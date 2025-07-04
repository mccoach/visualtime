<template>
  <div id="app">
    <main class="main-content">
      <!--
        网站LOGO与标题区（左上角），和内容分离，绝对定位以保证主内容和水杯左对齐。
      -->
      <div class="site-title-section">
        <div class="site-branding">
          <!-- 站点LOGO，图片文件import方式，不随base路径变化 -->
          <img :src="faviconUrl" alt="光阴 Logo" class="favicon" width="80" height="80" />
          <div class="site-text">
            <h1 class="site-title">光阴</h1>
            <p class="site-subtitle">VisualTime</p>
          </div>
        </div>
      </div>
      <!-- 日期+农历+时间横条，左对齐（与water卡片"本季剩余"同一列） -->
      <DateDisplay />
      <!-- ====== 四倒计时卡片，每一个都是“水杯”卡片 ====== -->
      <div class="countdown-grid">
        <!--
          年剩余卡片，进度为(1-剩余/当年总天数)，用getMaxValue自动推算闰年
        -->
        <CountdownCard
          title="本年剩余"
          :value="yearRemaining"
          :precision="yearPrecision"
          :decimal-precision="yearDecimalPrecision"
          type="year"
          color="var(--green-primary)"
          :progress="getProgress('year', yearRemaining, yearMax)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        <!--
          季剩余卡片，进度为(1-剩余/当前季度总天数)
        -->
        <CountdownCard
          title="本季剩余"
          :value="quarterRemaining"
          :precision="quarterPrecision"
          :decimal-precision="quarterDecimalPrecision"
          type="quarter"
          color="var(--green-secondary)"
          :progress="getProgress('quarter', quarterRemaining, quarterMax)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        <!--
          月剩余卡片，动态根据当前月实际天数
        -->
        <CountdownCard
          title="本月剩余"
          :value="monthRemaining"
          :precision="monthPrecision"
          :decimal-precision="monthDecimalPrecision"
          type="month"
          color="var(--green-tertiary)"
          :progress="getProgress('month', monthRemaining, monthMax)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
        />
        <!--
          周剩余卡片，周首日可切换，周最大天数自动判定
        -->
        <CountdownCard
          title="本周剩余"
          :value="weekRemaining"
          :precision="weekPrecision"
          :decimal-precision="weekDecimalPrecision"
          type="week"
          color="var(--green-quaternary)"
          :show-week-start="true"
          :week-start="weekStart"
          :progress="getProgress('week', weekRemaining, weekMax)"
          @precision-change="handlePrecisionChange"
          @decimal-change="handleDecimalChange"
          @week-start-change="handleWeekStartChange"
        />
      </div>
      <!-- 今日倒计时横条 -->
      <TodayCountdown />
      <!-- 自定义倒计时区域 -->
      <CustomCountdown />
    </main>
    <!-- 页脚：版权与作者说明 -->
    <footer class="footer">
      <p>光阴 VisualTime - 让时间可视化</p>
      <p class="author">大谨 | 用❤️打造</p>
    </footer>
  </div>
</template>

<script setup>
// -------- Vue3 setup语法糖 --------

import { ref, computed, onMounted, onUnmounted } from 'vue'
// LOGO静态导入，图片在 src/assets 下，Vite自动路径处理
import faviconUrl from './assets/favicon.svg'
import DateDisplay from './components/DateDisplay.vue'
import CountdownCard from './components/CountdownCard.vue'
import TodayCountdown from './components/TodayCountdown.vue'
import CustomCountdown from './components/CustomCountdown.vue'
import {
  getYearRemaining, getQuarterRemaining, getMonthRemaining, getWeekRemaining
} from './utils/dateUtils'
import {
  getPrecision, setPrecision, getWeekStart, setWeekStart,
  getDecimalPrecision, setDecimalPrecision
} from './utils/storage'

/* ====== 1. 全部倒计时主状态 ====== */
const yearRemaining    = ref(0) // 当年剩余天数或小时等
const quarterRemaining = ref(0)
const monthRemaining   = ref(0)
const weekRemaining    = ref(0)
const yearPrecision    = ref(getPrecision('year'))
const quarterPrecision = ref(getPrecision('quarter'))
const monthPrecision   = ref(getPrecision('month'))
const weekPrecision    = ref(getPrecision('week'))
const yearDecimalPrecision    = ref(getDecimalPrecision('year'))
const quarterDecimalPrecision = ref(getDecimalPrecision('quarter'))
const monthDecimalPrecision   = ref(getDecimalPrecision('month'))
const weekDecimalPrecision    = ref(getDecimalPrecision('week'))
const weekStart = ref(getWeekStart()) // 0:周日 1:周一

/* ====== 2. 每卡片最大天数/小时数动态计算（保证进度绝对精准）====== */

// 今年总天数，闰年=366，否则=365
const yearMax = computed(() => {
  const y = new Date().getFullYear()
  return ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) ? 366 : 365
})
// 当前季度总天数
const quarterMax = computed(() => {
  const now = new Date()
  // 当前季度起始月份（0,3,6,9）
  const q = Math.floor(now.getMonth() / 3)
  let days = 0
  for (let i = 0; i < 3; i++) {
    const m = q * 3 + i + 1
    days += new Date(now.getFullYear(), m, 0).getDate() // 获取每月天数，累加
  }
  return days
})
// 当前月总天数
const monthMax = computed(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
})
// 本周最大天数
const weekMax = computed(() => {
  // 通用场景一周=7天
  return 7
})

/* ====== 3. 进度百分比计算（剩余/总，满时1 空时0） ====== */
const getProgress = (type, value, max) => {
  // value 为剩余天数，max为本期最大天数
  const total = Number(max.value || max)
  // 没有值时强制显示空杯
  if (!total || isNaN(value)) return 0
  let percent = 1 - (Number(value) / total)
  return Math.max(0, Math.min(percent, 1))
}

/* ====== 4. 统一刷新倒计时主数字的函数 ====== */
const updateCountdowns = () => {
  yearRemaining.value    = getYearRemaining(yearPrecision.value)
  quarterRemaining.value = getQuarterRemaining(quarterPrecision.value)
  monthRemaining.value   = getMonthRemaining(monthPrecision.value)
  weekRemaining.value    = getWeekRemaining(weekPrecision.value, weekStart.value)
}

/* ------ 精度按钮/小数按钮/周起始日 切换处理，改变配置并刷新 ------ */
const handlePrecisionChange = (type, precision) => {
  setPrecision(type, precision)
  switch (type) {
    case 'year':    yearPrecision.value = precision; break
    case 'quarter': quarterPrecision.value = precision; break
    case 'month':   monthPrecision.value = precision; break
    case 'week':    weekPrecision.value = precision; break
  }
  updateCountdowns()
}
const handleDecimalChange = (type, precision) => {
  setDecimalPrecision(type, precision)
  switch (type) {
    case 'year':    yearDecimalPrecision.value = precision; break
    case 'quarter': quarterDecimalPrecision.value = precision; break
    case 'month':   monthDecimalPrecision.value = precision; break
    case 'week':    weekDecimalPrecision.value = precision; break
  }
}
const handleWeekStartChange = (value) => {
  weekStart.value = value
  setWeekStart(value)
  updateCountdowns()
}

/* ====== 页面初始化和全局刷新定时处理 ====== */
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
/* 全局样式、布局与响应式方案都放在 global.css，这里只写本页面特有或定位需要的特殊样式 */
@import './styles/global.css';

#app { min-height: 100vh; display: flex; flex-direction: column; }
.main-content {
  flex: 1; max-width: 1200px; margin: 0 auto; padding: 30px;
  padding-bottom: 0;
  width: 100%; position: relative;
}
/* LOGO与标题区段 */
.site-title-section { position: absolute; top: 30px; left: 30px; z-index: 10; }
.site-branding { display: flex; align-items: center; gap: 20px; }
.favicon { display: block; }
.site-text { display: flex; flex-direction: column; align-items: flex-start; }
.site-title { font-size: 60px; font-weight: 600; margin-bottom: -8px; color: var(--text-primary);}
.site-subtitle { font-size: 25px; color: var(--text-tertiary); margin: 0; line-height: 1.0; }
/* 日期栏左边距与本季剩余对齐 */
.date-display { margin-left: 290px; margin-bottom: 30px; }
.countdown-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 30px; margin-bottom: 30px;
}
.today-countdown { margin-bottom: 30px; }
.custom-countdown { margin-bottom: 8px; }
.date-display, .today-countdown, .custom-countdown { margin-right: 0; }
.footer { text-align: center; padding: 8px 30px; color: var(--text-tertiary); font-size: 12px; line-height: 1.6; }
.author { margin-top: 8px; font-size: 14px; color: var(--text-secondary); }

@media (max-width: 768px) {
  .main-content { padding: 20px; padding-top: 140px; padding-bottom: 0; }
  .site-title-section { position: relative; top: 0; left: 0; margin-bottom: 20px; display: flex; justify-content: center; }
  .site-branding { justify-content: center; }
  .site-text { align-items: center; text-align: center; }
  .site-title { font-size: 42px; }
  .site-subtitle { font-size: 18px; }
  .countdown-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 20px; }
  .date-display { margin-left: 0; margin-bottom: 20px; }
  .today-countdown { margin-bottom: 20px; }
  .custom-countdown { margin-bottom: 5px; }
  .footer { padding: 5px 20px; }
}
@media (max-width: 480px) {
  .main-content { padding-top: 160px; }
  .site-branding { flex-direction: column; gap: 16px; }
  .site-title { font-size: 36px; }
  .site-subtitle { font-size: 16px; }
}
</style>
