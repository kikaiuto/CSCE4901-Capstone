import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.API_PROXY_TARGET || 'http://localhost:8000'
  const proxy = {
    '/api': { target: apiProxyTarget, changeOrigin: true },
    '/health': { target: apiProxyTarget, changeOrigin: true },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      proxy,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/core/test/setup.ts'],
      css: true,
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
