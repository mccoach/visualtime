<!-- E:\AppProject\VisualTime\src\App.vue -->
<!--
  根组件：纯仲裁器版
  - 去除 useEscapeKey 与仲裁开关（isArbiterEnabled）；
  - 微信模态仅通过 actionArbiter 管理 ESC/外点击互斥与关闭；
  - 其它业务与样式保持不变。
-->
<template>
  <!-- 应用根容器 -->
  <div id="app">
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 品牌区：LOGO与标题 -->
      <div class="site-title-section">
        <div class="site-branding">
          <!-- 站点图标（SVG） -->
          <img
            :src="faviconUrl"
            alt="光阴 Logo"
            class="favicon"
            width="80"
            height="80"
          />
          <!-- 标题文字 -->
          <div class="site-text">
            <h1 class="site-title">光阴</h1>
            <p class="site-subtitle">VisualTime</p>
          </div>
        </div>
      </div>

      <!-- 日期显示组件 -->
      <DateDisplay />

      <!-- 标准倒计时模块 -->
      <StandardCountdowns />

      <!-- 今日剩余倒计时 -->
      <TodayCountdown />

      <!-- 自定义倒计时 -->
      <CustomCountdown />
    </main>

    <!-- 页脚 -->
    <footer class="footer footer-vertical">
      <!-- 口号 -->
      <span class="slogan">光阴 VisualTime - 让时间看得见</span>
      <!-- 联系方式（微信） -->
      <div class="contact-box">
        <!-- 点击“微信交流”文字打开微信模态 -->
        <span
          class="contact-text"
          @click="openWechat"
          title="点击显示微信二维码"
        >
          微信交流
        </span>
        <!-- 点击微信图标同样打开微信模态 -->
        <span
          class="wechat-icon"
          @click="openWechat"
          title="点击显示微信二维码"
        >
          <img :src="wechatLogo" alt="微信logo" width="20" height="20" />
        </span>
      </div>

      <!-- 微信二维码弹窗（遮罩） -->
      <!--
        v-if="showWechat"              // 仅在状态为 true 时渲染 
        class="wechat-modal"           // 遮罩层 
        ref="wechatModalRef"           // 提供给仲裁器进行“外点击”命中判定 
        @click.self="closeWechat"      // 点击遮罩空白区域时关闭（辅助，主路由仍由仲裁器统一处理） 
      -->
      <div
        v-if="showWechat"
        class="wechat-modal"
        ref="wechatModalRef"
        @click.self="closeWechat"
      >
        <!-- 弹窗内容盒 -->
        <div class="wechat-qr-box">
          <img :src="wechatQr" alt="微信二维码" class="wechat-qr-img" />
          <p>扫码添加微信</p>
          <button class="close-btn" @click="closeWechat">关闭</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// ---------------- 依赖导入（纯仲裁器版） ----------------

// Vue 组合式 API
import { ref } from "vue";

// 站点图标（SVG）
import faviconUrl from "./assets/favicon.svg";

// 一层子组件
import DateDisplay from "./components/DateDisplay.vue";
import StandardCountdowns from "./components/StandardCountdowns.vue";
import TodayCountdown from "./components/TodayCountdown.vue";
import CustomCountdown from "./components/CustomCountdown.vue";

// 微信相关图片资源
import wechatLogo from "./assets/wechat-logo.png";
import wechatQr from "./assets/wechat-qr.png";

// 统一互斥仲裁器（仅保留纯仲裁 API）
import { activate, closeActive, isActive } from "./services/actionArbiter";

// ---------------- 本组件状态 ----------------

// 微信模态显示状态
const showWechat = ref(false);
// 遮罩根元素引用（供“外点击”作用域使用，避免点击内容区被判定为外部）
const wechatModalRef = ref(null);

// ---------------- 交互逻辑（仅仲裁路径） ----------------

/**
 * 打开或切换 WeChat 模态
 * - 若当前已是该模态的激活会话：点击即“toggle关闭”
 * - 若不是：激活新会话（ESC/外点击可关闭），并显示模态
 */
function openWechat() {
  // 已处于微信会话：点击则通过仲裁器关闭（toggle体验）
  if (isActive("modal:wechat")) {
    closeActive("toggle");
    return;
  }

  // 激活新的模态会话
  activate({
    key: "modal:wechat",               // 会话唯一键
    closers: { esc: true, outside: true }, // 允许 ESC 与外点击关闭
    // 被取代/关闭前：幂等隐藏模态
    onPreempt: () => {
      showWechat.value = false;
    },
    // 完成释放后：再次确保隐藏（幂等）
    onRelease: () => {
      showWechat.value = false;
    },
    // 提供用于“内部点击”判定的根元素（遮罩容器）
    getRootEl: () => wechatModalRef.value,
  });

  // 本地状态：显示模态
  showWechat.value = true;
}

/**
 * 主动关闭 WeChat 模态
 * - 若当前会话就是微信模态：通过仲裁器关闭（触发 onPreempt/onRelease）
 * - 否则：保证本地隐藏（容错）
 */
function closeWechat() {
  // 仲裁路径：仅当当前激活的是微信模态时才发起关闭
  if (isActive("modal:wechat")) {
    closeActive("close");
  } else {
    // 容错：确保本地隐藏
    showWechat.value = false;
  }
}
</script>

<style>
/*
  全局样式表的导入建议：在 src/main.js 中已引入 ./styles/global.css
  @import './styles/global.css';
  此处保持空壳，避免SFC内重复引入。
*/
</style>
