<template>
  <!--
    今日倒计时主横条（防抖布局），左标题右数字
    液面波浪SVG绝对定位覆盖整个卡片，内容区用z-index:2浮于液面上
  -->
  <div class="today-countdown card today-liquid-wrap">
    <!-- 横向液面SVG：淡灰色、progress控制宽度，z-index:1 -->
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
        fill="#484848"
        fill-opacity="0.22"
      />
    </svg>

    <!-- 内容区域（确保样式和你确认的防抖动布局完全一致） -->
    <h3 class="title">今日剩余</h3>
    <div class="time-display">
      <!-- 左右抖动防抖关键：每个数字和符号固定宽度inline-block单独span -->
      <span class="num-block">{{ time.hours }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ time.minutes }}</span>
      <span class="sep-block">:</span>
      <span class="num-block">{{ time.seconds }}</span>
      <span class="dot-block">.</span>
      <span class="ms-block">{{ time.milliseconds }}</span>
    </div>
    <p class="precision-note">精确到毫秒</p>
  </div>
</template>

<script setup>
// 右侧倒计时数字布局与之前确认方案完全一致
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getTodayRemaining } from '../utils/dateUtils'

const cardW = 520   // 若设计为与主内容卡片宽一致
const cardH = 120

// 横向剩余进度（0~1），越大液面越向右
const progress = computed(() => {
  const t = getTodayRemaining()
  const totalMs = 24 * 60 * 60 * 1000
  const msLeft =
    Number(t.hours) * 60 * 60 * 1000 +
    Number(t.minutes) * 60 * 1000 +
    Number(t.seconds) * 1000 +
    Number(t.milliseconds)
  return 1 - msLeft / totalMs
})

// 水波动画（幅度非常低、波长基础60-100）
const waveOffset = ref(0)
const myWaveAmp = ref(1 + Math.random() * 0.35)
const myWaveLen = ref(60 + Math.random() * 40)
const myWavePhase = Math.random() * Math.PI * 2
const randomSeed = Array.from({ length: Math.ceil(cardH / 6) + 2 }, () => Math.random() * 0.5 - 0.25)
let timer
onMounted(() => { timer = setInterval(() => { waveOffset.value += 1 }, 24) })
onUnmounted(() => { clearInterval(timer) })
const liquidPath = computed(() => {
  const rightX = cardW * progress.value
  const amp = myWaveAmp.value
  const len = myWaveLen.value
  const phase = waveOffset.value
  let d = `M0,${cardH} L0,0 `
  let idx = 0
  // 横向，每隔dy生成扰动
  for (let y = 1; y < cardH - 1; y += 5) {
    const rand = randomSeed[idx % randomSeed.length]
    const x =
      rightX +
      Math.sin((y / len) * 2 * Math.PI + phase / 49 + myWavePhase) * amp +
      rand * 0.25 * Math.sin(phase / 57 + y)
    d += `${x},${y} `
    idx++
  }
  d += `L${rightX},${cardH} Z`
  return d
})

// 倒计时数字业务
const time = ref({ hours: '00', minutes: '00', seconds: '00', milliseconds: '000' })
const updateTime = () => { time.value = getTodayRemaining() }
let timer2
onMounted(() => {
  updateTime()
  timer2 = setInterval(updateTime, 10)
})
onUnmounted(() => { clearInterval(timer2) })
</script>

<style scoped>
/* 今日倒计时横条，relative为SVG定位提供上下文 */
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
/* 液面波浪 */
.liquid-svg-h {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}
/* 标题 */
.title {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
  margin: 0 24px 0 0;
  flex-shrink: 0;
}
/* 精确到毫秒备注，靠左下 */
.precision-note {
  font-size: 14px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin: 0;
  margin-top: 8px;
  margin-left: 2px;
}
/* 右侧数字区-严格防抖动实现，横排全部用等宽块span */
.time-display {
  font-family: var(--font-mono);
  display: flex;
  align-items: baseline;
  justify-content: center; /* 修改：数字栏横向居中（原为flex-end或space-between） */
  width: 100%;             /* 新增：让数字栏占满卡片宽度居中显示 */
  /* 保证不会因内容不同导致数字靠左或靠右 */
}

/* 两位数字宽度/排版固定 */
.num-block {
  display: inline-block;
  width: 60px;
  text-align: center;
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
}
.sep-block {
  display: inline-block;
  width: 26px;
  text-align: center;
  font-size: 56px;
  font-weight: 600;
  color: var(--green-primary);
  user-select: none;
}
.dot-block {
  display: inline-block;
  width: 24px;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: var(--green-secondary);
  user-select: none;
  margin-left: 0px;
}
.ms-block {
  display: inline-block;
  width: 42px;
  text-align: left;
  font-size: 32px;
  font-weight: 600;
  color: var(--green-secondary);
}
@media (max-width: 768px) {
  .today-countdown.today-liquid-wrap {
    flex-direction: column;
    height: auto;
    min-height: 120px;
    gap: 15px;
    padding: 14px;
  }
  .title { margin: 0; font-size: 16px;}
  .precision-note{ margin:0; margin-top:4px;}
  .num-block { width: 32px; font-size:40px;}
  .sep-block { width: 13px; font-size:40px; }
  .dot-block { width: 9px; font-size:22px;}
  .ms-block { width: 23px; font-size:24px;}
  .time-display { min-width: 182px; }
}
</style>
