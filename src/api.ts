/** The HTTP client for the Instaticker dashboard campaign routes (tech-spec D5, D6). */

export const REQUEST_TIMEOUT_MS = 30_000;

export type ApiOutcome =
  { kind: 'response'; status: number; body: unknown; retryAfterSeconds?: number } | { kind: 'failure'; code: string };

export type QueryValue = string | number | boolean;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
}

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/**
 * Aborts when any of the given signals aborts, or after `timeoutMs`. A small helper instead of
 * `AbortSignal.any`, which needs Node.js 20.3 (tech-spec D10). Call `dispose` when the request ends.
 */
export function combinedSignal(timeoutMs: number, parent?: AbortSignal): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  if (parent) {
    if (parent.aborted) {
      controller.abort();
    } else {
      parent.addEventListener('abort', abort, { once: true });
    }
  }
  const dispose = () => {
    clearTimeout(timer);
    parent?.removeEventListener('abort', abort);
  };
  return { signal: controller.signal, dispose };
}

/** Reduces a thrown error to a code, so a URL or a header never reaches the output (tech-spec D5). */
function errorCode(error: unknown): string {
  const cause = (error as { cause?: { code?: unknown } })?.cause;
  if (cause && typeof cause.code === 'string') {
    return cause.code;
  }
  const name = (error as { name?: unknown })?.name;
  return typeof name === 'string' ? name : 'Error';
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : undefined;
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly apiKey: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async request(method: string, path: string, options: RequestOptions = {}): Promise<ApiOutcome> {
    const url = new URL(this.baseUrl + path);
    for (const [name, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(name, String(value));
    }
    const { signal, dispose } = combinedSignal(REQUEST_TIMEOUT_MS, options.signal);
    try {
      const response = await this.fetchImpl(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
          ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal,
      });
      const text = await response.text();
      let body: unknown = null;
      if (text !== '') {
        try {
          body = JSON.parse(text);
        } catch {
          return { kind: 'failure', code: 'NON_JSON' };
        }
      }
      return {
        kind: 'response',
        status: response.status,
        body,
        retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')),
      };
    } catch (error) {
      return { kind: 'failure', code: errorCode(error) };
    } finally {
      dispose();
    }
  }
}
