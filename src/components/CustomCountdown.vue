<template>
  <div class="custom-countdown card">
    <h3 class="title">自定义倒计时</h3>
    <div class="input-area">
      <!-- 年月日一组 -->
      <div class="input-group">
        <input
          ref="yearInput"
          v-model="year"
          type="number"
          class="input"
          placeholder="年"
          @input="onlyInt($event, 'year')"
          @keyup.enter="focusNext('year', 'month')"
          @keydown.tab.prevent="focusNext('year', 'month')"
          @blur="validateYear"
          @keydown.up.prevent="spinField('year','up')"
          @keydown.down.prevent="spinField('year','down')"
          @wheel.prevent="onWheel($event, 'year')"
        >
        <span class="date-separator">-</span>
        <input
          ref="monthInput"
          v-model="month"
          type="number"
          class="input"
          placeholder="月"
          min="1"
          max="12"
          @input="onlyInt($event, 'month')"
          @keyup.enter="focusNext('month', 'day')"
          @keydown.tab.prevent="focusNext('month', 'day')"
          @blur="validateMonth"
          @keydown.up.prevent="spinField('month','up')"
          @keydown.down.prevent="spinField('month','down')"
          @wheel.prevent="onWheel($event, 'month')"
        >
        <span class="date-separator">-</span>
        <input
          ref="dayInput"
          v-model="day"
          type="number"
          class="input"
          placeholder="日"
          :min="1"
          :max="maxDay"
          @input="onlyInt($event, 'day')"
          @keyup.enter="focusNext('day', 'hour')"
          @keydown.tab.prevent="focusNext('day', 'hour')"
          @blur="validateDay"
          @keydown.up.prevent="spinField('day','up')"
          @keydown.down.prevent="spinField('day','down')"
          @wheel.prevent="onWheel($event, 'day')"
        >
      </div>
      <!-- 时分秒一组 -->
      <div class="input-group">
        <input
          ref="hourInput"
          v-model="hour"
          type="number"
          class="input"
          placeholder="时"
          min="0"
          max="23"
          @input="onlyInt($event, 'hour')"
          @keyup.enter="focusNext('hour', 'minute')"
          @keydown.tab.prevent="focusNext('hour', 'minute')"
          @blur="validateHour"
          @keydown.up.prevent="spinField('hour','up')"
          @keydown.down.prevent="spinField('hour','down')"
          @wheel.prevent="onWheel($event, 'hour')"
        >
        <span class="date-separator">:</span>
        <input
          ref="minuteInput"
          v-model="minute"
          type="number"
          class="input"
          placeholder="分"
          min="0"
          max="59"
          @input="onlyInt($event, 'minute')"
          @keyup.enter="focusNext('minute', 'second')"
          @keydown.tab.prevent="focusNext('minute', 'second')"
          @blur="validateMinute"
          @keydown.up.prevent="spinField('minute','up')"
          @keydown.down.prevent="spinField('minute','down')"
          @wheel.prevent="onWheel($event, 'minute')"
        >
        <span class="date-separator">:</span>
        <input
          ref="secondInput"
          v-model="second"
          type="number"
          class="input"
          placeholder="秒"
          min="0"
          max="59"
          @input="onlyInt($event, 'second')"
          @keyup.enter="focusNext('second', 'eventName')"
          @keydown.tab.prevent="focusNext('second', 'eventName')"
          @blur="validateSecond"
          @keydown.up.prevent="spinField('second','up')"
          @keydown.down.prevent="spinField('second','down')"
          @wheel.prevent="onWheel($event, 'second')"
        />
      </div>
      <!-- 事件名一组 -->
      <input
        ref="eventNameInput"
        v-model="eventName"
        type="text"
        class="input event-name-input"
        placeholder="事件名称（可选）"
        @keyup.enter="handleAddOrSave"
        @keydown.tab.prevent="focusNext('eventName', 'year')"
      >
      <!-- 添加按钮一组 -->
      <button class="button button-primary" @click="handleAdd" :disabled="!isValidInput">添加</button>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editingEvent" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">编辑事件</h3>
        <div class="modal-form">
          <!-- 年月日一组 -->
          <div class="input-group">
            <input
              ref="editYearInput"
              v-model="editForm.year"
              type="number"
              class="input"
              placeholder="年"
              @input="onlyInt($event, 'editYear')"
              @keyup.enter="focusNextEdit('year','month')"
              @keydown.tab.prevent="focusNextEdit('year','month')"
              @blur="validateEditYear"
              @keydown.up.prevent="spinEditField('year','up')"
              @keydown.down.prevent="spinEditField('year','down')"
              @wheel.prevent="onWheel($event, 'year')"
            >
            <span class="date-separator">-</span>
            <input
              ref="editMonthInput"
              v-model="editForm.month"
              type="number"
              class="input"
              placeholder="月"
              min="1"
              max="12"
              @input="onlyInt($event, 'editMonth')"
              @keyup.enter="focusNextEdit('month','day')"
              @keydown.tab.prevent="focusNextEdit('month','day')"
              @blur="validateEditMonth"
              @keydown.up.prevent="spinEditField('month','up')"
              @keydown.down.prevent="spinEditField('month','down')"
              @wheel.prevent="onWheel($event, 'month')"
            >
            <span class="date-separator">-</span>
            <input
              ref="editDayInput"
              v-model="editForm.day"
              type="number"
              class="input"
              placeholder="日"
              :min="1"
              :max="editMaxDay"
              @input="onlyInt($event, 'editDay')"
              @keyup.enter="focusNextEdit('day','hour')"
              @keydown.tab.prevent="focusNextEdit('day','hour')"
              @blur="validateEditDay"
              @keydown.up.prevent="spinEditField('day','up')"
              @keydown.down.prevent="spinEditField('day','down')"
              @wheel.prevent="onWheel($event, 'day')"
            >
          </div>
          <!-- 时分秒一组 -->
          <div class="input-group">
            <input
              ref="editHourInput"
              v-model="editForm.hour"
              type="number"
              class="input"
              placeholder="时"
              min="0"
              max="23"
              @input="onlyInt($event, 'editHour')"
              @keyup.enter="focusNextEdit('hour','minute')"
              @keydown.tab.prevent="focusNextEdit('hour','minute')"
              @blur="validateEditHour"
              @keydown.up.prevent="spinEditField('hour','up')"
              @keydown.down.prevent="spinEditField('hour','down')"
              @wheel.prevent="onWheel($event, 'hour')"
            >
            <span class="date-separator">:</span>
            <input
              ref="editMinuteInput"
              v-model="editForm.minute"
              type="number"
              class="input"
              placeholder="分"
              min="0"
              max="59"
              @input="onlyInt($event, 'editMinute')"
              @keyup.enter="focusNextEdit('minute','second')"
              @keydown.tab.prevent="focusNextEdit('minute','second')"
              @blur="validateEditMinute"
              @keydown.up.prevent="spinEditField('minute','up')"
              @keydown.down.prevent="spinEditField('minute','down')"
              @wheel.prevent="onWheel($event, 'minute')"
            >
            <span class="date-separator">: </span>
            <input
              ref="editSecondInput"
              v-model="editForm.second"
              type="number"
              class="input"
              placeholder="秒"
              min="0"
              max="59"
              @input="onlyInt($event, 'editSecond')"
              @keyup.enter="focusNextEdit('second','editName')"
              @keydown.tab.prevent="focusNextEdit('second','editName')"
              @blur="validateEditSecond"
              @keydown.up.prevent="spinEditField('second','up')"
              @keydown.down.prevent="spinEditField('second','down')"
              @wheel.prevent="onWheel($event, 'second')"
            >
          </div>
          <input
            ref="editNameInput"
            v-model="editForm.name"
            type="text"
            class="input edit-event-name-input"
            placeholder="事件名称"
            @keyup.enter="saveEdit"
            @keydown.tab.prevent="focusNextEdit('editName','year')"  
          >
        </div>
        <div class="modal-actions">
          <button class="button button-secondary" @click="closeEditModal">取消</button>
          <button class="button button-primary" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
    <!-- 自定义倒计时条目展示区 -->
    <div class="events-list" ref="eventsListRef">
      <div
        v-for="event in events"
        :key="event.id"
        class="event-container"
      >
        <div class="event-item">
          <!-- 拖动触发区：仅空白区可拖动，位于卡片最左侧留高度，实际是一个透明div（可直接hover） -->
          <div class="drag-blank-area"
              title="拖动排序"
              style="position:absolute;left:0;top:0;bottom:0;right:0;z-index:5;cursor:move;"
              @mousedown.stop
              @touchstart.stop
              >
            <!-- 仅作触发，不展示内容，可以设 pointer-events:none 给交互控件 -->
          </div>
          <!-- 日期时间描述 -->
          <div class="event-date-column">
            {{ event.dateTimeDesc }}
          </div>
          <!-- 事件名称 -->
          <div class="event-name-column">{{ event.name }}</div>
          <!-- 倒计时/已过展示（包含精度、组合模式高亮） -->
          <div class="event-countdown-column">
            <span v-html="event.finalDisplay"></span>
          </div>
          <!-- 右上角操作菜单，绝对浮动 -->
          <div class="menu-container absolute-menu" @click.stop>
            <button class="menu-btn" @click="toggleMenu(event.id)">⋮</button>
            <div v-if="activeMenu === event.id" class="dropdown-menu">
              <button @click="handleEdit(event.id)" class="menu-item">编辑</button>
              <button @click="handleCopy(event)" class="menu-item">复制</button>
              <button @click="handleDelete(event.id)" class="menu-item delete">删除</button>
            </div>
          </div>
        </div>
        <!-- 时间单位、精度按钮行，主单位左/精度右，左右对齐 -->
        <div class="button-row horizontal-between">
          <div class="joined-btn-group unit-btn-group">
            <button
              v-for="unit in unitOptions"
              :key="unit.value"
              :class="['precision-btn', 'joined-btn', { active: event.unit === unit.value }]"
              @click="handleUnitChange(event.id, unit.value)">
              {{ unit.label }}
            </button>
          </div>
          <div class="joined-btn-group precision-btn-group">
            <button
              v-for="p in precisionOptions"
              :key="p.value"
              :class="['decimal-btn', 'joined-btn', {
                active: event.decimalPrecision === p.value,
                disabled: isDecimalDisabled(event.unit, p.value)
              }]"
              @click="handlePrecisionChange(event.id, p.value)"
              :disabled="isDecimalDisabled(event.unit, p.value)">
              {{ p.label }}
            </button>
          </div>
        </div>
      </div>
      <p v-if="events.length === 0" class="empty-tip">暂无自定义倒计时，请添加</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import dayjs from 'dayjs'
import Sortable from 'sortablejs'
import { getCustomEvents, saveCustomEvents } from '../utils/storage'

/* ========== 输入字段及编辑相关ref ========== */
const eventName = ref('')
const year   = ref('')
const month  = ref('')
const day    = ref('')
const hour   = ref('')
const minute = ref('')
const second = ref('')

const events = ref([])
const customCounter = ref(1)
const activeMenu = ref(null)
const editingEvent = ref(null)
const editForm = ref({ name: '', year: '', month: '', day: '', hour: '', minute: '', second: '' })

const yearInput    = ref(null)
const monthInput   = ref(null)
const dayInput     = ref(null)
const hourInput    = ref(null)
const minuteInput  = ref(null)
const secondInput  = ref(null)
const eventNameInput = ref(null)

const eventsListRef = ref(null) // 【新增】对事件列表DOM的引用
let sortableInstance = null     // 【新增】SortableJS 实例

// 最小/最大值配置，用于循环
const inputLimits = {
  year:   { min: 1970, max: 9999 },         // 范围可根据业务决定
  month:  { min: 1,    max: 12 },
  day:    { min: 1,    get max() { return maxDay.value } }, // day依赖计算
  hour:   { min: 0,    max: 23 },
  minute: { min: 0,    max: 59 },
  second: { min: 0,    max: 59 },
  // 编辑区同理，如果editMaxDay.value
}

const editYearInput    = ref(null)
const editMonthInput   = ref(null)
const editDayInput     = ref(null)
const editHourInput    = ref(null)
const editMinuteInput  = ref(null)
const editSecondInput  = ref(null)
const editNameInput    = ref(null)

/* 编辑区专属上下限表 */
const editInputLimits = {
  year:   { min: 1970, max: 9999 },
  month:  { min: 1,    max: 12 },
  day:    { min: 1,    get max() { return editMaxDay.value } },
  hour:   { min: 0,    max: 23 },
  minute: { min: 0,    max: 59 },
  second: { min: 0,    max: 59 }
}

/* 主单位与精度选项，精度支持组合按钮 */
const unitOptions = [
  { value: 'year', label: '年' }, { value: 'month', label: '月' }, { value: 'week', label: '周' },
  { value: 'day', label: '天' }, { value: 'hour', label: '时' }, { value: 'minute', label: '分' }, { value: 'second', label: '秒' }
]
const precisionOptions = [
  { value: 'combo', label: '0:0' },
  { value: 0, label: '0' },
  { value: 1, label: '0.0' },
  { value: 2, label: '0.00' }
]
const unitLabels = {
  day: '天', hour: '小时', minute: '分钟', second: '秒', week: '周', month: '个月', year: '年'
}

/* 自动计算当月最大天数（随年月动态变化） */
const maxDay = computed(() => {
  const y = Number(year.value) || new Date().getFullYear()
  const m = Number(month.value) || 1
  return dayjs(`${y}-${m}-01`).daysInMonth()
})
const editMaxDay = computed(() => {
  const y = Number(editForm.value.year) || new Date().getFullYear()
  const m = Number(editForm.value.month) || 1
  return dayjs(`${y}-${m}-01`).daysInMonth()
})

/*
  输入框允许的只有正整数：粘贴/手输什么小数负号都会自动只留数字；
  年可空，月日/时分秒必补1/0
*/
function onlyInt(e, key) {
  let val = String(e.target.value)
  // year字段允许负号在首位
  if (key === 'year') {
    // 允许首字符为-，其余只保留数字
    val = val.replace(/[^\d-]/g, '')
    if (val.startsWith('-')) {
      val = '-' + val.slice(1).replace(/-/g, '')
    } else {
      val = val.replace(/-/g, '')
    }
    year.value = val
  } else {
    // 其他字段去除非数字字符
    val = val.replace(/\D/g, '')
    if (key === 'month')   month.value  = val.replace(/^0+/, '') || '1'
    if (key === 'day')     day.value    = val.replace(/^0+/, '') || '1'
    if (key === 'hour')    hour.value   = val.replace(/^0+/, '') || '0'
    if (key === 'minute')  minute.value = val.replace(/^0+/, '') || '0'
    if (key === 'second')  second.value = val.replace(/^0+/, '') || '0'
  }
}


/* Tab/回车：每位输入完校验，跳到下一个输入框（主录入区） */
const focusNext = (currKey, nextKey) => {
  switch (currKey) {
    case 'year':   validateYear(); break
    case 'month':  validateMonth(); break
    case 'day':    validateDay(); break
    case 'hour':   validateHour(); break
    case 'minute': validateMinute(); break
    case 'second': validateSecond(); break
    case 'eventName': break
  }
  nextTick(() => {
    switch (nextKey) {
      case 'month':     monthInput.value && monthInput.value.focus(); break
      case 'day':       dayInput.value && dayInput.value.focus(); break
      case 'hour':      hourInput.value && hourInput.value.focus(); break
      case 'minute':    minuteInput.value && minuteInput.value.focus(); break
      case 'second':    secondInput.value && secondInput.value.focus(); break
      case 'eventName': eventNameInput.value && eventNameInput.value.focus(); break
      case 'year':      yearInput.value && yearInput.value.focus(); break
      default: break
    }
  })
}
/* Tab/回车：编辑弹窗内每位跳转，与主输入区一致 */
const focusNextEdit = (currKey, nextKey) => {
  switch (currKey) {
    case 'year':   validateEditYear(); break
    case 'month':  validateEditMonth(); break
    case 'day':    validateEditDay(); break
    case 'hour':   validateEditHour(); break
    case 'minute': validateEditMinute(); break
    case 'second': validateEditSecond(); break
    case 'editName': break
  }
  nextTick(() => {
    switch (nextKey) {
      case 'month':    editMonthInput.value && editMonthInput.value.focus(); break
      case 'day':      editDayInput.value && editDayInput.value.focus(); break
      case 'hour':     editHourInput.value && editHourInput.value.focus(); break
      case 'minute':   editMinuteInput.value && editMinuteInput.value.focus(); break
      case 'second':   editSecondInput.value && editSecondInput.value.focus(); break
      case 'editName': editNameInput.value && editNameInput.value.focus(); break
      case 'year':     editYearInput.value && editYearInput.value.focus(); break // 可循环
      default: break
    }
  })
}

/* 校验逻辑，每项未填或超界都自动补为有效合法值 */
function validateYear() {
  if (!year.value || isNaN(Number(year.value))) {
    // 为空补当前年
    year.value = String(new Date().getFullYear())
  }
  // 负整数、0、正整数全部允许，无需限定
}
function validateMonth()  { if (!month.value || Number(month.value) < 1) month.value = '1'
                            else if (Number(month.value) > 12) month.value = '12'}
function validateDay()    { const max = maxDay.value
                            if (!day.value || Number(day.value) < 1) day.value = '1'
                            else if (Number(day.value) > max) day.value = String(max) }
function validateHour()   { if (!hour.value || Number(hour.value)<0) hour.value = '0'
                            else if (Number(hour.value) > 23) hour.value = '23' }
function validateMinute() { if (!minute.value|| Number(minute.value)<0) minute.value = '0'
                            else if (Number(minute.value) > 59) minute.value = '59' }
function validateSecond() { if (!second.value|| Number(second.value)<0) second.value = '0'
                            else if (Number(second.value) > 59) second.value = '59' }

function validateEditYear()   { if (!editForm.value.year || isNaN(Number(editForm.value.year)) || Number(editForm.value.year)<1970) editForm.value.year = String(new Date().getFullYear()) }
function validateEditMonth()  { if (!editForm.value.month || Number(editForm.value.month) < 1) editForm.value.month = '1'; else if (Number(editForm.value.month) > 12) editForm.value.month = '12'}
function validateEditDay()    { const max = editMaxDay.value; if (!editForm.value.day || Number(editForm.value.day) < 1) editForm.value.day = '1'; else if (Number(editForm.value.day) > max) editForm.value.day = String(max) }
function validateEditHour()   { if (!editForm.value.hour || Number(editForm.value.hour)<0) editForm.value.hour = '0'; else if (Number(editForm.value.hour) > 23) editForm.value.hour = '23' }
function validateEditMinute() { if (!editForm.value.minute|| Number(editForm.value.minute)<0) editForm.value.minute = '0'; else if (Number(editForm.value.minute) > 59) editForm.value.minute = '59' }
function validateEditSecond() { if (!editForm.value.second|| Number(editForm.value.second)<0) editForm.value.second = '0'; else if (Number(editForm.value.second) > 59) editForm.value.second = '59' }

const isValidInput = computed(() =>
  year.value && month.value && day.value &&
  month.value >= 1 && month.value <= 12 &&
  day.value >= 1 && day.value <= maxDay.value &&
  hour.value !== '' && minute.value !== '' && second.value !== '' &&
  hour.value >= 0 && hour.value <= 23 &&
  minute.value >= 0 && minute.value <= 59 &&
  second.value >= 0 && second.value <= 59
)

const isDecimalDisabled = (unit, decimalValue) => {
  if (unit === 'second' && decimalValue !== 'combo' && decimalValue > 0) return true
  if (unit === 'minute' && decimalValue === 2) return true
  return false
}

// 上下键切换数值，循环
function spinField(key, direction) {
  let val = Number(eval(key + ".value")) || 0
  const lim = inputLimits[key]
  let max = (typeof lim.max === 'function') ? lim.max() : (lim.max && lim.max.value ? lim.max.value : lim.max)
  // 月日上限可能为computed
  if (typeof max === 'function') max = max()
  const min = lim.min
  if (direction === 'up') {
    val = val >= max ? min : val + 1
  } else if (direction === 'down') {
    val = val <= min ? max : val - 1
  }
  eval(key + ".value = String(val)")
}

// 鼠标滚轮滚动时调整数值，阻止页面滚动
function onWheel(e, key) {
  e.preventDefault()
  if (e.deltaY < 0) {
    spinField(key, 'up')
  } else if (e.deltaY > 0) {
    spinField(key, 'down')
  }
}

// 编辑区上下键切换数值，循环
function spinEditField(key, direction) {
  let val = Number(editForm.value[key]) || 0
  const lim = editInputLimits[key]
  let max = (typeof lim.max === 'function') ? lim.max() : (lim.max && lim.max.value ? lim.max.value : lim.max)
  if (typeof max === 'function') max = max()
  const min = lim.min
  if (direction === 'up') {
    val = val >= max ? min : val + 1
  } else if (direction === 'down') {
    val = val <= min ? max : val - 1
  }
  editForm.value[key] = String(val)
}

// 编辑区鼠标滚轮滚动时调整数值，阻止页面滚动
function onEditWheel(e, key) {
  e.preventDefault()
  if (e.deltaY < 0) {
    spinEditField(key, 'up')
  } else if (e.deltaY > 0) {
    spinEditField(key, 'down')
  }
}


// 自动精度修正（配置了全部事件变化时实时校验）
watch(
  () => events.value.map(e => [e.unit, e.decimalPrecision]),
  () => {
    events.value.forEach(event => {
      if (event.unit === 'second' && event.decimalPrecision !== 'combo' && event.decimalPrecision > 0) event.decimalPrecision = 0
      if (event.unit === 'minute' && event.decimalPrecision === 2) event.decimalPrecision = 1
    })
  },
  { deep: true }
)

/* 组合精度拼接标准，算法已修正为逐级递减、零/整规则同前 */
function getComboDisplay(dateInput, now) {
  let [datePart, timePart='00:00:00'] = dateInput.split('T')
  let parts = timePart.split(':')
  let h = parts[0] || '0', m = parts[1] || '0', s = parts[2] || '0'
  let start = dayjs(now)
  let end = dayjs(datePart).set('hour', h).set('minute', m).set('second', s)
  let isPast = end.isBefore(start)
  if (isPast) [start, end] = [end, start]
  let years   = end.diff(start, 'year');   start = start.add(years, 'year')
  let months  = end.diff(start, 'month');  start = start.add(months, 'month')
  let days    = end.diff(start, 'day');    start = start.add(days, 'day')
  let hours   = end.diff(start, 'hour');   start = start.add(hours, 'hour')
  let minutes = end.diff(start, 'minute'); start = start.add(minutes, 'minute')
  let seconds = end.diff(start, 'second')
  let arr = [
    { num: years, unit: '年' },
    { num: months, unit: '个月' },
    { num: days, unit: '天' },
    { num: hours, unit: '小时' },
    { num: minutes, unit: '分' },
    { num: seconds, unit: '秒' }
  ]
  let firstNonZero = 0
  while (firstNonZero < arr.length-1 && arr[firstNonZero].num === 0) firstNonZero++
  let trimmed = arr.slice(firstNonZero)
  let lastNonZero = trimmed.length-1
  while (lastNonZero >= 0 && trimmed[lastNonZero].num === 0) lastNonZero--
  let core = trimmed.slice(0, lastNonZero+1)
  let endZeroCount = trimmed.length-1-lastNonZero
  let outArr = []
  for (let i=0; i<core.length; ) {
    if (core[i].num > 0) {
      outArr.push(` <span class="combo-num">${core[i].num}</span> ${core[i].unit}`)
      i++
    } else {
      let k = i
      while(k<core.length && core[k].num===0) k++
      outArr.push(' 零')
      i=k
    }
  }
  if (endZeroCount) outArr.push(' 整')
  if (outArr.length===0) outArr.push(' <span class="combo-num">0</span> 秒')
  return (isPast?'已过':'还有')+outArr.join('')
}

/* 每秒刷新所有倒计时finalDisplay，保证自定义条目随时更新 */
const updateCountdowns = () => {
  const now = dayjs()
  events.value = events.value.map(event => {
    const dt = `${event.date}T${(event.hour||'0').padStart(2,'0')}:${(event.minute||'0').padStart(2,'0')}:${(event.second||'0').padStart(2,'0')}`
    const target = dayjs(dt)
    let ms = target.diff(now)
    let isPast = ms < 0
    let finalDisplay = (event.decimalPrecision==='combo')
      ? getComboDisplay(dt, now)
      : (()=>{ // 非组合精度
         let diff
         switch (event.unit) {
          case 'second': diff = Math.abs(target.endOf('second').diff(now, 'second', true)); break
          case 'minute': diff = Math.abs(target.endOf('minute').diff(now, 'minute', true)); break
          case 'hour':   diff = Math.abs(target.endOf('hour').diff(now, 'hour', true)); break
          case 'day':    diff = Math.abs(target.endOf('day').diff(now, 'day', true)); break
          case 'week':   diff = Math.abs(target.endOf('week').diff(now, 'week', true)); break
          case 'month':  diff = Math.abs(target.endOf('month').diff(now, 'month', true)); break
          case 'year':   diff = Math.abs(target.endOf('year').diff(now, 'year', true)); break
          default:       diff = Math.abs(target.endOf('day').diff(now, 'day', true));
         }
         const disp = event.decimalPrecision == null ? diff : diff.toFixed(event.decimalPrecision)
         return (isPast? '已过 ': '还有 ') + `<strong class="combo-num">${disp}</strong> ${unitLabels[event.unit]}`
        })()
    // 日期+时间描述
    const dParts = (event.date || '').split('-')
    const dateTimeDesc = dParts.length === 3
      ? `${dParts[0]}年${dParts[1]}月${dParts[2]}日 ${(event.hour || '0').padStart(2, '0')}:${(event.minute || '0').padStart(2, '0')}:${(event.second || '0').padStart(2, '0')}`
      : event.date
    return { ...event, isPast, finalDisplay, dateTimeDesc }
  })
}

/* 生命周期和定时器 */
let updateTimer
onMounted(() => {
  loadEvents()
  updateCountdowns()
  updateTimer = setInterval(updateCountdowns, 1000)
  document.addEventListener('keydown', handleEscKey)
  document.addEventListener('click', handleGlobalClickOrTouch, true)
  document.addEventListener('touchstart', handleGlobalClickOrTouch, true)
  nextTick(() => {
    if (eventsListRef.value) {
      sortableInstance = Sortable.create(eventsListRef.value, {
        animation: 220,
        handle: '.drag-blank-area', // 仅允许在空白区拖动
        ghostClass: 'drag-ghost',   // 拖动时添加的类
        chosenClass: 'drag-chosen', // 被选中但尚未移动时的类
        dragClass: 'drag-dragging', // 拖动时的类
        onEnd: function (evt) {
          if (evt.oldIndex !== evt.newIndex && evt.oldIndex != null && evt.newIndex != null) {
            // 更新events顺序
            const moved = events.value.splice(evt.oldIndex, 1)[0]
            events.value.splice(evt.newIndex, 0, moved)
            saveCustomEvents(events.value)
          }
          // 【新增】确保还原所有动态拖拽样式
          cleanDragEffects()
        },
        onStart: function () {
          // 【增强】开始拖动时可以自定义更多效果
        }
      })
    }
  })
})
onUnmounted(() => {
  if (updateTimer) clearInterval(updateTimer)
  document.removeEventListener('keydown', handleEscKey)
  document.removeEventListener('click', handleGlobalClickOrTouch, true)
  document.removeEventListener('touchstart', handleGlobalClickOrTouch, true)
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
  cleanDragEffects()
})

function handleAddOrSave() { if (isValidInput.value) handleAdd() }
function handleAdd() {
  validateYear();validateMonth();validateDay();validateHour();validateMinute();validateSecond()
  if (!year.value) { alert('年份必填'); return }
  const dateStr = 
    `${year.value.padStart(4, '0')}-${(month.value || '1').padStart(2, '0')}-${(day.value || '1').padStart(2, '0')}`
  events.value.push({
    id: Date.now(),
    name: eventName.value || `自定义${customCounter.value}`,
    date: dateStr,
    hour: String(hour.value || '0'),
    minute: String(minute.value || '0'),
    second: String(second.value || '0'),
    unit: 'day',
    decimalPrecision: 0,
    countdown: 0,
    displayValue: 0,
    isPast: false,
    unitLabel: unitLabels.day,
    finalDisplay: '',
    dateTimeDesc: `${year.value}年${month.value}月${day.value}日 ${String(hour.value||'0').padStart(2,'0')}:${String(minute.value||'0').padStart(2,'0')}:${String(second.value||'0').padStart(2,'0')}`
  })
  saveCustomEvents(events.value)
  eventName.value = year.value = month.value = day.value = hour.value = minute.value = second.value = ''
  customCounter.value++
  updateCountdowns()
}
function toggleMenu(id) { activeMenu.value = activeMenu.value === id ? null : id }

function handleUnitChange(id, unit) {
  const event = events.value.find(e => e.id === id)
  if (event) {
    event.unit = unit
    event.unitLabel = unitLabels[unit]
    if (unit === 'second' && event.decimalPrecision !== 'combo' && event.decimalPrecision > 0)
      event.decimalPrecision = 0
    if (unit === 'minute' && event.decimalPrecision === 2)
      event.decimalPrecision = 1
    saveCustomEvents(events.value)
    updateCountdowns()
  }
}

function handlePrecisionChange(id, precision) {
  const event = events.value.find(e => e.id === id)
  if (event) {
    event.decimalPrecision = precision
    saveCustomEvents(events.value)
    updateCountdowns()
  }
}

function handleEdit(id) {
  activeMenu.value = null
  const event = events.value.find(e => e.id === id)
  if (event) {
    const [y, m, d] = event.date.split('-')
    editForm.value = {
      name: event.name,
      year: y,
      month: m,
      day: d,
      hour: event.hour || '0',
      minute: event.minute || '0',
      second: event.second || '0'
    }
    editingEvent.value = { ...event }
  }
}
function closeEditModal() {
  editingEvent.value = null
  editForm.value = { name: '', year: '', month: '', day: '', hour: '', minute: '', second: '' }
}
function saveEdit() {
  if (!editingEvent.value) return
  if (!editForm.value.name || !editForm.value.year || !editForm.value.month || !editForm.value.day) {
    alert('请填写完整信息')
    return
  }
  const dateStr = 
    `${editForm.value.year.padStart(4, '0')}-${(editForm.value.month || '1').padStart(2, '0')}-${(editForm.value.day || '1').padStart(2, '0')}`
  const event = events.value.find(e => e.id === editingEvent.value.id)
  if (event) {
    event.name = editForm.value.name
    event.date = dateStr
    event.hour = String(editForm.value.hour || '0')
    event.minute = String(editForm.value.minute || '0')
    event.second = String(editForm.value.second || '0')
    saveCustomEvents(events.value)
    updateCountdowns()
  }
  closeEditModal()
}
function handleCopy(event) {
  activeMenu.value = null
  events.value.push({
    ...event,
    id: Date.now(),
    name: event.name + ' - 副本'
  })
  saveCustomEvents(events.value)
  updateCountdowns()
}
function handleDelete(id) {
  if (confirm('确定要删除这个事件吗？')) {
    activeMenu.value = null
    events.value = events.value.filter(e => e.id !== id)
    saveCustomEvents(events.value)
    updateCountdowns()
  }
}
function handleGlobalClick(e) {
  const menuContainer = e.target.closest('.menu-container')
  if (!menuContainer) activeMenu.value = null
}
function loadEvents() {
  const savedEvents = getCustomEvents()
  events.value = savedEvents.map(event => ({
    ...event,
    hour: event.hour || '0',
    minute: event.minute || '0',
    second: event.second || '0',
    isPast: false,
    finalDisplay: '',
    dateTimeDesc: (event.date ?
      `${event.date.split('-')[0]}年${event.date.split('-')[1]}月${event.date.split('-')[2]}日`
        + ` ${(event.hour || '0').padStart(2, '0')}:${(event.minute || '0').padStart(2, '0')}:${(event.second || '0').padStart(2, '0')}` : '')
  }))
  const maxCounter = Math.max(...savedEvents.map(e => {
    const match = e.name.match(/^自定义(\d+)$/)
    return match ? parseInt(match[1]) : 0
  }), 0)
  customCounter.value = maxCounter + 1
  updateCountdowns()
}

// 支持Esc直接关闭弹窗和菜单
function handleEscKey(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (editingEvent.value) closeEditModal()
    if (activeMenu.value !== null) activeMenu.value = null
  }
}

// 全局空白点击，只关闭菜单，不关编辑弹窗

function handleGlobalClickOrTouch(e) {
  // 只要点击/触摸不在任何 .menu-container 内，关闭菜单
  // 但编辑弹窗不受影响，无需处理
  if (!e.target.closest('.menu-container')) {
    activeMenu.value = null
  }
  // 不要加对 editingEvent 的清空！
}

function cleanDragEffects() {
  // 清除可能残留的拖动类、插槽等（防止似乎未还原的情况）
  const list = eventsListRef.value
  if (!list) return
  list.querySelectorAll('.drag-ghost,.drag-chosen,.drag-dragging').forEach(el => {
    el.classList.remove('drag-ghost','drag-chosen','drag-dragging')
    el.style.opacity = ''
    el.style.transform = ''
    el.style.boxShadow = ''
    el.style.zIndex = ''
    el.style.pointerEvents = ''
  })
}
</script>

<style scoped>
.custom-countdown {
  margin-bottom: 8px;
}

/* 标题样式，主色偏灰，字号适中 */
.title {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
  margin-bottom: 20px;
}

/* 顶部输入行区域，桌面横排、移动端竖排 */
.input-area {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

/* 分组通用样式：年月日一组、时分秒一组，每组一行横排居中。 */
.input-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  /* 不允许输入组内部换行 */
  white-space: nowrap;
  width: 300px;  /* 96*3 + gap = 一组正好横排紧凑 */  
}

/* 所有输入框统一输入样式，兼容移动和桌面 */
.input {
  height: 40px;
  width: 96px;
  min-width: 36px;
  max-width: 120px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  text-align: center;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
}
.input:focus {
  border-color: var(--green-primary);
}

/* 事件名称输入框：独占剩余空间 */
.event-name-input {
  flex: 1;
  min-width: 120px;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  /* 这句让IE也不会超出 */
}

/* 指定日期/时间的分隔符字符宽度，让格式保持统一 */
.date-separator {
  display: inline-block;
  width: 10px;           /* 或你喜欢的统一值，如18/22px */
  text-align: center;
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0 2px;
  /* 确保不会因为字符差异而出现位置不整齐 */
}

/* 把添加按钮绝对定位到右端，竖直居中 */
.button.button-primary {
  min-width: 72px;
  max-width: 120px;
  height: 40px;
  margin-left: 6px;
  z-index: 3;
}

/* 输入框组分隔符（年月日、时分秒） */
.date-separator {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0 2px;
}

/* 编辑弹窗样式（与主输入区公用input样式，无需额外reset） */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: var(--bg-secondary); border-radius: 12px;
  padding: 24px; min-width: 400px; max-width: 90vw;
}
.modal-title {
  font-size: 18px; color: var(--text-primary);
  margin-bottom: 20px; text-align: center;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;         /* 保证组整体居中（关键！） */
  margin-bottom: 20px;
}

/* 日期、时间分组居中，每组横排不拆分 */
.modal-form .input-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  justify-content: center;     /* 居中这组输入框 */
  width: 100%;
  margin-bottom: 7px;
}
/* 默认桌面宽度自定义（如350px，可按实际调整） */
.edit-event-name-input {
  width: 324px;
  min-width: 120px;
  max-width: 100%;
  margin: 0;
}
.modal-actions { display: flex; gap: 10px; justify-content: flex-end;}
.button-secondary {
  background: var(--bg-tertiary); color: var(--text-primary);
  border: 1px solid var(--border-color);
}
.button-secondary:hover { background: var(--border-color); }

.events-list { display: flex; flex-direction: column; gap: 15px;}
.event-container { background: var(--bg-tertiary); border-radius: 12px; padding: 15px;}
.event-item {
  position: relative;
  display: grid;
  grid-template-columns: 200px 1fr 350px 40px;
  gap: 20px;
  align-items: start;
  margin-bottom: 15px;
}
.event-date-column, .event-countdown-column {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  text-align: left;
}
.event-name-column {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  /* 【修改】支持自动换行 */
  white-space: normal;
  word-break: break-all;          /* 防止长英文或无空格内容撑出 */
  text-align: left;
}

.event-countdown-column strong, .combo-num {
  color: var(--green-primary);
  font-weight: 600;
  margin: 0 4px;
  font-style: normal;
}

.menu-container.absolute-menu {
  position: absolute; top: -8px; right: -10px; z-index: 10;
}
.menu-btn {
  width: 32px; height: 32px; border: none; border-radius: 8px;
  background: var(--bg-tertiary); color: var(--text-secondary);
  cursor: pointer; font-size: 16px; font-weight: bold;
  transition: all 0.2s; display: flex; align-items: center; justify-content: center;
}
.menu-btn:hover { background: var(--border-color); color: var(--text-primary);}
.dropdown-menu {
  position: absolute; top: 100%; right: 0;
  background: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 1000; min-width: 80px; padding: 4px 0;
}
.menu-item { width: 100%; padding: 8px 16px; border: none; background: none;
  color: var(--text-primary); font-size: 14px; text-align: left; cursor: pointer;
  transition: background-color 0.2s; font-family: inherit;
}
.menu-item:hover { background: var(--bg-tertiary);}
.menu-item.delete { color: #f44336;}
.menu-item.delete:hover { background: rgba(244,67,54,.1);}
.event-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 8px;
}
.button-row.horizontal-between {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0;
  width: 100%;
  margin-top: 8px;
  margin-bottom: 8px;
}
.joined-btn-group {
  display: flex; flex-direction: row; gap: 0;
}
.joined-btn {
  border-radius: 0;
  margin-left: -1px;
  border-width: 1px 1px 1px 0;
  width: 48px;
  height: 28px;
  font-weight: 600;
  border: 1px solid var(--border-color);
  background: var(--bg-quaternary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.1s;
}
.joined-btn:first-child { border-top-left-radius: 14px; border-bottom-left-radius: 14px; margin-left:0;}
.joined-btn:last-child { border-top-right-radius: 14px; border-bottom-right-radius: 14px; }
.precision-btn.active,
.decimal-btn.active,
.unit-btn.active { background: var(--green-primary); color: var(--bg-primary);}
.decimal-btn.disabled, .unit-btn.disabled {
  opacity: 0.5; cursor: not-allowed; background: var(--bg-quaternary); color: var(--text-tertiary);
}
.empty-tip { text-align: center; color: var(--text-tertiary); font-size: 14px; padding: 20px;}
.drag-chosen, .drag-dragging {
  box-shadow: 0 8px 40px rgba(52, 206, 99, .22), 0 2px 18px #0004;
  transform: scale(1.03);
  z-index: 100;
  cursor: move;
}

/* 移动端：两组输入一上一下居中，两组输入组内横排不分散 */
@media (max-width: 768px) {
  .input-area { 
    flex-direction: column;      /* 垂直方向，三行 */
    align-items: center;         /* 所有子元素水平居中 */
    gap: 10px;
  }
  .input-group {
    flex-direction: row;
    width: 100%;
    justify-content: center;
    margin-bottom: 6px;
  }
  .input {
    min-width: 28px;
    max-width: 120px;
    width: 96px;
    font-size: 15px;
  }
  .event-name-input {
    display: block;
    min-width: 325px;
    margin: 0 auto;
    font-size: 18px;
    line-height: 40px;                    /* 让文本垂直居中 */
    box-sizing: border-box;
    padding: 0 0px;
  }
  
  /* 保证自定义条目条目内容区整体竖排并全部居中，但不影响input区时间/日期/事件分组和宽度 */
  .event-item {
    display: flex !important;         /* 强制条目为竖排flex */
    flex-direction: column !important;
    align-items: center !important;   /* 每行信息居中 */
    width: 100%;
    gap: 8px;
    justify-content: flex-start;
    text-align: center;
  }
  .event-date-column,
  .event-name-column,
  .event-countdown-column {
    width: 100%;
    text-align: center !important;
    word-break: break-all;
    margin-bottom: 2px;
    display: block;
  }
  /* 按钮单独占一行且居中 */

  .button-row.horizontal-between {
    flex-direction: column !important;       /* <--- 关键1 两组变上下排 */
    align-items: center !important;
    gap: 8px !important;                     /* 行间距更自然 */
    width: 100%;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .joined-btn-group {
    /* 保证每一组按钮占一行独立居中 */
    justify-content: center !important;
    width: 100%;
    margin: 0 auto;
    gap: 0;
  }
  /* 三点菜单依旧绝对定位右上，不受影响 */
  .menu-container.absolute-menu {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    margin: 0;
  }
  .edit-event-name-input {
    min-width: 325px;    /* 推荐设大点，手机下也不会太窄 */
    margin: 0 auto;
    height: 40px;        /* 高度也可同步增大 */
    font-size: 17px;
    box-sizing: border-box;
    display: block;
  }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .event-item { grid-template-columns: 100px 1fr 180px 40px; gap: 15px;}
}

/* 保持移动端手指可用 */
@media (any-pointer:coarse) {
  .drag-blank-area { touch-action: pan-y !important; }
}
</style>
