#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { DEFAULT_CALL_SECONDS } from './tools/contacts.js';

/** The CLI (tech-spec D4, D5, D23, D34). It checks only that a key is present; no backend call at start. */

const DEFAULT_BASE_URL = 'https://api.instaticker.com';
const ALLOWED_BASE_URL = /^(https:\/\/|http:\/\/localhost(?=[:/]|$)|http:\/\/127\.0\.0\.1(?=[:/]|$))/;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function readConfig() {
  let values: Record<string, string | undefined>;
  try {
    values = parseArgs({
      options: {
        'api-key': { type: 'string' },
        'base-url': { type: 'string' },
        'max-call-seconds': { type: 'string' },
      },
      strict: true,
      allowPositionals: false,
    }).values;
  } catch {
    fail('Unknown or invalid argument. Use --api-key, --base-url and --max-call-seconds.');
  }

  const apiKey = values['api-key'] ?? process.env.INSTATICKER_API_KEY;
  if (!apiKey) {
    fail('Missing account key: pass --api-key or set INSTATICKER_API_KEY');
  }

  const baseUrl = values['base-url'] ?? process.env.INSTATICKER_BASE_URL ?? DEFAULT_BASE_URL;
  if (!ALLOWED_BASE_URL.test(baseUrl)) {
    fail('Invalid --base-url: use https://, http://localhost or http://127.0.0.1');
  }

  const seconds = values['max-call-seconds'] ?? process.env.INSTATICKER_MAX_CALL_SECONDS;
  const maxCallSeconds = seconds === undefined ? DEFAULT_CALL_SECONDS : Number(seconds);
  if (!Number.isInteger(maxCallSeconds) || maxCallSeconds < 10 || maxCallSeconds > 600) {
    fail('Invalid --max-call-seconds: use a whole number from 10 to 600');
  }

  return { apiKey, baseUrl, maxCallSeconds };
}

const server = createServer(readConfig());
await server.connect(new StdioServerTransport());
