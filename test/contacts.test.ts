import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FetchLike } from '../src/api.js';
import { contactBackend, connect, json, LIST, phones } from './helpers.js';

type Summary = {
  added: number;
  duplicate: number;
  rejected: number;
  rateLimited: number;
  unknown: number;
  notAttempted: number;
  results: { index: number; status: string; reason?: string }[];
  stoppedBy?: string;
  budgetSeconds?: number;
  retryAfterSeconds?: number;
};

const summary = (result: { structuredContent?: unknown }) => (result.structuredContent as { result: Summary }).result;
const statuses = (s: Summary) => s.results.map((r) => r.status);

/** Runs a tool call while fake time moves on, until the call settles. */
async function settle<T>(
  promise: Promise<T>,
  stepMs = 500,
  limitMs = 700_000,
): Promise<{ value?: T; error?: unknown; elapsed: number }> {
  let done = false;
  let value: T | undefined;
  let error: unknown;
  const start = Date.now();
  promise.then((v) => ((value = v), (done = true))).catch((e) => ((error = e), (done = true)));
  while (!done && Date.now() - start < limitMs) {
    await vi.advanceTimersByTimeAsync(stepMs);
  }
  return { value, error, elapsed: Date.now() - start };
}

const addCall = (client: Awaited<ReturnType<typeof connect>>['client'], contacts: object[], timeout?: number) =>
  client.callTool(
    { name: 'sms_add_contacts', arguments: { id: LIST, contacts } },
    undefined,
    timeout ? { timeout } : undefined,
  );

describe('contact loop outcomes (tech-spec D10)', () => {
  it('maps 201, 409 duplicate, 400 rejected and another 409', async () => {
    const answers = [
      json(201, { id: 'a' }),
      json(409, { statusCode: 409, message: 'A contact with this phone already exists in the list' }),
      json(400, { statusCode: 400, message: ['phone must be E.164 digits without +'], error: 'Bad Request' }),
      json(409, { statusCode: 409, message: 'The list is being updated — retry in a moment' }),
    ];
    let i = 0;
    const { client } = await connect(async () => answers[i++]);
    const s = summary(await addCall(client, phones(4)));
    expect(statuses(s)).toEqual(['added', 'duplicate', 'rejected', 'rejected']);
    expect(s.results[2].reason).toBe('phone must be E.164 digits without +');
    expect(s).toMatchObject({ added: 1, duplicate: 1, rejected: 2, rateLimited: 0, unknown: 0, notAttempted: 0 });
  });

  it('stops at a 5xx or a network error: unknown, then not attempted', async () => {
    let i = 0;
    const fivexx: FetchLike = async () =>
      i++ === 1 ? json(500, { statusCode: 500, message: 'Internal server error' }) : json(201, {});
    const s = summary(await addCall((await connect(fivexx)).client, phones(4)));
    expect(statuses(s)).toEqual(['added', 'unknown', 'not_attempted', 'not_attempted']);
    const down: FetchLike = async () => {
      throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    };
    expect(statuses(summary(await addCall((await connect(down)).client, phones(2))))).toEqual([
      'unknown',
      'not_attempted',
    ]);
  });

  it('returns the 401 error result on a 401', async () => {
    const { client } = await connect(async () =>
      json(401, { statusCode: 401, message: 'Invalid or revoked account key' }),
    );
    const result = await addCall(client, phones(3));
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({
      statusCode: 401,
      body: { statusCode: 401, message: 'Invalid or revoked account key' },
    });
  });

  it('refuses 101 contacts with no request', async () => {
    const fetchImpl = vi.fn<FetchLike>();
    const result = await addCall((await connect(fetchImpl)).client, phones(101));
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      statusCode: 400,
      body: { message: 'A batch can hold at most 100 contacts' },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('contact loop waits and the call deadline (tech-spec D10)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits once on a 429 and retries the contact', async () => {
    let i = 0;
    const { client } = await connect(async () =>
      i++ === 0 ? json(429, { statusCode: 429 }, { 'Retry-After': '3' }) : json(201, {}),
    );
    const { value } = await settle(addCall(client, phones(2)));
    expect(statuses(summary(value!))).toEqual(['added', 'added']);
  });

  it('a second 429 for one contact: rate limited, then not attempted, with retryAfterSeconds', async () => {
    const { client } = await connect(async () =>
      json(429, { statusCode: 429, message: 'Rate limit exceeded' }, { 'Retry-After': '2' }),
    );
    const { value } = await settle(addCall(client, phones(3)));
    const s = summary(value!);
    expect(statuses(s)).toEqual(['rate_limited', 'not_attempted', 'not_attempted']);
    expect(s.retryAfterSeconds).toBe(2);
  });

  it('(a) a limit of 50 per minute and 60 contacts: 50 added, then a stop before the client timeout', async () => {
    const backend = contactBackend({ limitPerMinute: 50 });
    const { client } = await connect(backend.fetchImpl);
    const first = await settle(addCall(client, phones(60)));
    expect(first.error).toBeUndefined();
    expect(first.elapsed).toBeLessThan(60_000);
    const s = summary(first.value!);
    expect(s.added).toBe(50);
    expect(s.results[50].status).toBe('rate_limited');
    expect(s.notAttempted).toBe(9);
    expect(s.retryAfterSeconds).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(s.retryAfterSeconds! * 1000);
    const rest = phones(60).slice(50);
    const second = await settle(addCall(client, rest));
    expect(summary(second.value!).added).toBe(10);
  });

  it('(b) 100 contacts of 1 second each: the call returns near 50 seconds with the result, not a timeout', async () => {
    const backend = contactBackend({ delayMs: () => 1000 });
    const { client } = await connect(backend.fetchImpl);
    const { value, error, elapsed } = await settle(addCall(client, phones(100)));
    expect(error).toBeUndefined();
    expect(elapsed).toBeLessThanOrEqual(50_500);
    const s = summary(value!);
    expect(s.stoppedBy).toBe('time_budget');
    expect(s.budgetSeconds).toBe(50);
    expect(s.added).toBeGreaterThanOrEqual(45);
    expect(s.added + s.notAttempted).toBe(100);
  });

  it('(c) a request that is still open at the deadline is aborted: unknown, and nothing stays pending', async () => {
    // The last dispatch can start at 48 s: a contact is not sent when less than 2 s remain.
    const backend = contactBackend({ delayMs: (n) => (n < 48 ? 1000 : 20_000) });
    const { client } = await connect(backend.fetchImpl);
    const { value, elapsed } = await settle(addCall(client, phones(60)));
    const s = summary(value!);
    expect(elapsed).toBeLessThanOrEqual(50_500);
    expect(s.added).toBe(48);
    expect(s.results[48].status).toBe('unknown');
    expect(s.notAttempted).toBe(11);
    expect(s.stoppedBy).toBe('time_budget');
    expect(backend.state.pending).toBe(0);
    expect(vi.getTimerCount()).toBe(0);

    // (d) A retry of the same call is safe: the unknown contact comes back added or duplicate.
    backend.options.delayMs = () => 0;
    const again = await settle(addCall(client, phones(60)));
    const r = summary(again.value!);
    expect(['added', 'duplicate']).toContain(r.results[48].status);
  });

  it('(e) with --max-call-seconds 300 and a 300 s client timeout, 60 contacts at 50 per minute are all added', async () => {
    const backend = contactBackend({ limitPerMinute: 50 });
    const { client } = await connect(backend.fetchImpl, { maxCallSeconds: 300 });
    const progress: number[] = [];
    const call = client.callTool(
      { name: 'sms_add_contacts', arguments: { id: LIST, contacts: phones(60) } },
      undefined,
      {
        timeout: 300_000,
        onprogress: (p) => void progress.push(p.progress),
      },
    );
    const { value, error } = await settle(call);
    expect(error).toBeUndefined();
    const s = summary(value!);
    expect(s.added).toBe(60);
    expect(s.stoppedBy).toBeUndefined();
    expect(progress.length).toBeGreaterThan(0);
  });
});

describe('first-call 401 (tech-spec D34)', () => {
  it('a key without the sk_acct_ prefix gets 401 on every call, with no request', async () => {
    const fetchImpl = vi.fn<FetchLike>();
    const { client } = await connect(fetchImpl, { apiKey: 'not-an-account-key' });
    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(81);
    const result = await client.callTool({ name: 'sms_list_lists', arguments: {} });
    expect(result.structuredContent).toEqual({
      statusCode: 401,
      body: { statusCode: 401, message: 'Invalid or revoked account key' },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('a revoked or unknown key gets the backend 401 on the first call', async () => {
    const body = { statusCode: 401, message: 'Invalid or revoked account key', error: 'Unauthorized' };
    const { client } = await connect(async () => json(401, body));
    const result = await client.callTool({ name: 'sms_list_lists', arguments: {} });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({ statusCode: 401, body });
  });

  it('an unknown tool name is a JSON-RPC invalid-params error', async () => {
    const { client } = await connect(async () => json(200, {}));
    await expect(client.callTool({ name: 'email_disconnect', arguments: {} })).rejects.toMatchObject({ code: -32602 });
  });
});
