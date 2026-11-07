// Urdu translation of RSS articles with Claude.
//
// How it works (a queue in MongoDB):
//   1. The ingester saves new stories with urdu.status = 'pending'.
//   2. claimNext() atomically flips one to 'processing' so no other worker
//      (or overlapping run) pays to translate the same story. Newest first,
//      so the home page is translated before older stories.
//   3. translateOne() asks Claude for { urduTitle, urduSummary } as JSON.
//   4. Success → 'done'. A bad answer → back to 'pending' and attempts + 1;
//      after MAX_ATTEMPTS → 'failed' (so one odd story can't block the queue).
//      A rate limit / outage → back to 'pending' WITHOUT using up an attempt,
//      and the batch stops until the next tick.
//   5. A claim older than CLAIM_STALE_MS (worker crashed) is picked up again.

import Anthropic from '@anthropic-ai/sdk';
import { Article } from '../models/Article.js';

export const MAX_ATTEMPTS = 3;
const CLAIM_STALE_MS = 10 * 60_000;
const URDU_SCRIPT = /[؀-ۿ]/;

const SYSTEM_PROMPT = `You translate English news headlines and summaries into Urdu for PakNewsHub, a news site for readers in Pakistan.

Write natural, formal news Urdu in the style of BBC Urdu and Dawn News Urdu:
- Translate the meaning, not word by word. A headline should read like a real Urdu newspaper headline.
- Write names of people, places and organisations in Urdu script the way Urdu newspapers do.
- Keep every fact exactly as given: names, numbers, dates, amounts and quotes. Write numbers with Western digits (0-9).
- Do not add, remove or soften information, and add no commentary.
- If the summary is empty, return an empty string for urduSummary.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    urduTitle: { type: 'string' },
    urduSummary: { type: 'string' },
  },
  required: ['urduTitle', 'urduSummary'],
  additionalProperties: false,
};

/** A translation problem that is about this article (not the API being down). */
export class TranslationError extends Error {
  constructor(message, { permanent = false } = {}) {
    super(message);
    this.permanent = permanent; // true = don't retry (e.g. declined by safety checks)
  }
}

/** Reads ANTHROPIC_API_KEY (server/.env) or another SDK credential source. */
export function createClient() {
  return new Anthropic();
}

/**
 * Translate one article. → { urduTitle, urduSummary, usage, model }
 * Throws TranslationError for a bad answer, or the SDK's API errors.
 */
export async function translateOne(client, model, article) {
  // Server-side fallback: if Claude's safety checks decline a request (rare,
  // but war/violence news can trigger it), the API re-runs it on a fallback
  // model instead of failing. Haiku has no server-side fallback.
  const fallback = model.startsWith('claude-haiku')
    ? {}
    : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };

  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    ...fallback,
    output_config: {
      effort: 'low', // translation doesn't need deep reasoning; keeps cost down
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA }, // guarantees valid JSON
    },
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Title: ${article.title}\nSummary: ${article.excerpt || ''}` },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new TranslationError('declined by safety checks', { permanent: true });
  }
  if (response.stop_reason === 'max_tokens') {
    throw new TranslationError('response was cut off');
  }

  const text = response.content.find(block => block.type === 'text')?.text;
  let data;
  try {
    data = JSON.parse(text ?? '');
  } catch {
    throw new TranslationError('response was not valid JSON');
  }

  const urduTitle = String(data.urduTitle ?? '').trim();
  const urduSummary = String(data.urduSummary ?? '').trim();
  // Sanity checks: really Urdu, and not absurdly long
  if (!URDU_SCRIPT.test(urduTitle) || urduTitle.length > 400) {
    throw new TranslationError('title is not a valid Urdu translation');
  }
  if (article.excerpt && (!URDU_SCRIPT.test(urduSummary) || urduSummary.length > 2000)) {
    throw new TranslationError('summary is not a valid Urdu translation');
  }

  return { urduTitle, urduSummary, usage: response.usage, model: response.model };
}

/** Atomically take the newest untranslated article (or a stale claim). */
export function claimNext(now = new Date()) {
  return Article.findOneAndUpdate(
    {
      origin: 'rss',
      $or: [
        { 'urdu.status': 'pending' },
        { 'urdu.status': 'processing', 'urdu.claimedAt': { $lt: new Date(now - CLAIM_STALE_MS) } },
      ],
    },
    { $set: { 'urdu.status': 'processing', 'urdu.claimedAt': now } },
    { sort: { publishedAt: -1 }, new: true, projection: { _id: 1, id: 1, title: 1, excerpt: 1, urdu: 1 } }
  ).lean();
}

/** API problems that are not about the article: retry later, no attempt used. */
function isTransient(err) {
  return (
    err instanceof Anthropic.RateLimitError ||
    err instanceof Anthropic.InternalServerError ||
    err instanceof Anthropic.APIConnectionError || // includes timeouts
    (err instanceof Anthropic.APIError && err.status === 529) // overloaded
  );
}

/**
 * Only these errors are about the *article* (and use up an attempt). Anything
 * else — missing/invalid API key, wrong model name, a bug — would fail for
 * every article, so we must not mark hundreds of stories "failed" because of
 * it: the article goes back to the queue and the batch stops.
 * (Without a key the SDK only errors at request time, with a non-API error.)
 */
function isArticleProblem(err) {
  return err instanceof TranslationError || err instanceof Anthropic.BadRequestError;
}

/**
 * Translate up to `limit` queued articles, `concurrency` at a time.
 * → { done, retried, failed, stopped, inputTokens, outputTokens }
 */
export async function translateBatch({ client, model, limit = 20, concurrency = 4 }) {
  const stats = { done: 0, retried: 0, failed: 0, stopped: null, inputTokens: 0, outputTokens: 0 };
  let taken = 0;

  const release = (doc, extra = {}) =>
    Article.updateOne(
      { _id: doc._id },
      { $set: { 'urdu.status': 'pending', ...extra }, $unset: { 'urdu.claimedAt': '' } }
    );

  async function lane() {
    while (taken < limit && !stats.stopped) {
      taken++;
      const doc = await claimNext();
      if (!doc) return;

      try {
        const result = await translateOne(client, model, doc);
        await Article.updateOne(
          { _id: doc._id },
          {
            $set: {
              urduTitle: result.urduTitle,
              urduSummary: result.urduSummary,
              'urdu.status': 'done',
              'urdu.model': result.model,
              'urdu.translatedAt': new Date(),
            },
            $unset: { 'urdu.claimedAt': '', 'urdu.error': '' },
          }
        );
        stats.done++;
        stats.inputTokens += result.usage?.input_tokens ?? 0;
        stats.outputTokens += result.usage?.output_tokens ?? 0;
      } catch (err) {
        if (!isArticleProblem(err)) {
          // Not this article's fault: put it back untouched and stop the batch.
          await release(doc);
          stats.stopped = isTransient(err)
            ? `API unavailable (${err.status ?? err.name}) — will retry next tick`
            : `configuration problem: ${String(err.message).slice(0, 160)}`;
          return;
        }
        const attempts = (doc.urdu?.attempts ?? 0) + 1;
        const giveUp = err.permanent || attempts >= MAX_ATTEMPTS;
        const message = String(err.message).slice(0, 200);
        if (giveUp) {
          await Article.updateOne(
            { _id: doc._id },
            { $set: { 'urdu.status': 'failed', 'urdu.attempts': attempts, 'urdu.error': message }, $unset: { 'urdu.claimedAt': '' } }
          );
          stats.failed++;
        } else {
          await release(doc, { 'urdu.attempts': attempts, 'urdu.error': message });
          stats.retried++;
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, lane));
  return stats;
}

export function formatTranslateStats(s, model) {
  const parts = [`translated ${s.done}`, `retry ${s.retried}`, `failed ${s.failed}`];
  if (s.done) parts.push(`tokens in ${s.inputTokens} / out ${s.outputTokens}`);
  parts.push(model);
  return parts.join(' · ') + (s.stopped ? `\n  ⚠ stopped: ${s.stopped}` : '');
}
