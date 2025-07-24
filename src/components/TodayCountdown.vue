<!-- E:\AppProject\VisualTime\src\components\TodayCountdown.vue (全新重构版) -->
<template>
  <!-- 组件根容器 -->
  <div class="today-countdown card today-liquid-wrap">
    <!-- SVG波浪动画，现在由 useCountdown 返回的 progress 驱动 -->
    <svg class="liquid-svg-h" :width="cardW" :height="cardH" :viewBox="`0 0 ${cardW} ${cardH}`"
      preserveAspectRatio="none"
      style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none; border-radius: inherit;">
      <path :d="liquidPath" :fill="progress > 0.8 ? 'var(--green-secondary)' : (progress > 0.5 ? 'var(--green-quaternary)' : 'var(--bg-tertiary)')"
        fill-opacity="0.9" />
    </svg>

    <!-- 设置菜单 -->
    <div class="settings-menu-container" ref="menuContainerRef" @click.stop>
      <button class="menu-trigger-btn" @click="toggleMenu" :class="{ active: isMenuOpen }" title="设置">
        ⋮
      </button>
      <div v-if="isMenuOpen" class="settings-dropdown-panel">
        <div class="dropdown-column">
          <!-- 这里的 'active' 状态现在绑定到本地管理的 precision ref -->
          <button :class="['menu-option-btn', { active: precision === 'seconds' }]"
            @click="handlePrecisionChange('seconds')">
            秒
          </button>
          <button :class="['menu-option-btn', { active: precision === 'milliseconds' }]"
            @click="handlePrecisionChange('milliseconds')">
            毫秒
          </button>
        </div>
      </div>
    </div>

    <!-- 卡片头部标题 -->
    <div class="card-header">
      <h3 class="title">今日剩余</h3>
    </div>

    <!-- 时间显示区域，绑定到 useCountdown 返回的 timeObject -->
    <div class="time-display" ref="timeDisplayRef">
      <span class="num-block">{{ time.hours }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ time.minutes }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ time.seconds }}</span>
      <!-- 根据本地管理的 precision ref 来决定是否显示毫秒 -->
      <template v-if="precision === 'milliseconds'">
        <span class="dot-block">.</span>
        <span class="ms-block">{{ time.milliseconds }}</span>
      </template>
    </div>

  </div>
</template>

<script setup>
// E:\AppProject\VisualTime\src\components\TodayCountdown.vue (仅<script setup>部分)

// --- 依赖导入 ---
// 导入Vue的核心API
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
// 导入我们统一的倒计时逻辑编排Composable
import { useCountdown } from '../composables/useCountdown.js';
// 导入事件总线，用于菜单的互斥关闭
import { broadcastMenuOpened, listenForOtherMenuOpened } from '../utils/eventBus.js';
// 导入字体自适应管理器
import { createResponsiveFontAdapter } from '../utils/fontSizeManager.js';
// 导入本地存储工具，用于读写本组件的精度设置
import * as storage from '../utils/storage.js';
// 【核心升级】导入新的时钟服务API，用于请求和释放高频更新
import { requestHighFrequencyUpdate, releaseHighFrequencyUpdate } from '../services/clockService';

// --- 业务逻辑层 ---
// 【核心】调用 useCountdown，并传入 'day' 类型，获取计算好的时间和进度。
// time 和 progress 都是响应式的，会自动跟随 clockService 更新。
const { timeObject: time, progress } = useCountdown('day');

// --- UI状态与交互逻辑 ---

// 管理本组件独有的精度设置（秒/毫秒）。
// 它从本地存储初始化，以保持用户偏好。
const precision = ref(storage.getPrecision('today') || 'milliseconds');

// 控制设置菜单的显示与隐藏
const isMenuOpen = ref(false);
// 指向菜单DOM容器的引用，用于判断点击是否在菜单外部
const menuContainerRef = ref(null);
// 存储eventBus返回的清理函数，用于在组件卸载时取消订阅
let cleanupMenuListener = null;

// 切换菜单显示/隐藏的方法
const toggleMenu = () => {
  const willOpen = !isMenuOpen.value;
  // 如果要打开菜单，则通过事件总线广播一个事件，通知其他菜单关闭
  if (willOpen) broadcastMenuOpened('today-countdown');
  isMenuOpen.value = willOpen;
};

// 关闭菜单的方法
const closeMenu = () => { isMenuOpen.value = false; };

// 处理精度变化的方法
const handlePrecisionChange = (val) => {
  precision.value = val; // 更新本地响应式状态
  storage.setPrecision('today', val); // 将新设置存入localStorage
  closeMenu(); // 关闭菜单
};

// --- 【核心升级】按需升降频逻辑 ---

// 创建一个唯一的标识符，用于向clockService注册和释放高频需求。
// 使用Symbol确保了其唯一性，避免与其他组件的标识冲突。
const componentId = Symbol('TodayCountdown');

// 使用 watch 来动态地、响应式地根据 precision 的值来决定是否需要高频更新
watch(
  precision, // 监听的目标是 precision 这个 ref
  (newPrecision, oldPrecision) => { // 当 precision 值变化时执行的回调
    // 如果新的精度是 'milliseconds'，并且旧的不是，说明用户刚刚切换到毫秒显示
    if (newPrecision === 'milliseconds' && oldPrecision !== 'milliseconds') {
      // 向中央时钟服务注册一个高频更新的需求
      requestHighFrequencyUpdate(componentId);
    }
    // 如果新的精度不是 'milliseconds'，并且旧的是，说明用户刚刚从毫秒切换走
    else if (newPrecision !== 'milliseconds' && oldPrecision === 'milliseconds') {
      // 释放之前注册的高频更新需求
      releaseHighFrequencyUpdate(componentId);
    }
  }, 
  { immediate: true } // immediate: true 确保该watch在组件初始化时立即执行一次，
                     // 这样就能根据初始的精度值，正确地设置好时钟频率。
);


// --- 全局事件监听 (用于关闭菜单) ---
// 处理全局点击，用于点击菜单外部时关闭菜单
const handleGlobalClick = (e) => {
  if (isMenuOpen.value && menuContainerRef.value && !menuContainerRef.value.contains(e.target)) {
    closeMenu();
  }
};
// 处理全局键盘事件，用于按ESC键关闭菜单
const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' || e.key === 'Esc') {
    closeMenu();
  }
};


// --- SVG波浪动画逻辑 ---
const cardW = 520;
const cardH = 120;
const waveOffset = ref(0); // 控制波浪水平位移，产生动画效果
let waveTimer; // 存储波浪动画的定时器ID
// 计算SVG路径的计算属性
const liquidPath = computed(() => {
  const rightX = cardW * progress.value; // 液面的右边界由 progress 决定
  const phase = waveOffset.value; // 波浪的相位
  let d = `M${cardW},${cardH} L${cardW},0 `;
  // 循环生成波浪曲线上的点
  for (let y = 1; y < cardH - 1; y += 5) { 
    d += `${rightX + Math.sin(y/20 + phase/10)},${y} `; 
  }
  d += `L${rightX},${cardH} Z`;
  return d;
});


// --- 字号自适应逻辑 ---
const timeDisplayRef = ref(null); // 指向时间显示区域DOM的引用
let fontAdapter = null; // 存储字体适配器实例
let isMobileView = ref(false); // 存储当前是否为移动端视图

// 初始化适配器的函数
const initFontAdapter = () => {
    if (!timeDisplayRef.value) return; // 确保DOM元素存在
    if (fontAdapter) fontAdapter.destroy(); // 先销毁旧实例，防止内存泄漏
    const elementsToScale = timeDisplayRef.value.querySelectorAll('span'); // 获取所有需要缩放的span
    if (elementsToScale.length === 0) return;
    
    // 重置样式，以便重新计算原始尺寸
    elementsToScale.forEach(el => {
        ['fontSize', 'width', 'height', 'letterSpacing'].forEach(prop => { el.style[prop] = ''; });
    });

    // 使用nextTick确保DOM更新（如毫秒的显示/隐藏）后再执行适配
    nextTick(() => {
        isMobileView.value = window.innerWidth <= 800; // 判断是否为移动端
        fontAdapter = createResponsiveFontAdapter({
            container: timeDisplayRef.value,
            elements: elementsToScale,
            minSize: isMobileView.value ? 10 : 12, // 为移动端设置更小的最小字号
            debounceDelay: 50,
        });
    });
};

// 处理窗口尺寸变化的函数
const handleWindowResize = () => {
    if (!timeDisplayRef.value) return;
    const currentIsMobile = window.innerWidth <= 800;
    // 只有在跨越移动端/桌面端断点时，才重新初始化适配器
    if (currentIsMobile !== isMobileView.value) {
        initFontAdapter();
    }
};

// 监听精度变化，因为显示/隐藏毫秒会改变元素总数和容器宽度，需要重新适配字体
watch(precision, () => {
  nextTick(initFontAdapter);
});


// --- 生命周期钩子 ---
onMounted(() => {
  // 添加全局事件监听
  document.addEventListener('click', handleGlobalClick, true);
  document.addEventListener('keydown', handleGlobalKeydown);
  // 订阅其他菜单打开的事件
  cleanupMenuListener = listenForOtherMenuOpened('today-countdown', closeMenu);
  
  // 启动波浪动画
  waveTimer = setInterval(() => { waveOffset.value += 1; }, 32);

  // 初始化字体适配器并监听窗口变化
  nextTick(initFontAdapter);
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  // 【核心升级】在组件卸载时，确保释放高频更新需求，防止内存泄漏
  releaseHighFrequencyUpdate(componentId);

  // 清理所有全局事件监听
  document.removeEventListener('click', handleGlobalClick, true);
  document.removeEventListener('keydown', handleGlobalKeydown);
  if (cleanupMenuListener) cleanupMenuListener();

  // 清理定时器
  if (waveTimer) clearInterval(waveTimer);

  // 清理字体适配器和窗口监听
  if (fontAdapter) fontAdapter.destroy();
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<style scoped>
/* 样式部分保持不变 */
/* ... 您的所有 <style scoped> 内容 ... */
.today-countdown.today-liquid-wrap {
  position: relative;
  overflow: visible;
  z-index: 0;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  border-radius: var(--border-radius);
}

.liquid-svg-h {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  border-radius: inherit;
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
  position: absolute;
  top: 8px;
  right: 7px;
  z-index: 10;
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
  background: var(--bg-quaternary);
  color: var(--text-primary);
}

.settings-dropdown-panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
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
  display: flex;
  align-items: baseline;
  justify-content: center;
  width: 100%;
  z-index: 2;
  padding: 0 20px;
  margin: 20px 0 0;
}

.num-block,
.sep-block,
.dot-block,
.ms-block {
  z-index: 2;
}

.num-block {
  width: 64px;
  text-align: center;
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
}

.sep-block {
  width: 24px;
  text-align: center;
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
  user-select: none;
}

.dot-block {
  width: 16px;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: var(--green-secondary);
  user-select: none;
}

.ms-block {
  width: 20px;
  text-align: left;
  font-size: 32px;
  font-weight: 600;
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

  .num-block {
    width: 48px;
    font-size: 40px;
  }

  .sep-block {
    width: 13px;
    font-size: 40px;
  }

  .dot-block {
    width: 9px;
    font-size: 22px;
  }

  .ms-block {
    width: 23px;
    font-size: 24px;
  }

  .time-display {
    min-width: 120px;
  }
}
</style>
