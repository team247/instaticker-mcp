import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { FetchLike } from '../src/api.js';
import { createServer } from '../src/server.js';

// A fake account key: the server checks only the sk_acct_ prefix, so it needs no key-like body.
export const KEY = 'sk_acct_TEST';
export const LIST = '11111111-2222-4333-8444-555555555555';

/** An in-process MCP client and server pair over memory, with a mocked backend. */
export async function connect(fetchImpl: FetchLike, options: { apiKey?: string; maxCallSeconds?: number } = {}) {
  const server = createServer({
    apiKey: options.apiKey ?? KEY,
    baseUrl: 'http://localhost:3026',
    maxCallSeconds: options.maxCallSeconds ?? 50,
    fetchImpl,
  });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1.0.0' });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return { client, close: () => client.close() };
}

export const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

/** A response after `ms` of (fake) time; it rejects like fetch when the signal aborts first. */
export function delayed(ms: number, make: () => Response, signal?: AbortSignal | null): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(make());
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('This operation was aborted', 'AbortError'));
    };
    if (signal?.aborted) {
      onAbort();
    } else {
      signal?.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/** A mocked contact-add backend: a sliding per-minute limit, a set of added contacts, a delay per request. */
export function contactBackend(options: { limitPerMinute?: number; delayMs?: (n: number) => number } = {}) {
  // `options` is returned, so a test can change the delay between two calls.
  const added = new Set<string>();
  const times: number[] = [];
  const state = { requests: 0, pending: 0 };
  const fetchImpl: FetchLike = async (_url, init) => {
    const n = state.requests++;
    const contact = JSON.parse(String(init.body)) as { phone: string };
    const now = Date.now();
    while (times.length && now - times[0] >= 60_000) times.shift();
    const limit = options.limitPerMinute ?? Infinity;
    state.pending++;
    try {
      if (times.length >= limit) {
        const retry = Math.ceil((times[0] + 60_000 - now) / 1000);
        return await delayed(
          0,
          () =>
            json(429, { statusCode: 429, message: 'Rate limit exceeded (per key).' }, { 'Retry-After': String(retry) }),
          init.signal,
        );
      }
      times.push(now);
      const duplicate = added.has(contact.phone);
      added.add(contact.phone);
      return await delayed(
        options.delayMs?.(n) ?? 0,
        () =>
          duplicate
            ? json(409, { statusCode: 409, message: 'A contact with this phone already exists in the list' })
            : json(201, { id: `c${n}`, phone: contact.phone }),
        init.signal,
      );
    } finally {
      state.pending--;
    }
  };
  return { fetchImpl, added, state, options };
}

export const phones = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => ({ phone: String(1555010000 + from + i) }));
