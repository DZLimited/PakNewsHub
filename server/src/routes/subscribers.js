import { Router } from 'express';
import { Subscriber } from '../models/Subscriber.js';
import { HttpError } from '../middleware/errors.js';

export const subscribersRouter = Router();

// Deliberately simple: one "@", no spaces, a dot in the domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/subscribers  { email }
 * → 201 { subscribed: true }  (new)
 * → 200 { subscribed: true }  (already subscribed — idempotent, and doesn't
 *                              reveal whether an address was on the list)
 */
subscribersRouter.post('/', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new HttpError(400, 'Please enter a valid email address');
  }
  const result = await Subscriber.updateOne(
    { email },
    { $setOnInsert: { email } },
    { upsert: true }
  );
  res.status(result.upsertedCount ? 201 : 200).json({ subscribed: true });
});
