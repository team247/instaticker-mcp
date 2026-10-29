import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ApiOutcome } from './api.js';

/** Tool results (tech-spec D8): 2xx → `{ result }`; any other answer → `isError` with `{ statusCode, body }`. */

const STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  502: 'Bad Gateway',
};

export function successResult(result: unknown): CallToolResult {
  const structuredContent = { result };
  return { content: [{ type: 'text', text: JSON.stringify(structuredContent) }], structuredContent };
}

export function errorResult(statusCode: number, body: unknown, retryAfterSeconds?: number): CallToolResult {
  const structuredContent: Record<string, unknown> = { statusCode, body };
  if (retryAfterSeconds !== undefined) {
    structuredContent.retryAfterSeconds = retryAfterSeconds;
  }
  return { isError: true, content: [{ type: 'text', text: JSON.stringify(structuredContent) }], structuredContent };
}

/** An error with a Nest-shaped body, for the checks this server makes before a request. */
export function localError(statusCode: number, message: string): CallToolResult {
  const error = STATUS_NAMES[statusCode];
  return errorResult(statusCode, { statusCode, message, ...(error ? { error } : {}) });
}

export const UNREACHABLE_MESSAGE = 'Instaticker API unreachable';
export const INVALID_KEY_MESSAGE = 'Invalid or revoked account key';

export const unreachableResult = (): CallToolResult =>
  errorResult(502, { statusCode: 502, message: UNREACHABLE_MESSAGE });

export const invalidKeyResult = (): CallToolResult =>
  errorResult(401, { statusCode: 401, message: INVALID_KEY_MESSAGE });

export function toToolResult(outcome: ApiOutcome): CallToolResult {
  if (outcome.kind === 'failure') {
    return unreachableResult();
  }
  if (outcome.status >= 200 && outcome.status < 300) {
    return successResult(outcome.body);
  }
  if (outcome.status === 429) {
    return errorResult(429, outcome.body, outcome.retryAfterSeconds ?? 1);
  }
  return errorResult(outcome.status, outcome.body);
}
