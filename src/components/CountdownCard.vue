<template>
  <!--
    组件根元素。
    - .countdown-card, .card, .card-cup: 应用基础、通用卡片和此组件特定的样式。
  -->
  <div class="countdown-card card card-cup">
    <!--
      装饰性的波浪液面SVG。
      - 【圆角修复】在 style 中添加了 border-radius 继承，解决父容器 overflow:visible 导致的圆角失效问题。
    -->
    <svg
      class="liquid-svg"
      :width="cardW"
      :height="cardH"
      :viewBox="`0 0 ${cardW} ${cardH}`"
      preserveAspectRatio="none"
      style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none; border-radius: inherit;"
    >
      <path :d="liquidPath" fill="var(--bg-tertiary)" fill-opacity="0.99" />
    </svg>

    <!--
      卡片主内容容器。
      - 位于波浪SVG之上 (z-index: 2)。
    -->
    <div class="card-content">
      <!--
        右上角设置菜单的容器。
        - @click.stop 阻止事件冒泡，防止点击菜单时关闭自身。
      -->
      <div class="settings-menu-container" ref="menuContainerRef" @click.stop>
        <!-- “三点”菜单触发按钮 -->
        <button class="menu-trigger-btn" @click="toggleMenu" :class="{ active: isMenuOpen }" title="设置">
          ⋮
        </button>

        <!--
          设置下拉面板 (极致紧凑版)。
          - v-if="isMenuOpen" 控制其显示与隐藏。
        -->
        <div v-if="isMenuOpen" class="settings-dropdown-panel">
          <!--
            第一列：单位选项。
            - 这是一个垂直的“连体按钮组”。
          -->
          <div class="dropdown-column">
            <!-- 遍历单位选项，高亮当前选中的项 -->
            <button
              v-for="p in precisions"
              :key="p.value"
              :class="['menu-option-btn', { active: precision === p.value }]"
              @click="handlePrecisionChange(p.value)"
            >
              {{ p.label }}
            </button>
          </div>

          <!--
            第二列：精度选项。
            - 【分隔线】此列的容器会自动获得左边框，形成分隔线效果。
          -->
          <div class="dropdown-column">
            <!-- 【动态过滤】遍历已过滤的可用精度选项 -->
            <button
              v-for="d in availableDecimalOptions"
              :key="d.value"
              :class="['menu-option-btn', { active: decimalPrecision === d.value }]"
              @click="handleDecimalChange(d.value)"
            >
              {{ d.label }}
            </button>
          </div>

          <!-- 第三列：周首日选项 (仅当 showWeekStart 为 true 时渲染) -->
          <div v-if="showWeekStart" class="dropdown-column">
            <!-- 周一按钮 -->
            <button :class="['menu-option-btn', { active: weekStart === 1 }]" @click="handleWeekStartChange(1)">
              一
            </button>
            <!-- 周日按钮 -->
            <button :class="['menu-option-btn', { active: weekStart === 0 }]" @click="handleWeekStartChange(0)">
              日
            </button>
          </div>
        </div>
      </div>

      <!-- 卡片标题 -->
      <div class="card-header">
        <h3 class="title">{{ title }}</h3>
      </div>

      <!-- 为数字容器添加 ref，它将作为舞台 -->
      <div class="number-container" ref="numberContainerRef">
        <!-- 为数字span添加ref，它将作为演员 -->
        <span class="number" ref="numberRef">{{ displayNumber }}</span>
      </div>

      <!-- 单位div (不参与缩放) -->
      <div class="unit">{{ unit }}</div>
    </div>
  </div>
</template>

<script setup>
// 导入Vue组合式API的核心函数
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
// 导入新的字号自适应管理器
import { createResponsiveFontAdapter } from '../utils/fontSizeManager.js';
// [新增] 从全局广播网关导入通信函数
import { broadcastMenuOpened, listenForOtherMenuOpened } from '../utils/eventBus.js';


// 定义组件接收的props (维持原状)
const props = defineProps({
  title: String,
  value: Number,
  precision: String,
  type: String,
  color: String,
  showWeekStart: Boolean,
  weekStart: Number,
  decimalPrecision: { type: Number, default: 0 },
  progress: { type: Number, required: true }
});


// [新增] 定义本组件在广播系统中的唯一身份ID，使用props.type确保其唯一性
const COMPONENT_ID = `countdown-card-${props.type}`;
// [新增] 用于存储 eventBus 返回的清理函数
let cleanupMenuListener = null;


// 菜单容器的引用
const menuContainerRef = ref(null);

// 为需要自适应的元素及其容器添加ref
const numberContainerRef = ref(null);
const numberRef = ref(null);

// 用于存储适配器实例的变量
let fontAdapter = null;

// 定义组件可以向父组件触发的事件 (维持原状)
const emit = defineEmits(['precision-change', 'week-start-change', 'decimal-change']);

// 定义单位选项的静态数据 (维持原状)
const precisions = [
  { value: 'day', label: '天' },
  { value: 'hour', label: '时' },
  { value: 'minute', label: '分' },
  { value: 'second', label: '秒' }
];

// 定义精度选项的静态数据 (维持原状)
const decimalOptions = [
  { value: 0, label: '0' },
  { value: 1, label: '0.0' },
  { value: 2, label: '0.00' }
];

// 【动态过滤】计算属性：根据当前选择的单位，动态返回可用的精度选项列表 (维持原状)
const availableDecimalOptions = computed(() => {
  if (props.precision === 'second') {
    return decimalOptions.filter(opt => opt.value === 0);
  }
  if (props.precision === 'minute') {
    return decimalOptions.filter(opt => opt.value <= 1);
  }
  return decimalOptions;
});

// 状态变量：控制设置菜单是否打开 (维持原状)
const isMenuOpen = ref(false);

// [修改] 切换菜单的显示/隐藏状态，在打开前先进行广播
const toggleMenu = () => {
  const willOpen = !isMenuOpen.value;
  if (willOpen) {
    // 调用 eventBus 的辅助函数进行广播
    broadcastMenuOpened(COMPONENT_ID);
  }
  isMenuOpen.value = willOpen;
};

// 方法：关闭菜单 (维持原状)
const closeMenu = () => {
  isMenuOpen.value = false;
};

// [新增] 新增一个统一的全局点击处理函数
const handleGlobalClick = (event) => {
  // 如果菜单未打开，或点击发生在菜单内部，则不执行任何操作
  if (!isMenuOpen.value || (menuContainerRef.value && menuContainerRef.value.contains(event.target))) {
    return;
  }
  // 否则，关闭菜单
  closeMenu();
};

// [新增] 新增一个统一的全局按键处理函数
const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' || e.key === 'Esc') {
    closeMenu();
  }
};

// 全局焦点变化处理函数 (维持原状，逻辑与handleGlobalClick类似，但捕获Tab等焦点变化)
const handleGlobalFocus = (event) => {
  if (!isMenuOpen.value) return;
  if (menuContainerRef.value && !menuContainerRef.value.contains(event.target)) {
    closeMenu();
  }
};

// 生命周期钩子：组件挂载后，添加全局事件监听器
onMounted(() => {
  // [修改] 添加对全局点击、键盘和焦点事件的监听
  document.addEventListener('click', handleGlobalClick, true);
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('focusin', handleGlobalFocus, true);
  // [新增] 使用 eventBus 注册对其他菜单打开事件的监听
  cleanupMenuListener = listenForOtherMenuOpened(COMPONENT_ID, closeMenu);
});

// 生命周期钩子：组件卸载前，移除全局事件监听器
onUnmounted(() => {
  // [修改] 移除所有在 onMounted 中添加的监听器，防止内存泄漏
  document.removeEventListener('click', handleGlobalClick, true);
  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('focusin', handleGlobalFocus, true);
  // [新增] 调用 eventBus 返回的清理函数，安全地移除广播监听
  if (cleanupMenuListener) {
    cleanupMenuListener();
  }
});

// 计算属性：根据当前单位 prop 返回对应的文本 (维持原状)
const unit = computed(() =>
  ({ day: '天', hour: '小时', minute: '分钟', second: '秒' }[props.precision] || '天')
);

// 计算属性：将数值格式化为包含正确小数位的字符串 (维持原状)
const displayNumber = computed(() => {
  const value = props.value ?? 0;
  return value.toFixed(props.decimalPrecision);
});

// 方法：处理单位更改 (维持原状)
const handlePrecisionChange = value => {
  emit('precision-change', props.type, value);
  closeMenu();
};
// 方法：处理精度更改 (维持原状)
const handleDecimalChange = value => {
  emit('decimal-change', props.type, value);
  closeMenu();
};
// 方法：处理周首日更改 (维持原状)
const handleWeekStartChange = value => {
  emit('week-start-change', value);
  closeMenu();
};

// 侦听器：自动修正不合法的精度组合 (维持原状)
watch([() => props.precision, () => props.decimalPrecision], ([newPrecision, dec]) => {
  if (newPrecision === 'second' && dec > 0)
    emit('decimal-change', props.type, 0);
  if (newPrecision === 'minute' && dec === 2)
    emit('decimal-change', props.type, 1);
});

// --- 波浪动画逻辑 (维持原状) ---
const cardW = 260;
const cardH = 320;
const waveOffset = ref(0);
let waveTimer;
const liquidPath = computed(() => {
  const topY = 320 * (1 - props.progress); // 液面高度反转，从下往上涨
  const phase = waveOffset.value;
  let d = `M0,320 L0,${topY} `;
  for (let x = 1; x < cardW - 1; x += 6) {
    const y = topY + Math.sin((x / 75) * 2 * Math.PI + phase / 39) * 1.5;
    d += `${x},${y} `;
  }
  d += `L${cardW},${topY} L${cardW},320 Z`;
  return d;
});


// --- 新的字号自适应逻辑 ---

/**
 * 设置或重置字号自适应适配器。
 */
const setupFontAdapter = () => {
  if (fontAdapter) {
    fontAdapter.destroy();
    fontAdapter = null;
  }

  // 确保舞台(.number-container)和演员(.number)都存在
  if (numberContainerRef.value && numberRef.value) {
    
    fontAdapter = createResponsiveFontAdapter({
      // 舞台是 .number-container
      container: numberContainerRef.value,
      // 演员只有 .number
      elements: [numberRef.value],
      minSize: window.innerWidth <= 800 ? 24 : 32,
      debounceDelay: 50,
    });
  }
};

// 侦听 displayNumber 的变化。当数字长度改变时，重新设置适配器。
watch(displayNumber, () => {
  nextTick(() => {
    setupFontAdapter();
  });
});

// 在组件挂载后，首次设置适配器
onMounted(() => {
  waveTimer = setInterval(() => {
    waveOffset.value += 1;
  }, 32);

  nextTick(() => {
    setupFontAdapter();
  });
});

// 在组件卸载前，销毁适配器和定时器，防止内存泄漏
onUnmounted(() => {
  if (waveTimer) clearInterval(waveTimer);
  if (fontAdapter) {
    fontAdapter.destroy();
  }
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
.liquid-svg, .card-content {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
}
.liquid-svg { z-index: 1; pointer-events: none; }
.card-content {
  z-index: 2;
  display: flex; flex-direction: column;
  align-items: center; 
  justify-content: center;
  box-sizing: border-box; 
  /* 卡片自身的padding，负责整体布局 */
  padding: 15px; 
}
.card-header {
  position: absolute; top: 16px; left: 24px;
  right: 16px; text-align: left;
  min-height: 28px;
}
.title {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 400; margin: 0; line-height: 1.2;
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
  /*border: 1px dashed #88f099; /* 浅绿色虚线，便于调试 */
}
.number {
  display: block;
  font-weight: 600; 
  color: v-bind(color);
  white-space: nowrap; 
  text-align: center;
  font-size: 52px;
  /*border: 1px dashed red; /* 浅绿色虚线，便于调试 */
}
.unit {
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1;
  font-size: 30px;
}

/* ========== 设置菜单样式 (极致紧凑版) ========== */
.settings-menu-container {
  position: absolute; top: 8px; right: 6px; z-index: 10;
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
  position: absolute; top: calc(100% + 5px); right: 0;
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
@media (max-width:800px){
  .countdown-card {
    height: 140px;
  }
  .card-header { top: 12px; left: 16px; right: 12px; }
  .settings-menu-container { top: 8px; right: 8px; }
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
