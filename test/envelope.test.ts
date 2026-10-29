import { describe, expect, it } from 'vitest';
import { checkEnvelope, inputSchema, isToolResult, type ToolDef } from '../src/envelope.js';
import { TOOLS } from '../src/tools/index.js';

const ID = '11111111-2222-4333-8444-555555555555';
const tool = (name: string): ToolDef => TOOLS.find((t) => t.name === name)!;
const statusOf = (value: ReturnType<typeof checkEnvelope>) =>
  isToolResult(value) ? (value.structuredContent as { statusCode: number }).statusCode : 'ok';

describe('envelope check (tech-spec D7)', () => {
  it('builds the path, the query and the body', () => {
    const env = checkEnvelope(tool('sms_list_contacts'), { id: ID, search: 'x', page: 2 });
    expect(env).toEqual({ path: `/dashboard/sms-campaigns/lists/${ID}/contacts`, query: { search: 'x', page: 2 } });
    const two = checkEnvelope(tool('email_update_contact'), { id: ID, cid: ID, body: { email: 'a@b.c' } });
    expect(two).toMatchObject({
      path: `/dashboard/email-campaigns/lists/${ID}/contacts/${ID}`,
      body: { email: 'a@b.c' },
    });
  });

  it('refuses a missing or non-UUID path parameter, so a value cannot change the path', () => {
    expect(statusOf(checkEnvelope(tool('sms_get_campaign'), {}))).toBe(400);
    expect(statusOf(checkEnvelope(tool('sms_get_campaign'), { id: 'x' }))).toBe(400);
    expect(statusOf(checkEnvelope(tool('sms_get_campaign'), { id: `${ID}/../../x` }))).toBe(400);
  });

  it('refuses an unknown top-level key', () => {
    const result = checkEnvelope(tool('sms_list_lists'), { color: 'red' });
    expect(isToolResult(result) && result.structuredContent).toEqual({
      statusCode: 400,
      body: { statusCode: 400, message: 'property color should not exist', error: 'Bad Request' },
    });
  });

  it('refuses a query value that is not a scalar, and a body that is not an object', () => {
    expect(statusOf(checkEnvelope(tool('sms_list_contacts'), { id: ID, page: [1] }))).toBe(400);
    expect(statusOf(checkEnvelope(tool('sms_create_list'), { body: 'x' }))).toBe(400);
    expect(statusOf(checkEnvelope(tool('sms_create_list'), {}))).toBe(400);
    expect(statusOf(checkEnvelope(tool('sms_create_list'), { body: [] }))).toBe(400);
  });

  it('passes unknown body fields to the backend, which decides (tech-spec D7)', () => {
    expect(checkEnvelope(tool('sms_create_list'), { body: { name: 'x', color: 'red' } })).toMatchObject({
      body: { name: 'x', color: 'red' },
    });
  });

  it('checks the sender identity (tech-spec D15)', () => {
    expect(statusOf(checkEnvelope(tool('email_select_sender'), { body: { identity: '' } }))).toBe(400);
    expect(statusOf(checkEnvelope(tool('email_select_sender'), { body: {} }))).toBe(400);
    expect(statusOf(checkEnvelope(tool('email_select_sender'), { body: { identity: 'a'.repeat(321) } }))).toBe(400);
    expect(statusOf(checkEnvelope(tool('email_select_sender'), { body: { identity: 'example.com' } }))).toBe('ok');
  });

  it('caps a contact batch at 100 contacts of object type', () => {
    const contacts = (n: number) => Array.from({ length: n }, (_, i) => ({ phone: String(1555010000 + i) }));
    expect(statusOf(checkEnvelope(tool('sms_add_contacts'), { id: ID, contacts: contacts(100) }))).toBe('ok');
    const over = checkEnvelope(tool('sms_add_contacts'), { id: ID, contacts: contacts(101) });
    expect(isToolResult(over) && (over.structuredContent as { body: { message: string } }).body.message).toBe(
      'A batch can hold at most 100 contacts',
    );
    expect(statusOf(checkEnvelope(tool('sms_add_contacts'), { id: ID, contacts: ['x'] }))).toBe(400);
  });

  it('gives every tool a closed object schema with its path parameters required', () => {
    for (const t of TOOLS) {
      const schema = inputSchema(t);
      expect(schema.type).toBe('object');
      expect(schema.additionalProperties).toBe(false);
      for (const name of [...t.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1])) {
        expect(schema.required).toContain(name);
      }
    }
  });
});
