<template>
  <div class="countdown-card card card-cup">
    <!-- 
      SVG 水面，width/height 固定和卡片一样，绝对定位，无分离问题 
      path 跨整个宽度，两端严格topY，fill为淡灰色
    -->
    <svg
      class="liquid-svg"
      :width="cardW"
      :height="cardH"
      :viewBox="`0 0 ${cardW} ${cardH}`"
      preserveAspectRatio="none"
      style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;"
    >
      <path
        :d="liquidPath"
        fill="#484848"
        fill-opacity="0.22"  
      />
    </svg>
    <!-- 卡片内容区，z-index:2，正常布局；所有元素内容都在液面上显示 -->
    <div class="card-content">
      <div class="card-header">
        <h3 class="title">{{ title }}</h3>
        <div v-if="showWeekStart" class="week-start-selector">
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
      <div class="number-container">
        <span class="number">{{ displayNumber }}</span>
      </div>
      <div class="unit">{{ unit }}</div>
      <div class="precision-selector">
        <button
          v-for="p in precisions"
          :key="p.value"
          :class="['precision-btn', { active: precision === p.value }]"
          @click="handlePrecisionChange(p.value)"
        >{{ p.label }}</button>
      </div>
      <div class="decimal-selector">
        <button
          v-for="d in decimalOptions"
          :key="d.value"
          :class="['decimal-btn', {
            active: decimalPrecision === d.value,
            disabled: isDecimalDisabled(d.value)
          }]"
          @click="handleDecimalChange(d.value)"
          :disabled="isDecimalDisabled(d.value)"
        >{{ d.label }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// ========= 卡片内容功能与液面波浪动画 =========
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

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

/* 卡片功能区变量（按钮/单位/数值） */
const precisions = [
  { value: 'day', label: '天' }, { value: 'hour', label: '时' }, { value: 'second', label: '秒' }
]
const decimalOptions = [
  { value: 0, label: '0' }, { value: 1, label: '0.0' }, { value: 2, label: '0.00' }
]
const unit = computed(() => {
  const units = { day: '天', hour: '小时', second: '秒' }
  return units[props.precision] || '天'
})
const displayNumber = computed(() => {
  const value = props.value ?? 0
  if (props.precision === 'second') return Math.floor(value).toString()
  return value.toFixed(props.decimalPrecision)
})
const isDecimalDisabled = (decimalValue) =>
  props.precision === 'second' && decimalValue > 0
const handlePrecisionChange = value => {
  emit('precision-change', props.type, value)
  if (value === 'second') emit('decimal-change', props.type, 0)
}
const handleDecimalChange = value => {
  if (!isDecimalDisabled(value)) emit('decimal-change', props.type, value)
}
const handleWeekStartChange = value => {
  emit('week-start-change', value)
}
watch(() => props.precision, (precision) => {
  if (precision === 'second' && props.decimalPrecision > 0)
    emit('decimal-change', props.type, 0)
})

/* =========== SVG波浪液面动画部分 =========== */
const cardW = 260
const cardH = 320
const myWaveAmp = ref(1.4 + Math.random() * 0.9)          // 振幅更小且各卡略不同
const myWaveLen = ref(70 + Math.random() * 40)            // 波长略不同
const myWavePhase = Math.random() * Math.PI * 2           // 相位确保样式唯一
const randomSeed = Array.from(
  { length: Math.ceil(cardW / 6) + 2 },
  () => Math.random() * 0.8 - 0.4                         // 幅度再降到最多±0.4
)
const waveOffset = ref(0)
let timer
onMounted(() => {
  timer = setInterval(() => { waveOffset.value += 1 }, 32)
})
onUnmounted(() => { clearInterval(timer) })
/**
  生成SVG浮动液面路径。
  1. 左、右端点始终为topY，不做正弦和扰动，保证边界紧贴杯壁
  2. 中间若干点用sin和随机扰动做轻微浮动防止“死波”
*/
const liquidPath = computed(() => {
  const topY = cardH * (1 - props.progress)
  const amp = myWaveAmp.value
  const len = myWaveLen.value
  const phase = waveOffset.value
  // 
  let d = `M0,${cardH} L0,${topY} `
  let idx = 0
  for (let x = 1; x < cardW - 1; x += 6) {
    const rand = randomSeed[idx % randomSeed.length]
    const y =
      topY +
      Math.sin((x / len) * 2 * Math.PI + phase / 39 + myWavePhase) * amp
      + rand * 0.5 * Math.sin(phase / 47 + x)
    d += `${x},${y} `
    idx++
  }
  // 最右端点严格贴右杯壁（无扰动/浮动）
  d += `L${cardW},${topY} L${cardW},${cardH} Z`
  return d
})
</script>

<style scoped>
/* -- 卡片主体水杯 -- */
.countdown-card.card-cup {
  position:relative;
  overflow:hidden;
  z-index:0;
  height:320px;
}
/* -- “液体”SVG绝对覆盖，pointer-events: none避免和内容冲突 -- */
.liquid-svg {
  position:absolute;
  top:0; left:0;
  width:100%; height:100%;
  pointer-events: none;
  z-index:1;
}

/* 卡片z-index2的内容，数字、单位、按钮等都始终在浮动液面之上 */
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
  margin-bottom: 20px;
  min-height: 48px;
}
.title{ font-size: 18px; color: var(--text-secondary); font-weight: 400; margin: 0; line-height: 1.2;}
.week-start-selector { display: flex; align-items: center; gap: 8px;}
.week-label{font-size:14px;color:var(--text-tertiary);font-weight:400;line-height:1.2;}
.week-buttons{display:flex;flex-direction:column;gap:4px;}
.week-btn{width:28px;height:20px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-secondary);font-size:10px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;}
.week-btn.active{background:v-bind(color);color:var(--bg-primary);border-color:transparent;font-weight:600;}
.number-container{display:flex;align-items:baseline;line-height:1;margin-bottom:10px;}
.number{font-size:72px;font-weight:600;color:v-bind(color);}
.unit{font-size:24px;color:var(--text-secondary);margin-bottom:30px;font-weight:500;}
.precision-selector,.decimal-selector{display:flex;gap:10px;margin-bottom:15px;}
.decimal-selector{margin-bottom:20px;}
.precision-btn,.decimal-btn{width:50px;height:28px;border-radius:14px;border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-secondary);font-size:12px;cursor:pointer;transition:all 0.2s;}
.precision-btn.active,.decimal-btn.active{background:v-bind(color);color:var(--bg-primary);border-color:transparent;font-weight:600;}
.decimal-btn.disabled{opacity:0.4;cursor:not-allowed;background:var(--bg-tertiary);color:var(--text-tertiary);}
.decimal-btn.disabled.active{background:v-bind(color);color:var(--bg-primary);opacity:1;}
@media (max-width:768px){
  .countdown-card{height:280px;}
  .card-header{flex-direction:column;gap:10px;min-height:auto;}
  .week-start-selector{flex-direction:row;}
  .week-buttons{flex-direction:row;}
  .week-btn{width:32px;height:24px;}
  .number{font-size:56px;}
  .unit{font-size:20px;}
}
</style>
