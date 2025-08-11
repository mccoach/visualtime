<!-- E:\AppProject\VisualTime\src\components\DateDisplay.vue (稳定修复版：关闭容器RO + 外部调度，其他不变) -->
<template>
  <!-- 组件根元素 -->
  <div class="date-display card">
    <div class="date-content">
      <!-- 左侧日期信息容器 -->
      <div class="date-info" ref="dateInfoRef">
        <!-- 公历日期 -->
        <h1 class="current-date" ref="currentDateRef">
          {{ displayData.currentDate.value }}
        </h1>
        <!-- 农历与节气 -->
        <p class="lunar-date" ref="lunarDateRef">
          {{ displayData.lunarInfo.value }}
        </p>
      </div>
      <!-- 右侧实时时间容器 -->
      <div class="current-time" ref="currentTimeRef">
        <span class="num-block">{{ displayData.time.value.hours }}</span>
        <span class="sep-block">:</span>
        <span class="num-block">{{ displayData.time.value.minutes }}</span>
        <span class="sep-block">:</span>
        <span class="num-block">{{ displayData.time.value.seconds }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// 引入Vue组合式API
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
// 引入数据源Composable
import { useDateDisplay } from "../composables/useDateDisplay.js";
// 引入字号适配工具：沿用现有引擎，仅改变触发方式
import {
  createResponsiveFontAdapter,
  getEffectiveWidth,
  makeFontSchedulers,
} from "../utils/fontSizeManager.js";

// 获取显示数据（公历日期、农历信息、时分秒）
const displayData = useDateDisplay();

// DOM引用：左列容器与两行文本
const dateInfoRef = ref(null); // 左侧容器 .date-info
const currentDateRef = ref(null); // 公历行元素
const lunarDateRef = ref(null); // 农历/节气行元素
// DOM引用：右列容器（包含时分秒）
const currentTimeRef = ref(null); // 右侧容器 .current-time

// 适配器实例：保持三个独立实例（两行各自独立 + 时间容器独立）
let currentDateAdapter = null;
let lunarDateAdapter = null;
let timeAdapter = null;

// 构建/重建 左列两个适配器（各自独立，避免相互牵制）
function recreateDateAdapters() {
  // 先清理旧实例，保证“内容长度变化”时能重建新的原始测量基线
  if (currentDateAdapter) {
    currentDateAdapter.destroy();
    currentDateAdapter = null;
  }
  if (lunarDateAdapter) {
    lunarDateAdapter.destroy();
    lunarDateAdapter = null;
  }

  // 公历行：容器为 .date-info；关闭容器RO；用稳定的有效宽度提供者
  if (dateInfoRef.value && currentDateRef.value) {
    currentDateAdapter = createResponsiveFontAdapter({
      container: dateInfoRef.value,
      elements: [currentDateRef.value],
      minSize: 12,
      debounceDelay: 50,
      observeContainerResize: false, // 关键：不再监听容器自身尺寸变化
      effectiveWidthProvider: () => getEffectiveWidth(dateInfoRef.value), // 由我们显式提供容器有效宽度
    });
  }

  // 农历/节气行：同容器，同策略，彼此独立
  if (dateInfoRef.value && lunarDateRef.value) {
    lunarDateAdapter = createResponsiveFontAdapter({
      container: dateInfoRef.value,
      elements: [lunarDateRef.value],
      minSize: 10,
      debounceDelay: 50,
      observeContainerResize: false, // 关键：不监听容器自身尺寸变化
      effectiveWidthProvider: () => getEffectiveWidth(dateInfoRef.value), // 显式提供容器有效宽度
    });
  }
}

// 构建/重建 右列时间适配器（时分秒片段）
function recreateTimeAdapter() {
  // 清理旧实例
  if (timeAdapter) {
    timeAdapter.destroy();
    timeAdapter = null;
  }

  if (currentTimeRef.value) {
    timeAdapter = createResponsiveFontAdapter({
      container: currentTimeRef.value,
      elements: currentTimeRef.value.querySelectorAll("span"),
      minSize: 12,
      debounceDelay: 50,
      observeContainerResize: false, // 关键：不监听容器自身尺寸变化
      effectiveWidthProvider: () => getEffectiveWidth(currentTimeRef.value), // 显式提供容器有效宽度
    });
  }
}

// 统一的“重建全部适配器”动作（供调度器调用）
function setupAllAdapters() {
  recreateDateAdapters();
  recreateTimeAdapter();
}

// 创建调度器：内容变化 -> 立即（nextTick后）执行；结构/窗口变化 -> rAF合帧执行
const { scheduleImmediate, scheduleFrame } =
  makeFontSchedulers(setupAllAdapters);

// 监听“公历日期字串变化”（如月份或星期长度变化），同帧重建（与原逻辑一致）
watch(
  () => displayData.currentDate.value,
  () => {
    nextTick(scheduleImmediate);
  }
);

// 同理，监听“农历/节气信息字串变化”（跨天或节气切换），同帧重建
watch(
  () => displayData.lunarInfo.value,
  () => {
    nextTick(scheduleImmediate);
  }
);

// 窗口与视口变化：合帧重建（移动端地址栏折叠/横竖屏切换等）
function handleViewportResize() {
  scheduleFrame();
}

onMounted(() => {
  // 首次渲染后：同帧重建一次
  nextTick(scheduleImmediate);
  // 下一动画帧再重建一次兜底（应对移动端首次布局后仍有细微变动）
  requestAnimationFrame(() => {
    scheduleFrame();
  });

  // 监听窗口尺寸与方向变化
  window.addEventListener("resize", handleViewportResize);
  window.addEventListener("orientationchange", handleViewportResize);
  // 一些浏览器的可视视口变化不会触发 window.resize，这里额外监听（存在才添加）
  if (
    window.visualViewport &&
    typeof window.visualViewport.addEventListener === "function"
  ) {
    window.visualViewport.addEventListener("resize", handleViewportResize);
  }
});

onUnmounted(() => {
  // 移除监听
  window.removeEventListener("resize", handleViewportResize);
  window.removeEventListener("orientationchange", handleViewportResize);
  if (
    window.visualViewport &&
    typeof window.visualViewport.removeEventListener === "function"
  ) {
    window.visualViewport.removeEventListener("resize", handleViewportResize);
  }
  // 销毁三个适配器实例
  if (currentDateAdapter) currentDateAdapter.destroy();
  if (lunarDateAdapter) currentDateAdapter = null;
  if (lunarDateAdapter) lunarDateAdapter.destroy();
  if (timeAdapter) timeAdapter.destroy();
});
</script>

<style scoped>
/*
  原样保留：仅修复脚本中的自适应触发机制，样式无任何改动
*/
.date-display {
  margin-left: 290px;
  margin-bottom: 30px;
  height: 120px;
  display: flex;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
}

.date-content {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 20px;
  box-sizing: border-box;
  /*border: 1px dashed #88f099;/* [保留] 保留您的测试用边框 */
}

.date-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-width: 0;
  align-items: center;
  /*border: 1px dashed #4499;/* [保留] 保留您的测试用边框 */
}

.current-date {
  font-size: 36px;
  font-weight: 600;
  line-height: 1;
  color: var(--text-primary);
  white-space: nowrap;
  text-align: center;
  /*border: 1px dashed #88f099;/* [保留] 保留您的测试用边框 */
}

.lunar-date {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1;
  margin: 12px 0 0 0;
  text-align: center;
  white-space: nowrap;
  /*border: 1px dashed #881099;/* [保留] 保留您的测试用边框 */
}

.jieqi-day-tip {
  color: var(--green-primary);
  margin: 5px 0 0 0;
  font-size: 15px;
}

.current-time {
  display: flex;
  align-items: center;
  /*border: 1px dashed #111099;/* [保留] 保留您的测试用边框 */
}

.num-block {
  display: inline-block;
  width: 84px;
  text-align: center;
  font-size: 72px;
  font-weight: 600;
  color: var(--green-primary);
}

.sep-block {
  display: inline-block;
  width: 32px;
  text-align: center;
  font-size: 64px;
  font-weight: 600;
  color: var(--green-primary);
  user-select: none;
  padding: 0 2px;
}

@media (max-width: 800px) {
  .date-display {
    height: auto;
    min-height: 120px;
    padding: 10px;
    margin-left: 0;
    /*border: 1px dashed #111099;/* [保留] 保留您的测试用边框 */
  }

  .date-content {
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 12px;
    height: auto;
    align-items: center;
    padding: 15px 0 0px;
    /*border: 1px dashed #111099;/* [保留] 保留您的测试用边框 */
  }

  .date-info {
    align-items: center;
    width: 100%;
  }

  .current-time {
    justify-content: center;
    width: 100%;
  }

  .current-date {
    font-size: 32px;
  }

  .num-block {
    width: 66px;
    font-size: 60px;
  }

  .sep-block {
    width: 32px;
    font-size: 60px;
  }
}
</style>
