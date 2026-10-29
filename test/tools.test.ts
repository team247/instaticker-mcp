import { describe, expect, it } from 'vitest';
import { annotations } from '../src/envelope.js';
import { TOOLS } from '../src/tools/index.js';

/** The tool table of ticket 11 (tech-spec D11, D13, D14): name, method, path template and hint. */
const EXPECTED: [string, string, string, string][] = [
  ['sms_list_lists', 'GET', '/dashboard/sms-campaigns/lists', 'read'],
  ['sms_create_list', 'POST', '/dashboard/sms-campaigns/lists', 'write'],
  ['sms_delete_list', 'DELETE', '/dashboard/sms-campaigns/lists/{id}', 'destructive'],
  ['sms_list_contacts', 'GET', '/dashboard/sms-campaigns/lists/{id}/contacts', 'read'],
  ['sms_add_contact', 'POST', '/dashboard/sms-campaigns/lists/{id}/contacts', 'write'],
  ['sms_update_contact', 'PATCH', '/dashboard/sms-campaigns/contacts/{id}', 'write'],
  ['sms_get_render_context', 'GET', '/dashboard/sms-campaigns/lists/{id}/render-context', 'read'],
  ['sms_get_import', 'GET', '/dashboard/sms-campaigns/imports/{id}', 'read'],
  ['sms_list_imports', 'GET', '/dashboard/sms-campaigns/lists/{id}/imports', 'read'],
  ['sms_list_templates', 'GET', '/dashboard/sms-campaigns/templates', 'read'],
  ['sms_create_template', 'POST', '/dashboard/sms-campaigns/templates', 'write'],
  ['sms_update_template', 'PATCH', '/dashboard/sms-campaigns/templates/{id}', 'write'],
  ['sms_delete_template', 'DELETE', '/dashboard/sms-campaigns/templates/{id}', 'destructive'],
  ['sms_list_campaigns', 'GET', '/dashboard/sms-campaigns/campaigns', 'read'],
  ['sms_create_campaign', 'POST', '/dashboard/sms-campaigns/campaigns', 'write'],
  ['sms_update_campaign', 'PATCH', '/dashboard/sms-campaigns/campaigns/{id}', 'write'],
  ['sms_delete_campaign', 'DELETE', '/dashboard/sms-campaigns/campaigns/{id}', 'destructive'],
  ['sms_get_campaign', 'GET', '/dashboard/sms-campaigns/campaigns/{id}', 'read'],
  ['sms_list_recipients', 'GET', '/dashboard/sms-campaigns/campaigns/{id}/recipients', 'read'],
  ['sms_render_campaign', 'GET', '/dashboard/sms-campaigns/campaigns/{id}/render', 'read'],
  ['sms_review_campaign', 'GET', '/dashboard/sms-campaigns/campaigns/{id}/review', 'read'],
  ['sms_send_test', 'POST', '/dashboard/sms-campaigns/campaigns/{id}/test', 'destructive'],
  ['sms_commit_campaign', 'POST', '/dashboard/sms-campaigns/campaigns/{id}/commit', 'destructive'],
  ['sms_schedule_campaign', 'POST', '/dashboard/sms-campaigns/campaigns/{id}/schedule', 'destructive'],
  ['sms_reschedule_campaign', 'POST', '/dashboard/sms-campaigns/campaigns/{id}/reschedule', 'write'],
  ['sms_unschedule_campaign', 'POST', '/dashboard/sms-campaigns/campaigns/{id}/unschedule', 'write'],
  ['sms_cancel_campaign', 'POST', '/dashboard/sms-campaigns/campaigns/{id}/cancel', 'destructive'],
  ['sms_pause_campaign', 'POST', '/dashboard/sms-campaigns/campaigns/{id}/pause', 'write'],
  ['sms_resume_campaign', 'POST', '/dashboard/sms-campaigns/campaigns/{id}/resume', 'destructive'],
  ['email_get_overview', 'GET', '/dashboard/email-campaigns/overview', 'read'],
  ['email_get_connection', 'GET', '/dashboard/email-campaigns/connection', 'read'],
  ['email_list_senders', 'GET', '/dashboard/email-campaigns/senders', 'read'],
  ['email_select_sender', 'POST', '/dashboard/email-campaigns/senders/select', 'write'],
  ['email_create_sender', 'POST', '/dashboard/email-campaigns/senders', 'write'],
  ['email_get_sender_dkim', 'GET', '/dashboard/email-campaigns/senders/{id}/dkim', 'read'],
  ['email_get_postal_prefill', 'GET', '/dashboard/email-campaigns/senders/postal-prefill', 'read'],
  ['email_set_sender_postal', 'POST', '/dashboard/email-campaigns/senders/{id}/postal', 'write'],
  ['email_set_sender_default', 'POST', '/dashboard/email-campaigns/senders/{id}/default', 'write'],
  ['email_restart_sender', 'POST', '/dashboard/email-campaigns/senders/{id}/restart', 'write'],
  ['email_change_sender_warmup', 'POST', '/dashboard/email-campaigns/senders/{id}/warmup', 'write'],
  ['email_turn_off_sender_warmup', 'POST', '/dashboard/email-campaigns/senders/{id}/warmup/off', 'write'],
  ['email_get_sender', 'GET', '/dashboard/email-campaigns/senders/{id}', 'read'],
  ['email_list_seeds', 'GET', '/dashboard/email-campaigns/seeds', 'read'],
  ['email_add_seed', 'POST', '/dashboard/email-campaigns/seeds', 'write'],
  ['email_delete_seed', 'DELETE', '/dashboard/email-campaigns/seeds/{id}', 'destructive'],
  ['email_list_lists', 'GET', '/dashboard/email-campaigns/lists', 'read'],
  ['email_create_list', 'POST', '/dashboard/email-campaigns/lists', 'write'],
  ['email_preview_list_deletion', 'GET', '/dashboard/email-campaigns/lists/{id}/deletion-preview', 'read'],
  ['email_delete_list', 'DELETE', '/dashboard/email-campaigns/lists/{id}', 'destructive'],
  ['email_list_contacts', 'GET', '/dashboard/email-campaigns/lists/{id}/contacts', 'read'],
  ['email_add_contact', 'POST', '/dashboard/email-campaigns/lists/{id}/contacts', 'write'],
  ['email_update_contact', 'PATCH', '/dashboard/email-campaigns/lists/{id}/contacts/{cid}', 'write'],
  ['email_delete_contact', 'DELETE', '/dashboard/email-campaigns/lists/{id}/contacts/{cid}', 'destructive'],
  ['email_list_imports', 'GET', '/dashboard/email-campaigns/lists/{id}/imports', 'read'],
  ['email_get_import', 'GET', '/dashboard/email-campaigns/imports/{id}', 'read'],
  ['email_list_templates', 'GET', '/dashboard/email-campaigns/templates', 'read'],
  ['email_get_template', 'GET', '/dashboard/email-campaigns/templates/{id}', 'read'],
  ['email_create_template', 'POST', '/dashboard/email-campaigns/templates', 'write'],
  ['email_update_template', 'PATCH', '/dashboard/email-campaigns/templates/{id}', 'write'],
  ['email_delete_template', 'DELETE', '/dashboard/email-campaigns/templates/{id}', 'destructive'],
  ['email_list_campaigns', 'GET', '/dashboard/email-campaigns/campaigns', 'read'],
  ['email_create_campaign', 'POST', '/dashboard/email-campaigns/campaigns', 'write'],
  ['email_update_campaign', 'PATCH', '/dashboard/email-campaigns/campaigns/{id}', 'write'],
  ['email_delete_campaign', 'DELETE', '/dashboard/email-campaigns/campaigns/{id}', 'destructive'],
  ['email_get_campaign', 'GET', '/dashboard/email-campaigns/campaigns/{id}', 'read'],
  ['email_list_recipients', 'GET', '/dashboard/email-campaigns/campaigns/{id}/recipients', 'read'],
  ['email_send_test', 'POST', '/dashboard/email-campaigns/campaigns/{id}/test', 'destructive'],
  ['email_record_test_waiver', 'POST', '/dashboard/email-campaigns/campaigns/{id}/waiver', 'write'],
  ['email_get_preflight', 'GET', '/dashboard/email-campaigns/campaigns/{id}/preflight', 'read'],
  ['email_get_draft', 'GET', '/dashboard/email-campaigns/campaigns/{id}/draft', 'read'],
  ['email_run_preflight', 'POST', '/dashboard/email-campaigns/campaigns/{id}/preflight', 'write'],
  ['email_review_campaign', 'GET', '/dashboard/email-campaigns/campaigns/{id}/review', 'read'],
  ['email_commit_campaign', 'POST', '/dashboard/email-campaigns/campaigns/{id}/commit', 'destructive'],
  ['email_schedule_campaign', 'POST', '/dashboard/email-campaigns/campaigns/{id}/schedule', 'destructive'],
  ['email_reschedule_campaign', 'POST', '/dashboard/email-campaigns/campaigns/{id}/reschedule', 'write'],
  ['email_unschedule_campaign', 'POST', '/dashboard/email-campaigns/campaigns/{id}/unschedule', 'write'],
  ['email_pause_campaign', 'POST', '/dashboard/email-campaigns/campaigns/{id}/pause', 'write'],
  ['email_cancel_campaign', 'POST', '/dashboard/email-campaigns/campaigns/{id}/cancel', 'destructive'],
  ['email_resume_campaign', 'POST', '/dashboard/email-campaigns/campaigns/{id}/resume', 'destructive'],
  ['sms_add_contacts', 'POST', '/dashboard/sms-campaigns/lists/{id}/contacts', 'write'],
  ['email_add_contacts', 'POST', '/dashboard/email-campaigns/lists/{id}/contacts', 'write'],
];

describe('tool table', () => {
  it('has 81 tools: 30 SMS and 51 Email, with unique names', () => {
    expect(TOOLS).toHaveLength(81);
    expect(TOOLS.filter((t) => t.name.startsWith('sms_'))).toHaveLength(30);
    expect(TOOLS.filter((t) => t.name.startsWith('email_'))).toHaveLength(51);
    expect(new Set(TOOLS.map((t) => t.name)).size).toBe(81);
    expect(TOOLS.map((t) => t.name).sort()).toEqual(EXPECTED.map((e) => e[0]).sort());
  });

  it.each(EXPECTED)('%s calls %s %s with hint %s', (name, method, path, hint) => {
    const tool = TOOLS.find((t) => t.name === name)!;
    expect(tool.method).toBe(method);
    expect(tool.path).toBe(path);
    expect(tool.hint).toBe(hint);
    expect(annotations(tool.hint)).toEqual(
      hint === 'read' ? { readOnlyHint: true } : { readOnlyHint: false, destructiveHint: hint === 'destructive' },
    );
  });

  it('marks the 18 tools that delete, commit, schedule, cancel, test-send or resume as destructive', () => {
    const destructive = TOOLS.filter((t) => t.hint === 'destructive').map((t) => t.name);
    expect(destructive).toHaveLength(18);
    for (const name of ['sms_send_test', 'email_send_test', 'sms_resume_campaign', 'email_resume_campaign']) {
      expect(destructive).toContain(name);
    }
    expect(TOOLS.find((t) => t.name === 'sms_pause_campaign')!.hint).toBe('write');
  });

  it('marks every GET tool read-only and no other tool', () => {
    for (const tool of TOOLS) {
      expect(tool.hint === 'read').toBe(tool.method === 'GET');
    }
  });

  it('has no tool for the routes an account key cannot call', () => {
    const routes = TOOLS.map((t) => `${t.method} ${t.path}`);
    const denied = /\/(export|import|skipped)$|\/connection\/|\/templates\/images|^POST .*\/imports$/;
    expect(routes.filter((r) => denied.test(r))).toEqual([]);
  });
});
