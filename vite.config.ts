import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Em dev, /api vai para o backend Flask (mesma origem => sem CORS, cookie HttpOnly funciona).
// Em producao (KingHost) o /api e montado pelo proprio servidor, no mesmo dominio.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false } },
  },
  build: { sourcemap: false, target: 'es2022', cssCodeSplit: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
