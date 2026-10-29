import { invalidKeyResult, successResult } from '../result.js';
export const DEFAULT_CALL_SECONDS = 50;
export const MAX_RETRY_WAIT_SECONDS = 60;
const MIN_DISPATCH_MS = 2_000;
const PROGRESS_INTERVAL_MS = 10_000;
function messageOf(body) {
    const message = body?.message;
    if (Array.isArray(message)) {
        return message.join('; ');
    }
    return typeof message === 'string' ? message : undefined;
}
/** Waits `ms`, or less when `signal` aborts. Returns false when the wait ended by the abort. */
function wait(ms, signal, onTick) {
    return new Promise((resolve) => {
        if (signal.aborted) {
            resolve(false);
            return;
        }
        const ticker = onTick ? setInterval(() => void onTick().catch(() => undefined), PROGRESS_INTERVAL_MS) : undefined;
        const done = (completed) => {
            clearTimeout(timer);
            if (ticker) {
                clearInterval(ticker);
            }
            signal.removeEventListener('abort', onAbort);
            resolve(completed);
        };
        const onAbort = () => done(false);
        const timer = setTimeout(() => done(true), ms);
        signal.addEventListener('abort', onAbort, { once: true });
    });
}
export async function addContacts(api, path, contacts, options) {
    const budgetMs = options.budgetSeconds * 1000;
    const deadline = Date.now() + budgetMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), budgetMs);
    const results = [];
    let stopped = false;
    let timeBudgetStop = false;
    let retryAfterSeconds;
    const send = (contact) => api.request('POST', path, { body: contact, signal: controller.signal });
    try {
        for (let index = 0; index < contacts.length; index++) {
            if (stopped) {
                results.push({ index, status: 'not_attempted' });
                continue;
            }
            if (controller.signal.aborted || deadline - Date.now() < MIN_DISPATCH_MS) {
                timeBudgetStop = true;
                stopped = true;
                results.push({ index, status: 'not_attempted' });
                continue;
            }
            let outcome = await send(contacts[index]);
            if (outcome.kind === 'response' && outcome.status === 429) {
                const seconds = Math.min(MAX_RETRY_WAIT_SECONDS, Math.max(1, outcome.retryAfterSeconds ?? 1));
                retryAfterSeconds = seconds;
                const tick = options.onProgress ? () => options.onProgress(index, contacts.length) : undefined;
                if (seconds * 1000 > deadline - Date.now() || !(await wait(seconds * 1000, controller.signal, tick))) {
                    timeBudgetStop = true;
                    stopped = true;
                    results.push({ index, status: 'rate_limited', reason: messageOf(outcome.body) });
                    continue;
                }
                outcome = await send(contacts[index]);
            }
            if (outcome.kind === 'failure') {
                timeBudgetStop = controller.signal.aborted;
                stopped = true;
                results.push({ index, status: 'unknown' });
                continue;
            }
            const { status, body } = outcome;
            const reason = messageOf(body);
            if (status === 401) {
                return invalidKeyResult();
            }
            if (status >= 200 && status < 300) {
                results.push({ index, status: 'added' });
            }
            else if (status === 409 && reason?.includes('already exists')) {
                results.push({ index, status: 'duplicate', reason });
            }
            else if (status === 429) {
                retryAfterSeconds = Math.min(MAX_RETRY_WAIT_SECONDS, Math.max(1, outcome.retryAfterSeconds ?? 1));
                stopped = true;
                results.push({ index, status: 'rate_limited', reason });
            }
            else if (status >= 400 && status < 500) {
                results.push({ index, status: 'rejected', reason });
            }
            else {
                stopped = true;
                results.push({ index, status: 'unknown', reason });
            }
        }
    }
    finally {
        clearTimeout(timer);
    }
    const count = (status) => results.filter((r) => r.status === status).length;
    const summary = {
        added: count('added'),
        duplicate: count('duplicate'),
        rejected: count('rejected'),
        rateLimited: count('rate_limited'),
        unknown: count('unknown'),
        notAttempted: count('not_attempted'),
        results,
    };
    if (timeBudgetStop) {
        summary.stoppedBy = 'time_budget';
        summary.budgetSeconds = options.budgetSeconds;
    }
    if (retryAfterSeconds !== undefined && count('rate_limited') > 0) {
        summary.retryAfterSeconds = retryAfterSeconds;
    }
    return successResult(summary);
}
