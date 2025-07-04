import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'   // ← ← ← ← 这行是关键！

export default defineConfig({
  plugins: [vue()],
  base: '/visualtime/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
