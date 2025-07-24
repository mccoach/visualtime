<!-- E:\AppProject\VisualTime\src\components\CountdownCard.vue (全新重构版) -->
<template>
  <!-- 
    组件根元素。
    它现在是一个高度内聚的业务组件。
  -->
  <div class="countdown-card card card-cup">
    <!-- 
      装饰性的波浪SVG。
      它的液面高度由 `countdown.progress` 响应式地驱动。
    -->
    <svg class="liquid-svg" :width="cardW" :height="cardH" :viewBox="`0 0 ${cardW} ${cardH}`" preserveAspectRatio="none"
      style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none; border-radius: inherit;">
      <path :d="liquidPath" :fill="color" fill-opacity="0.1" />
    </svg>

    <!-- 卡片主内容容器，位于波浪之上。 -->
    <div class="card-content">
      <!-- 
        右上角的设置菜单容器。
        它的显示状态 (isMenuOpen) 和交互逻辑完全由本组件内部管理。
      -->
      <div class="settings-menu-container" ref="menuContainerRef" @click.stop>
        <button class="menu-trigger-btn" @click="toggleMenu" :class="{ active: isMenuOpen }" title="设置">
          ⋮
        </button>
        <!-- 设置下拉面板，v-if控制其显示 -->
        <div v-if="isMenuOpen" class="settings-dropdown-panel">
          <!-- 
            第一列：单位选项。
            - 遍历 precisions 数组生成按钮。
            - `active` 类根据 `countdown.precision` 的值动态绑定。
            - `@click` 调用 `handlePrecisionChange` 方法。
          -->
          <div class="dropdown-column">
            <button v-for="p in precisions" :key="p.value"
              :class="['menu-option-btn', { active: countdown.precision.value === p.value }]"
              @click="handlePrecisionChange(p.value)">
              {{ p.label }}
            </button>
          </div>

          <!-- 
            第二列：精度选项。
            - 遍历动态计算的 `availableDecimalOptions`。
            - `active` 类根据 `countdown.decimalPrecision` 的值动态绑定。
          -->
          <div class="dropdown-column">
            <button v-for="d in availableDecimalOptions" :key="d.value"
              :class="['menu-option-btn', { active: countdown.decimalPrecision.value === d.value }]"
              @click="handleDecimalChange(d.value)">
              {{ d.label }}
            </button>
          </div>

          <!-- 第三列：周首日选项 (仅当 props.showWeekStart 为 true 时渲染) -->
          <div v-if="props.showWeekStart" class="dropdown-column">
            <button :class="['menu-option-btn', { active: countdown.weekStart.value === 1 }]"
              @click="handleWeekStartChange(1)">一</button>
            <button :class="['menu-option-btn', { active: countdown.weekStart.value === 0 }]"
              @click="handleWeekStartChange(0)">日</button>
          </div>
        </div>
      </div>

      <!-- 卡片标题，由 props.title 决定 -->
      <div class="card-header">
        <h3 class="title">{{ props.title }}</h3>
      </div>

      <!-- 
        数字容器，作为字体自适应的“舞台”。
        其内部的数字由 `countdown.displayValue` 响应式地提供。
      -->
      <div class="number-container" ref="numberContainerRef">
        <span class="number" ref="numberRef" :style="{ color: props.color }">{{ countdown.displayValue.value }}</span>
      </div>

      <!-- 单位文本，由 `countdown.unitLabel` 响应式地提供 -->
      <div class="unit">{{ countdown.unitLabel.value }}</div>
    </div>
  </div>
</template>

<script setup>
// --- 依赖导入 ---
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useCountdown } from '../composables/useCountdown.js'; // 【核心】导入我们的新Composable
import { broadcastMenuOpened, listenForOtherMenuOpened } from '../utils/eventBus.js';
import { createResponsiveFontAdapter } from '../utils/fontSizeManager.js';

// --- Props 定义 ---
// Props 被极大简化，只接收与UI展示和类型标识相关的属性
const props = defineProps({
  title: String,
  type: { type: String, required: true }, // 'type' 是调用 useCountdown 的关键
  color: { type: String, default: 'var(--green-primary)' },
  showWeekStart: { type: Boolean, default: false },
});

// --- 业务逻辑层 ---
// 【核心】只需一行代码，即可从Composable中获取所有业务逻辑和响应式数据
const countdown = useCountdown(props.type);

// --- UI 状态与交互逻辑 ---
const COMPONENT_ID = `countdown-card-${props.type}`; // 用于事件总线，确保ID唯一
const isMenuOpen = ref(false); // 控制设置菜单的开关状态
const menuContainerRef = ref(null); // 指向菜单容器DOM的引用
let cleanupMenuListener = null; // 用于存储eventBus返回的清理函数

// 切换菜单显示/隐藏的方法
const toggleMenu = () => {
  const willOpen = !isMenuOpen.value;
  if (willOpen) broadcastMenuOpened(COMPONENT_ID); // 打开前广播事件，通知其他菜单关闭
  isMenuOpen.value = willOpen;
};

// 关闭菜单的方法
const closeMenu = () => { isMenuOpen.value = false; };

// 处理全局点击，用于点击菜单外部时关闭菜单
const handleGlobalClick = (event) => {
  if (isMenuOpen.value && menuContainerRef.value && !menuContainerRef.value.contains(event.target)) {
    closeMenu();
  }
};

// 处理全局键盘事件，用于按ESC键关闭菜单
const handleGlobalKeydown = (event) => {
  if (event.key === 'Escape' || event.key === 'Esc') {
    closeMenu();
  }
};

// 在组件挂载时，添加全局事件监听
onMounted(() => {
  document.addEventListener('click', handleGlobalClick, true);
  document.addEventListener('keydown', handleGlobalKeydown);
  cleanupMenuListener = listenForOtherMenuOpened(COMPONENT_ID, closeMenu);
});

// 在组件卸载前，移除所有监听，防止内存泄漏
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick, true);
  document.removeEventListener('keydown', handleGlobalKeydown);
  if (cleanupMenuListener) cleanupMenuListener();
});

// --- 设置选项的静态数据 ---
const precisions = [
  { value: 'days', label: '天' }, { value: 'hours', label: '时' },
  { value: 'minutes', label: '分' }, { value: 'seconds', label: '秒' }
];
const decimalOptions = [
  { value: 0, label: '0' }, { value: 1, label: '0.0' }, { value: 2, label: '0.00' }
];

// --- 动态计算属性 ---
// 根据当前选择的单位，动态过滤出可用的精度选项
const availableDecimalOptions = computed(() => {
  // countdown.precision 是一个ref，所以需要 .value 来访问
  const currentPrecision = countdown.precision.value;
  if (currentPrecision === 'seconds') return decimalOptions.filter(opt => opt.value === 0);
  if (currentPrecision === 'minutes') return decimalOptions.filter(opt => opt.value <= 1);
  return decimalOptions;
});

// --- 事件处理方法 ---
// 这些方法现在调用的是从 useCountdown Composable 中返回的函数

const handlePrecisionChange = (value) => {
  countdown.setPrecision(value);
  closeMenu();
};
const handleDecimalChange = (value) => {
  countdown.setDecimalPrecision(value);
  closeMenu();
};
const handleWeekStartChange = (value) => {
  countdown.setWeekStart(value);
  closeMenu();
};

// --- 波浪动画逻辑 ---
const cardW = 260;
const cardH = 320;
const waveOffset = ref(0);
let waveTimer;
const liquidPath = computed(() => {
  // 【核心】progress的值现在直接来自countdown Composable，它已经是响应式的
  const topY = cardH * (1 - countdown.progress.value);
  const phase = waveOffset.value;
  let d = `M0,${cardH} L0,${topY} `;
  for (let x = 1; x < cardW - 1; x += 6) {
    const y = topY + Math.sin((x / 75) * 2 * Math.PI + phase / 39) * 1.5;
    d += `${x},${y} `;
  }
  d += `L${cardW},${topY} L${cardW},${cardH} Z`;
  return d;
});

// 组件挂载时启动波浪动画定时器
onMounted(() => {
  waveTimer = setInterval(() => {
    waveOffset.value += 1;
  }, 32);
});
// 组件卸载时清除定时器
onUnmounted(() => {
  if (waveTimer) clearInterval(waveTimer);
});

// --- 字号自适应逻辑 ---
const numberContainerRef = ref(null);
const numberRef = ref(null);
let fontAdapter = null;
// 封装适配器初始化逻辑
const setupFontAdapter = () => {
  if (fontAdapter) fontAdapter.destroy(); // 先销毁旧的实例
  if (numberContainerRef.value && numberRef.value) {
    fontAdapter = createResponsiveFontAdapter({
      container: numberContainerRef.value,
      elements: [numberRef.value],
      minSize: window.innerWidth <= 800 ? 24 : 32, // 响应式最小字号
      debounceDelay: 50,
    });
  }
};
// 监听显示的数值变化，当数字长度改变时（如从10变为9），重新适配字号
watch(() => countdown.displayValue.value, () => {
  nextTick(setupFontAdapter); // 使用nextTick确保DOM更新后再执行
});
// 组件挂载后首次初始化
onMounted(() => {
  nextTick(setupFontAdapter);
});
// 组件卸载时销毁适配器实例
onUnmounted(() => {
  if (fontAdapter) fontAdapter.destroy();
});
</script>

<style scoped>
/* ========== 卡片与内容布局 ========== */
.countdown-card.card-cup {
  position: relative;
  overflow: visible;
  z-index: 0;
  height: 160px;
}

.liquid-svg,
.card-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.liquid-svg {
  z-index: 1;
  pointer-events: none;
}

.card-content {
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  /* 卡片自身的padding，负责整体布局 */
  padding: 15px;
}

.card-header {
  position: absolute;
  top: 16px;
  left: 24px;
  right: 16px;
  text-align: left;
  min-height: 28px;
}

.title {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 400;
  margin: 0;
  line-height: 1.2;
}

/* ========== 数字与单位 ========== */
.number-container {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  margin-top: 15px;
  margin-bottom: 15px;
  line-height: 1;
  height: 60px;
  padding: 0 30px;
  box-sizing: border-box;
}

.number {
  display: block;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
  font-size: 52px;
}

.unit {
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1;
  font-size: 30px;
}

/* ========== 设置菜单样式 (极致紧凑版) ========== */
.settings-menu-container {
  position: absolute;
  top: 8px;
  right: 6px;
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

.dropdown-column:not(:first-child) {
  border-left: 1px solid var(--border-color);
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
  position: relative;
  z-index: 2;
}

/* ========== 响应式调整 ========== */
@media (max-width:800px) {
  .countdown-card.card-cup {
    height: 140px;
  }

  .card-header {
    top: 12px;
    left: 16px;
    right: 12px;
  }

  .settings-menu-container {
    top: 8px;
    right: 8px;
  }

  .number-container {
    padding: 0 15px;
  }

  .number {
    font-size: 48px;
  }

  .unit {
    font-size: 24px;
  }
}
</style>
