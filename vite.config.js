import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/visualtime/', // 替换为你的仓库名，这里只需要仓库名本身，不需要完整路径，前后都要有斜杠
})
