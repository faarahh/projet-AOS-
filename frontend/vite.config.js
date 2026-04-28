import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth':                   { target: 'http://localhost:5001', changeOrigin: true },
      '/api/lists':                  { target: 'http://localhost:5002', changeOrigin: true },
      '/api/recipes':                { target: 'http://localhost:5003', changeOrigin: true },
      '/api/meal-plans':             { target: 'http://localhost:5003', changeOrigin: true },
      '/api/plan':                   { target: 'http://localhost:5003', changeOrigin: true },
      '/api/generate-shopping-list': { target: 'http://localhost:5003', changeOrigin: true },
      '/api/users':                  { target: 'http://localhost:5004', changeOrigin: true },
      '/api/groups':                 { target: 'http://localhost:5005', changeOrigin: true },
    },
  },
})
