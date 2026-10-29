import { describe, expect, it } from 'vitest';
import { ApiClient } from '../src/api.js';
import { toToolResult } from '../src/result.js';

// A fake account key: the server checks only the sk_acct_ prefix, so it needs no key-like body.
const MARKER = 'sk_acct_MARKER';
const respond = (status: number, body: string, headers: Record<string, string> = {}) =>
  new ApiClient('http://localhost:9', MARKER, async () => new Response(body === '' ? null : body, { status, headers }));

describe('error mapping (tech-spec D8)', () => {
  it('maps 2xx to { result }', async () => {
    const result = toToolResult(await respond(200, '[{"id":1}]').request('GET', '/x'));
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ result: [{ id: 1 }] });
  });

  it('maps an empty 2xx body to a null result', async () => {
    expect(toToolResult(await respond(204, '').request('POST', '/x')).structuredContent).toEqual({ result: null });
  });

  it('passes another status and its body through', async () => {
    const body = { statusCode: 409, message: 'Review again', error: 'Conflict' };
    const result = toToolResult(await respond(409, JSON.stringify(body)).request('POST', '/x'));
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({ statusCode: 409, body });
  });

  it('adds retryAfterSeconds to a 429', async () => {
    const result = toToolResult(await respond(429, '{"statusCode":429}', { 'Retry-After': '17' }).request('GET', '/x'));
    expect(result.structuredContent).toEqual({ statusCode: 429, body: { statusCode: 429 }, retryAfterSeconds: 17 });
  });

  it('maps a non-JSON body, a network error and a timeout to 502', async () => {
    const unreachable = { statusCode: 502, body: { statusCode: 502, message: 'Instaticker API unreachable' } };
    expect(toToolResult(await respond(500, '<html>').request('GET', '/x')).structuredContent).toEqual(unreachable);
    const refused = new ApiClient('http://localhost:9', MARKER, async () => {
      throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    });
    expect(await refused.request('GET', '/x')).toEqual({ kind: 'failure', code: 'ECONNREFUSED' });
    const timeout = new ApiClient('http://localhost:9', MARKER, async () => {
      throw new DOMException('The operation was aborted.', 'AbortError');
    });
    expect(toToolResult(await timeout.request('GET', '/x')).structuredContent).toEqual(unreachable);
  });

  it('sends the key only in the Authorization header', async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const api = new ApiClient('http://localhost:9/', MARKER, async (url, init) => {
      seen = { url, init };
      return new Response('{}', { status: 200 });
    });
    await api.request('GET', '/dashboard/x', { query: { page: 2 } });
    expect(seen!.url).toBe('http://localhost:9/dashboard/x?page=2');
    expect(seen!.url).not.toContain(MARKER);
    expect((seen!.init.headers as Record<string, string>).Authorization).toBe(`Bearer ${MARKER}`);
  });
});
