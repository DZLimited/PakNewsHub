// Shared schema options: expose our own string `id` (e.g. "12", "bbc")
// and hide Mongo internals (_id, __v) from API responses.
export const publicSchemaOptions = {
  id: false, // disable Mongoose's virtual `id` so our real `id` field is used
  versionKey: false,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret._id;
      delete ret.photo; // photo-finder bookkeeping (Article), not for the site
      return ret;
    },
  },
};
