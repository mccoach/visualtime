// E:\AppProject\VisualTime\src\main.js

// 导入 createApp 创建Vue应用实例
import { createApp } from 'vue';
// 导入主应用组件
import App from './App.vue';
// 【新增】导入时钟服务的启动函数
import { startClockService } from './services/clockService';

// 【新增】在应用创建前，启动全局时钟服务
startClockService();

// 应用全局样式，如果 global.css 单独放，可以这样全局引入
import './styles/global.css'

// 创建应用并挂载到 #app 元素
createApp(App).mount('#app');
