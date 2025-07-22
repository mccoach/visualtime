<template>
  <!-- 组件根容器 -->
  <div class="custom-countdown card">

    <!-- 头部区域，包含标题和操作按钮 -->
    <div class="custom-countdown-header">
      
      <!-- 左侧区域，用于放置标题 -->
      <div class="header-zone-left">
        <h3 class="title">
          自定义倒计时
        </h3>
      </div>

      <!-- 右侧区域，包含所有操作按钮 -->
      <div class="header-actions header-zone-right">

        <!-- 批量删除按钮 (仅在多选模式下显示) -->
        <button
          v-if="isMultiSelectMode && selectedEventIds.size > 0"
          class="button button-danger bulk-delete-btn"
          @click="bulkDelete"
          :title="`删除选中的 ${selectedEventIds.size} 个项目`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          批量删除
        </button>

        <!-- [结构重点] 连体按钮组的容器 -->
        <div class="joined-btn-group">
          
          <!-- "添加"按钮 -->
          <button
            class="joined-btn action-btn add-btn"
            @click="openAddModal"
            title="添加新倒计时"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="3" x2="12" y2="21"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
            </svg>
          </button>
          
          <!-- "排序"按钮 -->
          <button
            class="joined-btn action-btn"
            :class="{ active: sortOrder !== 'manual' }"
            @click="cycleSortOrder"
            :title="`当前排序: ${sortOrder === 'manual' ? '手动' : (sortOrder === 'asc' ? '升序' : '降序')}`"
          >
            <!-- ▼ SVG-1: 手动排序图标 ▼ -->
            <svg v-if="sortOrder === 'manual'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="9" y1="3" x2="9" y2="21" stroke-width="3" stroke-linecap="round"/>
                <line x1="9" y1="3" x2="4" y2="10" stroke-width="2" stroke-linecap="round"/>
                <line x1="15" y1="3" x2="15" y2="21" stroke-width="3" stroke-linecap="round"/>
                <line x1="20" y1="14" x2="15" y2="21" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <!-- ▼ SVG-2: 升序图标 ▼ -->
            <svg v-else-if="sortOrder === 'asc'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="9" y1="1" x2="9" y2="23" stroke-width="4" stroke-linecap="round"/>
                <line x1="9" y1="1" x2="4" y2="10" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <!-- ▼ SVG-3: 降序图标 ▼ -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="15" y1="1" x2="15" y2="23" stroke-width="4" stroke-linecap="round"/>
                <line x1="20" y1="14" x2="15" y2="23" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </button>
          
          <!-- "多选"按钮 -->
          <button
            class="joined-btn action-btn"
            :class="{ active: isMultiSelectMode }"
            @click="toggleMultiSelectMode"
            title="切换多选模式"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="1" y="1" width="22" height="22" rx="0" ry="0"/>
              <path d="m5 14 4 4 10 -12"/>
            </svg>
          </button>

        </div> <!-- [结构重点] 这是 .joined-btn-group 的闭合标签 -->

      </div> <!-- 这是 .header-actions 的闭合标签 -->

    </div> <!-- 这是 .custom-countdown-header 的闭合标签 -->

    <!-- 添加/编辑弹窗 -->
    <div
      v-if="isModalOpen"
      class="modal-overlay"
      @click.self="closeModal"
    >
      <div
        class="modal-content"
        @click.stop
      >
        <h3 class="modal-title">
          {{ modalTitle }}
        </h3>
        <div class="modal-form">
          <div class="input-group">
            <input ref="formYearRef" v-model="eventForm.year" type="text" class="input" placeholder="年" @input="formInteractionHandler.onInput($event, 'year')" @keydown="formInteractionHandler.onKeydown($event, 'year')" @focus="formInteractionHandler.onFocus($event, 'year')" @blur="formInteractionHandler.onBlur('year')" @wheel.prevent="formInteractionHandler.onWheel($event, 'year')">
            <span class="date-separator">-</span>
            <input ref="formMonthRef" v-model="eventForm.month" type="text" class="input" placeholder="月" @input="formInteractionHandler.onInput($event, 'month')" @keydown="formInteractionHandler.onKeydown($event, 'month')" @focus="formInteractionHandler.onFocus($event, 'month')" @blur="formInteractionHandler.onBlur('month')" @wheel.prevent="formInteractionHandler.onWheel($event, 'month')">
            <span class="date-separator">-</span>
            <input ref="formDayRef" v-model="eventForm.day" type="text" class="input" placeholder="日" @input="formInteractionHandler.onInput($event, 'day')" @keydown="formInteractionHandler.onKeydown($event, 'day')" @focus="formInteractionHandler.onFocus($event, 'day')" @blur="formInteractionHandler.onBlur('day')" @wheel.prevent="formInteractionHandler.onWheel($event, 'day')">
          </div>
          <div class="input-group">
            <input ref="formHourRef" v-model="eventForm.hour" type="text" class="input" placeholder="时" @input="formInteractionHandler.onInput($event, 'hour')" @keydown="formInteractionHandler.onKeydown($event, 'hour')" @focus="formInteractionHandler.onFocus($event, 'hour')" @blur="formInteractionHandler.onBlur('hour')" @wheel.prevent="formInteractionHandler.onWheel($event, 'hour')">
            <span class="date-separator">:</span>
            <input ref="formMinuteRef" v-model="eventForm.minute" type="text" class="input" placeholder="分" @input="formInteractionHandler.onInput($event, 'minute')" @keydown="formInteractionHandler.onKeydown($event, 'minute')" @focus="formInteractionHandler.onFocus($event, 'minute')" @blur="formInteractionHandler.onBlur('minute')" @wheel.prevent="formInteractionHandler.onWheel($event, 'minute')">
            <span class="date-separator">:</span>
            <input ref="formSecondRef" v-model="eventForm.second" type="text" class="input" placeholder="秒" @input="formInteractionHandler.onInput($event, 'second')" @keydown="formInteractionHandler.onKeydown($event, 'second')" @focus="formInteractionHandler.onFocus($event, 'second')" @blur="formInteractionHandler.onBlur('second')" @wheel.prevent="formInteractionHandler.onWheel($event, 'second')">
          </div>
          <input ref="formNameRef" v-model="eventForm.name" type="text" class="input event-name-input" placeholder="事件名称（可选）" @keydown="formInteractionHandler.onKeydown($event, 'name')" @focus="formInteractionHandler.onFocus($event, 'name')" @blur="formInteractionHandler.onBlur('name')">
        </div>
        <div class="modal-actions">
          <button class="button button-secondary" @click="closeModal">取消</button>
          <button class="button button-primary" @click="saveEvent" :disabled="!isFormValid">保存</button>
        </div>
      </div>
    </div>

    <!-- 事件列表 -->
    <div class="events-list" ref="eventsListRef">
      <div
        v-for="event in events"
        :key="event.id"
        :ref="el => eventItemRefs[event.id] = el"
        class="event-container"
        :class="{
          'pending-copy': pendingCopyId === event.id,
          'pending-delete': pendingDeleteId === event.id,
          'is-selected': isMultiSelectMode && selectedEventIds.has(event.id),
          'menu-is-active': activeMenu === event.id
        }"
        @click="handleItemClick(event)"
        @mouseenter="handleEventMouseEnter(event.id)"
        @mouseleave="handleEventMouseLeave"
        @mousemove="handleEventMouseMove"
      >
        <div class="drag-handle drag-handle-left desktop-only" title="拖动排序">
          <svg width="10" height="24" fill="currentColor"><circle cx="8" cy="6" r="1.5"/><circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="8" cy="18" r="1.5"/></svg>
        </div>
        <div class="drag-handle drag-handle-right desktop-only" title="拖动排序">
          <svg width="10" height="24" fill="currentColor"><circle cx="2" cy="6" r="1.5"/><circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="2" cy="18" r="1.5"/></svg>
        </div>
        <div class="event-item">
          <div class="drag-blank-area mobile-only" title="拖动排序"></div>
          <div class="event-name-column" :title="event.name" >
            {{ event.name }}
          </div>
          <div class="event-date-column" :ref="el => dateColumnRefs[event.id] = el">
            <span :ref="el => dateContentRefs[event.id] = el">{{ event.dateTimeDesc }}</span>
          </div>
          <div class="event-countdown-column" :ref="el => countdownColumnRefs[event.id] = el">
            <span :ref="el => countdownContentRefs[event.id] = el" v-html="event.finalDisplay"></span>
          </div>
          <!-- [修改] 为每个菜单容器添加 ref，以便进行焦点判断 -->
          <div class="settings-menu-container" :ref="el => menuContainerRefs[event.id] = el" @click.stop>
            <button class="menu-trigger-btn" @click="toggleMenu(event.id)" :class="{ active: activeMenu === event.id }">⋮</button>
            <div v-if="activeMenu === event.id" class="settings-dropdown-panel">
              <div class="dropdown-column">
                <button v-for="unit in unitOptions" :key="unit.value" :class="['menu-option-btn', { active: event.unit === unit.value }]" @click="handleUnitChange(event.id, unit.value)">
                  {{ unit.label }}
                </button>
              </div>
              <div class="dropdown-column">
                <button v-for="p in getAvailablePrecisions(event.unit)" :key="p.value" :class="['menu-option-btn', { active: event.decimalPrecision === p.value }]" @click="handlePrecisionChange(event.id, p.value)">
                  {{ p.label }}
                </button>
              </div>
              <div class="dropdown-column">
                <button class="menu-option-btn" @click="handleEdit(event)">编辑</button>
                <button class="menu-option-btn" @click="handleCopy(event)">复制</button>
                <button class="menu-option-btn delete" @click="handleMenuDelete(event.id)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-if="events.length === 0" class="empty-tip">
        暂无自定义倒计时，请添加
      </p>
    </div>

    <!-- 框选矩形 -->
    <div
      v-if="isMarqueeSelecting"
      class="marquee-select-box"
      :style="{
        left: marqueeBox.x + 'px',
        top: marqueeBox.y + 'px',
        width: marqueeBox.width + 'px',
        height: marqueeBox.height + 'px'
      }"
    ></div>

  </div> <!-- 这是 .custom-countdown.card 的闭合标签 -->

  <!-- 快捷键提示浮层 -->
  <Transition name="hint-fade">
    <div v-if="showOperationHint && hoveredEventId && !pendingDeleteId && !pendingCopyId" class="operation-hint" :style="{ left: mousePosition.x + 'px', top: mousePosition.y + 'px' }">
      <div class="hint-content">
        <div class="hint-item">
          <span class="hint-key">按 Space  或 / 键</span>
          <span class="hint-action">编辑</span>
        </div>
        <div class="hint-item">
          <span class="hint-key">按 Insert 或 + 键</span>
          <span class="hint-action">复制</span>
        </div>
        <div class="hint-item">
          <span class="hint-key">按 Delete 或 - 键</span>
          <span class="hint-action">删除</span>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 确认复制浮层 -->
  <Transition name="hint-fade">
    <div v-if="pendingCopyId && pendingCopyId === hoveredEventId" class="copy-confirm-hint" :style="{ left: mousePosition.x + 'px', top: mousePosition.y + 'px' }">
      再按一次 Insert 或 + 确认复制
    </div>
  </Transition>
  
  <!-- 确认删除浮层 -->
  <Transition name="hint-fade">
    <div v-if="pendingDeleteId && pendingDeleteId === hoveredEventId" class="delete-confirm-hint" :style="{ left: mousePosition.x + 'px', top: mousePosition.y + 'px' }">
      再按一次 Delete 或 - 确认删除
    </div>
  </Transition>

</template>

<script setup>
// ========== 依赖导入 ==========
import { ref, computed, onMounted, nextTick, onUnmounted, watch, onBeforeUpdate } from 'vue';
import Sortable from 'sortablejs';
import { getCustomEvents, saveCustomEvents } from '../utils/storage';
import { DateTime } from 'luxon';
import { calculateCustomDifference } from '../utils/dateUtils';
import { createResponsiveFontAdapter } from '../utils/fontSizeManager.js';
// [新增] 从全局广播网关导入通信函数
import { broadcastMenuOpened, listenForOtherMenuOpened } from '../utils/eventBus.js';


// [新增] 定义本组件在广播系统中的唯一身份ID
const COMPONENT_ID = 'custom-countdown';
// [新增] 用于存储 eventBus 返回的清理函数
let cleanupMenuListener = null;


// ========== 状态管理（State Management） ==========
const isModalOpen = ref(false);
const modalTitle = ref('添加自定义倒计时');
const activeEventData = ref(null);
const eventForm = ref({ year: '', month: '', day: '', hour: '', minute: '', second: '', name: '' });
const valueBeforeFocus = ref('');
const events = ref([]);
const customCounter = ref(1);
const activeMenu = ref(null);
const eventsListRef = ref(null);
let sortableInstance = null;
const sortOrder = ref('manual');
const isMultiSelectMode = ref(false);
const selectedEventIds = ref(new Set());
const isMarqueeSelecting = ref(false);
const marqueeStartPos = ref({ x: 0, y: 0 });
const marqueeBox = ref({ x: 0, y: 0, width: 0, height: 0 });
const eventItemRefs = ref({});
const hoveredEventId = ref(null);
const mousePosition = ref({ x: 0, y: 0 });
const showOperationHint = ref(false);
let operationHintTimer = null;
let operationHintHideTimer = null;
const pendingCopyId = ref(null);
const pendingDeleteId = ref(null);

const dateColumnRefs = ref({});
const countdownColumnRefs = ref({});
const dateContentRefs = ref({});
const countdownContentRefs = ref({});
let fontAdapters = {};
// [新增] 为每个菜单容器创建DOM引用集合
const menuContainerRefs = ref({});


// ========== DOM 引用 ==========
const formYearRef = ref(null);
const formMonthRef = ref(null);
const formDayRef = ref(null);
const formHourRef = ref(null);
const formMinuteRef = ref(null);
const formSecondRef = ref(null);
const formNameRef = ref(null);
const formRefs = { year: formYearRef, month: formMonthRef, day: formDayRef, hour: formHourRef, minute: formMinuteRef, second: formSecondRef, name: formNameRef };


// ========== 配置与常量 ==========
const fieldOrder = [ 'year', 'month', 'day', 'hour', 'minute', 'second', 'name' ];
const fieldConfig = {
  year: { maxLength: 6, min: -99999, max: 99999 },
  month: { maxLength: 2, min: 1, max: 12 },
  day: {
    maxLength: 2,
    min: 1,
    get max() {
      const year = Number(eventForm.value.year) || DateTime.now().year;
      const month = Number(eventForm.value.month) || 1;
      return DateTime.fromObject({ year, month }).daysInMonth;
    }
  },
  hour: { maxLength: 2, min: 0, max: 23 },
  minute: { maxLength: 2, min: 0, max: 59 },
  second: { maxLength: 2, min: 0, max: 59 },
  name: {}
};
const unitOptions = [ { value: 'year', label: '年' }, { value: 'month', label: '月' }, { value: 'week', label: '周' }, { value: 'day', label: '天' }, { value: 'hour', label: '时' }, { value: 'minute', label: '分' }, { value: 'second', label: '秒' } ];
const allPrecisionOptions = [
  { value: 'combo', label: '0:0' },
  { value: 0, label: '0' },
  { value: 1, label: '0.0' },
  { value: 2, label: '0.00' }
];
const getAvailablePrecisions = (unit) => {
  if (unit === 'second') {
    return allPrecisionOptions.filter(p => p.value === 'combo' || p.value === 0);
  }
  if (unit === 'minute') {
    return allPrecisionOptions.filter(p => p.value === 'combo' || p.value <= 1);
  }
  return allPrecisionOptions;
};


// ========== 核心逻辑：输入处理与交互 ==========
const formInteractionHandler = {
  onInput(event, field) { let value = event.target.value; const config = fieldConfig[field]; if (field === 'year') { value = value.replace(/[^0-9-]/g, ''); if (value.lastIndexOf('-') > 0) { value = value.replace(/-/g, (match, offset) => offset === 0 ? match : ''); } } else if (field !== 'name') { value = value.replace(/\D/g, ''); } if (config.maxLength && value.length > config.maxLength) { value = value.slice(0, config.maxLength); } eventForm.value[field] = value; if (field !== 'name' && value.length >= config.maxLength) { const currentIndex = fieldOrder.indexOf(field); const nextField = fieldOrder[currentIndex + 1]; if (nextField) { formRefs[nextField].value?.focus(); } } },
  onKeydown(event, field) { const { key, ctrlKey, metaKey, shiftKey, target } = event; const config = fieldConfig[field]; const navigate = (direction) => { event.preventDefault(); const currentIndex = fieldOrder.indexOf(field); const nextIndex = (currentIndex + direction + fieldOrder.length) % fieldOrder.length; const nextFieldKey = fieldOrder[nextIndex]; formRefs[nextFieldKey].value?.focus(); }; const adjustValue = (delta) => { if (field === 'name') return; event.preventDefault(); let numValue = Number(eventForm.value[field]) || 0; numValue += delta; const { min, max } = config; const maxValue = typeof max === 'function' ? max() : max; if (numValue > maxValue) numValue = min; if (numValue < min) numValue = maxValue; eventForm.value[field] = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); }; switch (key) { case 'Enter': if (ctrlKey || metaKey) { event.preventDefault(); saveEvent(); } else if (field === 'name') { event.preventDefault(); saveEvent(); } else { navigate(1); } break; case 'Tab': navigate(shiftKey ? -1 : 1); break; case 'ArrowLeft': if (ctrlKey || (target.selectionStart === 0 && target.selectionEnd === 0)) { navigate(-1); } break; case 'ArrowRight': if (ctrlKey || (target.selectionStart === target.value.length)) { navigate(1); } break; case 'ArrowUp': adjustValue(1); break; case 'ArrowDown': adjustValue(-1); break; case 'Escape': case 'Esc': event.preventDefault(); event.stopPropagation(); eventForm.value[field] = valueBeforeFocus.value; target.blur(); break; default: if (field !== 'name' && !/^[0-9]$/.test(key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key) && !ctrlKey && !metaKey) { if (!(field === 'year' && key === '-' && target.selectionStart === 0 && !eventForm.value.year.includes('-'))) { event.preventDefault(); } } break; } },
  onWheel(event, field) { if (field === 'name') return; const delta = event.deltaY < 0 ? 1 : -1; let numValue = Number(eventForm.value[field]) || 0; numValue += delta; const { min, max } = fieldConfig[field]; const maxValue = typeof max === 'function' ? max() : max; if (numValue > maxValue) numValue = min; if (numValue < min) numValue = maxValue; eventForm.value[field] = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); },
  onFocus(event, field) {
    valueBeforeFocus.value = eventForm.value[field];
    if (!eventForm.value[field] && field !== 'name') {
      const current = DateTime.now();
      const val = current[field];
      eventForm.value[field] = (field === 'year') ? String(val) : String(val).padStart(2, '0');
    }
    nextTick(() => event.target.select());
  },
  onBlur(field) { if (field === 'name' || !eventForm.value[field]) return; let value = eventForm.value[field]; if (field === 'year' && (value === '-' || value === '-0')) { eventForm.value[field] = ''; return; } if (field !== 'year' && value.length === 1) { value = '0' + value; } let numValue = Number(value); const { min, max } = fieldConfig[field]; const maxValue = typeof max === 'function' ? max() : max; if (numValue < min) numValue = min; if (numValue > maxValue) numValue = maxValue; const finalValue = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); if (finalValue !== eventForm.value[field]) { eventForm.value[field] = finalValue; } }
};

const isFormValid = computed(() => {
  const form = eventForm.value;
  const dt = DateTime.fromObject({
    year: Number(form.year),
    month: Number(form.month),
    day: Number(form.day),
    hour: Number(form.hour),
    minute: Number(form.minute),
    second: Number(form.second)
  });
  const isYearValid = Number(form.year) >= -99999 && Number(form.year) <= 99999 && form.year !== '' && form.year !== '-';
  return dt.isValid && isYearValid;
});


// ========== 核心逻辑：弹窗控制 ==========
function openAddModal() { activeMenu.value = null; modalTitle.value = '添加自定义倒计时'; activeEventData.value = { id: `new_${Date.now()}`, unit: 'day', decimalPrecision: 0 }; Object.keys(eventForm.value).forEach(k => eventForm.value[k] = ''); isModalOpen.value = true; nextTick(() => formRefs.year.value?.focus()); }
function handleEdit(event) {
  activeMenu.value = null;
  modalTitle.value = '编辑事件';
  activeEventData.value = { ...event };
  Object.assign(eventForm.value, {
    ...event,
    year: String(event.year),
    month: String(event.month),
    day: String(event.day),
  });
  isModalOpen.value = true;
  nextTick(() => formRefs.year.value?.focus());
}
function handleCopy(eventToCopy) {
  activeMenu.value = null;
  modalTitle.value = '复制并新增事件';
  const newEventData = {
    ...eventToCopy,
    id: `new_${Date.now()}`,
    name: `${eventToCopy.name} - 副本`
  };
  activeEventData.value = newEventData;
  Object.assign(eventForm.value, {
    ...newEventData,
    year: String(newEventData.year),
    month: String(newEventData.month),
    day: String(newEventData.day),
  });
  isModalOpen.value = true;
  nextTick(() => formRefs.year.value?.focus());
}
function closeModal() { isModalOpen.value = false; activeEventData.value = null; }


// ========== 核心逻辑：数据持久化 ==========
function saveEvent() {
  if (!isFormValid.value) {
    alert('请填写完整且合法的时间');
    return;
  }
  const f = eventForm.value;
  const newEvent = {
    ...activeEventData.value,
    name: f.name || `自定义${customCounter.value}`,
    year: Number(f.year),
    month: Number(f.month),
    day: Number(f.day),
    hour: String(f.hour),
    minute: String(f.minute),
    second: String(f.second),
  };
  delete newEvent.date;
  const existingIndex = events.value.findIndex(e => e.id === newEvent.id);
  if (existingIndex !== -1) {
    events.value[existingIndex] = newEvent;
  } else {
    newEvent.id = Date.now();
    events.value.unshift(newEvent);
    if (!f.name) customCounter.value++;
  }
  saveCustomEvents(events.value);
  updateAllEventsDisplay();
  closeModal();
}
function handleDelete(id) {
  events.value = events.value.filter(e => e.id !== id);
  saveCustomEvents(events.value);
  updateAllEventsDisplay();
  if (pendingDeleteId.value === id) { pendingDeleteId.value = null; }
  
  const dateAdapterKey = `${id}_date`;
  const countdownAdapterKey = `${id}_countdown`;
  if (fontAdapters[dateAdapterKey]) {
    fontAdapters[dateAdapterKey].destroy();
    delete fontAdapters[dateAdapterKey];
  }
  if (fontAdapters[countdownAdapterKey]) {
    fontAdapters[countdownAdapterKey].destroy();
    delete fontAdapters[countdownAdapterKey];
  }
}
function handleMenuDelete(id) { activeMenu.value = null; if (confirm('确定要删除这个事件吗？')) { handleDelete(id); } }


// ========== 排序、多选和框选逻辑 ==========
function cycleSortOrder() {
    const orderCycle = { manual: 'asc', asc: 'desc', desc: 'manual' };
    sortOrder.value = orderCycle[sortOrder.value];
    const getSortableDate = (event) => DateTime.fromObject({
        year: event.year,
        month: event.month,
        day: event.day,
        hour: Number(event.hour || 0),
        minute: Number(event.minute || 0),
        second: Number(event.second || 0)
    });
    if (sortOrder.value === 'manual') {
        const savedEvents = getCustomEvents();
        events.value = savedEvents;
        if (sortableInstance) sortableInstance.option('disabled', false);
    } else {
        events.value.sort((a, b) => {
            const dateA = getSortableDate(a);
            const dateB = getSortableDate(b);
            if (!dateA.isValid) return 1;
            if (!dateB.isValid) return -1;
            return sortOrder.value === 'asc' ? dateA.toMillis() - dateB.toMillis() : dateB.toMillis() - dateA.toMillis();
        });
        if (sortableInstance) sortableInstance.option('disabled', true);
    }
    nextTick(updateAllEventsDisplay);
}
function toggleMultiSelectMode() { isMultiSelectMode.value = !isMultiSelectMode.value; if (!isMultiSelectMode.value) { selectedEventIds.value.clear(); } }
function handleItemClick(event) { if (!isMultiSelectMode.value) return; if (selectedEventIds.value.has(event.id)) { selectedEventIds.value.delete(event.id); } else { selectedEventIds.value.add(event.id); } }
function bulkDelete() { if (selectedEventIds.value.size === 0) return; if (confirm(`您确定要删除选中的 ${selectedEventIds.value.size} 个倒计时吗？此操作不可撤销。`)) { const idsToDelete = new Set(selectedEventIds.value); events.value = events.value.filter(event => !idsToDelete.has(event.id)); saveCustomEvents(events.value); idsToDelete.forEach(id => handleDelete(id)); selectedEventIds.value.clear(); isMultiSelectMode.value = false; updateAllEventsDisplay(); } }


// ========== 核心逻辑：倒计时显示与更新 ==========
let animationFrameId = null;
function getEffectiveInterval(event) { if (event.decimalPrecision === 'combo' || event.unit === 'second') { return 1000; } const precision = event.decimalPrecision || 0; if (precision === 0) { switch(event.unit) { case 'minute': return 60 * 1000; case 'hour': return 60 * 60 * 1000; default: return 1000; } } const factor = Math.pow(10, -precision); let unitMillis; switch(event.unit) { case 'minute': unitMillis = 60 * 1000; break; case 'hour': unitMillis = 60 * 60 * 1000; break; case 'day': unitMillis = 24 * 60 * 60 * 1000; break; case 'week': unitMillis = 7 * 24 * 60 * 60 * 1000; break; case 'month': unitMillis = 30.44 * 24 * 60 * 60 * 1000; break; case 'year': unitMillis = 365.24 * 24 * 60 * 60 * 1000; break; default: unitMillis = 1000; } return Math.max(50, factor * unitMillis); }
function updateSingleEventDisplay(event) {
  const { finalDisplay, dateTimeDesc } = calculateCustomDifference(event);
  event.finalDisplay = finalDisplay;
  event.dateTimeDesc = dateTimeDesc;
}
function updateAllEventsDisplay() { events.value.forEach(event => updateSingleEventDisplay(event)); }
function mainLoop() { const now = Date.now(); events.value.forEach(event => { if (!event.nextUpdateTime || now >= event.nextUpdateTime) { updateSingleEventDisplay(event); const interval = getEffectiveInterval(event); event.nextUpdateTime = now + interval; } }); animationFrameId = requestAnimationFrame(mainLoop); }


// ========== 字号自适应逻辑 ==========
function setupAllAdapters() {
  Object.values(fontAdapters).forEach(adapter => adapter.destroy());
  fontAdapters = {};

  events.value.forEach(event => {
    const dateColumnEl = dateColumnRefs.value[event.id];
    const countdownColumnEl = countdownColumnRefs.value[event.id];
    const dateContentEl = dateContentRefs.value[event.id];
    const countdownContentEl = countdownContentRefs.value[event.id];

    if (dateColumnEl && dateContentEl) {
      const dateAdapterKey = `${event.id}_date`;
      fontAdapters[dateAdapterKey] = createResponsiveFontAdapter({
        container: dateColumnEl,
        elements: [dateContentEl],
        minSize: window.innerWidth <= 800 ? 9 : 12,
        debounceDelay: 50,
      });
    }

    if (countdownColumnEl && countdownContentEl) {
      const countdownAdapterKey = `${event.id}_countdown`;
      const elementsToScale = [countdownContentEl, ...countdownContentEl.querySelectorAll('*')];
      fontAdapters[countdownAdapterKey] = createResponsiveFontAdapter({
        container: countdownColumnEl,
        elements: elementsToScale,
        minSize: window.innerWidth <= 800 ? 9 : 12,
        debounceDelay: 50,
      });
    }
  });
}


// ========== 交互处理 ==========
// [修改] 切换菜单状态时，如果是打开操作，则先通过广播网关通知其他组件
const toggleMenu = (id) => {
  const willOpenId = activeMenu.value === id ? null : id;
  if (willOpenId !== null) {
    // 调用 eventBus 的辅助函数进行广播，注意这里的ID构造方式
    broadcastMenuOpened(`${COMPONENT_ID}-${id}`);
  }
  activeMenu.value = willOpenId;
};
function handleUnitChange(id, unit) {
  const event = events.value.find(e => e.id === id);
  if (event) {
    event.unit = unit;
    if (event.decimalPrecision === 'combo') { event.decimalPrecision = 0; }
    if (unit === 'second' && event.decimalPrecision !== 'combo' && event.decimalPrecision > 0) { event.decimalPrecision = 0; }
    if (unit === 'minute' && event.decimalPrecision === 2) { event.decimalPrecision = 1; }
    saveCustomEvents(events.value);
    event.nextUpdateTime = 0;
    updateSingleEventDisplay(event);
  }
  activeMenu.value = null;
}
function handlePrecisionChange(id, precision) {
  const event = events.value.find(e => e.id === id);
  if (event) {
    event.decimalPrecision = precision;
    saveCustomEvents(events.value);
    event.nextUpdateTime = 0;
    updateSingleEventDisplay(event);
  }
  activeMenu.value = null;
}
function handleEventMouseEnter(eventId) { if (window.innerWidth <= 800) return; if (pendingCopyId.value && pendingCopyId.value !== eventId) { pendingCopyId.value = null; } if (pendingDeleteId.value && pendingDeleteId.value !== eventId) { pendingDeleteId.value = null; } hoveredEventId.value = eventId; if (operationHintTimer) clearTimeout(operationHintTimer); if (operationHintHideTimer) clearTimeout(operationHintHideTimer); operationHintTimer = setTimeout(() => { showOperationHint.value = true; operationHintHideTimer = setTimeout(() => { showOperationHint.value = false; }, 3000); }, 500); }
function handleEventMouseLeave() { if (window.innerWidth <= 800) return; hoveredEventId.value = null; showOperationHint.value = false; if (operationHintTimer) clearTimeout(operationHintTimer); if (operationHintHideTimer) clearTimeout(operationHintHideTimer); pendingCopyId.value = null; pendingDeleteId.value = null; }
function handleEventMouseMove(e) { if (window.innerWidth <= 800) return; mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 }; }


// ========== 框选功能相关函数 ==========
function checkIntersection(rect1, rect2) { return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom); }
function startMarquee(clientX, clientY, e) { if (!isMultiSelectMode.value) return; const ignoredSelectors = [ '.event-container', '.custom-countdown-header', 'button', 'a', 'input', 'select', 'textarea', '.modal-overlay' ]; if (ignoredSelectors.some(selector => e.target.closest(selector))) { return; } e.preventDefault(); e.stopPropagation(); isMarqueeSelecting.value = true; marqueeStartPos.value = { x: clientX, y: clientY }; }
function moveMarquee(clientX, clientY, e) { if (!isMarqueeSelecting.value) return; e.preventDefault(); e.stopPropagation(); const start = marqueeStartPos.value; const end = { x: clientX, y: clientY }; marqueeBox.value = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y) }; const marqueeRect = { left: marqueeBox.value.x, top: marqueeBox.value.y, right: marqueeBox.value.x + marqueeBox.value.width, bottom: marqueeBox.value.y + marqueeBox.value.height }; for (const id in eventItemRefs.value) { const itemEl = eventItemRefs.value[id]; if (itemEl) { const itemRect = itemEl.getBoundingClientRect(); if (checkIntersection(marqueeRect, itemRect)) { selectedEventIds.value.add(Number(id)); } } } }
function endMarquee() { if (!isMarqueeSelecting.value) return; isMarqueeSelecting.value = false; }
const handleMouseDown = (e) => { if (e.button === 0) startMarquee(e.clientX, e.clientY, e); };
const handleMouseMove = (e) => moveMarquee(e.clientX, e.clientY, e);
const handleMouseUp = () => endMarquee();
const handleTouchStart = (e) => { if (e.touches.length === 1) startMarquee(e.touches[0].clientX, e.touches[0].clientY, e); };
const handleTouchMove = (e) => { if (e.touches.length === 1) moveMarquee(e.touches[0].clientX, e.touches[0].clientY, e); };
const handleTouchEnd = () => endMarquee();


// ========== 快捷键处理 ==========
const handleEditShortcut = (event) => handleEdit(event);
const handleCopyShortcut = (event) => { if (pendingCopyId.value === event.id) { handleCopy(event); pendingCopyId.value = null; } else { pendingCopyId.value = event.id; pendingDeleteId.value = null; setTimeout(() => { if (pendingCopyId.value === event.id) pendingCopyId.value = null; }, 3000); } };
const handleDeleteShortcut = (event) => { if (pendingDeleteId.value === event.id) { handleDelete(event.id); pendingDeleteId.value = null; } else { pendingDeleteId.value = event.id; pendingCopyId.value = null; setTimeout(() => { if (pendingDeleteId.value === event.id) pendingDeleteId.value = null; }, 3000); } };
const keyActionMap = { ' ': handleEditShortcut, '/': handleEditShortcut, 'Insert': handleCopyShortcut, '+': handleCopyShortcut, 'Delete': handleDeleteShortcut, '-': handleDeleteShortcut };
// [修改] 将原 handleGlobalKeydown 和 handleGlobalClickOrTouch 的菜单关闭逻辑抽离和增强
const closeActiveMenu = () => { activeMenu.value = null; };
function handleGlobalKeydown(e) {
  if (isModalOpen.value && (e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (isFormValid.value) saveEvent(); return; }
  if (e.key === 'Escape' || e.key === 'Esc') {
    e.preventDefault();
    if (activeMenu.value) { closeActiveMenu(); return; }
    if (pendingCopyId.value || pendingDeleteId.value) { pendingCopyId.value = null; pendingDeleteId.value = null; return; }
    const activeEl = document.activeElement;
    const isInModal = activeEl && activeEl.closest('.modal-content');
    if (isModalOpen.value && !isInModal) { closeModal(); return; }
    if (isMultiSelectMode.value) { toggleMultiSelectMode(); return; }
    return;
  }
  const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
  if (isInputFocused || !hoveredEventId.value) return;
  const event = events.value.find(e => e.id === hoveredEventId.value);
  if (!event) return;
  const action = keyActionMap[e.key];
  if (action) { e.preventDefault(); showOperationHint.value = false; action(event); }
}
// [新增] 用于处理外部点击关闭菜单的函数
function handleGlobalClick(e) {
  if (activeMenu.value === null) return;
  const activeMenuRef = menuContainerRefs.value[activeMenu.value];
  if (activeMenuRef && !activeMenuRef.contains(e.target)) {
    closeActiveMenu();
  }
}
// [新增] 用于处理焦点移出关闭菜单的函数
function handleGlobalFocus(e) {
  if (activeMenu.value === null) return;
  const activeMenuRef = menuContainerRefs.value[activeMenu.value];
  if (activeMenuRef && !activeMenuRef.contains(e.target)) {
    closeActiveMenu();
  }
}


// ========== 生命周期钩子 ==========

onBeforeUpdate(() => {
  dateColumnRefs.value = {};
  countdownColumnRefs.value = {};
  dateContentRefs.value = {};
  countdownContentRefs.value = {};
  // [新增] 同时清空菜单容器的引用
  menuContainerRefs.value = {};
});

watch(() => events.value.length, () => {
  nextTick(setupAllAdapters);
});

let resizeTimeout;
const handleWindowResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    setupAllAdapters();
  }, 150);
};

onMounted(() => {
  const savedEvents = getCustomEvents();
  events.value = savedEvents.map(event => ({
    ...event,
    finalDisplay: '',
    dateTimeDesc: '',
    nextUpdateTime: 0
  }));
  customCounter.value = Math.max(0, ...savedEvents.map(e => parseInt(e.name.match(/^自定义(\d+)$/)?.[1] || 0))) + 1;
  updateAllEventsDisplay();
  mainLoop();
  
  nextTick(setupAllAdapters);
  
  // [修改] 整合所有全局监听器
  window.addEventListener('resize', handleWindowResize);
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('click', handleGlobalClick, true);
  document.addEventListener('focusin', handleGlobalFocus, true);
  document.addEventListener('touchstart', handleGlobalClick, true); // 移动端触摸也视为点击
  
  // [新增] 使用 eventBus 注册对其他菜单打开事件的监听
  cleanupMenuListener = listenForOtherMenuOpened(COMPONENT_ID, (broadcasterId) => {
    // 构造当前组件内所有可能的菜单ID前缀
    const ownMenuIdPrefix = `${COMPONENT_ID}-`;
    // 如果广播源不是本组件内的任何一个菜单，则关闭当前激活的菜单
    if (!broadcasterId.startsWith(ownMenuIdPrefix)) {
      closeActiveMenu();
    }
  });

  nextTick(() => {
    if (eventsListRef.value) {
      const sortableOptions = { animation: 220, handle: '.drag-handle, .drag-blank-area', ghostClass: 'drag-ghost', chosenClass: 'drag-chosen', dragClass: 'drag-dragging', onEnd: (evt) => { sortOrder.value = 'manual'; if (sortableInstance) { sortableInstance.option('disabled', false); } if (evt.oldIndex != null && evt.newIndex != null && evt.oldIndex !== evt.newIndex) { const moved = events.value.splice(evt.oldIndex, 1)[0]; events.value.splice(evt.newIndex, 0, moved); saveCustomEvents(events.value); } } };
      if (window.innerWidth <= 800) { sortableOptions.delay = 300; sortableOptions.delayOnTouchOnly = true; }
      sortableInstance = Sortable.create(eventsListRef.value, sortableOptions);
    }
  });

  watch(isMultiSelectMode, (isMulti) => {
    if (isMulti) {
      document.addEventListener('mousedown', handleMouseDown, true);
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
      document.addEventListener('touchstart', handleTouchStart, true);
      document.addEventListener('touchmove', handleTouchMove, true);
      document.addEventListener('touchend', handleTouchEnd, true);
    } else {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('touchstart', handleTouchStart, true);
      document.removeEventListener('touchmove', handleTouchMove, true);
      document.removeEventListener('touchend', handleTouchEnd, true);
      isMarqueeSelecting.value = false;
    }
  }, { immediate: false });
});

onUnmounted(() => {
  if (animationFrameId) { cancelAnimationFrame(animationFrameId); }
  if (resizeTimeout) clearTimeout(resizeTimeout);
  
  Object.values(fontAdapters).forEach(adapter => adapter.destroy());

  // [修改] 统一移除所有全局监听器
  window.removeEventListener('resize', handleWindowResize);
  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('click', handleGlobalClick, true);
  document.removeEventListener('focusin', handleGlobalFocus, true);
  document.removeEventListener('touchstart', handleGlobalClick, true);
  document.removeEventListener('mousedown', handleMouseDown, true);
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('mouseup', handleMouseUp, true);
  document.removeEventListener('touchstart', handleTouchStart, true);
  document.removeEventListener('touchmove', handleTouchMove, true);
  document.removeEventListener('touchend', handleTouchEnd, true);
  
  // [新增] 调用 eventBus 返回的清理函数，安全地移除广播监听
  if (cleanupMenuListener) {
    cleanupMenuListener();
  }

  if (sortableInstance) sortableInstance.destroy();
  if (operationHintTimer) clearTimeout(operationHintTimer);
  if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
});
</script>

<style scoped>
/* ========== 组件根容器 ========== */
.custom-countdown {
  margin-bottom: 6px;
  position: relative;
}

/* ========== 头部整体布局 ========== */
.custom-countdown-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  margin-bottom: 12px;
  margin-top: -8px;
}

/* ========== 头部左侧区域（现在仅作为占位） ========== */
.header-zone-left {
  justify-self: start;
}

/* ========== 头部右侧区域（按钮容器） ========== */
.header-zone-right {
  justify-self: end;
}

/* ========== 模块标题 ========== */
.title {
  position: absolute;
  top: 16px;
  left: 24px;
  z-index: 5;
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  color: var(--text-secondary);
  height: 24px;
  display: flex;
  align-items: center;
}

/* ========== 头部右侧所有操作的容器 ========== */
.header-actions {
  display: flex;
  align-items: top;
  gap: 10px;
}

/* ========== 按钮通用与特定样式 ========== */
.bulk-delete-btn {
  background-color: #5f2120;
  color: #ffcdd2;
  border: 1px solid #a13531;
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.bulk-delete-btn:hover {
  background-color: #d32f2f;
  color: white;
  border-color: #d32f2f;
}

/* 连体按钮组的容器 */
.joined-btn-group {
  display: flex;
}

/* 连体按钮组内的单个按钮 */
.joined-btn {
  width: 30px;
  height: 30px;
  padding: 0 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 16px;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  border: 0px solid var(--border-color);
  border-left-width: 0;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

/* 单独处理第一个连体按钮 */
.joined-btn:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
  border-left-width: 0px;
}

/* 单独处理最后一个连体按钮 */
.joined-btn:last-child {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.joined-btn:hover {
  background-color: var(--bg-quaternary);
  color: var(--text-primary);
}

/* 连体按钮的激活状态（例如排序、多选模式开启时） */
.joined-btn.active {
  background-color: var(--green-primary);
  color: var(--bg-primary);
  border-color: var(--green-primary);
}

/* ========== 事件列表及条目 ========== */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-container {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 15px;
  position: relative;
  overflow: visible;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  cursor: default;
}

.event-container.menu-is-active {
  z-index: 20;
}

.event-container.is-selected {
  background: var(--bg-quaternary);
  box-shadow: 0 0 0 2px var(--green-primary);
}

.event-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(60px, 1fr) 2fr minmax(320px, 2fr) 20px;
  gap: 20px;
  align-items: center;
}

.event-date-column,
.event-countdown-column {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  text-align: center;
  transition: color 0.2s;
  min-height: 24px;
  white-space: nowrap;
  overflow: hidden;
}

.event-name-column {
  align-items: center;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  transition: color 0.2s;
  min-height: 24px;
  white-space: nowrap ;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

:deep(.event-countdown-column .combo-num) {
  color: var(--green-primary);
  font-weight: 600;
  margin: 0 4px;
  font-style: normal;
  transition: color 0.2s;
}

.empty-tip {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 20px;
}

/* ========== 弹窗样式 ========== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.modal-form .input-group {
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: center;
  width: 100%;
  margin-bottom: 7px;
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

.input {
  height: 40px;
  line-height: 40px;
  width: 96px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  border-color: var(--green-primary);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.5;
}

.date-separator {
  width: 10px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0 2px;
}

.event-name-input {
  width: 324px;
  max-width: 100%;
}

/* ========== 拖拽与菜单 ========== */
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

.drag-handle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  color: var(--text-tertiary);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  z-index: 10;
}

.event-container:hover .drag-handle {
  opacity: 1;
}

.drag-handle-left {
  left: -20px;
}

.drag-handle-right {
  right: -20px;
}

.drag-handle:hover {
  color: var(--green-primary);
}

.drag-chosen,
.drag-dragging {
  box-shadow: 0 8px 40px rgba(52, 206, 99, .22), 0 2px 18px #0004;
  transform: scale(1.03);
  z-index: 100;
  cursor: grabbing;
}

.drag-ghost {
  opacity: 0.2 !important;
  background: var(--bg-tertiary) !important;
  box-shadow: none !important;
}

.settings-menu-container {
  position: absolute;
  top: 50%;
  right: -8px;
  transform: translateY(-50%);
  z-index: 15;
}

.menu-trigger-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: var(--border-color);
  color: var(--text-primary);
}

.settings-dropdown-panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  z-index: 11;
  border: 1px solid var(--border-color);
  display: flex;
  overflow: hidden;
}

.dropdown-column {
  display: flex;
  flex-direction: column;
}

.dropdown-column:not(:first-child) {
  border-left: 1px solid var(--border-color);
}

.menu-option-btn {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 0 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  border-bottom: 1px solid var(--border-color);
  border-radius: 0;
}

.menu-option-btn.delete {
  color: #f44336;
}

.menu-option-btn.delete:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

.dropdown-column .menu-option-btn:last-child {
  border-bottom: none;
}

.menu-option-btn:hover {
  background: var(--bg-quaternary);
}

.menu-option-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
}

/* ========== 框选与交互提示 ========== */
.marquee-select-box {
  position: fixed;
  background-color: rgba(76, 175, 80, 0.2);
  border: 2px solid var(--green-primary);
  z-index: 9998;
  pointer-events: none;
}

.operation-hint,
.copy-confirm-hint,
.delete-confirm-hint {
  position: fixed;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transform: translateY(-50%);
}

.operation-hint {
  background: var(--bg-tertiary);
  opacity: 0.9;
}

.hint-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hint-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.hint-key {
  color: var(--text-secondary);
}

.hint-action {
  color: var(--text-primary);
}

.hint-item:last-child .hint-action {
  color: #ff7575;
}

.copy-confirm-hint {
  background: var(--green-primary);
  color: #fff;
}

.delete-confirm-hint {
  background: #d32f2f;
  color: #fff;
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

@keyframes pulse-animation {
  50% {
    background-color: var(--pulse-bg-color);
    box-shadow: 0 0 20px 2px var(--pulse-shadow-color);
  }
}

.event-container.pending-copy {
  --pulse-bg-color: rgba(76, 175, 80, 0.1);
  --pulse-shadow-color: rgba(76, 175, 80, 0.3);
  animation: pulse-animation 0.5s ease-in-out infinite;
}

.event-container.pending-delete {
  --pulse-bg-color: rgba(244, 67, 54, 0.1);
  --pulse-shadow-color: rgba(244, 67, 54, 0.3);
  animation: pulse-animation 0.5s ease-in-out infinite;
}

/* ========== 统一响应式布局 ========== */
@media (max-width: 800px) {
  /* --- 布局调整 --- */
  .custom-countdown-header {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .event-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    width: 100%;
    gap: 8px;
    text-align: center;
  }

  .event-name-column,
  .event-date-column,
  .event-countdown-column {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  /* ▼ [新增] 以下是专门为移动端菜单位置添加的样式规则 ▼ */
  .settings-menu-container {
    top: -16px;
    right: -16px;
    transform: none;
  }

  .modal-content {
    min-width: 90vw;
  }

  .event-name-input {
    min-width: calc(90vw - 80px);
  }

  /* --- 元素显隐控制 --- */
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
    position: absolute;
    left: 0; top: 0; bottom: 0; right: 0;
    z-index: 5;
    cursor: grab;
  }
  
  /* --- 标题定位 --- */
  .title {
    top: 12px;
    left: 16px;
  }
}
</style>
