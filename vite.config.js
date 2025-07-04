import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// Vite主配置，控制基础路径、插件、路径别名
export default defineConfig({
  // 插件：启用vue文件支持
  plugins: [vue()],
  // base: 用于GitHub Pages部署时的子路径，保持与仓库名一致，小写/大写完全一致
  base: '/visualtime/',         
  // 路径别名配置，@表示src目录(方便import)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
