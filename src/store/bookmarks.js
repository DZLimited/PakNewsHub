import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Store a lightweight snapshot (no body) so the Saved page works offline
// and doesn't need an extra API round-trip.
const snapshot = ({ body: _body, quote: _quote, ...rest }) => rest;

export const useBookmarks = create(
  persist(
    (set, get) => ({
      items: [],
      isSaved: id => get().items.some(a => a.id === id),
      toggle: article =>
        set(state =>
          state.items.some(a => a.id === article.id)
            ? { items: state.items.filter(a => a.id !== article.id) }
            : { items: [snapshot(article), ...state.items] }
        ),
      clear: () => set({ items: [] }),
    }),
    { name: 'bookmarks' }
  )
);
