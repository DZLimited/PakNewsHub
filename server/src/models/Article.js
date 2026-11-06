import mongoose from 'mongoose';
import { publicSchemaOptions } from './toJSON.js';

const quoteSchema = new mongoose.Schema(
  { text: { type: String, required: true }, author: { type: String, required: true } },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    id:          { type: String, required: true, unique: true, trim: true },
    title:       { type: String, required: true, trim: true },
    urduTitle:   { type: String, required: true, trim: true },
    urduSummary: { type: String, default: '' },
    excerpt:     { type: String, default: '' },
    body:        { type: [String], default: [] },
    url:         { type: String },                     // original story URL, if known
    category:    { type: String, required: true },     // → Category.id
    source:      { type: String, required: true },     // → Source.id
    sourceName:  { type: String, required: true },     // denormalized for list views
    publishedAt: { type: Date, required: true },
    readMinutes: { type: Number, default: 3, min: 1 },
    views:       { type: Number, default: 0, min: 0 },
    shares:      { type: Number, default: 0, min: 0 },
    isBreaking:  { type: Boolean, default: false },
    isFeatured:  { type: Boolean, default: false },
    tags:        { type: [String], default: [] },
    quote:       { type: quoteSchema },
  },
  { ...publicSchemaOptions, timestamps: false }
);

// Indexes for the common list queries
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ category: 1, publishedAt: -1 });
articleSchema.index({ source: 1, publishedAt: -1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ views: -1 });

export const Article = mongoose.model('Article', articleSchema);
