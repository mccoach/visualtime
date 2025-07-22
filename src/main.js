// ========== main.js ==========
// 应用入口文件，负责创建并挂载根 Vue 应用

// 导入 createApp 创建Vue应用实例
import { createApp } from 'vue'
// 导入主应用组件
import App from './App.vue'

// 应用全局样式，如果 global.css 单独放，可以这样全局引入
import './styles/global.css'

// 创建应用并挂载到 #app 元素
createApp(App).mount('#app')
