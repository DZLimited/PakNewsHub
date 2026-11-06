import mongoose from 'mongoose';
import { publicSchemaOptions } from './toJSON.js';

const categorySchema = new mongoose.Schema(
  {
    id:    { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true },
    urdu:  { type: String, required: true },
    emoji: { type: String, default: '🌍' },
    color: { type: String, default: '#E6F1FB' },
    text:  { type: String, default: '#0C447C' },
  },
  publicSchemaOptions
);

export const Category = mongoose.model('Category', categorySchema);
