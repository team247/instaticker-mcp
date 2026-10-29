# Instaticker MCP server

Set up SMS and Email campaigns on [Instaticker](https://www.instaticker.com/) with an AI agent. This is a
local [MCP](https://modelcontextprotocol.io/) server. Your MCP client starts it with `npx`, and it
calls the Instaticker API with your account key.

## Requirements

- Node.js 20 or later.
- An Instaticker account key. Create it on the API Keys page of the dashboard. It starts with `sk_acct_`.

## Run it

Always run a pinned release tag from GitHub:

```sh
INSTATICKER_API_KEY="<your account key>" npx -y github:team247/instaticker-mcp#vX.Y.Z
```

Replace `vX.Y.Z` with the newest tag of this repo. The API Keys page shows the current command.

> **Do not run `npx instaticker-mcp` from the npm registry.** This package is not published on npm,
> and the name is not ours there. Always use the `github:team247/instaticker-mcp#vX.Y.Z` form.

### Options

| Option                   | Environment variable           | Default                       | Meaning                                                                                                                               |
| ------------------------ | ------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-key <key>`        | `INSTATICKER_API_KEY`          | —                             | Your account key. The flag wins over the variable. Use the variable: it keeps the key out of your shell history and the process list. |
| `--base-url <url>`       | `INSTATICKER_BASE_URL`         | `https://api.instaticker.com` | The Instaticker API. Only `https://`, `http://localhost` and `http://127.0.0.1` are allowed.                                          |
| `--max-call-seconds <n>` | `INSTATICKER_MAX_CALL_SECONDS` | `50`                          | The time budget of one contact-add call, 10–600.                                                                                      |

With no key, the server exits with code 2. It does not check the key at start: a revoked or wrong key
shows as "Invalid or revoked account key" on the first tool call.

## Set up your MCP client

### Claude Code

```sh
claude mcp add instaticker --env INSTATICKER_API_KEY="<your account key>" -- npx -y github:team247/instaticker-mcp#vX.Y.Z
```

The Claude Code CLI allows long tool calls. Add `--max-call-seconds 300` at the end, so that one
contact-add call can wait through a full rate-limit minute.

### Other MCP clients

```json
{
  "mcpServers": {
    "instaticker": {
      "command": "npx",
      "args": ["-y", "github:team247/instaticker-mcp#vX.Y.Z"],
      "env": { "INSTATICKER_API_KEY": "<your account key>" }
    }
  }
}
```

## Update

Change the tag in the command (for example `#v0.1.0` to `#v0.2.0`), then restart your MCP client.

## Tools

81 tools: 30 for SMS Campaigns and 51 for Email Campaigns. Each tool calls one dashboard campaign
route and returns the same result or error as the dashboard. The tools add no charge of their own.
Test sends and campaign sends charge your credit, as in the dashboard.

Some dashboard steps have no tool: CSV import and export, skipped rows, the AWS connection
(connect, recheck, send rate, disconnect) and template image upload. Do these in the dashboard.

`sms_add_contacts` and `email_add_contacts` add at most 100 contacts per call, one after the other.
Each contact gets one outcome: `added`, `duplicate`, `rejected`, `rate_limited`, `unknown` or
`not_attempted`. A call stops within its time budget (50 seconds by default) and returns the outcomes
so far, with `stoppedBy: "time_budget"`. A retry of the whole call is safe: a contact that was added
comes back as `duplicate`.

The Instaticker API limits each account key to 60 requests per minute (contact adds: 600), each
company to 120 (contact adds: 1,200), and each company to 5 requests at the same time. A limited call
returns status 429 with `retryAfterSeconds`.

### SMS Campaigns

| Tool                      | Hint            |
| ------------------------- | --------------- |
| `sms_list_lists`          | read-only       |
| `sms_create_list`         | changes data    |
| `sms_delete_list`         | **destructive** |
| `sms_list_contacts`       | read-only       |
| `sms_add_contact`         | changes data    |
| `sms_update_contact`      | changes data    |
| `sms_get_render_context`  | read-only       |
| `sms_get_import`          | read-only       |
| `sms_list_imports`        | read-only       |
| `sms_list_templates`      | read-only       |
| `sms_create_template`     | changes data    |
| `sms_update_template`     | changes data    |
| `sms_delete_template`     | **destructive** |
| `sms_list_campaigns`      | read-only       |
| `sms_create_campaign`     | changes data    |
| `sms_update_campaign`     | changes data    |
| `sms_delete_campaign`     | **destructive** |
| `sms_get_campaign`        | read-only       |
| `sms_list_recipients`     | read-only       |
| `sms_render_campaign`     | read-only       |
| `sms_review_campaign`     | read-only       |
| `sms_send_test`           | **destructive** |
| `sms_commit_campaign`     | **destructive** |
| `sms_schedule_campaign`   | **destructive** |
| `sms_reschedule_campaign` | changes data    |
| `sms_unschedule_campaign` | changes data    |
| `sms_cancel_campaign`     | **destructive** |
| `sms_pause_campaign`      | changes data    |
| `sms_resume_campaign`     | **destructive** |
| `sms_add_contacts`        | changes data    |

### Email Campaigns

| Tool                           | Hint            |
| ------------------------------ | --------------- |
| `email_get_overview`           | read-only       |
| `email_get_connection`         | read-only       |
| `email_list_senders`           | read-only       |
| `email_select_sender`          | changes data    |
| `email_create_sender`          | changes data    |
| `email_get_sender_dkim`        | read-only       |
| `email_get_postal_prefill`     | read-only       |
| `email_set_sender_postal`      | changes data    |
| `email_set_sender_default`     | changes data    |
| `email_restart_sender`         | changes data    |
| `email_change_sender_warmup`   | changes data    |
| `email_turn_off_sender_warmup` | changes data    |
| `email_get_sender`             | read-only       |
| `email_list_seeds`             | read-only       |
| `email_add_seed`               | changes data    |
| `email_delete_seed`            | **destructive** |
| `email_list_lists`             | read-only       |
| `email_create_list`            | changes data    |
| `email_preview_list_deletion`  | read-only       |
| `email_delete_list`            | **destructive** |
| `email_list_contacts`          | read-only       |
| `email_add_contact`            | changes data    |
| `email_update_contact`         | changes data    |
| `email_delete_contact`         | **destructive** |
| `email_list_imports`           | read-only       |
| `email_get_import`             | read-only       |
| `email_list_templates`         | read-only       |
| `email_get_template`           | read-only       |
| `email_create_template`        | changes data    |
| `email_update_template`        | changes data    |
| `email_delete_template`        | **destructive** |
| `email_list_campaigns`         | read-only       |
| `email_create_campaign`        | changes data    |
| `email_update_campaign`        | changes data    |
| `email_delete_campaign`        | **destructive** |
| `email_get_campaign`           | read-only       |
| `email_list_recipients`        | read-only       |
| `email_send_test`              | **destructive** |
| `email_record_test_waiver`     | changes data    |
| `email_get_preflight`          | read-only       |
| `email_get_draft`              | read-only       |
| `email_run_preflight`          | changes data    |
| `email_review_campaign`        | read-only       |
| `email_commit_campaign`        | **destructive** |
| `email_schedule_campaign`      | **destructive** |
| `email_reschedule_campaign`    | changes data    |
| `email_unschedule_campaign`    | changes data    |
| `email_pause_campaign`         | changes data    |
| `email_cancel_campaign`        | **destructive** |
| `email_resume_campaign`        | **destructive** |
| `email_add_contacts`           | changes data    |

A **destructive** tool deletes, commits, schedules or cancels, or spends credit and sends messages.
Your MCP client can ask you before it runs one.

## Security

- Keep your account key secret. Never commit it.
- A leaked key: revoke it on the API Keys page at once. See [SECURITY.md](SECURITY.md).
- The server sends the key only in the `Authorization` header, and writes it to no log or error.

## Development

```sh
npm ci
npm run lint
npm run build
npm test
```

`dist/` is committed, so `npx` runs it with no build. CI rebuilds `dist/` and fails when it differs
from the commit.

## License

MIT. See [LICENSE](LICENSE).
