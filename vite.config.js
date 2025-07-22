import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Vite主配置，控制基础路径、插件、路径别名、服务器和构建选项
export default defineConfig({
  // 插件：启用vue文件支持
  plugins: [vue()],

  // base: 用于GitHub Pages部署时的子路径，保持与仓库名一致
  base: '/visualtime/',

  // 路径别名配置，@表示src目录(方便import)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  // [新增] 开发服务器配置
  server: {
    host: '0.0.0.0', // 允许通过IP地址访问，方便在同一局域网下的其他设备（如手机）上预览
    port: 8080,      // 指定一个固定的端口号，避免每次启动时端口变化
    open: true       // 运行 `npm run dev` 时自动在浏览器中打开项目
  },

  // [新增] 生产构建配置
  build: {
    sourcemap: false, // 生产环境中关闭 source map，可以减小文件体积并提高安全性
    
    // 配置代码压缩工具 (Vite 默认使用 esbuild，速度快；Terser 压缩率更高)
    // 这里我们使用 Terser，并配置它移除 console 和 debugger
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除所有 console.log
        drop_debugger: true // 移除 debugger
      }
    }
  }
})
