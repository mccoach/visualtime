<template>
  <div class="date-display card">
    <div class="date-content">
      <div class="date-info">
        <h1 class="current-date">{{ currentDate }}</h1>
        <p class="lunar-date">{{ lunarInfo }}</p>
      </div>
      <div class="current-time">
        {{ currentTime }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { formatDate, getLunarInfo, getCurrentTime } from '../utils/dateUtils'

const currentDate = ref('')
const lunarInfo = ref('')
const currentTime = ref('')

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = formatDate(now)
  const lunar = getLunarInfo(now)
  lunarInfo.value = lunar.fullInfo
  
  const time = getCurrentTime()
  currentTime.value = `${time.hours}:${time.minutes}:${time.seconds}`
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
  margin-left: 290px; /* 第一列卡片宽度(260px) + 间距(30px) = 290px */
  margin-bottom: 30px;
  height: 120px;
  display: flex;
  align-items: center;
  padding: 24px;
}

.date-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

.date-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.current-date {
  font-size: 40px;
  font-weight: 600;
  margin: 0;
  line-height: 1;
  color: var(--text-primary);
}

.lunar-date {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 8px 0 0 0;
}

.current-time {
  font-size: 64px;
  font-weight: 600;
  color: var(--green-primary);
  font-family: var(--font-mono);
  line-height: 1;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  height: 100%;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .date-display {
    margin-left: 0;
    height: auto;
    min-height: 120px;
    margin-bottom: 20px;
  }
  
  .date-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    height: auto;
  }
  
  .date-info {
    height: auto;
  }
  
  .current-date {
    font-size: 32px;
  }
  
  .current-time {
    font-size: 48px;
    height: auto;
  }
}

@media (max-width: 480px) {
  .current-date {
    font-size: 28px;
  }
  
  .current-time {
    font-size: 42px;
  }
  
  .lunar-date {
    font-size: 14px;
  }
}
</style>
