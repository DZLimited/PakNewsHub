import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  },
  { timestamps: true, versionKey: false }
);

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
