import mongoose from 'mongoose';
import { publicSchemaOptions } from './toJSON.js';

export const RSS_RETENTION_DAYS = 60;

const quoteSchema = new mongoose.Schema(
  { text: { type: String, required: true }, author: { type: String, required: true } },
  { _id: false }
);

// Translation progress for RSS articles (the Urdu translator's queue).
//   pending → processing (claimed by one worker) → done | failed
const urduStatusSchema = new mongoose.Schema(
  {
    status:       { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
    attempts:     { type: Number, default: 0 },
    error:        { type: String },
    claimedAt:    { type: Date },   // when a worker took it (stale claims are retried)
    model:        { type: String }, // which Claude model translated it
    translatedAt: { type: Date },
  },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    id:          { type: String, required: true, unique: true, trim: true },
    // 'demo' = bundled sample data (npm run seed), 'rss' = fetched by the ingester
    origin:      { type: String, enum: ['demo', 'rss'], default: 'demo' },
    // Edition: 'en' now; an Urdu edition (Urdu-language sources) comes later
    language:    { type: String, enum: ['en', 'ur'], default: 'en' },
    url:         { type: String },                     // original story URL (rss: unique key)
    title:       { type: String, required: true, trim: true },
    urduTitle:   { type: String, trim: true },         // rss: filled in later by the translator
    urduSummary: { type: String },
    excerpt:     { type: String, default: '' },
    body:        { type: [String], default: undefined }, // demo only — we never store full RSS articles
    imageUrl:    { type: String },
    category:    { type: String, required: true },     // → Category.id
    source:      { type: String, required: true },     // → Source.id
    sourceName:  { type: String, required: true },     // denormalized for list views
    publishedAt: { type: Date, required: true },
    readMinutes: { type: Number, min: 1 },             // demo only (unknown for RSS summaries)
    views:       { type: Number, default: 0, min: 0 },
    shares:      { type: Number, default: 0, min: 0 },
    isBreaking:  { type: Boolean, default: false },
    isFeatured:  { type: Boolean, default: false },
    tags:        { type: [String], default: [] },
    quote:       { type: quoteSchema },
    urdu:        { type: urduStatusSchema },
  },
  { ...publicSchemaOptions, timestamps: false }
);

// Indexes for the common list queries
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ category: 1, publishedAt: -1 });
articleSchema.index({ source: 1, publishedAt: -1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ views: -1 });

// The ingester's duplicate check. Partial, so demo articles (no url) don't collide.
articleSchema.index({ url: 1 }, { unique: true, partialFilterExpression: { url: { $type: 'string' } } });

// Translator queue lookups
articleSchema.index({ 'urdu.status': 1, publishedAt: -1 });

// MongoDB deletes RSS articles automatically after RSS_RETENTION_DAYS.
// Partial, so the demo articles never expire.
articleSchema.index(
  { publishedAt: 1 },
  { expireAfterSeconds: RSS_RETENTION_DAYS * 86_400, partialFilterExpression: { origin: 'rss' } }
);

export const Article = mongoose.model('Article', articleSchema);
