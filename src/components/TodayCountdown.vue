<!-- E:\AppProject\VisualTime\src\components\TodayCountdown.vue (全量最终修复版) -->
<template>
  <div class="today-countdown card today-liquid-wrap" ref="cardRef">
    <!-- SVG波浪动画 -->
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
      <path
        :d="liquidPath"
        fill="var(--green-primary)"
        :fill-opacity="progress > 0.8 ? '0.3' : progress > 0.5 ? '0.2' : '0.1'"
      />
    </svg>

    <!-- 菜单和标题 -->
    <div class="settings-menu-container" ref="menuContainerRef" @click.stop>
      <button
        class="menu-trigger-btn"
        @click="toggleMenu"
        :class="{ active: isMenuOpen }"
        title="设置"
      >
        ⋮
      </button>
      <div v-if="isMenuOpen" class="settings-dropdown-panel">
        <div class="dropdown-column">
          <!-- 【核心修复】class绑定时必须使用 .value 访问 ref 的值 -->
          <button
            :class="['menu-option-btn', { active: precision === 'seconds' }]"
            @click="handlePrecisionChange('seconds')"
          >
            秒
          </button>
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
    <div class="card-header">
      <h3 class="title">今日剩余</h3>
    </div>

    <!-- 时间显示 -->
    <div class="time-display" ref="timeDisplayRef">
      <span class="num-block">{{ timeObject.hours }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ timeObject.minutes }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ timeObject.seconds }}</span>
      <!-- 【核心修复】v-if 条件判断同样需要使用 .value -->
      <template v-if="precision === 'milliseconds'">
        <span class="dot-block">.</span>
        <span class="ms-block">{{ timeObject.milliseconds }}</span>
      </template>
    </div>
  </div>
</template>

<script setup>
// ========================== TodayCountdown.vue 脚本（仅脚本，逐行注释；修复跨帧抖动，统一调度） ==========================

// -------------------- Vue 核心 API --------------------
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from "vue"; // 引入组合式API

// -------------------- 业务逻辑/工具模块 --------------------
import { useCountdown } from "../composables/useCountdown.js"; // 倒计时业务逻辑（按天）
import { useNaturalWave } from "../composables/useNaturalWave.js"; // 波浪动画
import {
  broadcastMenuOpened,
  listenForOtherMenuOpened,
} from "../utils/eventBus.js"; // 菜单互斥
import {
  createResponsiveFontAdapter,
  makeFontSchedulers,
} from "../utils/fontSizeManager.js"; // 字号引擎 + 调度器工厂
import * as storage from "../utils/storage.js"; // 本地存储（用户精度选择）

// -------------------- 菜单状态与交互 --------------------
const isMenuOpen = ref(false); // 菜单展开状态
const menuContainerRef = ref(null); // 菜单容器引用
let cleanupMenuListener = null; // 菜单互斥监听的清理函数

// 切换菜单展开/收起
function toggleMenu() {
  const willOpen = !isMenuOpen.value; // 目标状态
  if (willOpen) broadcastMenuOpened("today-countdown"); // 广播打开，其他组件收到后自动关闭自己的菜单
  isMenuOpen.value = willOpen; // 应用状态
}

// 关闭菜单
function closeMenu() {
  isMenuOpen.value = false;
}

// 全局点击：点击菜单外时关闭
function handleGlobalClick(e) {
  if (
    isMenuOpen.value &&
    menuContainerRef.value &&
    !menuContainerRef.value.contains(e.target)
  ) {
    closeMenu();
  }
}

// 全局键盘：ESC 关闭
function handleGlobalKeydown(e) {
  if (e.key === "Escape" || e.key === "Esc") closeMenu();
}

// -------------------- 精度设置（秒/毫秒） --------------------
const precision = ref(storage.getPrecision("today")); // 从本地存储加载“今日剩余”的精度（默认毫秒）

// 根据精度决定 useCountdown 的计算频率（毫秒 → 高频；秒 → 低频）
const countdownConfig = computed(() => ({
  frequency: precision.value === "milliseconds" ? "high" : "low", // 仅当毫秒时请求 rAF 高频
}));

// 获取实时进度与分解时间对象（时/分/秒/毫秒）
const { progress, timeObject } = useCountdown("day", countdownConfig);

// 菜单项：用户切换精度（秒/毫秒）
function handlePrecisionChange(val) {
  precision.value = val; // 更新本地精度状态
  storage.setPrecision("today", val); // 持久化存储
  fontAdapterNeedsRecreate.value = true; // 结构变化（毫秒位显隐）→ 必须重建字号适配器
  scheduleFontAdapterImmediate(); // 内容变更：同帧适配，避免跨帧抖动
  closeMenu(); // 关闭菜单
}

// -------------------- 波浪动画（保持现有逻辑） --------------------
const cardRef = ref(null); // 卡片根容器
const cardWidth = ref(520); // 卡片宽（初值）
const cardHeight = ref(120); // 卡片高（初值）

// 监听卡片容器尺寸变化，实时更新 viewBox 尺寸
onMounted(() => {
  if (cardRef.value) {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        cardWidth.value = entries[0].contentRect.width; // 写入当前宽度
        cardHeight.value = entries[0].contentRect.height; // 写入当前高度
      }
    });
    resizeObserver.observe(cardRef.value); // 开始观察
    onUnmounted(() => resizeObserver.disconnect()); // 卸载时断开
  }
});

// 构建波浪路径（基于当前宽高与进度）
const { liquidPath } = useNaturalWave({
  width: cardWidth,
  height: cardHeight,
  progress: progress, // 使用 useCountdown 返回的进度
});

// -------------------- 字号自适应核心（刷新优先 + 必要时重建） --------------------
const timeDisplayRef = ref(null); // 数字显示容器（包含若干 span）
let fontAdapter = null; // 字号适配器实例

const fontAdapterNeedsRecreate = ref(true); // 是否需要重建适配器（结构或内容宽度变化时置 true）
let fontAdapterContainerEl = null; // 最近一次适配的容器引用（用于判定目标是否变化）
let fontAdapterElementsCount = 0; // 最近一次参与缩放的元素个数（毫秒显隐会改变数量）

const isMobileView = ref(false); // 移动端断点标记（决定 minSize）

// 实际执行适配的函数（函数声明，避免 TDZ）
function setupFontAdapter() {
  if (!timeDisplayRef.value) return; // 缺容器 → 跳过
  const containerEl = timeDisplayRef.value; // 当前容器
  const elements = containerEl.querySelectorAll("span"); // 所有文本片段（含毫秒）
  if (!elements || elements.length === 0) return; // 无元素 → 跳过

  // 判定是否需要“重建”
  const elementsCountChanged = elements.length !== fontAdapterElementsCount; // 片段数量是否改变（毫秒位显隐会变）
  const containerChanged = containerEl !== fontAdapterContainerEl; // 容器引用是否变化（DOM重建）

  const needRecreate =
    fontAdapterNeedsRecreate.value || // 业务侧主动要求重建（如精度切换）
    !fontAdapter || // 尚未创建
    elementsCountChanged || // 片段数量变化
    containerChanged; // 容器目标变化

  if (needRecreate) {
    if (fontAdapter) {
      fontAdapter.destroy(); // 销毁旧实例，清除缓存
      fontAdapter = null;
    }
    // 创建新实例（minSize 随断点切换）
    fontAdapter = createResponsiveFontAdapter({
      container: containerEl,
      elements,
      minSize: isMobileView.value ? 10 : 12,
      debounceDelay: 50,
    });
    // 记录当前绑定目标与数量，便于下轮判断
    fontAdapterContainerEl = containerEl;
    fontAdapterElementsCount = elements.length;
    fontAdapterNeedsRecreate.value = false; // 已重建 → 清标记
    return; // 已完成重建，无需 refresh
  }

  // 仅容器宽度变化或普通跳变 → 轻量 refresh（重读容器有效宽度，复用内容基线）
  fontAdapter.refresh();
}

// 基于字号适配函数创建“调度器”：同帧/合帧两种
const {
  scheduleImmediate: scheduleFontAdapterImmediate, // 内容变化使用（nextTick 内执行，避免跨帧抖动）
  scheduleFrame: scheduleFontAdapterFrame, // 结构变化使用（rAF 合并，减少重复）
} = makeFontSchedulers(setupFontAdapter);

// 更新断点（<=800 认为移动端）：跨越断点则重建字号适配器
function updateMobileFlag() {
  const nowIsMobile = window.innerWidth <= 800; // 当前是否移动端
  if (nowIsMobile !== isMobileView.value) {
    // 断点是否发生变化
    isMobileView.value = nowIsMobile; // 更新断点标记
    fontAdapterNeedsRecreate.value = true; // minSize 变化 → 必须重建
    scheduleFontAdapterFrame(); // 结构变化 → 用 rAF 合并
  }
}

// -------------------- 跳变刷新开关（可选） --------------------
// 默认开启“纯跳变也刷新”（'1'）；可在控制台通过 localStorage 进行开关：
//  localStorage.setItem('today_refresh_on_tick', '0') // 关闭
//  localStorage.setItem('today_refresh_on_tick', '1') // 开启
const TICK_REFRESH_LS_KEY = "today_refresh_on_tick"; // 存储键
const refreshOnTick = ref(true); // 是否在位数不变时也刷新
try {
  const saved =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(TICK_REFRESH_LS_KEY)
      : null; // 读取保存值
  if (saved !== null) refreshOnTick.value = saved !== "0"; // 应用保存的偏好
} catch {
  // 读取异常时忽略，保持默认开启
}

// 组合当前显示文本（作为“内容变化”的侦听源）
const displayedText = computed(() => {
  // 基础部分：HH:mm:ss
  let s = `${timeObject.value.hours}:${timeObject.value.minutes}:${timeObject.value.seconds}`;
  // 若选择毫秒精度，追加 .mmm
  if (precision.value === "milliseconds") {
    s += `.${timeObject.value.milliseconds}`;
  }
  return s; // 返回拼接后的文本
});

// 文本跳变 → 轻量刷新（同帧完成）；可通过 refreshOnTick 关闭“位数不变时的刷新”
watch(displayedText, () => {
  if (!refreshOnTick.value) return; // 用户关闭纯跳变刷新 → 跳过
  nextTick(scheduleFontAdapterImmediate); // 内容变化 → nextTick 内立即适配，避免跨帧闪动
});

// 精度变化（秒 ↔ 毫秒） → 结构变化（毫秒片段显隐）
// 这里为双保险：handlePrecisionChange 已经置位与立即调度；watch 再保证一层
watch(precision, () => {
  fontAdapterNeedsRecreate.value = true; // 标记重建
  nextTick(scheduleFontAdapterImmediate); // 同帧适配
});

// 窗口尺寸变化：更新断点，必要时重建；否则不处理（尽量少做工作）
function handleWindowResize() {
  updateMobileFlag(); // 判定断点是否跨越（跨越时会 schedule rAF 重建）
}

// 初次断点判定（放在调度器定义之后，避免顺序问题）
updateMobileFlag(); // 初始化 isMobileView 与重建标记（若需要）

// -------------------- 生命周期：挂载与卸载 --------------------
onMounted(() => {
  // 注册全局事件
  document.addEventListener("click", handleGlobalClick, true); // 点击外部关闭菜单
  document.addEventListener("keydown", handleGlobalKeydown); // ESC 关闭
  cleanupMenuListener = listenForOtherMenuOpened("today-countdown", closeMenu); // 菜单互斥监听
  window.addEventListener("resize", handleWindowResize); // 断点监听

  // 首次布局后：同帧适配（初始 fontAdapterNeedsRecreate 为 true，将执行重建）
  nextTick(scheduleFontAdapterImmediate);
});

onUnmounted(() => {
  // 清理全局事件
  document.removeEventListener("click", handleGlobalClick, true);
  document.removeEventListener("keydown", handleGlobalKeydown);
  window.removeEventListener("resize", handleWindowResize);

  // 清理菜单互斥监听
  if (cleanupMenuListener) cleanupMenuListener();

  // 销毁字号适配器
  if (fontAdapter) fontAdapter.destroy();
});
</script>

<style scoped>
/* 样式部分保持不变 */
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
  width: 72px;
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
