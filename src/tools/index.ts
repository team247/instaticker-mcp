import type { ToolDef } from '../envelope.js';
import { EMAIL_TOOLS } from './email.js';
import { SMS_TOOLS } from './sms.js';

/** Every tool, in the order of `tools/list`: 30 SMS tools, then 51 Email tools. */
export const TOOLS: ToolDef[] = [...SMS_TOOLS, ...EMAIL_TOOLS];
