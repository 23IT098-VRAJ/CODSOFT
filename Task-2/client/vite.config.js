import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fixed ports, so Task-1 and Task-2 can run side by side:
//   Task-1  API 5000 · web 5173
//   Task-2  API 5001 · web 5174
// strictPort makes Vite stop with a clear error if its port is taken,
// instead of quietly moving to the next one (which the API's CORS
// allow-list would then reject).
const API_PORT = 5001

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    // In development the browser calls /api on this same origin and Vite
    // forwards it to the Task-2 API.
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      }
    }
  },
  preview: { port: 5174, strictPort: true },
})
