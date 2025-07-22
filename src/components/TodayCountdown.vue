<template>
  <!--
    组件根容器。
    - 【保持原样】所有 template 部分均未做任何修改。
  -->
  <div class="today-countdown card today-liquid-wrap">
    <svg
      class="liquid-svg-h"
      :width="cardW"
      :height="cardH"
      :viewBox="`0 0 ${cardW} ${cardH}`"
      preserveAspectRatio="none"
      style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none; border-radius: inherit;"
    >
      <path
        :d="liquidPath"
        fill="var(--bg-tertiary)"
        fill-opacity="0.99"
      />
    </svg>

    <!-- [修改] 为菜单容器添加了 ref，以便在JS中访问其DOM元素，用于焦点判断 -->
    <div class="settings-menu-container" ref="menuContainerRef" @click.stop>
      <button class="menu-trigger-btn" @click="toggleMenu" :class="{ active: isMenuOpen }" title="设置">
        ⋮
      </button>
      <div v-if="isMenuOpen" class="settings-dropdown-panel">
        <div class="dropdown-column">
          <button
            :class="['menu-option-btn', { active: precision === 's' }]"
            @click="handlePrecisionChange('s')"
          >
            秒
          </button>
          <button
            :class="['menu-option-btn', { active: precision === 'ms' }]"
            @click="handlePrecisionChange('ms')"
          >
            毫秒
          </button>
        </div>
      </div>
    </div>

    <div class="card-header">
      <h3 class="title">今日剩余</h3>
    </div>

    <div class="time-display" ref="timeDisplayRef">
      <span class="num-block">{{ time.hours }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ time.minutes }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ time.seconds }}</span>
      <template v-if="precision === 'ms'">
        <span class="dot-block">.</span>
        <span class="ms-block">{{ time.milliseconds }}</span>
      </template>
    </div>

  </div>
</template>

<script setup>
// 导入Vue组合式API的核心函数
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
// 导入日期工具函数
import { getTodayRemaining } from '../utils/dateUtils';
// 导入用于持久化存储的工具函数
import { getPrecision, setPrecision as setStoragePrecision } from '../utils/storage';
// 导入 v9.1 响应式适配器
import { createResponsiveFontAdapter, SCALABLE_PROPERTIES } from '../utils/fontSizeManager';
// [新增] 从全局广播网关导入通信函数
import { broadcastMenuOpened, listenForOtherMenuOpened } from '../utils/eventBus.js';


// [新增] 定义本组件在广播系统中的唯一身份ID
const COMPONENT_ID = 'today-countdown';
// [新增] 用于存储 eventBus 返回的清理函数
let cleanupMenuListener = null;


// --- 状态管理 ---
const isMenuOpen = ref(false); // 菜单是否打开的状态
const precision = ref(getPrecision('today') || 'ms'); // 精度状态，从localStorage读取
const time = ref({ hours: '00', minutes: '00', seconds: '00', milliseconds: '000' }); // 时间对象
const waveOffset = ref(0); // 波浪动画位移
let waveTimer; // 波浪动画定时器ID
let timeTimer; // 时间更新定时器ID

// --- DOM 引用和适配器实例 ---
const timeDisplayRef = ref(null); // 指向时间显示区的DOM引用
// [新增] 指向菜单容器的DOM引用
const menuContainerRef = ref(null);
let fontAdapter = null; // 字体适配器实例
let isMobileView = ref(false); // 是否为移动端视图的状态

// --- 菜单交互逻辑 ---
// [修改] 切换菜单状态时，如果是打开操作，则先通过广播网关通知其他组件
const toggleMenu = () => {
  const willOpen = !isMenuOpen.value;
  if (willOpen) {
    // 调用 eventBus 的辅助函数进行广播
    broadcastMenuOpened(COMPONENT_ID);
  }
  isMenuOpen.value = willOpen;
};
const closeMenu = () => { isMenuOpen.value = false; }; // 关闭菜单的函数
// [修改] 保持原有逻辑，处理点击菜单外部区域关闭菜单的情况
const handleGlobalClick = (e) => {
  if (menuContainerRef.value && !menuContainerRef.value.contains(e.target)) {
    closeMenu();
  }
};
const handleGlobalKeydown = (e) => { if (e.key === 'Escape' || e.key === 'Esc') { closeMenu(); } }; // 按ESC键关闭菜单
// [新增] 新增一个处理函数，用于处理“焦点移出”菜单区域的场景
const handleGlobalFocus = (event) => {
  // 如果菜单未打开，则不执行任何操作
  if (!isMenuOpen.value) return;
  // 如果新获得焦点的元素不在本菜单容器内部，则关闭菜单
  if (menuContainerRef.value && !menuContainerRef.value.contains(event.target)) {
    closeMenu();
  }
};
const handlePrecisionChange = (val) => { // 处理精度切换的点击事件
  precision.value = val;
  setStoragePrecision('today', val);
  refreshTimeTimer();
  nextTick(initFontAdapter);
  closeMenu();
};

// --- 核心功能逻辑 ---
const progress = computed(() => { // 计算当天已过进度的计算属性
  const totalMsInDay = 86400000;
  const remainingMs = Number(time.value.hours) * 3600000 + Number(time.value.minutes) * 60000 + Number(time.value.seconds) * 1000 + Number(time.value.milliseconds);
  return 1 - remainingMs / totalMsInDay;
});
const updateTime = () => { // 更新时间的函数
  let t = getTodayRemaining();
  if (precision.value === 's') { t.milliseconds = '000'; }
  time.value = t;
};
const refreshTimeTimer = () => { // 刷新时间更新定时器的函数
  if (timeTimer) clearInterval(timeTimer);
  updateTime();
  timeTimer = setInterval(updateTime, precision.value === 'ms' ? 16 : 1000);
};

// --- 字号及布局适配逻辑 ---
const initFontAdapter = () => { // 初始化字体适配器的函数
    if (!timeDisplayRef.value) return;

    if (fontAdapter) {
        fontAdapter.destroy();
    }

    const elementsToScale = timeDisplayRef.value.querySelectorAll('.num-block, .sep-block, .dot-block, .ms-block');
    if (elementsToScale.length === 0) return;

    elementsToScale.forEach(el => {
        SCALABLE_PROPERTIES.forEach(prop => {
            el.style[prop] = '';
        });
    });

    nextTick(() => {
        const isMobile = window.innerWidth <= 800;
        isMobileView.value = isMobile;

        fontAdapter = createResponsiveFontAdapter({
            container: timeDisplayRef.value,
            elements: elementsToScale,
            minSize: isMobile ? 3 : 6,
            debounceDelay: 50,
        });
    });
};

const handleWindowResize = () => { // 处理窗口尺寸变化的函数
    if (!timeDisplayRef.value) return;
    const currentIsMobile = window.innerWidth <= 800;
    if (currentIsMobile !== isMobileView.value) {
        initFontAdapter();
    }
};

// --- SVG波浪动画逻辑 ---
const cardW = 520; // SVG viewBox 宽度
const cardH = 120; // SVG viewBox 高度
const liquidPath = computed(() => { // 生成波浪SVG路径的计算属性
  const rightX = cardW * progress.value;
  const phase = waveOffset.value;
  let d = `M${cardW},${cardH} L${cardW},0 `;
  for (let y = 1; y < cardH - 1; y += 5) { d += `${rightX + Math.sin(y/20 + phase/10)},${y} `; }
  d += `L${rightX},${cardH} Z`;
  return d;
});


// --- 生命周期钩子 ---
onMounted(() => {
  // [修改] 保持原有的外部点击和ESC键监听
  document.addEventListener('click', handleGlobalClick, true);
  document.addEventListener('keydown', handleGlobalKeydown);
  // [新增] 添加对全局“焦点移入”事件的监听
  document.addEventListener('focusin', handleGlobalFocus, true);
  // [新增] 使用 eventBus 注册对其他菜单打开事件的监听
  cleanupMenuListener = listenForOtherMenuOpened(COMPONENT_ID, closeMenu);

  // 启动波浪和时间更新的定时器
  waveTimer = setInterval(() => { waveOffset.value += 1; }, 32);
  refreshTimeTimer();

  // 初始化字体适配器
  nextTick(initFontAdapter);
  
  // 监听窗口尺寸变化
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  // [修改] 移除所有在 onMounted 中添加的监听器，以防止内存泄漏
  document.removeEventListener('click', handleGlobalClick, true);
  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('focusin', handleGlobalFocus, true);
  // [新增] 调用 eventBus 返回的清理函数，安全地移除广播监听
  if (cleanupMenuListener) {
    cleanupMenuListener();
  }
  
  // 清理所有定时器
  if(waveTimer) clearInterval(waveTimer);
  if(timeTimer) clearInterval(timeTimer);

  // 销毁字体适配器实例
  if(fontAdapter) {
    fontAdapter.destroy();
  }

  // 移除窗口尺寸变化监听
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<style scoped>
/* ========== 【完全维持原样】所有样式均未改动 ========== */
.today-countdown.today-liquid-wrap {
  position: relative;
  overflow: visible; /* [重要修正] 改为 visible 以便菜单能弹出卡片外部 */
  z-index: 0;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  border-radius: var(--border-radius) var(--border-radius) var(--border-radius) var(--border-radius);
}
.liquid-svg-h {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 1;
}
.card-header {
  position: absolute;
  top: 16px;
  left: 24px;
  z-index: 2;
}
.title {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 400;
  margin: 0;
}
.settings-menu-container {
  position: absolute; top: 8px; right: 7px; z-index: 10;
}
.menu-trigger-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: var(--border-color);
  color: var(--text-primary);
}
.settings-dropdown-panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  z-index: 11;
  border: 1px solid var(--border-color);
  display: flex;
  overflow: hidden;
}
.dropdown-column {
  display: flex;
  flex-direction: column;
}
.menu-option-btn {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 0px 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s;
  white-space: nowrap;
  border-bottom: 1px solid var(--border-color);
  border-radius: 0;
}
.dropdown-column .menu-option-btn:last-child {
  border-bottom: none;
}
.menu-option-btn:hover {
  background: var(--bg-quaternary);
}
.menu-option-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
}
.time-display {
  box-sizing: border-box;
  font-family: var(--font-mono);
  display: flex;
  align-items: baseline;
  justify-content: center;
  width: 100%;
  z-index: 2;
  padding: 0 20px;
  margin: 20px 0 0;
  /*border: 1px dashed #88f099; /* 浅绿色虚线，便于调试 */
}
.num-block, .sep-block, .dot-block, .ms-block {
  z-index: 2;
}
.num-block {
  width: 64px; text-align: center;
  font-size: 56px; font-weight: 600;
  color: var(--green-primary);
}
.sep-block {
  width: 24px; text-align: center;
  font-size: 56px; font-weight: 600;
  color: var(--green-primary);
  user-select: none;
}
.dot-block {
  width: 16px; text-align: center;
  font-size: 32px; font-weight: 600;
  color: var(--green-secondary);
  user-select: none;
}
.ms-block {
  width: 20px; text-align: left;
  font-size: 32px; font-weight: 600;
  color: var(--green-secondary);
}
@media (max-width: 800px) {
  .today-countdown.today-liquid-wrap {
    flex-direction: column;
    height: auto;
    min-height: 120px;
    gap: 12px;
    padding: 14px;
  }
  .card-header {
    position: absolute;
    top: 12px;
    left: 16px;
  }
  .title {
    font-size: 16px;
  }
  .num-block { width: 48px; font-size: 40px; }
  .sep-block { width: 13px; font-size: 40px; }
  .dot-block { width: 9px; font-size: 22px; }
  .ms-block { width: 23px; font-size: 24px; }
  .time-display { min-width: 120px; }
}
</style>
