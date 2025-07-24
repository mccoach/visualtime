<!-- E:\AppProject\VisualTime\src\App.vue (最终重构版 - 已应用useGlobalKeys) -->
<template>
  <!-- 
    应用的根元素，ID为"app"。
    职责：仅负责应用的最高层级布局结构。
  -->
  <div id="app">
    <!--
      主内容区域容器。
    -->
    <main class="main-content">
      <!--
        网站LOGO与标题区域。
      -->
      <div class="site-title-section">
        <div class="site-branding">
          <img :src="faviconUrl" alt="光阴 Logo" class="favicon" width="80" height="80" />
          <div class="site-text">
            <h1 class="site-title">光阴</h1>
            <p class="site-subtitle">VisualTime</p>
          </div>
        </div>
      </div>

      <!--
        日期显示组件。
      -->
      <DateDisplay />

      <!--
        四个主要倒计时卡片的网格容器。
      -->
      <div class="countdown-grid">
        <CountdownCard
          title="本年剩余"
          type="year"
          color="var(--green-primary)"
        />
        <CountdownCard
          title="本季剩余"
          type="quarter"
          color="var(--green-secondary)"
        />
        <CountdownCard
          title="本月剩余"
          type="month"
          color="var(--green-tertiary)"
        />
        <CountdownCard
          title="本周剩余"
          type="week"
          color="var(--green-quaternary)"
          :show-week-start="true"
        />
      </div>

      <!--
        “今日剩余”倒计时组件。
      -->
      <TodayCountdown />

      <!--
        自定义倒计时功能组件。
      -->
      <CustomCountdown />
    </main>

    <!--
      网站页脚。
    -->
    <footer class="footer footer-vertical">
      <span class="slogan">光阴 VisualTime - 让时间看得见</span>
      <div class="contact-box">
        <span class="contact-text" @click="showWechat = true" title="点击显示微信二维码">微信交流</span>
        <span class="wechat-icon" @click="showWechat = true" title="点击显示微信二维码">
          <img :src="wechatLogo" alt="微信logo" width="20" height="20" />
        </span>
      </div>

      <!--
        微信二维码弹窗。
      -->
      <div v-if="showWechat" class="wechat-modal" @click.self="showWechat = false">
        <div class="wechat-qr-box">
          <img :src="wechatQr" alt="微信二维码" class="wechat-qr-img" />
          <p>扫码添加微信</p>
          <button class="close-btn" @click="showWechat = false">关闭</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// --- 依赖导入 ---

// 导入Vue组合式API的核心函数
import { ref } from 'vue';
// 【核心修改】从新的整合性文件中导入 useEscapeKey
import { useEscapeKey } from './composables/useGlobalKeys.js'; 

// 导入网站LOGO（SVG格式）
import faviconUrl from './assets/favicon.svg';

// 导入所有一级子组件
import DateDisplay from './components/DateDisplay.vue';
import CountdownCard from './components/CountdownCard.vue';
import TodayCountdown from './components/TodayCountdown.vue';
import CustomCountdown from './components/CustomCountdown.vue';

// 导入微信相关的图片资源
import wechatLogo from './assets/wechat-logo.png';
import wechatQr from './assets/wechat-qr.png';


// --- 状态管理 ---
// App.vue只保留与自身UI强相关的状态，如全局弹窗的显示与否。
const showWechat = ref(false);


// --- 全局键盘交互 ---
// 通过调用Composable来处理全局键盘事件，使代码更具声明性。

// 1. 定义一个简单的回调函数，告诉useEscapeKey当ESC按下时该做什么
const closeWechatModal = () => {
  showWechat.value = false;
};

// 2. 【核心】调用Composable，将状态(showWechat)和回调(closeWechatModal)传给它
// 之后的所有事件监听和生命周期管理都由 useEscapeKey 在后台自动完成。
useEscapeKey(showWechat, closeWechatModal);
</script>

<style>
/*
  全局样式表的导入。
  最佳实践是将其移至 `src/main.js`。
@import './styles/global.css';
*/
</style>
