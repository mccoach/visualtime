<template>
  <!-- 自定义倒计时主容器，使用card样式类 -->
  <div class="custom-countdown card">
    <!-- 模块标题 -->
    <h3 class="title">自定义倒计时</h3>
    
    <!-- 输入区域容器，包含所有输入控件 -->
    <div class="input-area">
      <!-- 年月日输入组，横向排列 -->
      <div class="input-group">
        <!-- 年份输入框 -->
        <input
          ref="inputYearRef"
          v-model="inputForm.year"
          type="number"
          class="input"
          placeholder="年"
          @input="onlyInt(inputForm, 'year')"
          @keyup.enter="focusNext(inputForm, inputRefs, 'year', 'month')"
          @keydown.tab.prevent="focusNext(inputForm, inputRefs, 'year', 'month')"
          @blur="validateField(inputForm, 'year')"
          @keydown.up.prevent="spinField(inputForm, 'year', 'up')"
          @keydown.down.prevent="spinField(inputForm, 'year', 'down')"
          @wheel.prevent="onWheel(inputForm, 'year', $event)"
        >
        <!-- 日期分隔符 -->
        <span class="date-separator">-</span>
        
        <!-- 月份输入框 -->
        <input
          ref="inputMonthRef"
          v-model="inputForm.month"
          type="number"
          class="input"
          placeholder="月"
          min="1"
          max="12"
          @input="onlyInt(inputForm, 'month')"
          @keyup.enter="focusNext(inputForm, inputRefs, 'month', 'day')"
          @keydown.tab.prevent="focusNext(inputForm, inputRefs, 'month', 'day')"
          @blur="validateField(inputForm, 'month')"
          @keydown.up.prevent="spinField(inputForm, 'month', 'up')"
          @keydown.down.prevent="spinField(inputForm, 'month', 'down')"
          @wheel.prevent="onWheel(inputForm, 'month', $event)"
        >
        <!-- 日期分隔符 -->
        <span class="date-separator">-</span>
        
        <!-- 日期输入框 -->
        <input
          ref="inputDayRef"
          v-model="inputForm.day"
          type="number"
          class="input"
          placeholder="日"
          :min="1"
          :max="maxDay(inputForm)"
          @input="onlyInt(inputForm, 'day')"
          @keyup.enter="focusNext(inputForm, inputRefs, 'day', 'hour')"
          @keydown.tab.prevent="focusNext(inputForm, inputRefs, 'day', 'hour')"
          @blur="validateField(inputForm, 'day')"
          @keydown.up.prevent="spinField(inputForm, 'day', 'up')"
          @keydown.down.prevent="spinField(inputForm, 'day', 'down')"
          @wheel.prevent="onWheel(inputForm, 'day', $event)"
        >
      </div>
      
      <!-- 时分秒输入组，横向排列 -->
      <div class="input-group">
        <!-- 小时输入框 -->
        <input
          ref="inputHourRef"
          v-model="inputForm.hour"
          type="number"
          class="input"
          placeholder="时"
          min="0"
          max="23"
          @input="onlyInt(inputForm, 'hour')"
          @keyup.enter="focusNext(inputForm, inputRefs, 'hour', 'minute')"
          @keydown.tab.prevent="focusNext(inputForm, inputRefs, 'hour', 'minute')"
          @blur="validateField(inputForm, 'hour')"
          @keydown.up.prevent="spinField(inputForm, 'hour', 'up')"
          @keydown.down.prevent="spinField(inputForm, 'hour', 'down')"
          @wheel.prevent="onWheel(inputForm, 'hour', $event)"
        >
        <!-- 时间分隔符 -->
        <span class="date-separator">:</span>
        
        <!-- 分钟输入框 -->
        <input
          ref="inputMinuteRef"
          v-model="inputForm.minute"
          type="number"
          class="input"
          placeholder="分"
          min="0"
          max="59"
          @input="onlyInt(inputForm, 'minute')"
          @keyup.enter="focusNext(inputForm, inputRefs, 'minute', 'second')"
          @keydown.tab.prevent="focusNext(inputForm, inputRefs, 'minute', 'second')"
          @blur="validateField(inputForm, 'minute')"
          @keydown.up.prevent="spinField(inputForm, 'minute', 'up')"
          @keydown.down.prevent="spinField(inputForm, 'minute', 'down')"
          @wheel.prevent="onWheel(inputForm, 'minute', $event)"
        >
        <!-- 时间分隔符 -->
        <span class="date-separator">:</span>
        
        <!-- 秒输入框 -->
        <input
          ref="inputSecondRef"
          v-model="inputForm.second"
          type="number"
          class="input"
          placeholder="秒"
          min="0"
          max="59"
          @input="onlyInt(inputForm, 'second')"
          @keyup.enter="focusNext(inputForm, inputRefs, 'second', 'name')"
          @keydown.tab.prevent="focusNext(inputForm, inputRefs, 'second', 'name')"
          @blur="validateField(inputForm, 'second')"
          @keydown.up.prevent="spinField(inputForm, 'second', 'up')"
          @keydown.down.prevent="spinField(inputForm, 'second', 'down')"
          @wheel.prevent="onWheel(inputForm, 'second', $event)"
        />
      </div>
      
      <!-- 事件名称输入框 -->
      <input
        ref="inputNameRef"
        v-model="inputForm.name"
        type="text"
        class="input event-name-input"
        placeholder="事件名称（可选）"
        @keyup.enter="handleNameEnter"
        @keydown.tab.prevent="focusNext(inputForm, inputRefs, 'name', 'year')"
      >
      
      <!-- 添加按钮 -->
      <button 
        class="button button-primary"
        @click="handleAdd"
        :disabled="!isValidInput(inputForm)"
      >添加</button>
    </div>
    <!-- 编辑弹窗 -->
    <!-- 当editingEvent有值时显示编辑弹窗 -->
    <div v-if="editingEvent" class="modal-overlay">
      <!-- 模态框内容容器，点击停止事件冒泡防止关闭弹窗 -->
      <div class="modal-content" @click.stop>
        <!-- 弹窗标题 -->
        <h3 class="modal-title">编辑事件</h3>
        
        <!-- 编辑表单容器 -->
        <div class="modal-form">
          <!-- 编辑区年月日输入组 -->
          <div class="input-group">
            <!-- 编辑区年份输入框 -->
            <input
              ref="editYearRef"
              v-model="editForm.year"
              type="number"
              class="input"
              placeholder="年"
              @input="onlyInt(editForm, 'year')"
              @keyup.enter="focusNext(editForm, editRefs, 'year', 'month')"
              @keydown.tab.prevent="focusNext(editForm, editRefs, 'year', 'month')"
              @blur="validateField(editForm, 'year')"
              @keydown.up.prevent="spinField(editForm, 'year', 'up')"
              @keydown.down.prevent="spinField(editForm, 'year', 'down')"
              @wheel.prevent="onWheel(editForm, 'year', $event)"
            >
            <span class="date-separator">-</span>
            
            <!-- 编辑区月份输入框 -->
            <input
              ref="editMonthRef"
              v-model="editForm.month"
              type="number"
              class="input"
              placeholder="月"
              min="1"
              max="12"
              @input="onlyInt(editForm, 'month')"
              @keyup.enter="focusNext(editForm, editRefs, 'month', 'day')"
              @keydown.tab.prevent="focusNext(editForm, editRefs, 'month', 'day')"
              @blur="validateField(editForm, 'month')"
              @keydown.up.prevent="spinField(editForm, 'month', 'up')"
              @keydown.down.prevent="spinField(editForm, 'month', 'down')"
              @wheel.prevent="onWheel(editForm, 'month', $event)"
            >
            <span class="date-separator">-</span>
            
            <!-- 编辑区日期输入框 -->
            <input
              ref="editDayRef"
              v-model="editForm.day"
              type="number"
              class="input"
              placeholder="日"
              :min="1"
              :max="maxDay(editForm)"
              @input="onlyInt(editForm, 'day')"
              @keyup.enter="focusNext(editForm, editRefs, 'day', 'hour')"
              @keydown.tab.prevent="focusNext(editForm, editRefs, 'day', 'hour')"
              @blur="validateField(editForm, 'day')"
              @keydown.up.prevent="spinField(editForm, 'day', 'up')"
              @keydown.down.prevent="spinField(editForm, 'day', 'down')"
              @wheel.prevent="onWheel(editForm, 'day', $event)"
            >
          </div>
          
          <!-- 编辑区时分秒输入组 -->
          <div class="input-group">
            <!-- 编辑区小时输入框 -->
            <input
              ref="editHourRef"
              v-model="editForm.hour"
              type="number"
              class="input"
              placeholder="时"
              min="0"
              max="23"
              @input="onlyInt(editForm, 'hour')"
              @keyup.enter="focusNext(editForm, editRefs, 'hour', 'minute')"
              @keydown.tab.prevent="focusNext(editForm, editRefs, 'hour', 'minute')"
              @blur="validateField(editForm, 'hour')"
              @keydown.up.prevent="spinField(editForm, 'hour', 'up')"
              @keydown.down.prevent="spinField(editForm, 'hour', 'down')"
              @wheel.prevent="onWheel(editForm, 'hour', $event)"
            >
            <span class="date-separator">:</span>
            
            <!-- 编辑区分钟输入框 -->
            <input
              ref="editMinuteRef"
              v-model="editForm.minute"
              type="number"
              class="input"
              placeholder="分"
              min="0"
              max="59"
              @input="onlyInt(editForm, 'minute')"
              @keyup.enter="focusNext(editForm, editRefs, 'minute', 'second')"
              @keydown.tab.prevent="focusNext(editForm, editRefs, 'minute', 'second')"
              @blur="validateField(editForm, 'minute')"
              @keydown.up.prevent="spinField(editForm, 'minute', 'up')"
              @keydown.down.prevent="spinField(editForm, 'minute', 'down')"
              @wheel.prevent="onWheel(editForm, 'minute', $event)"
            >
            <span class="date-separator">:</span>
            
            <!-- 编辑区秒输入框 -->
            <input
              ref="editSecondRef"
              v-model="editForm.second"
              type="number"
              class="input"
              placeholder="秒"
              min="0"
              max="59"
              @input="onlyInt(editForm, 'second')"
              @keyup.enter="focusNext(editForm, editRefs, 'second', 'name')"
              @keydown.tab.prevent="focusNext(editForm, editRefs, 'second', 'name')"
              @blur="validateField(editForm, 'second')"
              @keydown.up.prevent="spinField(editForm, 'second', 'up')"
              @keydown.down.prevent="spinField(editForm, 'second', 'down')"
              @wheel.prevent="onWheel(editForm, 'second', $event)"
            />
          </div>
          
          <!-- 编辑区事件名称输入框 -->
          <input
            ref="editNameRef"
            v-model="editForm.name"
            type="text"
            class="input edit-event-name-input"
            placeholder="事件名称"
            @keyup.enter="saveEdit"
            @keydown.tab.prevent="focusNext(editForm, editRefs, 'name', 'year')"
          >
        </div>
        
        <!-- 弹窗操作按钮区 -->
        <div class="modal-actions">
          <!-- 取消按钮 -->
          <button class="button button-secondary" @click="closeEditModal">取消</button>
          <!-- 保存按钮 -->
          <button class="button button-primary" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 事件列表容器，支持拖拽排序 -->
    <div class="events-list" ref="eventsListRef">
      <!-- 遍历显示所有事件 -->
      <div
        v-for="event in events"
        :key="event.id"
        class="event-container"
      >
        <!-- 单个事件内容区 -->
        <div class="event-item">
          <!-- 桌面端左侧拖拽手柄 -->
          <div class="drag-handle drag-handle-left desktop-only"
               title="拖动排序">
            <svg width="16" height="24" fill="currentColor">
              <circle cx="12" cy="6" r="1.5"/>
              <circle cx="6" cy="12" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="18" r="1.5"/>
            </svg>
          </div>
          
          <!-- 移动端拖拽空白区域（保持原有逻辑） -->
          <div class="drag-blank-area mobile-only"
              title="拖动排序"
              style="position:absolute;left:0;top:0;bottom:0;right:0;z-index:5;cursor:move;"
              @mousedown.stop
              @touchstart.stop>
          </div>
          
          <!-- 事件日期时间显示列 -->
          <div class="event-date-column">
            {{ event.dateTimeDesc }}
          </div>
          
          <!-- 事件名称显示列 -->
          <div class="event-name-column">{{ event.name }}</div>
          
          <!-- 倒计时显示列 -->
          <div class="event-countdown-column">
            <span v-html="event.finalDisplay"></span>
          </div>
          
          <!-- 桌面端右侧拖拽手柄 -->
          <div class="drag-handle drag-handle-right desktop-only"
               title="拖动排序">
            <svg width="16" height="24" viewBox="0 0 16 24" fill="currentColor">
              <circle cx="4" cy="6" r="1.5"/>
              <circle cx="4" cy="12" r="1.5"/>
              <circle cx="10" cy="12" r="1.5"/>
              <circle cx="4" cy="18" r="1.5"/>
            </svg>
          </div>
          
          <!-- 操作菜单容器，绝对定位在右上角 -->
          <div class="menu-container absolute-menu" @click.stop>
            <!-- 菜单按钮（三个点） -->
            <button class="menu-btn" @click="toggleMenu(event.id)">⋮</button>
            
            <!-- 下拉菜单，仅在当前事件菜单激活时显示 -->
            <div v-if="activeMenu === event.id" class="dropdown-menu">
              <!-- 编辑按钮 -->
              <button @click="handleEdit(event.id)" class="menu-item">编辑</button>
              <!-- 复制按钮 -->
              <button @click="handleCopy(event)" class="menu-item">复制</button>
              <!-- 删除按钮，使用delete类添加红色样式 -->
              <button @click="handleDelete(event.id)" class="menu-item delete">删除</button>
            </div>
          </div>
        </div>
        
        <!-- 单位和精度按钮行，左右对齐布局 -->
        <div class="button-row horizontal-between">
          <!-- 左侧：时间单位选择按钮组 -->
          <div class="joined-btn-group unit-btn-group">
            <button
              v-for="unit in unitOptions"
              :key="unit.value"
              :class="['precision-btn', 'joined-btn', { active: event.unit === unit.value }]"
              @click="handleUnitChange(event.id, unit.value)">
              {{ unit.label }}
            </button>
          </div>
          
          <!-- 右侧：小数精度选择按钮组 -->
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
      
      <!-- 空状态提示 -->
      <p v-if="events.length === 0" class="empty-tip">暂无自定义倒计时，请添加</p>
    </div>
  </div>
</template>
<script setup>
// 导入Vue 3组合式API的核心函数
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
// 导入日期处理库
import dayjs from 'dayjs'
// 导入拖拽排序库
import Sortable from 'sortablejs'
// 导入本地存储工具函数
import { getCustomEvents, saveCustomEvents } from '../utils/storage'

/* ========== 统一表单对象 ========== */
// 主输入区表单数据，使用ref创建响应式对象
const inputForm = ref({ 
  year: '',    // 年份
  month: '',   // 月份
  day: '',     // 日期
  hour: '',    // 小时
  minute: '',  // 分钟
  second: '',  // 秒
  name: ''     // 事件名称
})

// 编辑弹窗表单数据，结构与inputForm相同
const editForm = ref({ 
  year: '', 
  month: '', 
  day: '', 
  hour: '', 
  minute: '', 
  second: '', 
  name: '' 
})

/* ========== 创建独立的 ref 对象 ========== */
// 主输入区的DOM引用，用于programmatic focus等DOM操作
const inputYearRef = ref(null)    // 年份输入框引用
const inputMonthRef = ref(null)   // 月份输入框引用
const inputDayRef = ref(null)     // 日期输入框引用
const inputHourRef = ref(null)    // 小时输入框引用
const inputMinuteRef = ref(null)  // 分钟输入框引用
const inputSecondRef = ref(null)  // 秒输入框引用
const inputNameRef = ref(null)    // 事件名输入框引用

// 编辑区的DOM引用，与主输入区对应
const editYearRef = ref(null)
const editMonthRef = ref(null)
const editDayRef = ref(null)
const editHourRef = ref(null)
const editMinuteRef = ref(null)
const editSecondRef = ref(null)
const editNameRef = ref(null)

/* ========== 创建 refs 映射对象 ========== */
// 主输入区引用映射，方便通过字段名访问对应的ref
const inputRefs = {
  year: inputYearRef,
  month: inputMonthRef,
  day: inputDayRef,
  hour: inputHourRef,
  minute: inputMinuteRef,
  second: inputSecondRef,
  name: inputNameRef
}

// 编辑区引用映射
const editRefs = {
  year: editYearRef,
  month: editMonthRef,
  day: editDayRef,
  hour: editHourRef,
  minute: editMinuteRef,
  second: editSecondRef,
  name: editNameRef
}

// 事件列表数据
const events = ref([])
// 自定义事件计数器，用于生成默认事件名
const customCounter = ref(1)
// 当前激活的菜单ID，null表示无菜单打开
const activeMenu = ref(null)
// 当前编辑的事件对象，null表示未在编辑状态
const editingEvent = ref(null)
// 事件列表DOM引用，用于初始化拖拽功能
const eventsListRef = ref(null)
// Sortable实例，用于拖拽排序
let sortableInstance = null

// 输入字段的限制配置
const inputLimits = {
  year: { min: 1970, max: 9999 },              // 年份范围
  month: { min: 1, max: 12 },                  // 月份范围
  day: { min: 1, max: (form) => maxDay(form) }, // 日期范围，最大值动态计算
  hour: { min: 0, max: 23 },                   // 小时范围
  minute: { min: 0, max: 59 },                 // 分钟范围
  second: { min: 0, max: 59 }                  // 秒范围
}

/* ========== 日期极值动态获取 ========== */
// 根据年月计算当月最大天数
function maxDay(form) {
  // 获取年份，如果未填写则使用当前年份
  const y = Number(form.year) || new Date().getFullYear()
  // 获取月份，如果未填写则默认为1月
  const m = Number(form.month) || 1
  // 使用dayjs计算指定年月的天数
  return dayjs(`${y}-${m}-01`).daysInMonth()
}

/* ========== 只允许纯数字输入/修正为默认值 ========== */
function onlyInt(form, key) {
  // 将输入值转为字符串
  let val = String(form[key])
  // 移除所有非数字字符
  val = val.replace(/\D/g, '')
  
  // 对于不同字段的处理
  if (key === 'year') {
    // 年份可以暂时为空，允许用户逐位输入
    form[key] = val
  } else if (key === 'month' || key === 'day') {
    // 月日默认值为 1，防止为0或空
    form[key] = val !== '' ? val : '1'
  } else {
    // 时分秒默认值为 0
    form[key] = val !== '' ? val : '0'
  }
}

/* ========== 上下键增加/减少，自动循环极值 ========== */
function spinField(form, key, direction) {
  // 获取当前值，如果为空则默认为0
  let val = Number(form[key]) || 0
  // 获取最大值，如果是函数则调用获取
  let max = typeof inputLimits[key].max === 'function'
    ? inputLimits[key].max(form)
    : inputLimits[key].max
  // 获取最小值
  const min = inputLimits[key].min
  
  if (direction === 'up') {
    // 向上增加，到达最大值后循环到最小值
    val = val >= max ? min : val + 1
  } else if (direction === 'down') {
    // 向下减少，到达最小值后循环到最大值
    val = val <= min ? max : val - 1
  }
  // 更新表单值
  form[key] = String(val)
}

/* ========== 鼠标滚轮增减 ========== */
function onWheel(form, key, e) {
  // 阻止默认的页面滚动行为
  e.preventDefault()
  // 根据滚轮方向调用spinField
  // deltaY < 0 表示向上滚动，增加值
  // deltaY > 0 表示向下滚动，减少值
  spinField(form, key, e.deltaY < 0 ? 'up' : 'down')
}

/* ========== 失焦自动校验修正 ========== */
function validateField(form, key) {
  // name 字段不需要验证
  if (key === 'name') return
  
  // 如果值为空，先设置默认值
  if (!form[key] || form[key] === '') {
    if (key === 'year') {
      // 年份默认为当前年
      form[key] = String(new Date().getFullYear())
    } else if (key === 'month' || key === 'day') {
      // 月日默认为1
      form[key] = '1'
    } else {
      // 时分秒默认为0
      form[key] = '0'
    }
    return
  }
  
  // 转换为数字进行范围验证
  let val = Number(form[key])
  // 获取最大值
  let max = typeof inputLimits[key].max === 'function'
    ? inputLimits[key].max(form)
    : inputLimits[key].max
  const min = inputLimits[key].min
  
  // 验证并修正范围
  if (isNaN(val)) {
    // 如果不是有效数字，设置默认值
    form[key] = (key === 'month' || key === 'day') ? '1' : '0'
  } else if (val < min) {
    // 如果小于最小值，设置为最小值
    form[key] = String(min)
  } else if (val > max) {
    // 如果大于最大值，设置为最大值
    form[key] = String(max)
  }
}

/* ========== tab、回车自动跳下一个输入框，并全选内容 ========== */
function focusNext(form, refsObj, currKey, nextKey) {
  // 只有非 name 字段才进行验证
  if (currKey !== 'name') {
    // 如果当前字段为空，先填充默认值
    if (!form[currKey] || form[currKey] === '') {
      if (currKey === 'year') {
        form[currKey] = String(new Date().getFullYear())
      } else if (currKey === 'month' || currKey === 'day') {
        form[currKey] = '1'
      } else {
        form[currKey] = '0'
      }
    }
    // 验证当前字段
    validateField(form, currKey)
  }
  
  // 使用nextTick确保DOM更新后再进行焦点操作
  nextTick(() => {
    // 检查下一个输入框的ref是否存在
    if (refsObj[nextKey] && refsObj[nextKey].value) {
      const nextInput = refsObj[nextKey].value
      // 聚焦到下一个输入框
      nextInput.focus()
      // 全选输入框内容，方便用户直接输入覆盖
      nextInput.select()
    }
  })
}

/* ========== 通用输入有效校验器 ========== */
function isValidInput(form) {
  // 年份允许为空，但录入时需给默认年
  if (!form.year || isNaN(+form.year)) return false
  // 月日必须有值
  if (!form.month || !form.day) return false
  // 验证月份范围 1-12
  if (+form.month < 1 || +form.month > 12) return false
  // 验证日期范围 1-当月最大天数
  if (+form.day < 1 || +form.day > maxDay(form)) return false
  // 验证小时范围 0-23
  if (form.hour === '' || +form.hour < 0 || +form.hour > 23) return false
  // 验证分钟范围 0-59
  if (form.minute === '' || +form.minute < 0 || +form.minute > 59) return false
  // 验证秒范围 0-59
  if (form.second === '' || +form.second < 0 || +form.second > 59) return false
  // 所有验证通过
  return true
}
/* ================== 业务相关常量和方法(保留原有单位、精度、计算算法) ================== */
// 时间单位选项配置
const unitOptions = [
  { value: 'year', label: '年' },    // 年
  { value: 'month', label: '月' },   // 月
  { value: 'week', label: '周' },    // 周
  { value: 'day', label: '天' },     // 天
  { value: 'hour', label: '时' },    // 小时
  { value: 'minute', label: '分' },  // 分钟
  { value: 'second', label: '秒' }   // 秒
]

// 小数精度选项配置
const precisionOptions = [
  { value: 'combo', label: '0:0' },  // 组合显示模式，如"1年2个月3天"
  { value: 0, label: '0' },          // 整数
  { value: 1, label: '0.0' },        // 1位小数
  { value: 2, label: '0.00' }        // 2位小数
]

// 单位标签映射，用于显示
const unitLabels = {
  day: '天',
  hour: '小时',
  minute: '分钟',
  second: '秒',
  week: '周',
  month: '个月',
  year: '年'
}

// 判断小数精度是否应该被禁用
const isDecimalDisabled = (unit, decimalValue) => {
  // 秒单位不支持小数（除了组合模式）
  if (unit === 'second' && decimalValue !== 'combo' && decimalValue > 0) return true
  // 分钟单位不支持2位小数
  if (unit === 'minute' && decimalValue === 2) return true
  return false
}

/* ========== 组合精度显示逻辑（原样复用） ========== */
// 计算并返回组合格式的倒计时显示
function getComboDisplay(dateInput, now) {
  // 分解日期时间字符串
  let [datePart, timePart='00:00:00'] = dateInput.split('T')
  let parts = timePart.split(':')
  let h = parts[0] || '0', m = parts[1] || '0', s = parts[2] || '0'
  
  // 创建起始和结束时间对象
  let start = dayjs(now)
  let end = dayjs(datePart).set('hour', h).set('minute', m).set('second', s)
  
  // 判断是否已过期
  let isPast = end.isBefore(start)
  // 如果已过期，交换起始和结束时间
  if (isPast) [start, end] = [end, start]
  
  // 逐级计算时间差
  let years = end.diff(start, 'year');   
  start = start.add(years, 'year')      // 加上年份后继续计算
  
  let months = end.diff(start, 'month'); 
  start = start.add(months, 'month')    // 加上月份后继续计算
  
  let days = end.diff(start, 'day');     
  start = start.add(days, 'day')        // 加上天数后继续计算
  
  let hours = end.diff(start, 'hour');   
  start = start.add(hours, 'hour')      // 加上小时后继续计算
  
  let minutes = end.diff(start, 'minute'); 
  start = start.add(minutes, 'minute')  // 加上分钟后继续计算
  
  let seconds = end.diff(start, 'second')
  
  // 构建时间差数组
  let arr = [
    { num: years, unit: '年' }, 
    { num: months, unit: '个月' }, 
    { num: days, unit: '天' },
    { num: hours, unit: '小时' }, 
    { num: minutes, unit: '分' }, 
    { num: seconds, unit: '秒' }
  ]
  
  // 找到第一个非零值
  let firstNonZero = 0
  while (firstNonZero < arr.length-1 && arr[firstNonZero].num === 0) firstNonZero++
  
  // 从第一个非零值开始截取
  let trimmed = arr.slice(firstNonZero)
  
  // 找到最后一个非零值
  let lastNonZero = trimmed.length-1
  while (lastNonZero >= 0 && trimmed[lastNonZero].num === 0) lastNonZero--
  
  // 提取核心部分（第一个非零到最后一个非零）
  let core = trimmed.slice(0, lastNonZero+1)
  // 计算末尾零的个数
  let endZeroCount = trimmed.length-1-lastNonZero
  
  // 构建输出数组
  let outArr = []
  for (let i=0; i<core.length; ) {
    if (core[i].num > 0) {
      // 非零值用绿色高亮显示
      outArr.push(` <span class="combo-num">${core[i].num}</span> ${core[i].unit}`)
      i++
    } else {
      // 连续的零合并为一个"零"
      let k = i
      while(k<core.length && core[k].num===0) k++
      outArr.push(' 零')
      i=k
    }
  }
  
  // 如果末尾有零，添加"整"
  if (endZeroCount) outArr.push(' 整')
  // 如果全为零，显示"0秒"
  if (outArr.length===0) outArr.push(' <span class="combo-num">0</span> 秒')
  
  // 返回完整的显示字符串
  return (isPast?'已过':'还有')+outArr.join('')
}

// 更新所有事件的倒计时显示
const updateCountdowns = () => {
  const now = dayjs()
  // 遍历并更新每个事件
  events.value = events.value.map(event => {
    // 构建完整的日期时间字符串
    const dt = `${event.date}T${(event.hour||'0').padStart(2,'0')}:${(event.minute||'0').padStart(2,'0')}:${(event.second||'0').padStart(2,'0')}`
    const target = dayjs(dt)
    
    // 计算时间差（毫秒）
    let ms = target.diff(now)
    let isPast = ms < 0
    
    // 根据精度类型计算显示内容
    let finalDisplay = (event.decimalPrecision==='combo')
      ? getComboDisplay(dt, now)  // 组合精度显示
      : (()=>{ // 非组合精度显示
         let diff
         // 根据不同单位计算时间差
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
         // 根据小数精度格式化显示
         const disp = event.decimalPrecision == null ? diff : diff.toFixed(event.decimalPrecision)
         // 返回带样式的显示字符串
         return (isPast? '已过 ': '还有 ') + `<strong class="combo-num">${disp}</strong> ${unitLabels[event.unit]}`
        })()
    
    // 解析日期字符串用于显示
    const dParts = (event.date || '').split('-')
    // 格式化日期时间描述
    const dateTimeDesc = dParts.length === 3
      ? `${dParts[0]}年${dParts[1]}月${dParts[2]}日 ${(event.hour || '0').padStart(2, '0')}:${(event.minute || '0').padStart(2, '0')}:${(event.second || '0').padStart(2, '0')}`
      : event.date
    
    // 返回更新后的事件对象
    return { ...event, isPast, finalDisplay, dateTimeDesc }
  })
}

/* ========= 事件/菜单/编辑/复制/拖拽 ========= */
// 处理事件名输入框的回车键
function handleNameEnter() {
  // 如果输入有效，则添加事件
  if (isValidInput(inputForm.value)) {
    handleAdd()
  } else {
    // 输入无效时，循环跳转到年份输入框
    focusNext(inputForm, inputRefs, 'name', 'year')
  }
}

// 添加新事件
function handleAdd() {
  const f = inputForm.value
  // 验证输入是否完整合法
  if (!isValidInput(f)) { 
    alert('请填写完整且合法的时间'); 
    return 
  }
  
  // 构建标准日期字符串 YYYY-MM-DD
  const dateStr = `${f.year.padStart(4, '0')}-${(f.month || '1').padStart(2, '0')}-${(f.day || '1').padStart(2, '0')}`
  
  // 创建新事件对象
  events.value.push({
    id: Date.now(),                              // 使用时间戳作为唯一ID
    name: f.name || `自定义${customCounter.value}`, // 事件名称，无则使用默认名
    date: dateStr,                               // 日期字符串
    hour: String(f.hour || '0'),                 // 小时
    minute: String(f.minute || '0'),             // 分钟
    second: String(f.second || '0'),             // 秒
    unit: 'day',                                 // 默认单位为天
    decimalPrecision: 0,                         // 默认整数精度
    countdown: 0,                                // 倒计时值（将被计算）
    displayValue: 0,                             // 显示值（将被计算）
    isPast: false,                               // 是否已过期
    unitLabel: unitLabels.day,                   // 单位标签
    finalDisplay: '',                            // 最终显示文本
    dateTimeDesc: `${f.year}年${f.month}月${f.day}日 ${(f.hour||'0').padStart(2,'0')}:${(f.minute||'0').padStart(2,'0')}:${(f.second||'0').padStart(2,'0')}` // 日期时间描述
  })
  
  // 保存到本地存储
  saveCustomEvents(events.value)
  // 清空输入表单
  Object.keys(f).forEach(k => f[k] = '')
  // 增加计数器
  customCounter.value++
  // 立即更新倒计时显示
  updateCountdowns()
}

// 切换菜单显示状态
function toggleMenu(id) { 
  // 如果点击的是当前打开的菜单，则关闭；否则打开新菜单
  activeMenu.value = activeMenu.value === id ? null : id 
}

// 处理单位变更
function handleUnitChange(id, unit) {
  // 找到对应事件
  const event = events.value.find(e => e.id === id)
  if (event) {
    // 更新单位
    event.unit = unit
    event.unitLabel = unitLabels[unit]
    
    // 根据新单位调整精度限制
    if (unit === 'second' && event.decimalPrecision !== 'combo' && event.decimalPrecision > 0)
      event.decimalPrecision = 0  // 秒不支持小数
    if (unit === 'minute' && event.decimalPrecision === 2)
      event.decimalPrecision = 1  // 分钟最多1位小数
    
    // 保存并更新显示
    saveCustomEvents(events.value)
    updateCountdowns()
  }
}

// 处理精度变更
function handlePrecisionChange(id, precision) {
  const event = events.value.find(e => e.id === id)
  if (event) {
    event.decimalPrecision = precision
    saveCustomEvents(events.value)
    updateCountdowns()
  }
}

// 处理编辑事件
function handleEdit(id) {
  activeMenu.value = null  // 关闭菜单
  const e = events.value.find(e => e.id === id)
  if (e) {
    // 解析日期字符串
    const [y, m, d] = e.date.split('-')
    // 填充编辑表单
    Object.assign(editForm.value, {
      name: e.name,
      year: y,
      month: m,
      day: d,
      hour: e.hour || '0',
      minute: e.minute || '0',
      second: e.second || '0'
    })
    // 保存当前编辑的事件
    editingEvent.value = { ...e }
    // 聚焦到年份输入框
    nextTick(() => {
      if (editYearRef.value) {
        editYearRef.value.focus()
      }
    })
  }
}

// 关闭编辑弹窗
function closeEditModal() {
  editingEvent.value = null  // 清除编辑状态
  // 清空编辑表单
  Object.keys(editForm.value).forEach(k => editForm.value[k] = '')
}

// 保存编辑
function saveEdit() {
  if (!editingEvent.value) return
  const f = editForm.value
  
  // 验证输入
  if (!isValidInput(f)) { 
    alert('请填写完整且合法的时间'); 
    return 
  }
  
  // 构建日期字符串
  const dateStr = `${f.year.padStart(4, '0')}-${(f.month || '1').padStart(2, '0')}-${(f.day || '1').padStart(2, '0')}`
  
  // 找到并更新原事件
  const event = events.value.find(e => e.id === editingEvent.value.id)
  if (event) {
    event.name = f.name
    event.date = dateStr
    event.hour = String(f.hour || '0')
    event.minute = String(f.minute || '0')
    event.second = String(f.second || '0')
    saveCustomEvents(events.value)
    updateCountdowns()
  }
  closeEditModal()
}

// 处理复制事件
function handleCopy(event) {
  activeMenu.value = null  // 关闭菜单
  // 创建事件副本
  events.value.push({
    ...event,                     // 复制所有属性
    id: Date.now(),              // 新的唯一ID
    name: event.name + ' - 副本'  // 添加副本后缀
  })
  saveCustomEvents(events.value)
  updateCountdowns()
}

// 处理删除事件
function handleDelete(id) {
  if (confirm('确定要删除这个事件吗？')) {
    activeMenu.value = null  // 关闭菜单
    // 过滤掉要删除的事件
    events.value = events.value.filter(e => e.id !== id)
    saveCustomEvents(events.value)
    updateCountdowns()
  }
}

/* ========== ESC键和全局点击处理 ========== */
// ESC键处理：关闭菜单和编辑弹窗
function handleEscKey(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (editingEvent.value) closeEditModal()     // 优先关闭编辑弹窗
    if (activeMenu.value !== null) activeMenu.value = null  // 关闭菜单
  }
}

// 全局点击处理：点击菜单外部关闭菜单
function handleGlobalClickOrTouch(e) {
  // 如果点击的不是菜单容器内部，关闭菜单
  if (!e.target.closest('.menu-container')) activeMenu.value = null
}

/* ========== 拖拽排序处理 ========== */
// 清理拖拽效果（移除拖拽过程中添加的类和样式）
function cleanDragEffects() {
  const list = eventsListRef.value
  if (!list) return
  // 查找并清理所有拖拽相关的类和样式
  list.querySelectorAll('.drag-ghost,.drag-chosen,.drag-dragging').forEach(el => {
    el.classList.remove('drag-ghost','drag-chosen','drag-dragging')
    el.style.opacity = ''
    el.style.transform = ''
    el.style.boxShadow = ''
    el.style.zIndex = ''
    el.style.pointerEvents = ''
  })
}

/* ========== 生命周期钩子 ========== */
let updateTimer  // 定时器引用

// 组件挂载时
onMounted(() => {
  loadEvents()                    // 加载保存的事件
  updateCountdowns()              // 初始计算倒计时
  updateTimer = setInterval(updateCountdowns, 1000)  // 每秒更新倒计时
  
  // 添加全局事件监听
  document.addEventListener('keydown', handleEscKey)
  document.addEventListener('click', handleGlobalClickOrTouch, true)
  document.addEventListener('touchstart', handleGlobalClickOrTouch, true)
  
  // 初始化拖拽排序
  nextTick(() => {
    if (eventsListRef.value) {
      sortableInstance = Sortable.create(eventsListRef.value, {
        animation: 220,                    // 动画时长
        handle: '.drag-handle, .drag-blank-area',  // 同时支持手柄和移动端拖拽区
        ghostClass: 'drag-ghost',          // 拖拽镜像类
        chosenClass: 'drag-chosen',        // 选中项类
        dragClass: 'drag-dragging',        // 拖拽中类
        delay: 500,                        // 延迟500毫秒（0.5秒）
        delayOnTouchOnly: true,            // 仅在触摸设备上应用延迟
        forceFallback: true,               // 强制使用 fallback 模式，确保样式生效
        fallbackClass: 'sortable-fallback', // fallback 元素的类名
        direction: 'vertical',             // 明确指定垂直方向
        swapThreshold: 0.65,               // 调整交换阈值
        invertSwap: false,                 // 不反转交换
        dragoverBubble: false,             // 防止拖拽事件冒泡
        removeCloneOnHide: true,           // 隐藏时移除克隆
        preventOnFilter: false,            // 允许过滤时的拖拽
        scrollSensitivity: 30,             // 滚动敏感度
        scrollSpeed: 10,                   // 滚动速度
        bubbleScroll: true,                // 允许冒泡滚动
  
        // 自定义拖拽移动函数，只考虑Y坐标
        onMove: function(evt, originalEvent) {
          // 返回 true 表示允许移动，返回 false 表示禁止
          return true;
        },
        
        // 拖拽过程中的回调
        onSort: function(evt) {
          // 在这里可以添加额外的排序逻辑
        },
        
        onEnd: function (evt) {            // 拖拽结束回调
          // 如果位置发生变化
          if (evt.oldIndex !== evt.newIndex && evt.oldIndex != null && evt.newIndex != null) {
            // 移动数组元素
            const moved = events.value.splice(evt.oldIndex, 1)[0]
            events.value.splice(evt.newIndex, 0, moved)
            // 保存新顺序
            saveCustomEvents(events.value)
          }
          // 清理拖拽效果
          cleanDragEffects()
        }
      })
    }
  })
})

// 组件卸载时
onUnmounted(() => {
  // 清理定时器
  if (updateTimer) clearInterval(updateTimer)
  
  // 移除全局事件监听
  document.removeEventListener('keydown', handleEscKey)
  document.removeEventListener('click', handleGlobalClickOrTouch, true)
  document.removeEventListener('touchstart', handleGlobalClickOrTouch, true)
  
  // 销毁拖拽实例
  if (sortableInstance) { 
    sortableInstance.destroy(); 
    sortableInstance = null 
  }
  
  // 清理拖拽效果
  cleanDragEffects()
})

/* ========== 加载已保存的事件 ========== */
function loadEvents() {
  // 从本地存储获取事件列表
  const savedEvents = getCustomEvents()
  
  // 转换并补充必要字段
  events.value = savedEvents.map(event => ({
    ...event,
    hour: event.hour || '0',         // 确保时分秒有默认值
    minute: event.minute || '0',
    second: event.second || '0',
    isPast: false,                   // 初始化过期状态
    finalDisplay: '',                // 初始化显示文本
    dateTimeDesc: (event.date ?      // 格式化日期时间描述
      `${event.date.split('-')[0]}年${event.date.split('-')[1]}月${event.date.split('-')[2]}日`
        + ` ${(event.hour || '0').padStart(2,'0')}:${(event.minute || '0').padStart(2,'0')}:${(event.second || '0').padStart(2,'0')}` : '')
  }))
  
  // 计算最大的自定义编号
  const maxCounter = Math.max(...savedEvents.map(e => {
    // 匹配"自定义N"格式的名称
    const match = e.name.match(/^自定义(\d+)$/)
    return match ? parseInt(match[1]) : 0
  }), 0)
  
  // 设置下一个编号
  customCounter.value = maxCounter + 1
  
  // 立即更新倒计时显示
  updateCountdowns()
}
</script>
<style scoped>
/* ========== 组件容器样式 ========== */
.custom-countdown {
  margin-bottom: 8px;  /* 与其他模块的间距 */
}

/* ========== 标题样式 ========== */
.title {
  font-size: 18px;                      /* 标题字号 */
  color: var(--text-secondary);         /* 使用次要文本颜色（灰色） */
  font-weight: 400;                     /* 常规字重 */
  margin-bottom: 20px;                  /* 与输入区的间距 */
}

/* ========== 输入区域布局 ========== */
.input-area {
  display: flex;                        /* 弹性布局 */
  flex-wrap: wrap;                      /* 允许换行 */
  align-items: center;                  /* 垂直居中对齐 */
  gap: 12px;                           /* 子元素间距 */
  margin-bottom: 20px;                  /* 与事件列表的间距 */
}

/* ========== 输入组样式 ========== */
.input-group {
  display: flex;                        /* 横向排列 */
  flex-direction: row;                  /* 水平方向 */
  align-items: center;                  /* 垂直居中 */
  gap: 2px;                            /* 输入框之间的最小间距 */
  white-space: nowrap;                  /* 防止换行，保持一组输入框在同一行 */
  width: 300px;                         /* 固定宽度，确保3个输入框正好排列 */
}

/* ========== 通用输入框样式 ========== */
.input {
  height: 40px;                         /* 输入框高度 */
  width: 96px;                          /* 默认宽度 */
  min-width: 36px;                      /* 最小宽度，防止过窄 */
  max-width: 120px;                     /* 最大宽度，防止过宽 */
  padding: 0 8px;                       /* 内边距 */
  border-radius: 6px;                   /* 圆角 */
  border: 1px solid var(--border-color); /* 边框颜色 */
  background: var(--bg-tertiary);       /* 深色背景 */
  color: var(--text-primary);           /* 主文本颜色（白色） */
  font-size: 14px;                      /* 字号 */
  text-align: center;                   /* 文本居中 */
  font-family: inherit;                 /* 继承字体 */
  box-sizing: border-box;               /* 包含边框和内边距在内的盒模型 */
  outline: none;                        /* 移除默认聚焦轮廓 */
}

/* 输入框聚焦状态 */
.input:focus {
  border-color: var(--green-primary);   /* 聚焦时显示绿色边框 */
}

/* ========== 事件名称输入框特殊样式 ========== */
.event-name-input {
  flex: 1;                              /* 占据剩余空间 */
  min-width: 120px;                     /* 最小宽度 */
  max-width: 100%;                      /* 最大宽度不超过容器 */
  width: 100%;                          /* 默认占满容器宽度 */
  box-sizing: border-box;               /* 包含边框的盒模型 */
}

/* ========== 日期时间分隔符样式 ========== */
.date-separator {
  display: inline-block;                /* 内联块级元素 */
  width: 10px;                          /* 固定宽度，确保对齐 */
  text-align: center;                   /* 文本居中 */
  color: var(--text-secondary);         /* 次要文本颜色 */
  font-size: 16px;                      /* 字号 */
  margin: 0 2px;                        /* 左右边距 */
}

/* ========== 添加按钮样式 ========== */
.button.button-primary {
  min-width: 72px;                      /* 最小宽度 */
  max-width: 120px;                     /* 最大宽度 */
  height: 40px;                         /* 与输入框同高 */
  margin-left: 6px;                     /* 左边距 */
  z-index: 3;                           /* 提升层级，防止被遮挡 */
}

/* ========== 编辑弹窗样式 ========== */
.modal-overlay {
  position: fixed;                      /* 固定定位 */
  top: 0;                              /* 覆盖整个视窗 */
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);      /* 半透明黑色背景 */
  display: flex;                        /* 弹性布局 */
  align-items: center;                  /* 垂直居中 */
  justify-content: center;              /* 水平居中 */
  z-index: 2000;                       /* 高层级确保在最上层 */
}

/* 弹窗内容容器 */
.modal-content {
  background: var(--bg-secondary);      /* 次要背景色 */
  border-radius: 12px;                  /* 圆角 */
  padding: 24px;                        /* 内边距 */
  min-width: 400px;                     /* 最小宽度 */
  max-width: 90vw;                      /* 最大宽度不超过视窗的90% */
}

/* 弹窗标题 */
.modal-title {
  font-size: 18px;                      /* 标题字号 */
  color: var(--text-primary);           /* 主文本颜色 */
  margin-bottom: 20px;                  /* 底部间距 */
  text-align: center;                   /* 文本居中 */
}

/* 弹窗表单容器 */
.modal-form {
  display: flex;                        /* 弹性布局 */
  flex-direction: column;               /* 垂直排列 */
  gap: 12px;                           /* 行间距 */
  align-items: center;                  /* 水平居中对齐 */
  margin-bottom: 20px;                  /* 底部间距 */
}

/* 弹窗内的输入组 */
.modal-form .input-group {
  display: flex;                        /* 横向排列 */
  flex-direction: row;                  /* 水平方向 */
  align-items: center;                  /* 垂直居中 */
  gap: 2px;                            /* 输入框间距 */
  justify-content: center;              /* 水平居中 */
  width: 100%;                          /* 占满容器宽度 */
  margin-bottom: 7px;                   /* 底部间距 */
}

/* 编辑区事件名输入框 */
.edit-event-name-input {
  width: 324px;                         /* 固定宽度 */
  min-width: 120px;                     /* 最小宽度 */
  max-width: 100%;                      /* 最大不超过容器 */
  margin: 0;                            /* 无外边距 */
}

/* 弹窗操作按钮区 */
.modal-actions { 
  display: flex;                        /* 横向排列 */
  gap: 10px;                           /* 按钮间距 */
  justify-content: flex-end;            /* 右对齐 */
}

/* 次要按钮样式 */
.button-secondary {
  background: var(--bg-tertiary);       /* 深色背景 */
  color: var(--text-primary);           /* 主文本颜色 */
  border: 1px solid var(--border-color); /* 边框 */
}

/* 次要按钮悬停效果 */
.button-secondary:hover { 
  background: var(--border-color);      /* 悬停时背景变深 */
}

/* ========== 事件列表样式 ========== */
.events-list { 
  display: flex;                        /* 弹性布局 */
  flex-direction: column;               /* 垂直排列 */
  gap: 15px;                           /* 事件项间距 */
}

/* 单个事件容器 */
.event-container { 
  background: var(--bg-tertiary);       /* 深色背景 */
  border-radius: 12px;                  /* 圆角 */
  padding: 15px;                        /* 内边距 */
  position: relative;                   /* 相对定位 */
  overflow: visible;                    /* 允许手柄显示在容器外 */
  transition: background 0.2s;          /* 背景色过渡动画 */
}

/* 事件项网格布局 */
.event-item {
  position: relative;                   /* 相对定位，为绝对定位的子元素提供参考 */
  display: grid;                        /* 网格布局 */
  grid-template-columns: 200px 1fr 350px 40px; /* 4列：日期、名称、倒计时、菜单 */
  gap: 20px;                           /* 列间距 */
  align-items: start;                   /* 顶部对齐 */
  margin-bottom: 15px;                  /* 底部间距 */
}

/* 日期和倒计时列样式 */
.event-date-column, .event-countdown-column {
  font-size: 16px;                      /* 字号 */
  color: var(--text-primary);           /* 主文本颜色 */
  font-weight: 500;                     /* 中等字重 */
  white-space: nowrap;                  /* 不换行 */
  text-align: left;                     /* 左对齐 */
}

/* 事件名称列样式 */
.event-name-column {
  font-size: 16px;                      /* 字号 */
  color: var(--text-primary);           /* 主文本颜色 */
  font-weight: 500;                     /* 中等字重 */
  white-space: normal;                  /* 允许换行 */
  word-break: break-all;                /* 长单词断行 */
  text-align: left;                     /* 左对齐 */
}

/* 倒计时数字高亮样式 */
.event-countdown-column strong, .combo-num {
  color: var(--green-primary);          /* 绿色高亮 */
  font-weight: 600;                     /* 加粗 */
  margin: 0 4px;                        /* 左右间距 */
  font-style: normal;                   /* 正常字体样式 */
}

/* ========== 拖拽手柄样式 ========== */
/* 桌面端和移动端控制类 */
.desktop-only {
  display: none;
}

.mobile-only {
  display: block;
}

/* ========== 拖拽手柄样式调整 ========== */
/* 拖拽手柄基础样式 */
.drag-handle {
  position: absolute;
  top: 150%;
  transform: translateY(-50%);
  width: 24px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border-radius: 6px;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s, background 0.2s, transform 0.2s;
  z-index: 10;
}

/* 左侧手柄位置 - 调整到与卡片外轮廓垂直居中 */
.drag-handle-left {
  left: -40px;  /* 进一步向左，与卡片外轮廓对齐 */
}

/* 右侧手柄位置 - 调整到与卡片外轮廓垂直居中 */
.drag-handle-right {
  right: -40px;  /* 进一步向右，与卡片外轮廓对齐 */
}

/* 手柄悬停效果 */
.drag-handle:hover {
  color: var(--green-primary);
  background: var(--bg-tertiary);
  border-color: var(--green-primary);
  transform: translateY(-50%) scale(1.1);
}

/* 手柄激活效果 */
.drag-handle:active {
  color: var(--green-secondary);
  transform: translateY(-50%) scale(0.95);
}

/* ========== 菜单样式 ========== */
/* 菜单容器绝对定位 */
.menu-container.absolute-menu {
  position: absolute;                   /* 绝对定位 */
  top: -8px;                           /* 相对顶部偏移 */
  right: -10px;                        /* 相对右侧偏移 */
  z-index: 10;                         /* 提升层级 */
}

/* 菜单按钮（三个点） */
.menu-btn {
  width: 32px;                          /* 宽度 */
  height: 32px;                         /* 高度 */
  border: none;                         /* 无边框 */
  border-radius: 8px;                   /* 圆角 */
  background: var(--bg-tertiary);       /* 深色背景 */
  color: var(--text-secondary);         /* 次要文本颜色 */
  cursor: pointer;                      /* 手型光标 */
  font-size: 16px;                      /* 字号 */
  font-weight: bold;                    /* 加粗 */
  transition: all 0.2s;                 /* 过渡动画 */
  display: flex;                        /* 弹性布局 */
  align-items: center;                  /* 垂直居中 */
  justify-content: center;              /* 水平居中 */
}

/* 菜单按钮悬停效果 */
.menu-btn:hover { 
  background: var(--border-color);      /* 背景变深 */
  color: var(--text-primary);           /* 文本变亮 */
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;                   /* 绝对定位 */
  top: 100%;                           /* 位于按钮下方 */
  right: 0;                            /* 右对齐 */
  background: var(--bg-secondary);      /* 次要背景色 */
  border: 1px solid var(--border-color); /* 边框 */
  border-radius: 8px;                   /* 圆角 */
  box-shadow: 0 4px 12px rgba(0,0,0,0.3); /* 阴影 */
  z-index: 1000;                       /* 高层级 */
  min-width: 80px;                      /* 最小宽度 */
  padding: 4px 0;                       /* 上下内边距 */
}

/* 菜单项 */
.menu-item { 
  width: 100%;                          /* 占满宽度 */
  padding: 8px 16px;                    /* 内边距 */
  border: none;                         /* 无边框 */
  background: none;                     /* 无背景 */
  color: var(--text-primary);           /* 主文本颜色 */
  font-size: 14px;                      /* 字号 */
  text-align: left;                     /* 左对齐 */
  cursor: pointer;                      /* 手型光标 */
  transition: background-color 0.2s;    /* 背景色过渡 */
  font-family: inherit;                 /* 继承字体 */
}

/* 菜单项悬停效果 */
.menu-item:hover { 
  background: var(--bg-tertiary);       /* 深色背景 */
}

/* 删除菜单项特殊样式 */
.menu-item.delete { 
  color: #f44336;                       /* 红色文本 */
}

/* 删除菜单项悬停效果 */
.menu-item.delete:hover { 
  background: rgba(244,67,54,.1);       /* 淡红色背景 */
}

/* ========== 按钮组样式 ========== */
/* 按钮行容器 */
.button-row.horizontal-between {
  display: flex;                        /* 弹性布局 */
  flex-direction: row;                  /* 水平排列 */
  align-items: center;                  /* 垂直居中 */
  justify-content: space-between;       /* 两端对齐 */
  gap: 0;                              /* 无间距 */
  width: 100%;                          /* 占满宽度 */
  margin-top: 8px;                      /* 顶部间距 */
  margin-bottom: 8px;                   /* 底部间距 */
}

/* 连体按钮组容器 */
.joined-btn-group {
  display: flex;                        /* 横向排列 */
  flex-direction: row;                  /* 水平方向 */
  gap: 0;                              /* 按钮之间无间距 */
}

/* 连体按钮通用样式 */
.joined-btn {
  border-radius: 0;                     /* 默认无圆角 */
  margin-left: -1px;                    /* 负边距重叠边框 */
  border-width: 1px 1px 1px 0;          /* 只显示右边框 */
  width: 48px;                          /* 按钮宽度 */
  height: 28px;                         /* 按钮高度 */
  font-weight: 600;                     /* 字体加粗 */
  border: 1px solid var(--border-color); /* 边框颜色 */
  background: var(--bg-quaternary);     /* 更深的背景色 */
  color: var(--text-secondary);         /* 次要文本颜色 */
  font-size: 12px;                      /* 字号 */
  cursor: pointer;                      /* 手型光标 */
  transition: all 0.1s;                 /* 快速过渡效果 */
}

/* 第一个按钮左圆角 */
.joined-btn:first-child { 
  border-top-left-radius: 14px;         /* 左上圆角 */
  border-bottom-left-radius: 14px;      /* 左下圆角 */
  margin-left: 0;                       /* 无负边距 */
}

/* 最后一个按钮右圆角 */
.joined-btn:last-child { 
  border-top-right-radius: 14px;        /* 右上圆角 */
  border-bottom-right-radius: 14px;     /* 右下圆角 */
}

/* 按钮激活状态 */
.precision-btn.active,
.decimal-btn.active,
.unit-btn.active { 
  background: var(--green-primary);     /* 绿色背景 */
  color: var(--bg-primary);             /* 深色文本 */
}

/* 按钮禁用状态 */
.decimal-btn.disabled, .unit-btn.disabled {
  opacity: 0.5;                         /* 半透明 */
  cursor: not-allowed;                  /* 禁止光标 */
  background: var(--bg-quaternary);     /* 深色背景 */
  color: var(--text-tertiary);          /* 更淡的文本颜色 */
}

/* ========== 空状态提示 ========== */
.empty-tip { 
  text-align: center;                   /* 居中对齐 */
  color: var(--text-tertiary);          /* 淡色文本 */
  font-size: 14px;                      /* 字号 */
  padding: 20px;                        /* 内边距 */
}

/* ========== 拖拽效果样式 ========== */
/* 拖拽选中和拖拽中的样式 */
.drag-chosen, .drag-dragging {
  box-shadow: 0 8px 40px rgba(52, 206, 99, .22), 0 2px 18px #0004; /* 绿色光晕阴影 */
  transform: scale(1.03);               /* 轻微放大 */
  z-index: 100;                         /* 提升层级 */
  cursor: move;                         /* 移动光标 */
}

/* 拖拽时的占位符（ghost）样式 - 目标位置淡显 */
.drag-ghost {
  opacity: 0.2 !important;              /* 设置为20%不透明度 */
  background: var(--bg-tertiary);       /* 保持背景色 */
  box-shadow: none !important;          /* 移除阴影 */
  transform: scale(1) !important;       /* 保持原始大小 */
}

/* 确保拖拽时的镜像元素保持可见 */
.sortable-fallback {
  opacity: 1 !important;                /* 拖拽镜像保持完全不透明 */
}

/* ========== 桌面端特有样式 ========== */
@media (min-width: 769px) {
  /* 桌面端显示手柄，隐藏移动端拖拽区 */
  .desktop-only {
    display: flex !important;
  }
  
  .mobile-only {
    display: none !important;
  }
  
  /* 桌面端事件列表留出手柄空间 */
  .events-list {
    padding: 0 0px;
  }
  
  /* 鼠标悬停在事件容器时的效果 - 仅桌面端 */
  .event-container:hover {
    background: var(--bg-quaternary);
  }
  
  /* 鼠标悬停时显示手柄 */
  .event-container:hover .drag-handle {
    opacity: 1;
  }
}

/* ========== 移动端响应式样式 ========== */
@media (max-width: 768px) {
  /* 输入区域垂直布局 */
  .input-area { 
    flex-direction: column;             /* 改为垂直排列 */
    align-items: center;                /* 水平居中 */
    gap: 10px;                         /* 减小间距 */
  }
  
  /* 输入组保持横向但居中 */
  .input-group {
    flex-direction: row;                /* 保持横向 */
    width: 100%;                        /* 占满宽度 */
    justify-content: center;            /* 居中对齐 */
    margin-bottom: 6px;                 /* 底部间距 */
  }
  
  /* 移动端输入框样式调整 */
  .input {
    min-width: 28px;                    /* 更小的最小宽度 */
    max-width: 120px;                   /* 保持最大宽度 */
    width: 96px;                        /* 默认宽度 */
    font-size: 15px;                    /* 稍大的字号 */
  }
  
  /* 事件名输入框移动端样式 */
  .event-name-input {
    display: block;                     /* 块级显示 */
    min-width: 325px;                   /* 最小宽度 */
    margin: 0 auto;                     /* 水平居中 */
    font-size: 18px;                    /* 更大的字号 */
    line-height: 40px;                  /* 行高与输入框高度一致 */
    box-sizing: border-box;             /* 包含边框的盒模型 */
    padding: 0 0px;                     /* 无水平内边距 */
  }
  
  /* 移动端事件容器样式 */
  .event-container {
    -webkit-tap-highlight-color: transparent;  /* 移除默认点击高亮 */
    user-select: none;                        /* 防止文本选择 */
  }
  
  /* 事件项改为垂直布局 */
  .event-item {
    display: flex !important;           /* 强制使用弹性布局 */
    flex-direction: column !important;  /* 垂直排列 */
    align-items: center !important;     /* 水平居中 */
    width: 100%;                        /* 占满宽度 */
    gap: 8px;                          /* 行间距 */
    justify-content: flex-start;        /* 顶部对齐 */
    text-align: center;                 /* 文本居中 */
  }
  
  /* 事件各列移动端样式 */
  .event-date-column,
  .event-name-column,
  .event-countdown-column {
    width: 100%;                        /* 占满宽度 */
    text-align: center !important;      /* 强制居中 */
    word-break: break-all;              /* 允许断词 */
    margin-bottom: 2px;                 /* 底部间距 */
    display: block;                     /* 块级显示 */
  }
  
  /* 按钮行改为垂直布局 */
  .button-row.horizontal-between {
    flex-direction: column !important;  /* 垂直排列 */
    align-items: center !important;     /* 水平居中 */
    gap: 8px !important;               /* 行间距 */
    width: 100%;                        /* 占满宽度 */
    margin-top: 8px;                    /* 顶部间距 */
    margin-bottom: 8px;                 /* 底部间距 */
  }
  
  /* 按钮组移动端样式 */
  .joined-btn-group {
    justify-content: center !important; /* 居中对齐 */
    width: 100%;                        /* 占满宽度 */
    margin: 0 auto;                     /* 水平居中 */
    gap: 0;                            /* 无间距 */
  }
  
  /* 菜单保持绝对定位 */
  .menu-container.absolute-menu {
    position: absolute;                 /* 保持绝对定位 */
    top: 0;                            /* 顶部对齐 */
    right: 0;                          /* 右侧对齐 */
    z-index: 10;                       /* 层级 */
    margin: 0;                         /* 无外边距 */
  }
  
  /* 编辑区事件名输入框 */
  .edit-event-name-input {
    min-width: 325px;                   /* 最小宽度 */
    margin: 0 auto;                     /* 水平居中 */
    height: 40px;                       /* 高度 */
    font-size: 17px;                    /* 字号 */
    box-sizing: border-box;             /* 盒模型 */
    display: block;                     /* 块级显示 */
  }
  
  /* 移动端事件列表无需额外内边距 */
  .events-list {
    padding: 0;
  }
}

/* ========== 平板设备响应式 ========== */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 调整事件项列宽以适应平板屏幕 */
  .event-item { 
    grid-template-columns: 100px 1fr 180px 40px; /* 缩小日期和倒计时列宽 */
    gap: 15px;                         /* 减小列间距 */
  }
}

/* ========== 触摸设备特殊处理 ========== */
@media (any-pointer:coarse) {
  /* 保持拖拽区域可以垂直滚动 */
  .drag-blank-area { 
    touch-action: pan-y !important;     /* 允许垂直滑动，但可以横向拖拽 */
  }
}
</style>
