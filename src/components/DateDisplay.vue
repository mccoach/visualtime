<template>
  <div class="date-display card">
    <div class="date-content">
      <!-- 左侧：公历日期和农历信息 -->
      <div class="date-info">
        <h1 class="current-date">{{ currentDate }}</h1>
        <p class="lunar-date">{{ lunarInfo }}</p>
      </div>
      <!-- 右侧：“此刻时间”数字横排居中，冒号与数字分别占位，不抖动 -->
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
// ========== 日期与时间防抖显示，依赖dayjs等工具 ==========
import { ref, onMounted, onUnmounted } from 'vue'
import { formatDate, getLunarInfo, getCurrentTime } from '../utils/dateUtils'

// 当前公历日期字符串
const currentDate = ref('')
// 当前农历+节气
const lunarInfo = ref('')
// 防抖动化时间对象，包含hours, minutes, seconds（字符串两位补零），用于数字和冒号分块
const now = ref({ hours: '00', minutes: '00', seconds: '00' })

const updateDateTime = () => {
  const date = new Date()
  currentDate.value = formatDate(date)
  lunarInfo.value = getLunarInfo(date).fullInfo
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
/* 外壳，用于整体卡片轮廓和间距，不影响内容结构 */
.date-display {
  margin-left: 290px;     /* 与倒计时卡片第二列对齐 */
  margin-bottom: 30px;
  height: 120px;
  display: flex;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
}

/* 内层左右内容分布，date-info左侧，current-time右侧 */
.date-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 95%;
  height: 100%;
}

/* 左侧日期/农历信息区 */
.date-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

/* 公历大号标题 */
.current-date {
  font-size: 36px;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
  color: var(--text-primary);
}
.lunar-date {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 8px 0 0 0;
}

/* 右侧当前时间/冒号/分/秒，所有部分都用等宽块以防止跳动 */
.current-time {
  display: flex;
  align-items: center;
  /* 等宽体保证每个数字占位一样，冒号不会跑 */
  font-family: var(--font-mono);
}

.num-block {
  display: inline-block;
  width: 80px;              /* 每个数字两位，宽度固定、防跳 */
  text-align: center;
  font-size: 72px;
  font-weight: 600;
  color: var(--green-primary);
}
.sep-block {
  display: inline-block;
  width: 28px;              /* 冒号宽度略小于数字 */
  text-align: center;
  font-size: 64px;
  font-weight: 600;
  color: var(--green-primary);
  user-select: none;
  padding: 2 2px;
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
  .current-date { font-size: 32px; }
  .num-block { width: 28px; font-size: 40px;}
  .sep-block { width: 11px; font-size: 40px;}
  .current-time { justify-content: center; }
}

@media (max-width: 480px) {
  .current-date { font-size: 26px; }
  .num-block { width: 18px; font-size: 28px;}
  .sep-block { width: 7px; font-size: 28px;}
  .lunar-date { font-size: 14px; }
}
</style>
