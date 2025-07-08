<template>
  <div id="app">
    <main class="main-content">
      <!--
        网站LOGO与中英文标题区，绝对定位不占主内容宽度
      -->
      <div class="site-title-section">
        <div class="site-branding">
          <img :src="faviconUrl" alt="光阴 Logo" class="favicon" width="80" height="80" />
          <div class="site-text">
            <h1 class="site-title">光阴</h1>
            <p class="site-subtitle">VisualTime</p>
          </div>
        </div>
      </div>
      <!-- 日期横条 -->
      <DateDisplay />
      <!-- 四大主倒计时卡片 -->
      <div class="countdown-grid">
        <!-- 年卡片 -->
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
        <!-- 季卡片 -->
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
        <!-- 月卡片 -->
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
        <!-- 周卡片，周首日、精度参数全联动 -->
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
      <!-- 今日剩余横条 -->
      <TodayCountdown />
      <!-- 自定义倒计时卡片 -->
      <CustomCountdown />
    </main>
    <footer class="footer footer-vertical">
      <span class="slogan">光阴 VisualTime - 让时间可视化</span>
      <div class="contact-box">
        <!-- 文本和图标都可点击，弹出二维码弹窗 -->
        <span class="contact-text" @click="showWechat = true" title="点击显示微信二维码">微信交流</span>
        <span class="wechat-icon" @click="showWechat = true" title="点击显示微信二维码">
          <img :src="wechatLogo" alt="微信logo" width="20" height="20" />
        </span>
      </div>
      <!-- 二维码弹层，点击空白或按ESC关闭 -->
      <div v-if="showWechat" class="wechat-modal" @click.self="showWechat = false">
        <div class="wechat-qr-box">
          <img :src="wechatQr" alt="微信二维码" class="wechat-qr-img" />
          <p>扫码添加微信</p>
          <button class="close-btn" @click="showWechat = false">关闭</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

// 微信logo和二维码图片用 Vite 静态资源import，绝不出错
import wechatLogo from './assets/wechat-logo.png'
import wechatQr from './assets/wechat-qr.png'
const showWechat = ref(false)  // 控制二维码弹窗显示与否

/* 响应式倒计时数值状态 */
const yearRemaining = ref(0)
const quarterRemaining = ref(0)
const monthRemaining = ref(0)
const weekRemaining = ref(0)

/* 单位/精度 */
const yearPrecision = ref(getPrecision('year'))
const quarterPrecision = ref(getPrecision('quarter'))
const monthPrecision = ref(getPrecision('month'))
const weekPrecision = ref(getPrecision('week'))

const yearDecimalPrecision = ref(getDecimalPrecision('year'))
const quarterDecimalPrecision = ref(getDecimalPrecision('quarter'))
const monthDecimalPrecision = ref(getDecimalPrecision('month'))
const weekDecimalPrecision = ref(getDecimalPrecision('week'))

const weekStart = ref(getWeekStart())

/* 各卡片最大值动态计算 */
const yearMax = computed(() => getMax('year', yearPrecision.value))

const quarterMax = computed(() => getMax('quarter', quarterPrecision.value))
const monthMax = computed(() => getMax('month', monthPrecision.value))
const weekMax  = computed(() => getMax('week', weekPrecision.value))

/* progress为(剩余/总) */
const getProgress = (type, value, max) => {
  const total = Number(max)
  const val = Number(value)
  if (!total || isNaN(val)) return 0
  let percent = 1 - val / total
  if (percent < 0) percent = 0
  if (percent > 1) percent = 1
  return percent
}

/* 定时更新全部倒计时/精度状态 */
const updateCountdowns = () => {
  yearRemaining.value = getYearRemaining(yearPrecision.value, yearDecimalPrecision.value)
  quarterRemaining.value = getQuarterRemaining(quarterPrecision.value, quarterDecimalPrecision.value)
  monthRemaining.value = getMonthRemaining(monthPrecision.value, monthDecimalPrecision.value)
  weekRemaining.value = getWeekRemaining(
    weekPrecision.value, weekDecimalPrecision.value, weekStart.value
  )
}

/* 精度/小数/周首日切换事件都全局刷新数据 */
const handlePrecisionChange = (type, precision) => {
  setPrecision(type, precision)
  switch (type) {
    case 'year':    yearPrecision.value    = precision; break
    case 'quarter': quarterPrecision.value = precision; break
    case 'month':   monthPrecision.value   = precision; break
    case 'week':    weekPrecision.value    = precision; break
  }
  updateCountdowns() // 立即刷新
}
const handleDecimalChange = (type, precision) => {
  setDecimalPrecision(type, precision)
  switch (type) {
    case 'year': yearDecimalPrecision.value = precision; break
    case 'quarter': quarterDecimalPrecision.value = precision; break
    case 'month': monthDecimalPrecision.value = precision; break
    case 'week': weekDecimalPrecision.value = precision; break
  }
  updateCountdowns() // 立即刷新
}
const handleWeekStartChange = (val) => {
  weekStart.value = val
  setWeekStart(val)
  updateCountdowns()
}

/* 定时器，保证每隔一秒更新一次所有倒计时 */
let timer
onMounted(() => {
  updateCountdowns()
  timer = setInterval(updateCountdowns, 1000)
})
onUnmounted(() => {
  clearInterval(timer)
})

/*
  获取不同周期的剩余最大值
  type: 'year'|'quarter'|'month'|'week'
  precision: 'day'|'hour'|'minute'|'second'
*/
function getMax(type, precision) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  // 年度
  if (type === 'year') {
    const yearDays = ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) ? 366 : 365
    if (precision === 'day')    return yearDays
    if (precision === 'hour')   return yearDays * 24
    if (precision === 'minute') return yearDays * 24 * 60
    if (precision === 'second') return yearDays * 24 * 60 * 60
  }
  // 季度
  if (type === 'quarter') {
    const quarter = Math.floor(m / 3)
    let days = 0
    for (let i = 0; i < 3; i++) {
      const mm = quarter * 3 + i + 1
      days += new Date(y, mm, 0).getDate()
    }
    if (precision === 'day')    return days
    if (precision === 'hour')   return days * 24
    if (precision === 'minute') return days * 24 * 60
    if (precision === 'second') return days * 24 * 60 * 60
  }
  // 月
  if (type === 'month') {
    const days = new Date(y, m + 1, 0).getDate()
    if (precision === 'day')    return days
    if (precision === 'hour')   return days * 24
    if (precision === 'minute') return days * 24 * 60
    if (precision === 'second') return days * 24 * 60 * 60
  }
  // 周：始终假定为7天现行（不考虑自然周残缺）
  if (type === 'week') {
    if (precision === 'day')    return 7
    if (precision === 'hour')   return 7 * 24
    if (precision === 'minute') return 7 * 24 * 60
    if (precision === 'second') return 7 * 24 * 60 * 60
  }
  return 1
}

// 支持ESC关闭二维码弹窗
function handleWechatEscKey(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (showWechat.value) showWechat.value = false
  }
}
// 弹窗显示时才监听Esc
watch(showWechat, val => {
  if (val) document.addEventListener('keydown', handleWechatEscKey)
  else document.removeEventListener('keydown', handleWechatEscKey)
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleWechatEscKey)
})
</script>

<style>
@import './styles/global.css';
/* 其余样式全部由 global.css 控制，无冗余冗长内容 */
</style>

