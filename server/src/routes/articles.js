import { Router } from 'express';
import { Article } from '../models/Article.js';
import { countArticles, GROUP_FIELDS, queryArticles } from '../services/articleQuery.js';
import { HttpError } from '../middleware/errors.js';

export const articlesRouter = Router();

/**
 * GET /api/articles
 *   ?q=&category=&source=bbc,dawn&tag=&featured=true&breaking=true
 *   &exclude=<id>&range=any|1h|24h|7d|30d&sort=latest|views|shares|relevance
 *   &limit=&offset=
 * → { items: Article[], total: number }
 */
articlesRouter.get('/', async (req, res) => {
  res.json(await queryArticles(req.query));
});

/**
 * GET /api/articles/counts?groupBy=source|category&<same filters>
 * → { [id]: count }
 * (declared before /:id so "counts" isn't treated as an article id)
 */
articlesRouter.get('/counts', async (req, res) => {
  const { groupBy, ...filters } = req.query;
  if (!GROUP_FIELDS.includes(groupBy)) {
    throw new HttpError(400, `groupBy must be one of: ${GROUP_FIELDS.join(', ')}`);
  }
  res.json(await countArticles(groupBy, filters));
});

/** GET /api/articles/:id → Article (404 if missing) */
articlesRouter.get('/:id', async (req, res) => {
  const article = await Article.findOne({ id: req.params.id });
  if (!article) throw new HttpError(404, 'Article not found');
  res.json(article);
});
