import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** The built CLI over stdio (tech-spec D5, D23, D27, D34). Run `npm run build` first; CI builds in the dist check. */

const BIN = fileURLToPath(new URL('../dist/index.js', import.meta.url));
// A fake account key: the server checks only the sk_acct_ prefix, so it needs no key-like body.
const MARKER = 'sk_acct_MARKER';

const run = (args: string[], env: Record<string, string | undefined> = {}) =>
  spawnSync(process.execPath, [BIN, ...args], {
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8',
    input: '',
    timeout: 10_000,
  });

let backend: Server;
let baseUrl: string;
const seen: { method?: string; url?: string; auth?: string }[] = [];

beforeAll(async () => {
  if (!existsSync(BIN)) {
    throw new Error('dist/index.js is missing: run npm run build first');
  }
  backend = createServer((req: IncomingMessage, res) => {
    seen.push({ method: req.method, url: req.url, auth: req.headers.authorization });
    if (req.url === '/dashboard/sms-campaigns/lists') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('[]');
    } else if (req.url === '/dashboard/sms-campaigns/templates') {
      res.writeHead(500, { 'Content-Type': 'text/html' }).end('<html>error</html>');
    } else {
      res
        .writeHead(401, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ statusCode: 401, message: 'Invalid or revoked account key', error: 'Unauthorized' }));
    }
  });
  await new Promise<void>((resolve) => backend.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(backend.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => backend.close(() => resolve())));

async function stdioClient(args: string[], env: Record<string, string>) {
  const transport = new StdioClientTransport({ command: process.execPath, args: [BIN, ...args], env, stderr: 'pipe' });
  let stderr = '';
  transport.stderr?.on('data', (chunk) => (stderr += String(chunk)));
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(transport);
  return { client, stderr: () => stderr };
}

describe('arguments and environment', () => {
  it('exits with code 2 and a clear message when no key is given', () => {
    const r = run([]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('Missing account key: pass --api-key or set INSTATICKER_API_KEY');
  });

  it('exits with code 2 on a base URL that is not https or local', () => {
    for (const url of ['http://example.com', 'http://localhost.example.com', 'ftp://localhost']) {
      expect(run(['--base-url', url], { INSTATICKER_API_KEY: MARKER }).status).toBe(2);
    }
  });

  it('exits with code 2 on --max-call-seconds outside 10–600, and on an unknown argument', () => {
    expect(run(['--max-call-seconds', '5'], { INSTATICKER_API_KEY: MARKER }).status).toBe(2);
    expect(run(['--max-call-seconds', '601'], { INSTATICKER_API_KEY: MARKER }).status).toBe(2);
    expect(run([], { INSTATICKER_API_KEY: MARKER, INSTATICKER_MAX_CALL_SECONDS: 'x' }).status).toBe(2);
    expect(run(['--key', MARKER]).status).toBe(2);
  });

  it('never writes the key in an exit message', () => {
    for (const r of [
      run(['--api-key', MARKER, '--base-url', 'http://example.com']),
      run(['--api-key', MARKER, '--max-call-seconds', '1']),
    ]) {
      expect(r.stdout + r.stderr).not.toContain(MARKER);
    }
  });
});

describe('stdio round trip against a mocked backend', () => {
  it('initializes and lists 81 tools with no backend call, then calls one tool with the key in the header', async () => {
    seen.length = 0;
    const { client } = await stdioClient(['--base-url', baseUrl], { INSTATICKER_API_KEY: MARKER });
    expect(client.getServerVersion()).toMatchObject({ name: 'instaticker', version: '0.1.0' });
    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(81);
    expect(seen).toHaveLength(0);
    const result = await client.callTool({ name: 'sms_list_lists', arguments: {} });
    expect(result.structuredContent).toEqual({ result: [] });
    expect(seen).toEqual([{ method: 'GET', url: '/dashboard/sms-campaigns/lists', auth: `Bearer ${MARKER}` }]);
    await client.close();
  });

  it('the flag wins over the environment variable', async () => {
    seen.length = 0;
    const { client } = await stdioClient(['--base-url', baseUrl, '--api-key', MARKER], {
      INSTATICKER_API_KEY: 'sk_acct_other',
    });
    await client.callTool({ name: 'sms_list_lists', arguments: {} });
    expect(seen[0].auth).toBe(`Bearer ${MARKER}`);
    await client.close();
  });
});

describe('no key in output (security 5)', () => {
  it('keeps the marker key out of stdout, stderr and every error result', async () => {
    const outputs: string[] = [];
    const { client, stderr } = await stdioClient(['--base-url', baseUrl], { INSTATICKER_API_KEY: MARKER });
    for (const name of ['sms_list_templates', 'sms_list_campaigns']) {
      outputs.push(JSON.stringify(await client.callTool({ name, arguments: {} })));
    }
    outputs.push(JSON.stringify(await client.callTool({ name: 'sms_get_campaign', arguments: { id: 'bad' } })));
    await client.close();
    const down = await stdioClient(['--base-url', 'http://127.0.0.1:9'], { INSTATICKER_API_KEY: MARKER });
    const unreachable = await down.client.callTool({ name: 'sms_list_lists', arguments: {} });
    outputs.push(JSON.stringify(unreachable));
    await down.client.close();
    expect(unreachable.structuredContent).toEqual({
      statusCode: 502,
      body: { statusCode: 502, message: 'Instaticker API unreachable' },
    });
    expect(outputs.join('\n') + stderr() + down.stderr()).not.toContain(MARKER);
  });
});
