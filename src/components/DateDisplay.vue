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
// [新增] 导入 luxon 的 DateTime
import { DateTime } from 'luxon'
import { formatDate, getLunarInfo, getCurrentTime } from '../utils/dateUtils'

const currentDate = ref('')
const lunarInfo = ref('')
const now = ref({ hours: '00', minutes: '00', seconds: '00' })

const updateDateTime = () => {
  // [修改] 将创建日期对象的方式从 new Date() 改为 luxon 的 DateTime.now()
  // 这是解决问题的核心。现在传递给 formatDate 和 getLunarInfo 的将是正确的 luxon 对象。
  const luxonDate = DateTime.now()

  // [说明] 此处调用 formatDate 时，传入的是 luxon 对象，符合新函数的要求。
  currentDate.value = formatDate(luxonDate)
  // [说明] 此处调用 getLunarInfo 时，传入的是 luxon 对象，我们已在 dateUtils 中做了兼容处理。
  lunarInfo.value = getLunarInfo(luxonDate).fullInfo
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
  .num-block { width: 66px; font-size: 60px;}
  .sep-block { width: 32px; font-size: 60px;}
  .current-time { justify-content: center; }
}
@media (max-width: 480px) {
  .current-date { font-size: 26px; }
  .num-block { width: 48px; font-size: 40px;}
  .sep-block { width: 16px; font-size: 40px;}
  .lunar-date { font-size: 14px; }
}
</style>
