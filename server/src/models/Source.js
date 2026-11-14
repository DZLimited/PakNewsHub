import mongoose from 'mongoose';
import { publicSchemaOptions } from './toJSON.js';

const sourceSchema = new mongoose.Schema(
  {
    id:        { type: String, required: true, unique: true, trim: true },
    name:      { type: String, required: true },
    short:     { type: String, required: true },
    country:   { type: String, default: '' },
    url:       { type: String, required: true },
    region:    { type: String, enum: ['pk', 'intl'], default: 'intl' },
    language:  { type: String, enum: ['en', 'ur'], default: 'en' }, // which edition lists it
    color:     { type: String, default: '#E6F1FB' },
    textColor: { type: String, default: '#0C447C' },
  },
  publicSchemaOptions
);

export const Source = mongoose.model('Source', sourceSchema);
