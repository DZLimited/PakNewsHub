import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // With VITE_API_URL=/api, requests go through this proxy to the Express
    // server, so there are no CORS issues in development.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
