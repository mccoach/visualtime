<template>
  <!--
    应用的根元素，ID为"app"，是Vue实例挂载的目标。
  -->
  <div id="app">
    <!--
      主内容区域。
      - .main-content 类定义了其最大宽度、居中对齐和内边距。
    -->
    <main class="main-content">
      <!--
        网站LOGO与标题区域。
        - 这是一个绝对定位的元素，因此它不会占据主内容区的文档流空间，
          而是浮动在左上角。
      -->
      <div class="site-title-section">
        <!-- 包含LOGO和文字的容器，使用Flex布局使其水平对齐。 -->
        <div class="site-branding">
          <!--
            网站LOGO图片。
            - :src 动态绑定到导入的faviconUrl资源路径。
          -->
          <img :src="faviconUrl" alt="光阴 Logo" class="favicon" width="80" height="80" />
          <!-- 网站标题和副标题的文本容器。 -->
          <div class="site-text">
            <h1 class="site-title">光阴</h1>
            <p class="site-subtitle">VisualTime</p>
          </div>
        </div>
      </div>

      <!--
        日期显示组件。
        - 负责显示当前的公历、农历和实时时间。
      -->
      <DateDisplay />

      <!--
        四个主要倒计时卡片的网格容器。
        - .countdown-grid 类应用了Grid布局，以实现响应式的卡片排列。
      -->
      <div class="countdown-grid">
        <!--
          “本年剩余”倒计时卡片。
          - title: 传递卡片标题。
          - :value: 绑定到响应式的 `yearRemaining` 状态。
          - :precision: 绑定到单位设置 (天/时/分/秒)。
          - :decimal-precision: 绑定到小数点精度设置。
          - type: 标识卡片类型，用于事件处理和状态更新。
          - color: 传递该卡片的主题色。
          - :progress: 绑定计算出的进度值 (0到1)，用于驱动卡片内的波浪动画。
          - @precision-change, @decimal-change: 监听子组件触发的事件，并调用相应的处理函数。
        -->
        <CountdownCard
          title="本年剩余"
          :value="yearRemaining"
          :precision="yearPrecision"
          :decimal-precision="yearDecimalPrecision"
          type="year"
          color="var(--green-primary)"
          :progress="getProgress('year', yearRemaining, yearMax)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        <!-- “本季剩余”倒计时卡片，props逻辑同上。 -->
        <CountdownCard
          title="本季剩余"
          :value="quarterRemaining"
          :precision="quarterPrecision"
          :decimal-precision="quarterDecimalPrecision"
          type="quarter"
          color="var(--green-secondary)"
          :progress="getProgress('quarter', quarterRemaining, quarterMax)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        <!-- “本月剩余”倒计时卡片，props逻辑同上。 -->
        <CountdownCard
          title="本月剩余"
          :value="monthRemaining"
          :precision="monthPrecision"
          :decimal-precision="monthDecimalPrecision"
          type="month"
          color="var(--green-tertiary)"
          :progress="getProgress('month', monthRemaining, monthMax)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        <!--
          “本周剩余”倒计时卡片。
          - props逻辑同上，额外增加了与周首日设置相关的 props 和事件监听。
        -->
        <CountdownCard
          title="本周剩余"
          :value="weekRemaining"
          :precision="weekPrecision"
          :decimal-precision="weekDecimalPrecision"
          type="week"
          color="var(--green-quaternary)"
          :show-week-start="true"
          :week-start="weekStart"
          :progress="getProgress('week', weekRemaining, weekMax)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
          @week-start-change="handleWeekStartChange"
        />
      </div>

      <!--
        “今日剩余”倒计时组件。
        - 这是一个独立的横条形倒计时。
      -->
      <TodayCountdown />

      <!--
        自定义倒计时功能组件。
        - 允许用户添加、编辑和管理自己的倒计时事件。
      -->
      <CustomCountdown />
    </main>

    <!--
      网站页脚。
      - .footer-vertical 类使其内容垂直居中排列。
    -->
    <footer class="footer footer-vertical">
      <!-- 网站口号 -->
      <span class="slogan">光阴 VisualTime - 让时间看得见</span>
      <!-- 联系方式容器 -->
      <div class="contact-box">
        <!--
          “微信交流”文本，点击可弹出二维码。
          - @click="showWechat = true" 将控制弹窗显示的 `showWechat` 状态设为true。
        -->
        <span class="contact-text" @click="showWechat = true" title="点击显示微信二维码">微信交流</span>
        <!-- 微信图标，点击效果同上。 -->
        <span class="wechat-icon" @click="showWechat = true" title="点击显示微信二维码">
          <img :src="wechatLogo" alt="微信logo" width="20" height="20" />
        </span>
      </div>

      <!--
        微信二维码弹窗。
        - v-if="showWechat" 根据状态变量条件性地渲染此弹窗。
        - @click.self="showWechat = false" 监听点击事件。`.self` 修饰符确保只有在直接点击遮罩层本身时才触发，点击内部的二维码内容不会关闭弹窗。
      -->
      <div v-if="showWechat" class="wechat-modal" @click.self="showWechat = false">
        <!-- 弹窗内容盒子 -->
        <div class="wechat-qr-box">
          <!-- 二维码图片 -->
          <img :src="wechatQr" alt="微信二维码" class="wechat-qr-img" />
          <p>扫码添加微信</p>
          <!-- 关闭按钮 -->
          <button class="close-btn" @click="showWechat = false">关闭</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// --- 依赖导入 ---

// 导入Vue组合式API的核心函数
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
// 导入网站LOGO（SVG格式），Vite会将其作为静态资源处理
import faviconUrl from './assets/favicon.svg';
// 导入所有子组件
import DateDisplay from './components/DateDisplay.vue';
import CountdownCard from './components/CountdownCard.vue';
import TodayCountdown from './components/TodayCountdown.vue';
import CustomCountdown from './components/CustomCountdown.vue';
// 导入日期计算相关的工具函数
import {
  getYearRemaining, getQuarterRemaining, getMonthRemaining, getWeekRemaining
} from './utils/dateUtils';
// 导入与localStorage交互的工具函数，用于持久化用户设置
import {
  getPrecision, setPrecision, getWeekStart, setWeekStart,
  getDecimalPrecision, setDecimalPrecision
} from './utils/storage';
// 导入微信相关的图片资源
import wechatLogo from './assets/wechat-logo.png';
import wechatQr from './assets/wechat-qr.png';

// --- 状态管理 (State Management) ---

// 控制微信二维码弹窗显示与否的响应式状态
const showWechat = ref(false);

/* 响应式倒计时数值状态，这些值由定时器周期性更新 */
const yearRemaining = ref(0);
const quarterRemaining = ref(0);
const monthRemaining = ref(0);
const weekRemaining = ref(0);

/*
  各卡片单位/精度设置的状态。
  - 使用 ref 创建响应式变量。
  - 初始值从 localStorage 读取，实现用户设置的持久化。
*/
const yearPrecision = ref(getPrecision('year'));
const quarterPrecision = ref(getPrecision('quarter'));
const monthPrecision = ref(getPrecision('month'));
const weekPrecision = ref(getPrecision('week'));

const yearDecimalPrecision = ref(getDecimalPrecision('year'));
const quarterDecimalPrecision = ref(getDecimalPrecision('quarter'));
const monthDecimalPrecision = ref(getDecimalPrecision('month'));
const weekDecimalPrecision = ref(getDecimalPrecision('week'));

// 周卡片专属的“周首日”设置状态
const weekStart = ref(getWeekStart());

/*
  各卡片最大值（总时长）的计算属性。
  - computed 属性会缓存其结果，只有当其依赖（如 yearPrecision）改变时才会重新计算。
  - 这个值是计算进度条百分比时的“分母”。
*/
const yearMax = computed(() => getMax('year', yearPrecision.value));
const quarterMax = computed(() => getMax('quarter', quarterPrecision.value));
const monthMax = computed(() => getMax('month', monthPrecision.value));
const weekMax  = computed(() => getMax('week', weekPrecision.value));

// --- 方法与逻辑 (Methods & Logic) ---

/**
 * 计算进度百分比 (0到1之间)。
 * @param {string} type - 卡片类型（未使用，但可用于未来扩展）。
 * @param {number} value - 当前剩余值。
 * @param {number} max - 该周期的总值。
 * @returns {number} - 进度百分比。
 */
const getProgress = (type, value, max) => {
  const total = Number(max);
  const val = Number(value);
  if (!total || isNaN(val)) return 0; // 防止除以零或无效数字
  let percent = 1 - val / total; // 进度 = (总时长 - 剩余时长) / 总时长
  if (percent < 0) percent = 0;   // 边界检查
  if (percent > 1) percent = 1;   // 边界检查
  return percent;
};

/**
 * 核心更新函数，用于刷新所有倒计时的数值。
 * 这个函数会被定时器每秒调用一次。
 */
const updateCountdowns = () => {
  yearRemaining.value = getYearRemaining(yearPrecision.value, yearDecimalPrecision.value);
  quarterRemaining.value = getQuarterRemaining(quarterPrecision.value, quarterDecimalPrecision.value);
  monthRemaining.value = getMonthRemaining(monthPrecision.value, monthDecimalPrecision.value);
  weekRemaining.value = getWeekRemaining(
    weekPrecision.value, weekDecimalPrecision.value, weekStart.value
  );
};

/*
  事件处理函数，用于响应子组件(CountdownCard)触发的设置变更事件。
*/

// 处理单位（天/时/分/秒）变化的事件
const handlePrecisionChange = (type, precision) => {
  setPrecision(type, precision); // 将新设置存入localStorage
  // 根据类型更新对应的本地响应式状态
  switch (type) {
    case 'year':    yearPrecision.value    = precision; break;
    case 'quarter': quarterPrecision.value = precision; break;
    case 'month':   monthPrecision.value   = precision; break;
    case 'week':    weekPrecision.value    = precision; break;
  }
  updateCountdowns(); // 立即刷新所有倒计时显示
};

// 处理小数点精度变化的事件
const handleDecimalChange = (type, precision) => {
  setDecimalPrecision(type, precision); // 持久化设置
  // 更新本地状态
  switch (type) {
    case 'year':    yearDecimalPrecision.value = precision; break;
    case 'quarter': quarterDecimalPrecision.value = precision; break;
    case 'month':   monthDecimalPrecision.value = precision; break;
    case 'week':    weekDecimalPrecision.value = precision; break;
  }
  updateCountdowns(); // 立即刷新
};

// 处理周首日变化的事件
const handleWeekStartChange = (val) => {
  weekStart.value = val; // 更新本地状态
  setWeekStart(val);     // 持久化设置
  updateCountdowns();    // 立即刷新
};

// --- 定时器与生命周期钩子 ---

// 定义一个变量来存储定时器的ID
let timer;
// onMounted 是一个生命周期钩子，在组件被挂载到DOM后执行
onMounted(() => {
  updateCountdowns(); // 组件加载后立即执行一次，避免初始白屏
  // 设置一个定时器，每1000毫秒（1秒）调用一次 updateCountdowns 函数
  timer = setInterval(updateCountdowns, 1000);
});
// onUnmounted 是在组件被卸载前执行
onUnmounted(() => {
  // 清除定时器，这是非常重要的性能优化和内存管理步骤，防止组件卸载后定时器仍在后台运行
  clearInterval(timer);
});

/**
 * 根据周期类型和单位，获取该周期的总时长。
 * @param {'year'|'quarter'|'month'|'week'} type - 周期类型。
 * @param {'day'|'hour'|'minute'|'second'} precision - 时间单位。
 * @returns {number} - 计算出的总时长。
 */
function getMax(type, precision) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  // 年度总时长计算
  if (type === 'year') {
    // 判断是否是闰年，以确定一年的总天数
    const yearDays = ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) ? 366 : 365;
    if (precision === 'day')    return yearDays;
    if (precision === 'hour')   return yearDays * 24;
    if (precision === 'minute') return yearDays * 24 * 60;
    if (precision === 'second') return yearDays * 24 * 60 * 60;
  }
  // 季度总时长计算
  if (type === 'quarter') {
    const quarter = Math.floor(m / 3); // 计算当前是第几季度 (0-3)
    let days = 0;
    // 循环计算该季度包含的三个月的总天数
    for (let i = 0; i < 3; i++) {
      const mm = quarter * 3 + i + 1;
      days += new Date(y, mm, 0).getDate();
    }
    if (precision === 'day')    return days;
    if (precision === 'hour')   return days * 24;
    if (precision === 'minute') return days * 24 * 60;
    if (precision === 'second') return days * 24 * 60 * 60;
  }
  // 月度总时长计算
  if (type === 'month') {
    const days = new Date(y, m + 1, 0).getDate(); // 获取当月的总天数
    if (precision === 'day')    return days;
    if (precision === 'hour')   return days * 24;
    if (precision === 'minute') return days * 24 * 60;
    if (precision === 'second') return days * 24 * 60 * 60;
  }
  // 周总时长计算（固定为7天）
  if (type === 'week') {
    if (precision === 'day')    return 7;
    if (precision === 'hour')   return 7 * 24;
    if (precision === 'minute') return 7 * 24 * 60;
    if (precision === 'second') return 7 * 24 * 60 * 60;
  }
  return 1; // 默认返回值，防止出错
}

// --- 微信弹窗的键盘事件处理 ---

/**
 * 处理键盘事件，用于实现按 ESC 键关闭弹窗。
 * @param {KeyboardEvent} e - 键盘事件对象。
 */
function handleWechatEscKey(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (showWechat.value) showWechat.value = false;
  }
}
// 使用 watch 侦听 `showWechat` 状态的变化
watch(showWechat, val => {
  // 只有当弹窗显示时 (val为true)，才添加键盘事件监听器
  if (val) {
    document.addEventListener('keydown', handleWechatEscKey);
  } else {
    // 当弹窗关闭时，移除监听器，以提升性能
    document.removeEventListener('keydown', handleWechatEscKey);
  }
});
// 在组件卸载时，也确保移除监听器，防止内存泄漏
onUnmounted(() => {
  document.removeEventListener('keydown', handleWechatEscKey);
});
</script>

<style>
/*
  导入全局样式表。
  - @import './styles/global.css'; 将会应用在整个应用中。
  - 这个组件本身没有 scoped 样式，所有样式由全局CSS文件控制，保持了代码的简洁。
*/
@import './styles/global.css';
</style>
