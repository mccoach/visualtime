<!-- E:\AppProject\VisualTime\src\components\TodayCountdown.vue -->
<!--
  说明（逐行注释版）：
  - 本组件显示“今日剩余”倒计时，包含顶部设置菜单与动态波浪背景。
  - 第六阶段重构：彻底移除 eventBus 与灰度开关；所有互斥交互统一由 actionArbiter 管理。
  - 菜单：通过仲裁器实现 ESC / 外点击关闭，与全局其他会话（如其他菜单/左滑/拖拽）互斥。
  - 字号适配：使用 fontSizeManager 的响应式适配器，按内容变化（tick）与结构变化（布局）分两种调度。
-->

<template>
  <!-- 根容器：卡片样式 + 波浪承载区 -->
  <div class="today-countdown card today-liquid-wrap" ref="cardRef">
    <!-- 背景SVG波浪：根据进度(progress)决定液位高度，路径由 useNaturalWave 生成 -->
    <svg
      class="liquid-svg-h"
      :width="cardWidth"
      :height="cardHeight"
      :viewBox="`0 0 ${cardWidth} ${cardHeight}`"
      preserveAspectRatio="none"
      style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
        border-radius: inherit;
      "
    >
      <!-- 根据 progress 改变不透明度，progress 越高，视觉浮动越明显 -->
      <path
        :d="liquidPath"
        fill="var(--green-primary)"
        :fill-opacity="progress > 0.8 ? '0.3' : progress > 0.5 ? '0.2' : '0.1'"
      />
    </svg>

    <!-- 设置菜单容器：点击按钮打开菜单；使用仲裁器进行互斥与外点击/ESC关闭 -->
    <div class="settings-menu-container" ref="menuContainerRef" @click.stop>
      <!-- 触发按钮：active 类用于高亮已打开状态 -->
      <button
        class="menu-trigger-btn"
        @click="toggleMenu"
        :class="{ active: isMenuOpen }"
        title="设置"
      >
        <!-- 简洁的竖三点（以文本方式呈现） -->
        ⋮
      </button>

      <!-- 菜单面板：选择精度为“秒”或“毫秒” -->
      <div v-if="isMenuOpen" class="settings-dropdown-panel">
        <div class="dropdown-column">
          <!-- 选择“秒”精度 -->
          <button
            :class="['menu-option-btn', { active: precision === 'seconds' }]"
            @click="handlePrecisionChange('seconds')"
          >
            秒
          </button>
          <!-- 选择“毫秒”精度 -->
          <button
            :class="[
              'menu-option-btn',
              { active: precision === 'milliseconds' },
            ]"
            @click="handlePrecisionChange('milliseconds')"
          >
            毫秒
          </button>
        </div>
      </div>
    </div>

    <!-- 卡片标题 -->
    <div class="card-header">
      <h3 class="title">今日剩余</h3>
    </div>

    <!-- 时间显示区：由 useCountdown 输出的 HH:mm:ss[.ms] 组成；字号自适配 -->
    <div class="time-display" ref="timeDisplayRef">
      <span class="num-block">{{ timeObject.hours }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ timeObject.minutes }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ timeObject.seconds }}</span>
      <!-- 当精度为毫秒时，附加小数点与毫秒段 -->
      <template v-if="precision === 'milliseconds'">
        <span class="dot-block">.</span>
        <span class="ms-block">{{ timeObject.milliseconds }}</span>
      </template>
    </div>
  </div>
</template>

<script setup>
// ========================== 核心API与工具导入 ==========================

// 引入 Vue 组合式API工具
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from "vue";

// 倒计时逻辑：基于 clockService 提供的时间信号，输出进度与格式化字段
import { useCountdown } from "../composables/useCountdown.js";

// 自然波浪生成器：根据容器宽高与进度生成可用的SVG路径
import { useNaturalWave } from "../composables/useNaturalWave.js";

// 字号适配工具：按容器宽度等比缩放子元素；提供两类调度器
import {
  createResponsiveFontAdapter,
  makeFontSchedulers,
} from "../utils/fontSizeManager.js";

// 本地存储：读取/保存“今日剩余”的精度设置（秒/毫秒）
import * as storage from "../utils/storage.js";

// 统一互斥仲裁器：唯一会话管理；支持 esc/outside 关闭路由
import { activate, closeActive, isActive } from "../services/actionArbiter.js";

// ========================== 菜单状态与仲裁 ==========================

// 菜单展开状态（true：显示设置面板）
const isMenuOpen = ref(false);

// 菜单容器引用：提供给 arbiter 的 getRootEl，用于“外点击”判定
const menuContainerRef = ref(null);

/**
 * 切换菜单（通过仲裁器统一管理）
 * - 若当前会话已是本菜单 → 触发 toggle 关闭
 * - 否则 → 激活新会话，开启 ESC/外点击关闭，作用域为菜单容器（触发器 + 面板）
 */
function toggleMenu() {
  const key = "menu:today";

  // 已激活 → 点击触发“toggle”关闭（仲裁器会执行 onPreempt/onRelease）
  if (isActive(key)) {
    closeActive("toggle");
    return;
  }

  // 激活新会话：开启 ESC 与 outside 关闭；作用域为菜单容器
  activate({
    key,
    closers: { esc: true, outside: true },
    onPreempt: () => {
      // 被取代/主动关闭：幂等收起
      isMenuOpen.value = false;
    },
    onRelease: () => {
      // 释放后：再次确保关闭（幂等）
      isMenuOpen.value = false;
    },
    getRootEl: () => menuContainerRef.value,
  });

  // 打开菜单
  isMenuOpen.value = true;
}

// ========================== 精度设置与倒计时 ==========================

// 读取“今日剩余”的精度设置：'seconds' | 'milliseconds'
const precision = ref(storage.getPrecision("today")); // storage 内已兼容 today

// 根据精度决定倒计时频率：毫秒 → 高频（rAF）；秒 → 低频（1Hz）
const countdownConfig = computed(() => ({
  frequency: precision.value === "milliseconds" ? "high" : "low",
}));

// 使用 day 类型倒计时：表示“本日剩余”
const { progress, timeObject } = useCountdown("day", countdownConfig);

/**
 * 精度切换处理：
 * - 更新本地存储
 * - 标记字号适配器需要重建（元素数量可能变化：是否显示毫秒段）
 * - 在 nextTick 后安排“立即”适配（避免闪动）
 */
function handlePrecisionChange(val) {
  precision.value = val;
  storage.setPrecision("today", val);
  fontAdapterNeedsRecreate.value = true;
  scheduleFontAdapterImmediate();

  // 新增：关闭仲裁会话并收起菜单（解决点选后不关闭的问题）
  if (isActive("menu:today")) closeActive("select");
  isMenuOpen.value = false;
}

// ========================== 背景波浪（尺寸响应） ==========================

// 根容器引用：用于监听卡片尺寸变化，驱动 useNaturalWave 的宽高
const cardRef = ref(null);

// 波浪容器实时尺寸（由 ResizeObserver 推送）
const cardWidth = ref(520);
const cardHeight = ref(120);

// 安装 ResizeObserver：监听卡片尺寸变化并更新宽高
onMounted(() => {
  if (cardRef.value) {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        cardWidth.value = entries[0].contentRect.width;
        cardHeight.value = entries[0].contentRect.height;
      }
    });
    resizeObserver.observe(cardRef.value);
    // 组件卸载时断开观察器（在 onMounted 内注册 onUnmounted，保证同生命周期）
    onUnmounted(() => resizeObserver.disconnect());
  }
});

// 自然波浪：输入宽/高与 progress，输出 SVG path
const { liquidPath } = useNaturalWave({
  width: cardWidth,
  height: cardHeight,
  progress: progress,
});

// ========================== 字号自适应（时间显示） ==========================

// 时间显示容器引用（包含若干 span：HH : mm : ss [. ms]）
const timeDisplayRef = ref(null);

// 自适配器实例与关联状态
let fontAdapter = null; // 当前适配器实例
const fontAdapterNeedsRecreate = ref(true); // 标识是否需要重建（容器/元素集合变化时）
let fontAdapterContainerEl = null; // 最近一次绑定的容器
let fontAdapterElementsCount = 0; // 最近一次绑定的元素数量（毫秒开关影响）

// 移动端视图标识：影响 minSize（更小字号）
const isMobileView = ref(false);

/**
 * 初始化/刷新字号自适应：
 * - 当容器或元素集合变化（如切换毫秒开关）时，销毁后重建适配器；
 * - 否则仅 refresh，避免不必要的重建。
 */
function setupFontAdapter() {
  if (!timeDisplayRef.value) return;

  // 目标容器与参与缩放的元素（span 列表）
  const containerEl = timeDisplayRef.value;
  const elements = containerEl.querySelectorAll("span");
  if (!elements || elements.length === 0) return;

  // 是否需要重建：显式标记 / 容器变动 / 元素数量变化
  const elementsCountChanged = elements.length !== fontAdapterElementsCount;
  const containerChanged = containerEl !== fontAdapterContainerEl;
  const needRecreate =
    fontAdapterNeedsRecreate.value ||
    !fontAdapter ||
    elementsCountChanged ||
    containerChanged;

  if (needRecreate) {
    // 销毁旧实例（若有）
    if (fontAdapter) {
      fontAdapter.destroy();
      fontAdapter = null;
    }
    // 创建新实例：minSize 按视口大小区分，以保证可读性
    fontAdapter = createResponsiveFontAdapter({
      container: containerEl,
      elements,
      minSize: isMobileView.value ? 10 : 12,
      debounceDelay: 50,
    });
    // 记录绑定信息，清除重建标记
    fontAdapterContainerEl = containerEl;
    fontAdapterElementsCount = elements.length;
    fontAdapterNeedsRecreate.value = false;
    return;
  }

  // 否则仅刷新（快速调整）
  fontAdapter.refresh();
}

// 创建两个调度器：
// - scheduleImmediate：用于内容变化（tick）后，在同帧 nextTick 内完成，避免闪动
// - scheduleFrame：用于结构/布局变化，合并到 rAF
const {
  scheduleImmediate: scheduleFontAdapterImmediate,
  scheduleFrame: scheduleFontAdapterFrame,
} = makeFontSchedulers(setupFontAdapter);

/**
 * 计算当前展示文本（仅用于侦听内容变化，触发“立即”适配）
 * - 当时分秒/毫秒跳动时，确保字号适配及时刷新，避免折行或截断
 */
const displayedText = computed(() => {
  let s = `${timeObject.value.hours}:${timeObject.value.minutes}:${timeObject.value.seconds}`;
  if (precision.value === "milliseconds") {
    s += `.${timeObject.value.milliseconds}`;
  }
  return s;
});

// 本地开关：是否在 tick 上刷新字号（默认 true）
const TICK_REFRESH_LS_KEY = "today_refresh_on_tick";
const refreshOnTick = ref(true);
try {
  const saved =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(TICK_REFRESH_LS_KEY)
      : null;
  if (saved !== null) refreshOnTick.value = saved !== "0";
} catch {
  // 安全忽略存取异常
}

// 监听展示文本变化：若开启 refreshOnTick，则在 nextTick 安排“立即”刷新
watch(displayedText, () => {
  if (!refreshOnTick.value) return;
  nextTick(scheduleFontAdapterImmediate);
});

// 监听精度变化：需要重建（元素数量变化），在 nextTick 后执行“立即”适配
watch(precision, () => {
  fontAdapterNeedsRecreate.value = true;
  nextTick(scheduleFontAdapterImmediate);
});

// 视图断点：简单以 800px 判定移动端，影响 minSize（小屏更小字号）
function updateMobileFlag() {
  const nowIsMobile = window.innerWidth <= 800;
  if (nowIsMobile !== isMobileView.value) {
    isMobileView.value = nowIsMobile;
    fontAdapterNeedsRecreate.value = true;
    scheduleFontAdapterFrame(); // 结构变化：合并到 rAF
  }
}

// 初始化断点标记
updateMobileFlag();

// ========================== 生命周期钩子 ==========================

onMounted(() => {
  // 首次渲染完成后，安排一次“立即”适配，随后再按需要刷新
  nextTick(scheduleFontAdapterImmediate);
});

onUnmounted(() => {
  // 清理字号适配器实例
  if (fontAdapter) fontAdapter.destroy();
});
</script>

<style scoped>
/* 根容器：承载波浪、标题与时间显示 */
.today-countdown.today-liquid-wrap {
  position: relative;
  overflow: hidden;
  z-index: 0;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  border-radius: var(--border-radius);
}

/* 背景波浪：全覆盖，禁用事件 */
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

/* 标题位置：卡片左上 */
.card-header {
  position: absolute;
  top: 16px;
  left: 24px;
  z-index: 2;
}

/* 标题样式 */
.title {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 400;
  margin: 0;
}

/* 菜单容器：卡片右上 */
.settings-menu-container {
  position: absolute;
  top: 8px;
  right: 7px;
  z-index: 10;
}

/* 菜单触发按钮：hover/active 高亮 */
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

/* 菜单面板：靠右展开 */
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

/* 列布局：当前仅一列（精度），保留结构便于拓展 */
.dropdown-column {
  display: flex;
  flex-direction: column;
}

/* 菜单项：悬停与选中状态高亮 */
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
  color: var(--bg-primary);
}
.menu-option-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
}

/* 时间显示容器：中部对齐，承载 span 片段 */
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

/* 片段基类：置于波浪之上 */
.num-block,
.sep-block,
.dot-block,
.ms-block {
  z-index: 2;
}

/* 小时/分/秒数字块 */
.num-block {
  width: 72px;
  text-align: center;
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
}

/* 冒号分隔符 */
.sep-block {
  width: 24px;
  text-align: center;
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
  user-select: none;
}

/* 小数点 */
.dot-block {
  width: 16px;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: var(--green-secondary);
  user-select: none;
}

/* 毫秒段 */
.ms-block {
  width: 20px;
  text-align: left;
  font-size: 32px;
  font-weight: 600;
  color: var(--green-secondary);
}

/* 移动端适配：更紧凑的布局与字号 */
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

  /* 移动端：hover 不改变外观，仅 active 高亮 */
  .menu-trigger-btn:hover {
    background: transparent;
    color: var(--text-secondary);
  }
  .menu-trigger-btn.active {
    background: var(--bg-quaternary);
    color: var(--text-primary);
  }
}
</style>
