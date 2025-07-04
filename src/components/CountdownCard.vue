<template>
  <div class="countdown-card card">
    <div class="card-header">
      <h3 class="title">{{ title }}</h3>
      <div v-if="showWeekStart" class="week-start-selector">
        <div class="week-label">周首日</div>
        <div class="week-buttons">
          <button
            :class="['week-btn', { active: weekStart === 1 }]"
            @click="handleWeekStartChange(1)"
          >
            一
          </button>
          <button
            :class="['week-btn', { active: weekStart === 0 }]"
            @click="handleWeekStartChange(0)"
          >
            日
          </button>
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
      >
        {{ p.label }}
      </button>
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
      >
        {{ d.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  title: String,
  value: Number,
  precision: String,
  type: String,
  color: String,
  showWeekStart: Boolean,
  weekStart: Number,
  decimalPrecision: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['precision-change', 'week-start-change', 'decimal-change'])

const precisions = [
  { value: 'day', label: '天' },
  { value: 'hour', label: '时' },
  { value: 'second', label: '秒' }
]

const decimalOptions = [
  { value: 0, label: '0' },
  { value: 1, label: '0.0' },
  { value: 2, label: '0.00' }
]

const unit = computed(() => {
  const units = {
    day: '天',
    hour: '小时',
    second: '秒'
  }
  return units[props.precision] || '天'
})

const displayNumber = computed(() => {
  const value = props.value || 0
  if (props.precision === 'second') {
    return Math.floor(value).toString()
  }
  return value.toFixed(props.decimalPrecision)
})

const isDecimalDisabled = (decimalValue) => {
  return props.precision === 'second' && decimalValue > 0
}

const handlePrecisionChange = (value) => {
  emit('precision-change', props.type, value)
  if (value === 'second') {
    emit('decimal-change', props.type, 0)
  }
}

const handleDecimalChange = (value) => {
  if (!isDecimalDisabled(value)) {
    emit('decimal-change', props.type, value)
  }
}

const handleWeekStartChange = (value) => {
  emit('week-start-change', value)
}

watch(() => props.precision, (newPrecision) => {
  if (newPrecision === 'second' && props.decimalPrecision > 0) {
    emit('decimal-change', props.type, 0)
  }
})
</script>

<style scoped>
.countdown-card {
  width: 100%;
  height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
  min-height: 48px;
}

.title {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
  margin: 0;
  line-height: 1.2;
}

.week-start-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.week-label {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: 400;
  line-height: 1.2;
}

.week-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.week-btn {
  width: 28px;
  height: 20px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.week-btn.active {
  background: v-bind(color);
  color: var(--bg-primary);
  border-color: transparent;
  font-weight: 600;
}

.number-container {
  display: flex;
  align-items: baseline;
  line-height: 1;
  margin-bottom: 10px;
}

.number {
  font-size: 72px;
  font-weight: 600;
  color: v-bind(color);
}

.unit {
  font-size: 24px;
  color: var(--text-secondary);
  margin-bottom: 30px;
  font-weight: 500;
}

.precision-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.decimal-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.precision-btn,
.decimal-btn {
  width: 50px;
  height: 28px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.precision-btn.active,
.decimal-btn.active {
  background: v-bind(color);
  color: var(--bg-primary);
  border-color: transparent;
  font-weight: 600;
}

.decimal-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.decimal-btn.disabled.active {
  background: v-bind(color);
  color: var(--bg-primary);
  opacity: 1;
}

@media (max-width: 768px) {
  .countdown-card {
    height: 280px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    min-height: auto;
  }
  
  .week-start-selector {
    flex-direction: row;
  }
  
  .week-buttons {
    flex-direction: row;
  }
  
  .week-btn {
    width: 32px;
    height: 24px;
  }
  
  .number {
    font-size: 56px;
  }
  
  .unit {
    font-size: 20px;
  }
}
</style>
