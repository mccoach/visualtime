<!-- E:\AppProject\VisualTime\src\components\DateDisplay.vue (全新重构版) -->
<template>
  <!--
    组件根元素。
    所有显示的内容都由 `displayData` 这个从Composable返回的对象提供。
  -->
  <div class="date-display card">
    <div class="date-content">
      <!--
        左侧日期信息容器。
      -->
      <div class="date-info" ref="dateInfoRef">
        <!--
          公历日期，绑定到 `displayData.currentDate`。
        -->
        <h1 class="current-date" ref="currentDateRef">{{ displayData.currentDate.value }}</h1>
        <!--
          农历及节气信息，绑定到 `displayData.lunarInfo`。
        -->
        <p class="lunar-date" ref="lunarDateRef">{{ displayData.lunarInfo.value }}</p>
      </div>
      <!--
        右侧实时时间容器。
      -->
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
// --- 依赖导入 ---
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useDateDisplay } from '../composables/useDateDisplay.js'; // 【核心】导入新的Composable
import { createResponsiveFontAdapter } from '../utils/fontSizeManager.js';

// --- 业务逻辑层 ---
// 【核心】调用Composable，获取所有用于显示的数据。
// `displayData` 是一个包含了所有响应式计算属性的对象。
const displayData = useDateDisplay();

// --- 纯UI逻辑：字体自适应 ---
// 这部分逻辑只关心UI渲染，与业务数据无关，因此保留在组件内是合理的。

// DOM元素引用
const dateInfoRef = ref(null);
const currentDateRef = ref(null);
const lunarDateRef = ref(null);
const currentTimeRef = ref(null);

// 适配器实例
let currentDateAdapter = null;
let lunarDateAdapter = null;
let timeAdapter = null;

// 初始化所有字体适配器的函数
const setupFontAdapters = () => {
  // 销毁旧实例，防止内存泄漏
  if (currentDateAdapter) currentDateAdapter.destroy();
  if (lunarDateAdapter) lunarDateAdapter.destroy();
  if (timeAdapter) timeAdapter.destroy();

  // 初始化公历日期的适配器
  if (dateInfoRef.value && currentDateRef.value) {
    currentDateAdapter = createResponsiveFontAdapter({
      container: dateInfoRef.value,
      elements: [currentDateRef.value],
      minSize: 12,
    });
  }
  // 初始化农历日期的适配器
  if (dateInfoRef.value && lunarDateRef.value) {
    lunarDateAdapter = createResponsiveFontAdapter({
      container: dateInfoRef.value,
      elements: [lunarDateRef.value],
      minSize: 10,
    });
  }
  // 初始化实时时间的适配器
  if (currentTimeRef.value) {
    timeAdapter = createResponsiveFontAdapter({
      container: currentTimeRef.value,
      elements: currentTimeRef.value.querySelectorAll('span'),
      minSize: 12,
    });
  }
};

// 监听日期的变化，因为日期字符串长度可能会变（如月份、星期变化），需要重新适配
watch(
  () => displayData.currentDate.value,
  () => { nextTick(setupFontAdapters); }
);

// 组件挂载后，首次进行适配
onMounted(() => {
  nextTick(setupFontAdapters);
});

// 组件卸载时，确保销毁所有适配器实例
onUnmounted(() => {
  if (currentDateAdapter) currentDateAdapter.destroy();
  if (lunarDateAdapter) lunarDateAdapter.destroy();
  if (timeAdapter) timeAdapter.destroy();
});
</script>

<style scoped>
/*
  [说明] 组件的样式保持不变，只关心布局和外观。
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
  grid-template-columns: minmax(0, 1.618fr) minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-right: 30px;
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
    padding: 30px;
    margin-left: 0;
  }

  .date-content {
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 12px;
    height: auto;
    align-items: center;
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
