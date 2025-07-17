<template>
  <div class="today-countdown card today-liquid-wrap">
    <!--
      液面波浪SVG渐淡灰色，width=card宽，横向进度由progress驱动，波动高度/波长每段插值
    -->
    <svg
      class="liquid-svg-h"
      :width="cardW"
      :height="cardH"
      :viewBox="`0 0 ${cardW} ${cardH}`"
      preserveAspectRatio="none"
      style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;"
    >
      <path
        :d="liquidPath"
        fill="var(--bg-tertiary)"
        fill-opacity="0.99"
      />
    </svg>
    <!--
      今日剩余横条内容区，左标题/右数字区
      （保证样式与标准横条一致，不会因SVG干扰数字布局）
    -->
    <h3 class="title">今日剩余</h3>
    <div class="time-display">
      <span class="num-block">{{ time.hours }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ time.minutes }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ time.seconds }}</span>
      <!-- 只有选毫秒精度时才显示小数点和毫秒数字块 -->
      <template v-if="precision === 'ms'">
        <span class="dot-block">.</span>
        <span class="ms-block">{{ time.milliseconds }}</span>
      </template>
    </div>
    <!-- 精度切换按钮区，连体风格 -->
    <div class="joined-btn-group today-precision-group">
      <button
        :class="['today-precision-btn', 'joined-btn', { active: precision === 's' }]"
        @click="setPrecision('s')"
      >秒</button>
      <button
        :class="['today-precision-btn', 'joined-btn', { active: precision === 'ms' }]"
        @click="setPrecision('ms')"
      >毫秒</button>
    </div>
  </div>
</template>

<script setup>
// 时间/波面进度，完全贴两边
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getTodayRemaining } from '../utils/dateUtils'

// 本卡宽高，建议和App/主内容区设定一致
const cardW = 520
const cardH = 120

// 精度模式：'s'为秒级，'ms'为毫秒级
const precision = ref('ms')
const setPrecision = (val) => {
  precision.value = val
  refreshTimer()
}

// 进度百分比，当前时间已用/全天总毫秒数，越大越长
const progress = computed(() => {
  // 关键：让 progress 依赖 time.value
  const totalMs = 24 * 60 * 60 * 1000
  const msLeft = Number(time.value.hours) * 60 * 60 * 1000 +
                 Number(time.value.minutes) * 60 * 1000 +
                 Number(time.value.seconds) * 1000 +
                 Number(time.value.milliseconds)
  return 1 - msLeft / totalMs
})

// 波形锚点及参数，每条y段均独立波长/幅度
const anchorCount = 6
const anchorY = Array.from({ length: anchorCount }, (_, i) => i * cardH / (anchorCount - 1))
const anchorWaveLen = anchorY.map(() => 60 + Math.random() * 36)
const anchorAmp     = anchorY.map(() => 1 + Math.random() * 0.6)
const myWavePhase = Math.random() * Math.PI * 2
function lerp(a, b, t) { return a + (b - a) * t }
function getLerpValue(y, anchorArr) {
  for (let i = 0; i < anchorArr.length - 1; i++) {
    if (y >= anchorY[i] && y <= anchorY[i + 1]) {
      const t = (y - anchorY[i]) / (anchorY[i + 1] - anchorY[i])
      return lerp(anchorArr[i], anchorArr[i + 1], t)
    }
  }
  return anchorArr[anchorArr.length - 1]
}

// 随机扰动数组：每条波段加微扰，防止死板
const randomSeed = Array.from(
  { length: Math.ceil(cardH / 5) + 2 },
  () => Math.random() * 0.4 - 0.2
)
const waveOffset = ref(0)
let timer
onMounted(() => { timer = setInterval(() => { waveOffset.value += 1 }, 32) })
onUnmounted(() => { clearInterval(timer) })

// 生成SVG液面路径，左右端点严格贴合
const liquidPath = computed(() => {
  const rightX = cardW * progress.value
  const phase = waveOffset.value
  let d = `M${cardW},${cardH} L${cardW},0 `
  let idx = 0
  for (let y = 1; y < cardH - 1; y += 5) {
    const waveLen = getLerpValue(y, anchorWaveLen)
    const amp = getLerpValue(y, anchorAmp)
    const rand = randomSeed[idx % randomSeed.length]
    const x = rightX
      + Math.sin((y / waveLen) * 2 * Math.PI + phase / 47 + myWavePhase) * amp
      + rand
    d += `${x},${y} `
    idx++
  }
  d += `L${rightX},${cardH} Z`
  return d
})

// 倒计时数字自动刷新，切换ms/s智能调整频率
const time = ref({ hours: '00', minutes: '00', seconds: '00', milliseconds: '000' })

// 定时刷新的方法，兼顾精度显示规则
const updateTime = () => {
  let t = getTodayRemaining()
  // 若当前为“秒级”精度，只显示整数，不动毫秒
  if (precision.value === 'second' || precision.value === 's') {
    t.milliseconds = '000'
  }
  time.value = t // 这样progress依赖time.value，动画能动态刷新
}

// 启动定时器，刷倒计时
let timer2
const refreshTimer = () => {
  if (timer2) clearInterval(timer2)
  updateTime()
  // 精度为毫秒时10ms刷，秒时1000ms刷
  timer2 = setInterval(updateTime, precision.value === 'ms' ? 1 : 1000)
}
onMounted(() => {
  updateTime()
  timer2 = setInterval(updateTime, 10) // 液面/数字都可丝滑，1000也能用但动画略卡
})
onUnmounted(() => { clearInterval(timer2) })
</script>

<style>
.today-countdown.today-liquid-wrap {
  position: relative;
  overflow: hidden;
  z-index: 0;
  height: 120px;
  min-width: 320px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding: 24px;
}
.liquid-svg-h {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 1;
}
.title { font-size: 18px; color: var(--text-secondary); z-index: 2;font-weight: 400; margin: 0 24px 0 0; flex-shrink: 0;}
/* 右侧倒计时数字区，完全居中并防抖动 */
.time-display {
  font-family: var(--font-mono);
  display: flex;
  align-items: baseline;
  flex: 1;
  justify-content: center;
  min-width: 232px;
  z-index: 2;
}
.num-block {
  display: inline-block;
  width: 64px;
  text-align: center;
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
  z-index: 2;
}
.sep-block {
  display: inline-block;
  width: 24px;
  text-align: center;
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
  z-index: 2;
  user-select: none;
}
.dot-block {
  display: inline-block;
  width: 16px;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: var(--green-secondary);
  z-index: 2;
  user-select: none;
  margin-left: 0px;
}
.ms-block {
  display: inline-block;
  width: 20px;
  text-align: left;
  font-size: 32px;
  font-weight: 600;
  color: var(--green-secondary);
  z-index: 2;
}
/* 精度切换按钮连体样式，风格与其它卡片保持一致，水平方向排列 */
.joined-btn-group.today-precision-group {
  display: flex;
  z-index: 2;
  flex-direction: row;
  justify-content: center;
  gap: 0;
  margin-top: 18px;
}
.today-precision-btn.joined-btn {
  border-radius: 0;
  margin-left: -1px;
  border-width: 1px 1px 1px 0;
  width: 54px;
  height: 32px;
  font-weight: 600;
  border: 1px solid var(--border-color);
  background: var(--bg-quaternary);
  color: var(--text-secondary);
  z-index: 2;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}
.today-precision-btn.joined-btn:first-child {
  border-top-left-radius: 14px; border-bottom-left-radius: 14px; margin-left:0;
}
.today-precision-btn.joined-btn:last-child {
  border-top-right-radius: 14px; border-bottom-right-radius: 14px;
}
.today-precision-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
}
.today-precision-btn.disabled {
  opacity: 0.5; cursor: not-allowed; background: var(--bg-tertiary); color: var(--text-tertiary);
}
@media (max-width: 768px) {
  .today-countdown.today-liquid-wrap {
    flex-direction: column; height:auto; min-height:120px; gap:12px; padding: 14px; }
  .title { margin: 0; font-size: 16px;}
  .num-block { width: 48px; font-size:40px;}
  .sep-block { width: 13px; font-size:40px; }
  .dot-block { width: 9px; font-size:22px;}
  .ms-block { width: 23px; font-size:24px;}
  .time-display { min-width: 120px; }
}
</style>
