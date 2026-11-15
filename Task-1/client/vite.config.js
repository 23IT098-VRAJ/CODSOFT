import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fixed ports, so Task-1 and Task-2 can run side by side:
//   Task-1  API 5000 · web 5173
//   Task-2  API 5001 · web 5174
// strictPort makes Vite stop with a clear error if its port is taken,
// instead of quietly moving to the next one.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
});
