<template>
  <!--
    组件根元素。
  -->
  <div class="date-display card">
    <div class="date-content">
      <!--
        左侧日期信息容器。
        - 它将通过 Flexbox 的 align-items 属性来居中其子元素。
      -->
      <div class="date-info" ref="dateInfoRef">
        <!--
          公历日期。
          - 它的宽度将由其内部文本的实际宽度决定。
        -->
        <h1 class="current-date" ref="currentDateRef">{{ currentDate }}</h1>
        <!--
          农历及节气信息。
          - 它的宽度同样由其内部文本的实际宽度决定。
        -->
        <p class="lunar-date" ref="lunarDateRef">{{ lunarInfo }}</p>
      </div>
      <!--
        右侧实时时间容器。
      -->
      <div class="current-time" ref="currentTimeRef">
        <span class="num-block">{{ now.hours }}</span>
        <span class="sep-block">:</span>
        <span class="num-block">{{ now.minutes }}</span>
        <span class="sep-block">:</span>
        <span class="num-block">{{ now.seconds }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// [说明] Script 部分的逻辑已经是正确的，无需任何改动。
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { DateTime } from 'luxon'
import { formatDate, getLunarInfo, getCurrentTime } from '../utils/dateUtils'
import { createResponsiveFontAdapter } from '../utils/fontSizeManager.js'

// --- 状态管理 ---
const currentDate = ref('')
const lunarInfo = ref('')
const now = ref({ hours: '00', minutes: '00', seconds: '00' })

// --- DOM元素引用 ---
const dateInfoRef = ref(null) 
const currentDateRef = ref(null)
const lunarDateRef = ref(null)
const currentTimeRef = ref(null)

// --- 适配器实例 ---
let currentDateAdapter = null
let lunarDateAdapter = null
let timeAdapter = null

// --- 核心业务逻辑 ---
const updateDateTime = () => {
  const luxonDate = DateTime.now()
  currentDate.value = formatDate(luxonDate)
  lunarInfo.value = getLunarInfo(luxonDate).fullInfo
  const t = getCurrentTime()
  now.value = { hours: t.hours, minutes: t.minutes, seconds: t.seconds }
}

// --- 生命周期钩子 ---
let timer
onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)

  // [说明] 这里的适配器初始化逻辑已经是正确的，它将与修复后的CSS完美配合。
  nextTick(() => {
    // 1. 初始化公历日期的适配器。
    if (dateInfoRef.value && currentDateRef.value) {
      currentDateAdapter = createResponsiveFontAdapter({
        container: dateInfoRef.value,
        elements: [currentDateRef.value],
        minSize: 12,
      })
    }

    // 2. 初始化农历日期的适配器。
    if (dateInfoRef.value && lunarDateRef.value) {
      lunarDateAdapter = createResponsiveFontAdapter({
        container: dateInfoRef.value,
        elements: [lunarDateRef.value],
        minSize: 10,
      })
    }

    // 3. 初始化实时时间的适配器。
    if (currentTimeRef.value) {
      timeAdapter = createResponsiveFontAdapter({
        container: currentTimeRef.value,
        elements: currentTimeRef.value.querySelectorAll('span'),
        minSize: 12,
      })
    }
  })
})

onUnmounted(() => {
  clearInterval(timer)
  if (currentDateAdapter) currentDateAdapter.destroy()
  if (lunarDateAdapter) lunarDateAdapter.destroy()
  if (timeAdapter) timeAdapter.destroy()
})
</script>

<style scoped>
/*
  [说明] 最终的样式表修复。
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
  gap: clamp(20px, 3vw, 40px);
  align-items: center;
  width: 100%; 
  height: 100%;
}

.date-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-width: 0;
  /* [核心修复] 新增 align-items: center，使其子元素（文本块）能够在其内水平居中。 */
  align-items: center; 
  /*border: 1px dashed #4499;/* [保留] 保留您的测试用边框 */
}

.current-date { 
  font-size: 36px; 
  font-weight: 600;  
  margin: 0; 
  line-height: 1.2; 
  color: var(--text-primary);
  white-space: nowrap;
  /* [核心修复] 移除 width: 100%。让元素的宽度由其内容自然决定。 */
  /* width: 100%; */ 
  /*border: 1px dashed #88f099;/* [保留] 保留您的测试用边框 */
}

.lunar-date { 
  font-size: 16px; 
  color: var(--text-secondary); 
  line-height: 1.4; 
  margin: 8px 0 0 0;
  white-space: nowrap;
  /* [核心修复] 移除 width: 100%。*/
  /* width: 100%; */
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
  font-family: var(--font-mono);
  /*border: 1px dashed #111099;/* [保留] 保留您的测试用边框 */
}
.num-block { display: inline-block; width: 84px; text-align: center; font-size: 72px; font-weight: 600; color: var(--green-primary);}
.sep-block { display: inline-block; width: 32px; text-align: center; font-size: 64px; font-weight: 600; color: var(--green-primary); user-select: none; padding: 0 2px;}

@media (max-width: 800px) {
  .date-display { 
    height: auto; 
    min-height: 120px; 
    padding: 30px;
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
  .current-date { font-size: 32px; }
  .num-block { width: 66px; font-size: 60px;}
  .sep-block { width: 32px; font-size: 60px;}
}
</style>
