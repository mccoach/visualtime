<template>
  <div class="countdown-card card card-cup">
    <!--
      波浪液面SVG：灰色淡透明，宽度=卡片宽度，两端严格贴边
      水面“进度”=progress决定高度，波形有横向扰动每个锚点lerp平滑
    -->
    <svg
      class="liquid-svg"
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
      主内容区，位于波浪之上
    -->
    <div class="card-content">
      <!-- 标题/周首日选项都同一行居两端 -->
      <div class="card-header">
        <h3 class="title">{{ title }}</h3>
        <div v-if="showWeekStart" class="week-start-selector-row">
          <div class="week-label">周首日</div>
          <div class="week-buttons">
            <button
              :class="['week-btn', { active: weekStart === 1 }]"
              @click="handleWeekStartChange(1)"
            >一</button>
            <button
              :class="['week-btn', { active: weekStart === 0 }]"
              @click="handleWeekStartChange(0)"
            >日</button>
          </div>
        </div>
      </div>
      <!-- 根据数字位数动态缩放的主数字，宽度自适应且居中 -->
      <div class="number-container">
        <span class="number" :style="numberStyle">{{ displayNumber }}</span>
      </div>
      <!-- 单位文字，如天/小时/分钟等 -->
      <div class="unit">{{ unit }}</div>
      <!-- 
        下方按钮两组，均横向连体居中 
      -->
      <div class="button-row">
        <!-- 主单位四选一，连体样式 -->
        <div class="joined-btn-group">
          <button
            v-for="p in precisions"
            :key="p.value"
            :class="['precision-btn', 'joined-btn', { active: precision === p.value }]"
            @click="handlePrecisionChange(p.value)">
            {{ p.label }}
          </button>
        </div>
        <!-- 精度按钮连体，禁用规则已在方法里控制 -->
        <div class="joined-btn-group">
          <button
            v-for="d in decimalOptions"
            :key="d.value"
            :class="['decimal-btn', 'joined-btn', { active: decimalPrecision === d.value, disabled: isDecimalDisabled(d.value) }]"
            @click="handleDecimalChange(d.value)"
            :disabled="isDecimalDisabled(d.value)">
            {{ d.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 导入vue组合API和工具方法
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import {
  getYearRemaining,
  getQuarterRemaining,
  getMonthRemaining,
  getWeekRemaining
} from '../utils/dateUtils'

// props区：全部由App.vue传入ref或computed值，包含主精度/进度/小数点/周首日/色值等
const props = defineProps({
  title: String,
  value: Number,
  precision: String,
  type: String,
  color: String,
  showWeekStart: Boolean,
  weekStart: Number,
  decimalPrecision: { type: Number, default: 0 },
  progress: { type: Number, required: true }
})

const emit = defineEmits(['precision-change', 'week-start-change', 'decimal-change'])

// 主单位按钮、精度按钮（四选一/三选一，支持所有类型），按钮组由全局css定义
const precisions = [
  { value: 'day', label: '天' },
  { value: 'hour', label: '时' },
  { value: 'minute', label: '分' },
  { value: 'second', label: '秒' }
]
const decimalOptions = [
  { value: 0, label: '0' },
  { value: 1, label: '0.0' },
  { value: 2, label: '0.00' }
]

// 单位自动切换
const unit = computed(() =>
  ({ day: '天', hour: '小时', minute: '分钟', second: '秒' }[props.precision] || '天')
)

// 自动自适应字号
const displayNumber = computed(() => {
  const value = props.value ?? 0
  return value.toFixed(props.decimalPrecision)
})

const numberFontSize = computed(() => {
  const len = (displayNumber.value || '').replace('.', '').length
  // 在移动端的时候
  if (window.innerWidth <= 768) {
    if (len <= 4) return '40px'
    if (len >= 12) return '14px'
    return `${Math.round(40 - (len - 4) * 2.7)}px`
  } else {
    // 桌面端
    if (len <= 4) return '72px'
    if (len >= 10) return '32px'
    return `${Math.round(72 - (len - 4) * 7)}px`
  }
})

const numberStyle = computed(() => ({
  fontSize: numberFontSize.value,
  width: '100%',
  textAlign: 'center',
  letterSpacing: '2px'
}))

// 精度按钮禁用
const isDecimalDisabled = (decimalValue) => {
  if (props.precision === 'second' && decimalValue > 0) return true
  if (props.precision === 'minute' && decimalValue === 2) return true
  return false
}
// 单位/精度/周首日切换事件全部一条链路传父组件
const handlePrecisionChange = value => emit('precision-change', props.type, value)
const handleDecimalChange = value => emit('decimal-change', props.type, value)
const handleWeekStartChange = value => emit('week-start-change', value)
// 精度变时如非法精度自动回退
watch([() => props.precision, () => props.decimalPrecision], ([newPrecision, dec]) => {
  if (newPrecision === 'second' && dec > 0)
    emit('decimal-change', props.type, 0)
  if (newPrecision === 'minute' && dec === 2)
    emit('decimal-change', props.type, 1)
})

/* 波浪动画参数，每卡片段锚点各自随机lerp，流畅无尖刺，左右端严格贴边 */
const cardW = 260
const cardH = 320
const anchorCount = 6
const anchorX = Array.from({ length: anchorCount }, (_, i) => i * cardW / (anchorCount - 1))
const anchorWaveLen = anchorX.map(() => 75 + Math.random() * 30)
const anchorAmp = anchorX.map(() => 1.2 + Math.random() * 1)
const myWavePhase = Math.random() * Math.PI * 2
const waveOffset = ref(0)
let waveTimer
onMounted(() => { waveTimer = setInterval(() => { waveOffset.value += 1 }, 32) })
onUnmounted(() => { clearInterval(waveTimer) })
function lerp(a, b, t) { return a + (b - a) * t }
function getLerpValue(x, anchorArr) {
  for (let i = 0; i < anchorArr.length - 1; i++) {
    if (x >= anchorX[i] && x <= anchorX[i + 1]) {
      const t = (x - anchorX[i]) / (anchorX[i + 1] - anchorX[i])
      return lerp(anchorArr[i], anchorArr[i + 1], t)
    }
  }
  return anchorArr[anchorArr.length - 1]
}
const liquidPath = computed(() => {
  // 水杯液面底=0，顶=cardH
  const topY = cardH * props.progress
  const phase = waveOffset.value
  let d = `M0,${cardH} L0,${topY} `
  for (let x = 1; x < cardW - 1; x += 6) {
    const waveLen = getLerpValue(x, anchorWaveLen)
    const amp = getLerpValue(x, anchorAmp)
    const rand = Math.sin(x * 0.06 + phase / 222) * 0.3
    const y = topY +
      Math.sin((x / waveLen) * 2 * Math.PI + phase / 39 + myWavePhase) * amp +
      rand
    d += `${x},${y} `
  }
  d += `L${cardW},${topY} L${cardW},${cardH} Z`
  return d
})

</script>

<style scoped>
/* 卡片本体样式和布局仅负责内容结构，视觉由全局card保证 */
/* 波浪液面波动动画 */
.countdown-card.card-cup {
  position: relative;
  overflow: hidden;
  z-index: 0;
  height: 320px;
}
.liquid-svg {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}
.card-content {
  position: relative;
  z-index: 2;
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 48px;
}
.title{
  font-size:18px;
  color:var(--text-secondary);
  font-weight:400;
  margin:0;
  line-height:1.2;
}
.week-start-selector-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.week-label {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: 400;
  line-height: 1.2;
}
.week-buttons{ display: flex; flex-direction: row; gap: 0; }
.week-btn {
  border-radius: 0; margin-left: -1px; width: 46px; height: 28px;
  border: 1px solid var(--border-color);
  background: var(--bg-quaternary);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.week-btn:first-child { border-radius: 14px 0 0 14px; margin-left:0; }
.week-btn:last-child { border-radius: 0 14px 14px 0; }
.week-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
  border-color: transparent;
}

.number-container{
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  min-height: 80px;
  margin-bottom: 10px;
}
.number{
  display: inline-block;
  font-weight: 600;
  color: v-bind(color);
  white-space: nowrap;
  text-align: center;
  width: auto;
}

.unit {
  font-size: 24px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-weight: 500;
}

.button-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 14px;
}

.joined-btn-group {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 0;
  width: auto;
}
.joined-btn {
  border-radius: 0;
  margin-left: -1px;
  border-width: 1px 1px 1px 0;
  width: 48px; height: 28px; font-weight: 600;
  border: 1px solid var(--border-color);
  background: var(--bg-quaternary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.1s;
}
.joined-btn:first-child { border-top-left-radius: 14px; border-bottom-left-radius: 14px; margin-left:0;}
.joined-btn:last-child  { border-top-right-radius: 14px; border-bottom-right-radius: 14px;}

.precision-btn.active, .decimal-btn.active, .week-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
}
.decimal-btn.disabled, .week-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}
@media (max-width:768px){
  .countdown-card{height:280px;}
  .card-header{flex-direction:column;gap:10px;min-height:auto;}
  .number{font-size:56px;}
  .unit{font-size:20px;}
}
</style>
