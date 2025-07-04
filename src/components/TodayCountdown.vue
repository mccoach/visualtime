<template>
  <div class="today-countdown card">
    <h3 class="title">今日剩余</h3>
    <div class="time-display">
      <span class="time">{{ time.hours }}:{{ time.minutes }}:{{ time.seconds }}</span>
      <span class="milliseconds">.{{ time.milliseconds }}</span>
    </div>
    <p class="precision-note">精确到毫秒</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getTodayRemaining } from '../utils/dateUtils'

const time = ref({
  hours: '00',
  minutes: '00',
  seconds: '00',
  milliseconds: '000'
})

const updateTime = () => {
  time.value = getTodayRemaining()
}

let timer

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 10)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.today-countdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px; /* 与其他卡片一致的内边距 */
  margin-bottom: 30px; /* 统一间距 */
  height: 120px; /* 与今日日期栏一致的高度 */
}

.title {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
  flex-shrink: 0;
}

.time-display {
  font-family: var(--font-mono);
  display: flex;
  align-items: baseline;
  flex: 1;
  justify-content: center;
}

.time {
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
}

.milliseconds {
  font-size: 32px;
  font-weight: 600;
  color: var(--green-secondary);
}

.precision-note {
  font-size: 14px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .today-countdown {
    flex-direction: column;
    text-align: center;
    gap: 15px;
    height: auto;
    min-height: 120px;
  }
  
  .time {
    font-size: 40px;
  }
  
  .milliseconds {
    font-size: 24px;
  }
}
</style>
