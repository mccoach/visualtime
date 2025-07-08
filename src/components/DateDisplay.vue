<template>
  <div class="date-display card">
    <div class="date-content">
      <div class="date-info">
        <h1 class="current-date">{{ currentDate }}</h1>
        <!-- 只这一行，包含干支、生肖、农历、节气信息 -->
        <p class="lunar-date">{{ lunarInfo }}</p>
      </div>
      <div class="current-time">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { formatDate, getLunarInfo, getCurrentTime } from '../utils/dateUtils'

const currentDate = ref('')
const lunarInfo = ref('')
const now = ref({ hours: '00', minutes: '00', seconds: '00' })

const updateDateTime = () => {
  const date = new Date()
  currentDate.value = formatDate(date)
  lunarInfo.value = getLunarInfo(date).fullInfo   // 一行完整输出
  const t = getCurrentTime()
  now.value = { hours: t.hours, minutes: t.minutes, seconds: t.seconds }
}
let timer
onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)
})
onUnmounted(() => {
  clearInterval(timer)
})
</script>


<style scoped>
.date-display {
  margin-left: 290px;
  margin-bottom: 30px;
  height: 120px;
  display: flex;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
}
.date-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%; height: 100%;
}
.date-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}
.current-date { font-size: 36px; font-weight: 600; margin: 0; line-height: 1.2; color: var(--text-primary);}
.lunar-date { font-size: 16px; color: var(--text-secondary); line-height: 1.4; margin: 8px 0 0 0;}
.jieqi-day-tip { color: var(--green-primary); margin: 5px 0 0 0; font-size: 15px; }
.current-time {
  display: flex; align-items: center;
  font-family: var(--font-mono);
}
.num-block { display: inline-block; width: 84px; text-align: center; font-size: 72px; font-weight: 600; color: var(--green-primary);}
.sep-block { display: inline-block; width: 32px; text-align: center; font-size: 64px; font-weight: 600; color: var(--green-primary); user-select: none; padding: 0 2px;}
@media (max-width: 768px) {
  .date-display { margin-left: 0; height: auto; min-height: 120px; margin-bottom: 20px;}
  .date-content { flex-direction: column; text-align: center; gap: 20px; height: auto;}
  .current-date { font-size: 32px; }
  .num-block { width: 48px; font-size: 40px;}
  .sep-block { width: 16px; font-size: 40px;}
  .current-time { justify-content: center; }
}
@media (max-width: 480px) {
  .current-date { font-size: 26px; }
  .num-block { width: 48px; font-size: 28px;}
  .sep-block { width: 6px; font-size: 28px;}
  .lunar-date { font-size: 14px; }
}
</style>
