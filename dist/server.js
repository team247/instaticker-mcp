import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { ApiClient } from './api.js';
import { annotations, checkEnvelope, inputSchema, isToolResult } from './envelope.js';
import { invalidKeyResult, toToolResult } from './result.js';
import { addContacts } from './tools/contacts.js';
import { TOOLS } from './tools/index.js';
export const SERVER_NAME = 'instaticker';
export const SERVER_VERSION = '0.1.0';
export const ACCOUNT_KEY_PREFIX = 'sk_acct_';
/** The MCP server: `tools/list` needs no backend call; each `tools/call` is one checked request (tech-spec D34). */
export function createServer(config) {
    const api = new ApiClient(config.baseUrl, config.apiKey, config.fetchImpl);
    const byName = new Map(TOOLS.map((tool) => [tool.name, tool]));
    const server = new Server({ name: SERVER_NAME, version: SERVER_VERSION }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: TOOLS.map((tool) => ({
            name: tool.name,
            title: tool.title,
            description: tool.description,
            inputSchema: inputSchema(tool),
            annotations: { title: tool.title, ...annotations(tool.hint) },
        })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
        const tool = byName.get(request.params.name);
        if (!tool) {
            throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${request.params.name}`);
        }
        if (!config.apiKey.startsWith(ACCOUNT_KEY_PREFIX)) {
            return invalidKeyResult();
        }
        const envelope = checkEnvelope(tool, request.params.arguments);
        if (isToolResult(envelope)) {
            return envelope;
        }
        if (tool.contacts) {
            const progressToken = request.params._meta?.progressToken;
            return addContacts(api, envelope.path, envelope.contacts ?? [], {
                budgetSeconds: config.maxCallSeconds,
                onProgress: progressToken === undefined
                    ? undefined
                    : (progress, total) => extra.sendNotification({
                        method: 'notifications/progress',
                        params: { progressToken, progress, total },
                    }),
            });
        }
        return toToolResult(await api.request(tool.method, envelope.path, { query: envelope.query, body: envelope.body }));
    });
    return server;
}
