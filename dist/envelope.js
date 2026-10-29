import { localError } from './result.js';
export const MAX_CONTACTS_PER_CALL = 100;
const UUID_PATTERN = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
const UUID = new RegExp(UUID_PATTERN);
export const pathParams = (def) => [...def.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
export function annotations(hint) {
    if (hint === 'read') {
        return { readOnlyHint: true };
    }
    return { readOnlyHint: false, destructiveHint: hint === 'destructive' };
}
export function inputSchema(def) {
    const properties = {};
    const required = [];
    for (const name of pathParams(def)) {
        properties[name] = { type: 'string', pattern: UUID_PATTERN, description: 'UUID' };
        required.push(name);
    }
    for (const name of def.query ?? []) {
        properties[name] = { type: ['string', 'number', 'boolean'] };
    }
    if (def.body) {
        properties.body = {
            type: 'object',
            description: `Fields of ${def.body.dto}. The Instaticker API checks them as the dashboard does.`,
            properties: def.body.properties,
        };
        if (def.body.required) {
            required.push('body');
        }
    }
    if (def.contacts) {
        properties.contacts = { type: 'array', maxItems: MAX_CONTACTS_PER_CALL, items: { type: 'object' } };
        required.push('contacts');
    }
    return { type: 'object', properties, required, additionalProperties: false };
}
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
/** The envelope check of tech-spec D7. It returns the request parts, or a 400 tool error with no request. */
export function checkEnvelope(def, args) {
    const input = args ?? {};
    const params = pathParams(def);
    const allowed = new Set([
        ...params,
        ...(def.query ?? []),
        ...(def.body ? ['body'] : []),
        ...(def.contacts ? ['contacts'] : []),
    ]);
    for (const key of Object.keys(input)) {
        if (!allowed.has(key)) {
            return localError(400, `property ${key} should not exist`);
        }
    }
    let path = def.path;
    for (const name of params) {
        const value = input[name];
        if (typeof value !== 'string' || !UUID.test(value)) {
            return localError(400, `${name} must be a UUID`);
        }
        path = path.replace(`{${name}}`, value);
    }
    const query = {};
    for (const name of def.query ?? []) {
        const value = input[name];
        if (value === undefined) {
            continue;
        }
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
            return localError(400, `${name} must be a string, a number or a boolean`);
        }
        query[name] = value;
    }
    const envelope = { path, query };
    if (def.body) {
        if (input.body === undefined && !def.body.required) {
            envelope.body = {};
        }
        else if (!isObject(input.body)) {
            return localError(400, 'body must be an object');
        }
        else {
            envelope.body = input.body;
        }
        const problem = def.check?.(envelope.body);
        if (problem) {
            return localError(400, problem);
        }
    }
    if (def.contacts) {
        const contacts = input.contacts;
        if (!Array.isArray(contacts) || !contacts.every(isObject)) {
            return localError(400, 'contacts must be an array of objects');
        }
        if (contacts.length > MAX_CONTACTS_PER_CALL) {
            return localError(400, `A batch can hold at most ${MAX_CONTACTS_PER_CALL} contacts`);
        }
        envelope.contacts = contacts;
    }
    return envelope;
}
export const isToolResult = (value) => 'content' in value;
