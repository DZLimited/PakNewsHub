import { Router } from 'express';
import { Source } from '../models/Source.js';
import { Category } from '../models/Category.js';

export const metaRouter = Router();

/** GET /api/sources → Source[] */
metaRouter.get('/sources', async (_req, res) => {
  res.json(await Source.find().sort({ _id: 1 })); // seed order: Pakistani first
});

/** GET /api/categories → Category[] (in seed order) */
metaRouter.get('/categories', async (_req, res) => {
  res.json(await Category.find().sort({ _id: 1 }));
});
