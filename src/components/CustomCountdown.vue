<template>
  <div class="custom-countdown card">
    <h3 class="title">自定义倒计时</h3>
    
    <div class="input-area">
      <div class="date-inputs">
        <input
          ref="yearInput"
          v-model="year"
          type="number"
          class="input date-input"
          placeholder="年"
          @keyup.enter="focusNextInput"
        >
        <span class="date-separator">-</span>
        <input
          ref="monthInput"
          v-model="month"
          type="number"
          class="input date-input"
          placeholder="月"
          min="1"
          max="12"
          @keyup.enter="focusNextInput"
          @blur="validateMonth"
        >
        <span class="date-separator">-</span>
        <input
          ref="dayInput"
          v-model="day"
          type="number"
          class="input date-input"
          placeholder="日"
          min="1"
          :max="maxDay"
          @keyup.enter="handleAddOrSave"
          @blur="validateDay"
        >
      </div>
      
      <input
        v-model="eventName"
        type="text"
        class="input event-name-input"
        placeholder="事件名称（可选）"
        @keyup.enter="handleAddOrSave"
      >
      
      <button
        class="button button-primary"
        @click="handleAdd"
        :disabled="!isValidInput"
      >
        添加
      </button>
    </div>

    <!-- 编辑模态框 -->
    <div v-if="editingEvent" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">编辑事件</h3>
        <div class="modal-form">
          <div class="date-inputs">
            <input
              ref="editYearInput"
              v-model="editForm.year"
              type="number"
              class="input date-input"
              placeholder="年"
              @keyup.enter="focusNextEditInput"
            >
            <span class="date-separator">-</span>
            <input
              ref="editMonthInput"
              v-model="editForm.month"
              type="number"
              class="input date-input"
              placeholder="月"
              min="1"
              max="12"
              @keyup.enter="focusNextEditInput"
              @blur="validateEditMonth"
            >
            <span class="date-separator">-</span>
            <input
              ref="editDayInput"
              v-model="editForm.day"
              type="number"
              class="input date-input"
              placeholder="日"
              min="1"
              :max="editMaxDay"
              @keyup.enter="focusNameInput"
              @blur="validateEditDay"
            >
          </div>
          <input
            ref="editNameInput"
            v-model="editForm.name"
            type="text"
            class="input"
            placeholder="事件名称"
            @keyup.enter="saveEdit"
          >
        </div>
        <div class="modal-actions">
          <button class="button button-secondary" @click="closeEditModal">取消</button>
          <button class="button button-primary" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
    
    <div class="events-list">
      <div
        v-for="event in events"
        :key="event.id"
        class="event-container"
      >
        <div class="event-item">
          <div class="event-date-column">{{ event.date }}</div>
          <div class="event-name-column">{{ event.name }}</div>
          <div class="event-countdown-column">
            <template v-if="event.isPast">
              已过 <strong>{{ event.displayValue }}</strong> {{ event.unitLabel }}
            </template>
            <template v-else>
              还有 <strong>{{ event.displayValue }}</strong> {{ event.unitLabel }}
            </template>
          </div>
          <div class="menu-container" @click.stop>
            <button 
              class="menu-btn"
              @click="toggleMenu(event.id)"
            >
              ⋮
            </button>
            <div 
              v-if="activeMenu === event.id"
              class="dropdown-menu"
            >
              <button @click="handleEdit(event.id)" class="menu-item">编辑</button>
              <button @click="handleCopy(event)" class="menu-item">复制</button>
              <button @click="handleDelete(event.id)" class="menu-item delete">删除</button>
            </div>
          </div>
        </div>
        
        <div class="event-controls">
          <div class="unit-selector">
            <button
              v-for="unit in unitOptions"
              :key="unit.value"
              :class="['unit-btn', { active: event.unit === unit.value }]"
              @click="handleUnitChange(event.id, unit.value)"
            >
              {{ unit.label }}
            </button>
          </div>
          
          <div class="precision-selector">
            <button
              v-for="p in precisionOptions"
              :key="p.value"
              :class="['precision-btn', { 
                active: event.decimalPrecision === p.value,
                disabled: isDecimalDisabled(event.unit, p.value)
              }]"
              @click="handlePrecisionChange(event.id, p.value)"
              :disabled="isDecimalDisabled(event.unit, p.value)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
      </div>
      
      <p v-if="events.length === 0" class="empty-tip">
        暂无自定义倒计时，请添加
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { getCustomEvents, saveCustomEvents } from '../utils/storage'

const eventName = ref('')
const year = ref('')
const month = ref('')
const day = ref('')
const events = ref([])
const customCounter = ref(1)
const activeMenu = ref(null)
const editingEvent = ref(null)
const editForm = ref({
  name: '',
  year: '',
  month: '',
  day: ''
})

const yearInput = ref(null)
const monthInput = ref(null)
const dayInput = ref(null)

// 编辑模态框的输入框引用
const editYearInput = ref(null)
const editMonthInput = ref(null)
const editDayInput = ref(null)
const editNameInput = ref(null)

const unitOptions = [
  { value: 'year', label: '年' },
  { value: 'month', label: '月' },
  { value: 'week', label: '周' },
  { value: 'day', label: '天' },
  { value: 'hour', label: '时' },
  { value: 'second', label: '秒' }
]

const precisionOptions = [
  { value: 0, label: '0' },
  { value: 1, label: '0.0' },
  { value: 2, label: '0.00' }
]

const unitLabels = {
  day: '天',
  hour: '小时',
  minute: '分钟',
  second: '秒',
  week: '周',
  month: '月',
  year: '年'
}

const maxDay = computed(() => {
  if (!year.value || !month.value) return 31
  return dayjs(`${year.value}-${month.value}-01`).daysInMonth()
})

const editMaxDay = computed(() => {
  if (!editForm.value.year || !editForm.value.month) return 31
  return dayjs(`${editForm.value.year}-${editForm.value.month}-01`).daysInMonth()
})

const isValidInput = computed(() => {
  return year.value && 
         month.value && 
         day.value &&
         month.value >= 1 && 
         month.value <= 12 &&
         day.value >= 1 && 
         day.value <= maxDay.value
})

const isDecimalDisabled = (unit, decimalValue) => {
  return unit === 'second' && decimalValue > 0
}

const validateMonth = () => {
  if (month.value > 12) {
    month.value = 12
  } else if (month.value < 1) {
    month.value = 1
  }
}

const validateDay = () => {
  const max = maxDay.value
  if (day.value > max) {
    day.value = max
  } else if (day.value < 1) {
    day.value = 1
  }
}

const validateEditMonth = () => {
  if (editForm.value.month > 12) {
    editForm.value.month = 12
  } else if (editForm.value.month < 1) {
    editForm.value.month = 1
  }
}

const validateEditDay = () => {
  const max = editMaxDay.value
  if (editForm.value.day > max) {
    editForm.value.day = max
  } else if (editForm.value.day < 1) {
    editForm.value.day = 1
  }
}

const calculateCountdown = (targetDate, unit, decimalPrecision = 0) => {
  const now = dayjs()
  const target = dayjs(targetDate).endOf('day')
  const isPast = target.isBefore(now)
  
  let diff
  switch(unit) {
    case 'second':
      diff = Math.abs(target.diff(now, 'second'))
      break
    case 'hour':
      diff = Math.abs(target.diff(now, 'hour', true))
      break
    case 'day':
      diff = Math.abs(target.diff(now, 'day', true))
      break
    case 'week':
      diff = Math.abs(target.diff(now, 'week', true))
      break
    case 'month':
      diff = Math.abs(target.diff(now, 'month', true))
      break
    case 'year':
      diff = Math.abs(target.diff(now, 'year', true))
      break
    default:
      diff = Math.abs(target.diff(now, 'day', true))
  }
  
  return {
    value: unit === 'second' ? Math.floor(diff) : diff,
    displayValue: unit === 'second' ? Math.floor(diff) : diff.toFixed(decimalPrecision),
    isPast
  }
}

const loadEvents = () => {
  const savedEvents = getCustomEvents()
  events.value = savedEvents.map(event => {
    const result = calculateCountdown(event.date, event.unit || 'day', event.decimalPrecision || 0)
    return {
      ...event,
      unit: event.unit || 'day',
      decimalPrecision: event.decimalPrecision || 0,
      countdown: result.value,
      displayValue: result.displayValue,
      isPast: result.isPast,
      unitLabel: unitLabels[event.unit || 'day']
    }
  })
  
  // 更新计数器
  const maxCounter = Math.max(...savedEvents.map(e => {
    const match = e.name.match(/^自定义(\d+)$/)
    return match ? parseInt(match[1]) : 0
  }), 0)
  customCounter.value = maxCounter + 1
}

const focusNextInput = async (e) => {
  if (e.target === yearInput.value) {
    await nextTick()
    monthInput.value?.focus()
  } else if (e.target === monthInput.value) {
    await nextTick()
    dayInput.value?.focus()
  }
}

const focusNextEditInput = async (e) => {
  if (e.target === editYearInput.value) {
    await nextTick()
    editMonthInput.value?.focus()
  } else if (e.target === editMonthInput.value) {
    await nextTick()
    editDayInput.value?.focus()
  }
}

const focusNameInput = async () => {
  await nextTick()
  editNameInput.value?.focus()
}

const handleAddOrSave = () => {
  if (isValidInput.value) {
    handleAdd()
  }
}

const handleAdd = () => {
  if (!isValidInput.value) return
  
  const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(day.value).padStart(2, '0')}`
  const name = eventName.value || `自定义${customCounter.value}`
  const result = calculateCountdown(dateStr, 'day', 0)
  
  const newEvent = {
    id: Date.now(),
    name,
    date: dateStr,
    unit: 'day',
    decimalPrecision: 0,
    countdown: result.value,
    displayValue: result.displayValue,
    isPast: result.isPast,
    unitLabel: unitLabels.day
  }
  
  events.value.push(newEvent)
  
  // 保存到本地存储
  const eventsToSave = events.value.map(({ countdown, displayValue, isPast, unitLabel, ...event }) => event)
  saveCustomEvents(eventsToSave)
  
  // 清空输入
  eventName.value = ''
  year.value = ''
  month.value = ''
  day.value = ''
  
  if (!eventName.value) {
    customCounter.value++
  }
}

const toggleMenu = (id) => {
  activeMenu.value = activeMenu.value === id ? null : id
}

const handleUnitChange = (id, unit) => {
  const eventIndex = events.value.findIndex(e => e.id === id)
  if (eventIndex !== -1) {
    const event = events.value[eventIndex]
    
    // 如果切换到秒，自动设置精度为0
    if (unit === 'second') {
      event.decimalPrecision = 0
    }
    
    // 更新事件属性
    const updatedEvent = {
      ...event,
      unit,
      unitLabel: unitLabels[unit]
    }
    
    // 重新计算倒计时
    const result = calculateCountdown(updatedEvent.date, unit, updatedEvent.decimalPrecision)
    updatedEvent.countdown = result.value
    updatedEvent.displayValue = result.displayValue
    updatedEvent.isPast = result.isPast
    
    // 更新数组中的事件
    events.value[eventIndex] = updatedEvent
    
    // 保存到本地存储
    const eventsToSave = events.value.map(({ countdown, displayValue, isPast, unitLabel, ...event }) => event)
    saveCustomEvents(eventsToSave)
  }
}

const handlePrecisionChange = (id, precision) => {
  const eventIndex = events.value.findIndex(e => e.id === id)
  if (eventIndex !== -1) {
    const event = events.value[eventIndex]
    
    if (!isDecimalDisabled(event.unit, precision)) {
      // 更新精度
      const updatedEvent = {
        ...event,
        decimalPrecision: precision
      }
      
      // 重新计算显示值
      const result = calculateCountdown(updatedEvent.date, updatedEvent.unit, precision)
      updatedEvent.displayValue = result.displayValue
      
      // 更新数组中的事件
      events.value[eventIndex] = updatedEvent
      
      // 保存到本地存储
      const eventsToSave = events.value.map(({ countdown, displayValue, isPast, unitLabel, ...event }) => event)
      saveCustomEvents(eventsToSave)
    }
  }
}

const handleEdit = (id) => {
  activeMenu.value = null
  const event = events.value.find(e => e.id === id)
  if (event) {
    const [year, month, day] = event.date.split('-')
    editForm.value = {
      name: event.name,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day)
    }
    editingEvent.value = { ...event } // 创建副本避免直接修改
  }
}

const closeEditModal = () => {
  editingEvent.value = null
  editForm.value = {
    name: '',
    year: '',
    month: '',
    day: ''
  }
}

const saveEdit = () => {
  if (!editingEvent.value) return
  
  // 验证输入
  if (!editForm.value.name || !editForm.value.year || !editForm.value.month || !editForm.value.day) {
    alert('请填写完整信息')
    return
  }
  
  const dateStr = `${editForm.value.year}-${String(editForm.value.month).padStart(2, '0')}-${String(editForm.value.day).padStart(2, '0')}`
  
  // 找到要编辑的事件在数组中的位置
  const eventIndex = events.value.findIndex(e => e.id === editingEvent.value.id)
  if (eventIndex !== -1) {
    // 更新事件数据
    const updatedEvent = {
      ...events.value[eventIndex],
      name: editForm.value.name,
      date: dateStr
    }
    
    // 重新计算倒计时
    const result = calculateCountdown(dateStr, updatedEvent.unit, updatedEvent.decimalPrecision)
    updatedEvent.countdown = result.value
    updatedEvent.displayValue = result.displayValue
    updatedEvent.isPast = result.isPast
    
    // 替换数组中的事件
    events.value[eventIndex] = updatedEvent
    
    // 保存到本地存储
    const eventsToSave = events.value.map(({ countdown, displayValue, isPast, unitLabel, ...event }) => event)
    saveCustomEvents(eventsToSave)
  }
  
  closeEditModal()
}

const handleCopy = (event) => {
  activeMenu.value = null
  const result = calculateCountdown(event.date, event.unit, event.decimalPrecision)
  const newEvent = {
    id: Date.now(),
    name: `${event.name} - 副本`,
    date: event.date,
    unit: event.unit,
    decimalPrecision: event.decimalPrecision,
    countdown: result.value,
    displayValue: result.displayValue,
    isPast: result.isPast,
    unitLabel: event.unitLabel
  }
  
  events.value.push(newEvent)
  
  // 保存到本地存储
  const eventsToSave = events.value.map(({ countdown, displayValue, isPast, unitLabel, ...event }) => event)
  saveCustomEvents(eventsToSave)
}

const handleDelete = (id) => {
  if (confirm('确定要删除这个事件吗？')) {
    activeMenu.value = null
    events.value = events.value.filter(e => e.id !== id)
    const eventsToSave = events.value.map(({ countdown, displayValue, isPast, unitLabel, ...event }) => event)
    saveCustomEvents(eventsToSave)
  }
}

// 点击外部关闭菜单
const handleGlobalClick = (e) => {
  const menuContainer = e.target.closest('.menu-container')
  if (!menuContainer) {
    activeMenu.value = null
  }
}

// 定期更新倒计时
const updateCountdowns = () => {
  events.value = events.value.map(event => {
    const result = calculateCountdown(event.date, event.unit, event.decimalPrecision)
    return {
      ...event,
      countdown: result.value,
      displayValue: result.displayValue,
      isPast: result.isPast
    }
  })
}

let updateTimer

onMounted(() => {
  loadEvents()
  document.addEventListener('click', handleGlobalClick)
  // 每秒更新一次，确保实时动态更新
  updateTimer = setInterval(updateCountdowns, 1000)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style scoped>
.custom-countdown {
  margin-bottom: 30px; /* 统一间距 */
}

.title {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
  margin-bottom: 20px;
}

.input-area {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
}

.input {
  height: 40px;
  padding: 0 15px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: var(--green-primary);
}

.event-name-input {
  flex: 1;
  min-width: 160px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 5px;
}

.date-input {
  width: 70px;
  padding: 0 10px;
  text-align: center;
}

.date-separator {
  color: var(--text-secondary);
  font-size: 16px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 90vw;
}

.modal-title {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.button-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.button-secondary:hover {
  background: var(--border-color);
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-container {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 15px;
}

.event-item {
  display: grid;
  grid-template-columns: 120px 1fr 200px 40px;
  gap: 20px;
  align-items: center;
  margin-bottom: 15px;
}

.event-date-column {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  text-align: left;
}

.event-name-column {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.event-countdown-column {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  text-align: right;
}

.event-countdown-column strong {
  color: var(--green-primary);
  font-weight: 600;
}

.menu-container {
  position: relative;
  display: flex;
  justify-content: center;
}

.menu-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 80px;
  padding: 4px 0;
}

.menu-item {
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: inherit;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}

.menu-item.delete {
  color: #f44336;
}

.menu-item.delete:hover {
  background: rgba(244, 67, 54, 0.1);
}

.event-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unit-selector {
  display: flex;
  gap: 8px;
}

.precision-selector {
  display: flex;
  gap: 8px;
}

.unit-btn,
.precision-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.unit-btn.active,
.precision-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
  border-color: transparent;
  font-weight: 600;
}

.precision-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
}

.precision-btn.disabled.active {
  background: var(--green-primary);
  color: var(--bg-primary);
  opacity: 1;
}

.empty-tip {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 20px;
}

@media (max-width: 768px) {
  .input-area {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .date-inputs {
    justify-content: center;
  }
  
  .modal-content {
    min-width: 300px;
    margin: 20px;
  }
  
  .event-item {
    grid-template-columns: 1fr;
    gap: 10px;
    text-align: center;
  }
  
  .event-date-column,
  .event-name-column,
  .event-countdown-column {
    text-align: center;
  }
  
  .menu-container {
    justify-content: center;
  }
  
  .event-controls {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .unit-selector,
  .precision-selector {
    justify-content: center;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .event-item {
    grid-template-columns: 100px 1fr 180px 40px;
    gap: 15px;
  }
}
</style>
