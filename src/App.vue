<template>
  <div id="app">
    <main class="main-content">
      <!-- 网站标题独立区域 -->
      <div class="site-title-section">
        <div class="site-title-container">
          <div class="site-branding">
            <div class="favicon-container">
              <img src="/favicon.svg" alt="光阴 Logo" class="favicon" width="96" height="96">
            </div>
            <div class="site-text">
              <h1 class="site-title">光阴</h1>
              <p class="site-subtitle">VisualTime</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 日期时间显示区域 -->
      <DateDisplay />
      
      <div class="countdown-grid">
        <CountdownCard
          title="本年剩余"
          :value="yearRemaining"
          :precision="yearPrecision"
          :decimal-precision="yearDecimalPrecision"
          type="year"
          color="var(--green-primary)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        
        <CountdownCard
          title="本季剩余"
          :value="quarterRemaining"
          :precision="quarterPrecision"
          :decimal-precision="quarterDecimalPrecision"
          type="quarter"
          color="var(--green-secondary)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        
        <CountdownCard
          title="本月剩余"
          :value="monthRemaining"
          :precision="monthPrecision"
          :decimal-precision="monthDecimalPrecision"
          type="month"
          color="var(--green-tertiary)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        
        <CountdownCard
          title="本周剩余"
          :value="weekRemaining"
          :precision="weekPrecision"
          :decimal-precision="weekDecimalPrecision"
          type="week"
          color="var(--green-quaternary)"
          :show-week-start="true"
          :week-start="weekStart"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
          @week-start-change="handleWeekStartChange"
        />
      </div>

      <TodayCountdown />
      <CustomCountdown />
    </main>

    <footer class="footer">
      <p>光阴 VisualTime - 让时间可视化</p>
      <p class="author">大谨 | 用❤️打造</p>
    </footer>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DateDisplay from './components/DateDisplay.vue'
import CountdownCard from './components/CountdownCard.vue'
import TodayCountdown from './components/TodayCountdown.vue'
import CustomCountdown from './components/CustomCountdown.vue'
import {
  getYearRemaining,
  getQuarterRemaining,
  getMonthRemaining,
  getWeekRemaining
} from './utils/dateUtils'
import {
  getPrecision,
  setPrecision,
  getWeekStart,
  setWeekStart,
  getDecimalPrecision,
  setDecimalPrecision
} from './utils/storage'

// 状态管理
const yearRemaining = ref(0)
const quarterRemaining = ref(0)
const monthRemaining = ref(0)
const weekRemaining = ref(0)

const yearPrecision = ref(getPrecision('year'))
const quarterPrecision = ref(getPrecision('quarter'))
const monthPrecision = ref(getPrecision('month'))
const weekPrecision = ref(getPrecision('week'))

const yearDecimalPrecision = ref(getDecimalPrecision('year'))
const quarterDecimalPrecision = ref(getDecimalPrecision('quarter'))
const monthDecimalPrecision = ref(getDecimalPrecision('month'))
const weekDecimalPrecision = ref(getDecimalPrecision('week'))

const weekStart = ref(getWeekStart())

const updateCountdowns = () => {
  yearRemaining.value = getYearRemaining(yearPrecision.value)
  quarterRemaining.value = getQuarterRemaining(quarterPrecision.value)
  monthRemaining.value = getMonthRemaining(monthPrecision.value)
  weekRemaining.value = getWeekRemaining(weekPrecision.value, weekStart.value)
}

const handlePrecisionChange = (type, precision) => {
  setPrecision(type, precision)
  
  switch(type) {
    case 'year': yearPrecision.value = precision; break
    case 'quarter': quarterPrecision.value = precision; break
    case 'month': monthPrecision.value = precision; break
    case 'week': weekPrecision.value = precision; break
  }
  
  updateCountdowns()
}

const handleDecimalChange = (type, precision) => {
  setDecimalPrecision(type, precision)
  
  switch(type) {
    case 'year': yearDecimalPrecision.value = precision; break
    case 'quarter': quarterDecimalPrecision.value = precision; break
    case 'month': monthDecimalPrecision.value = precision; break
    case 'week': weekDecimalPrecision.value = precision; break
  }
}

const handleWeekStartChange = (value) => {
  weekStart.value = value
  setWeekStart(value)
  updateCountdowns()
}

let timer

onMounted(() => {
  updateCountdowns()
  timer = setInterval(updateCountdowns, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style>
@import './styles/global.css';

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  padding-bottom: 0; /* 移除底部内边距，避免与footer叠加 */
  width: 100%;
  position: relative;
}

/* 网站标题独立定位 */
.site-title-section {
  position: absolute;
  top: 40px;
  left: 30px;
  z-index: 10;
}

.site-title-container {
  /* 移除之前的定位样式 */
}

.site-branding {
  display: flex;
  align-items: center;
  gap: 20px;
}

.favicon-container {
  flex-shrink: 0;
}

.favicon {
  display: block;
}

.site-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.site-title {
  font-size: 66px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
  line-height: 1;
}

.site-subtitle {
  font-size: 27px;
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.2;
}

/* DateDisplay 与本季剩余左边界对齐 */
.date-display {
  margin-left: 290px; /* 260px(卡片宽度) + 30px(间距) */
  margin-bottom: 30px;
}

.countdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.today-countdown {
  margin-bottom: 30px;
}

.custom-countdown {
  margin-bottom: 8px; /* 进一步缩小到8px */
}

/* 确保所有模块右边界对齐 */
.date-display,
.today-countdown,
.custom-countdown {
  margin-right: 0;
}

.footer {
  text-align: center;
  padding: 8px 30px; /* 上下内边距缩小到8px */
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.author {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px;
    padding-top: 140px;
    padding-bottom: 0; /* 移除底部内边距 */
  }
  
  .site-title-section {
    position: relative;
    top: 0;
    left: 0;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
  }
  
  .site-branding {
    justify-content: center;
  }
  
  .site-text {
    align-items: center;
    text-align: center;
  }
  
  .site-title {
    font-size: 42px;
  }
  
  .site-subtitle {
    font-size: 18px;
  }
  
  .countdown-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }
  
  /* 移动端所有模块左对齐 */
  .date-display {
    margin-left: 0;
    margin-bottom: 20px;
  }
  
  .today-countdown {
    margin-bottom: 20px;
  }
  
  .custom-countdown {
    margin-bottom: 5px; /* 移动端缩小到5px */
  }
  
  .footer {
    padding: 5px 20px; /* 移动端进一步缩小 */
  }
}

@media (max-width: 480px) {
  .main-content {
    padding-top: 160px;
  }
  
  .site-branding {
    flex-direction: column;
    gap: 16px;
  }
  
  .site-title {
    font-size: 36px;
  }
  
  .site-subtitle {
    font-size: 16px;
  }
}
</style>
