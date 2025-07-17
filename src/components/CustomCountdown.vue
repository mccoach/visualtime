<template>
  <div
    class="custom-countdown card"
  >
    <div
      class="custom-countdown-header three-column-header"
    >
      <div
        class="header-zone-left"
      >
        <h3
          class="title"
        >
          自定义倒计时
        </h3>
      </div>
      <div
        class="header-zone-center"
      >
        <button
          class="button button-primary add-new-event-btn"
          @click="openAddModal"
        >
          添加倒计时
        </button>
      </div>
      <div
        class="header-actions header-zone-right"
      >
        <button
          v-if="isMultiSelectMode && selectedEventIds.size > 0"
          class="button button-danger bulk-delete-btn"
          @click="bulkDelete"
          :title="`删除选中的 ${selectedEventIds.size} 个项目`"
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
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          批量删除
        </button>
        <div
          class="joined-btn-group"
        >
          <button
            class="joined-btn action-btn"
            :class="{ active: sortOrder !== 'manual' }"
            @click="cycleSortOrder"
            :title="`当前排序: ${sortOrder === 'manual' ? '手动' : (sortOrder === 'asc' ? '升序' : '降序')}`"
          >
            <svg
              v-if="sortOrder === 'manual'"
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
                <line x1="9" y1="3" x2="9" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <line x1="9" y1="3" x2="4" y2="10" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
                <line x1="15" y1="3" x2="15" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <line x1="20" y1="14" x2="15" y2="21" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg
              v-else-if="sortOrder === 'asc'"
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
                <line x1="9" y1="1" x2="9" y2="23" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
                <line x1="9" y1="1" x2="4" y2="10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
                <line x1="15" y1="3" x2="15" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <line x1="20" y1="14" x2="15" y2="21" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg
              v-else
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
                <line x1="9" y1="3" x2="9" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <line x1="9" y1="3" x2="4" y2="10" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
                <line x1="15" y1="1" x2="15" y2="23" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
                <line x1="20" y1="14" x2="15" y2="23" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </button>
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="isModalOpen"
      class="modal-overlay"
      @click.self="closeModal"
    >
      <div
        class="modal-content"
        @click.stop
      >
        <h3
          class="modal-title"
        >
          {{ modalTitle }}
        </h3>
        <div
          class="modal-form"
        >
          <div
            class="input-group"
          >
            <input
              ref="formYearRef"
              v-model="eventForm.year"
              type="text"
              class="input"
              placeholder="年"
              @input="formInteractionHandler.onInput($event, 'year')"
              @keydown="formInteractionHandler.onKeydown($event, 'year')"
              @focus="formInteractionHandler.onFocus($event, 'year')"
              @blur="formInteractionHandler.onBlur('year')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'year')"
            >
            <span
              class="date-separator"
            >
              -
            </span>
            <input
              ref="formMonthRef"
              v-model="eventForm.month"
              type="text"
              class="input"
              placeholder="月"
              @input="formInteractionHandler.onInput($event, 'month')"
              @keydown="formInteractionHandler.onKeydown($event, 'month')"
              @focus="formInteractionHandler.onFocus($event, 'month')"
              @blur="formInteractionHandler.onBlur('month')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'month')"
            >
            <span
              class="date-separator"
            >
              -
            </span>
            <input
              ref="formDayRef"
              v-model="eventForm.day"
              type="text"
              class="input"
              placeholder="日"
              @input="formInteractionHandler.onInput($event, 'day')"
              @keydown="formInteractionHandler.onKeydown($event, 'day')"
              @focus="formInteractionHandler.onFocus($event, 'day')"
              @blur="formInteractionHandler.onBlur('day')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'day')"
            >
          </div>
          <div
            class="input-group"
          >
            <input
              ref="formHourRef"
              v-model="eventForm.hour"
              type="text"
              class="input"
              placeholder="时"
              @input="formInteractionHandler.onInput($event, 'hour')"
              @keydown="formInteractionHandler.onKeydown($event, 'hour')"
              @focus="formInteractionHandler.onFocus($event, 'hour')"
              @blur="formInteractionHandler.onBlur('hour')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'hour')"
            >
            <span
              class="date-separator"
            >
              :
            </span>
            <input
              ref="formMinuteRef"
              v-model="eventForm.minute"
              type="text"
              class="input"
              placeholder="分"
              @input="formInteractionHandler.onInput($event, 'minute')"
              @keydown="formInteractionHandler.onKeydown($event, 'minute')"
              @focus="formInteractionHandler.onFocus($event, 'minute')"
              @blur="formInteractionHandler.onBlur('minute')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'minute')"
            >
            <span
              class="date-separator"
            >
              :
            </span>
            <input
              ref="formSecondRef"
              v-model="eventForm.second"
              type="text"
              class="input"
              placeholder="秒"
              @input="formInteractionHandler.onInput($event, 'second')"
              @keydown="formInteractionHandler.onKeydown($event, 'second')"
              @focus="formInteractionHandler.onFocus($event, 'second')"
              @blur="formInteractionHandler.onBlur('second')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'second')"
            >
          </div>
          <input
            ref="formNameRef"
            v-model="eventForm.name"
            type="text"
            class="input event-name-input"
            placeholder="事件名称（可选）"
            @keydown="formInteractionHandler.onKeydown($event, 'name')"
            @focus="formInteractionHandler.onFocus($event, 'name')"
            @blur="formInteractionHandler.onBlur('name')"
          >
        </div>
        <div
          class="modal-actions"
        >
          <button
            class="button button-secondary"
            @click="closeModal"
          >
            取消
          </button>
          <button
            class="button button-primary"
            @click="saveEvent"
            :disabled="!isFormValid"
          >
            保存
          </button>
        </div>
      </div>
    </div>
    <div
      class="events-list"
      ref="eventsListRef"
    >
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
        <div
          class="drag-handle drag-handle-left desktop-only"
          title="拖动排序"
        >
          <svg width="10" height="24" fill="currentColor">
            <circle cx="8" cy="6" r="1.5"/>
            <circle cx="2" cy="12" r="1.5"/>
            <circle cx="8" cy="12" r="1.5"/>
            <circle cx="8" cy="18" r="1.5"/>
          </svg>
        </div>
        <div
          class="drag-handle drag-handle-right desktop-only"
          title="拖动排序"
        >
          <svg width="10" height="24" fill="currentColor">
            <circle cx="2" cy="6" r="1.5"/>
            <circle cx="2" cy="12" r="1.5"/>
            <circle cx="8" cy="12" r="1.5"/>
            <circle cx="2" cy="18" r="1.5"/>
          </svg>
        </div>
        <div
          class="event-item"
        >
          <div
            class="drag-blank-area mobile-only"
            title="拖动排序"
          ></div>
          <div
            class="event-name-column"
          >
            {{ event.name }}
          </div>
          <div
            class="event-date-column"
            :ref="el => setElementRef(el, event.id, 'date')"
            :style="fontStyles[event.id]?.date"
          >
            {{ event.dateTimeDesc }}
          </div>
          <div
            class="event-countdown-column"
            :ref="el => setElementRef(el, event.id, 'countdown')"
            :style="fontStyles[event.id]?.countdown"
          >
            <span
              v-html="event.finalDisplay"
            ></span>
          </div>
          <div
            class="settings-menu-container"
            @click.stop
          >
            <button
              class="menu-trigger-btn"
              @click="toggleMenu(event.id)"
              :class="{ active: activeMenu === event.id }"
            >
              ⋮
            </button>
            <div
              v-if="activeMenu === event.id"
              class="settings-dropdown-panel"
            >
              <div class="dropdown-column">
                <button
                  v-for="unit in unitOptions"
                  :key="unit.value"
                  :class="['menu-option-btn', { active: event.unit === unit.value }]"
                  @click="handleUnitChange(event.id, unit.value)"
                >
                  {{ unit.label }}
                </button>
              </div>
              <div class="dropdown-column">
                <!--
                  [修改] v-for 现在循环的是 getAvailablePrecisions(event.unit) 的结果，
                  这是一个根据当前单位动态计算出的、只包含可用选项的数组。
                  :disabled 属性和相关的类判断已被移除。
                -->
                <button
                  v-for="p in getAvailablePrecisions(event.unit)"
                  :key="p.value"
                  :class="['menu-option-btn', {
                    active: event.decimalPrecision === p.value
                  }]"
                  @click="handlePrecisionChange(event.id, p.value)"
                >
                  {{ p.label }}
                </button>
              </div>
              <div class="dropdown-column">
                <button
                  class="menu-option-btn"
                  @click="handleEdit(event)"
                >
                  编辑
                </button>
                <button
                  class="menu-option-btn"
                  @click="handleCopy(event)"
                >
                  复制
                </button>
                <button
                  class="menu-option-btn delete"
                  @click="handleMenuDelete(event.id)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p
        v-if="events.length === 0"
        class="empty-tip"
      >
        暂无自定义倒计时，请添加
      </p>
    </div>
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
  </div>
  <Transition
    name="hint-fade"
  >
    <div
      v-if="showOperationHint && hoveredEventId && !pendingDeleteId && !pendingCopyId"
      class="operation-hint"
      :style="{
        left: mousePosition.x + 'px',
        top: mousePosition.y + 'px'
      }"
    >
      <div
        class="hint-content"
      >
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Space  或 / 键
          </span>
          <span
            class="hint-action"
          >
            编辑
          </span>
        </div>
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Insert 或 + 键
          </span>
          <span
            class="hint-action"
          >
            复制
          </span>
        </div>
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Delete 或 - 键
          </span>
          <span
            class="hint-action"
          >
            删除
          </span>
        </div>
      </div>
    </div>
  </Transition>
  <Transition
    name="hint-fade"
  >
    <div
      v-if="pendingCopyId && pendingCopyId === hoveredEventId"
      class="copy-confirm-hint"
      :style="{
        left: mousePosition.x + 'px',
        top: mousePosition.y + 'px'
      }"
    >
      再按一次 Insert 或 + 确认复制
    </div>
  </Transition>
  <Transition
    name="hint-fade"
  >
    <div
      v-if="pendingDeleteId && pendingDeleteId === hoveredEventId"
      class="delete-confirm-hint"
      :style="{
        left: mousePosition.x + 'px',
        top: mousePosition.y + 'px'
      }"
    >
      再按一次 Delete 或 - 确认删除
    </div>
  </Transition>
</template>

<script setup>
// ========== 依赖导入 ==========
// 导入Vue组合式API的核心函数
import {
  ref,
  computed,
  onMounted,
  nextTick,
  onUnmounted,
  watch
} from 'vue';
// 导入Sortable.js库用于实现拖拽排序
import Sortable from 'sortablejs';
// 导入从localStorage存取数据的工具函数
import {
  getCustomEvents,
  saveCustomEvents
} from '../utils/storage';
// 导入 luxon 以在表单验证和排序中使用
import { DateTime } from 'luxon';
// 导入重构后的统一倒计时计算函数
import { calculateCustomDifference } from '../utils/dateUtils';


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
const fontStyles = ref({});
const elementRefs = ref({});
let resizeObserver = null;
const MAX_FONT_SIZE = 16;
const MIN_FONT_SIZE = 9;
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

// [修改] 静态的 `allPrecisionOptions` 作为所有精度选项的源数据
const allPrecisionOptions = [
  { value: 'combo', label: '0:0' },
  { value: 0, label: '0' },
  { value: 1, label: '0.0' },
  { value: 2, label: '0.00' }
];

// [新增] 一个根据单位动态过滤可用精度选项的函数
const getAvailablePrecisions = (unit) => {
  if (unit === 'second') {
    // 当单位为“秒”时，只允许“组合”和“0”精度
    return allPrecisionOptions.filter(p => p.value === 'combo' || p.value === 0);
  }
  if (unit === 'minute') {
    // 当单位为“分”时，允许“组合”、“0”和“0.0”精度
    return allPrecisionOptions.filter(p => p.value === 'combo' || p.value <= 1);
  }
  // 其他所有单位（年/月/周/日/时），返回全部精度选项
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
function openAddModal() { modalTitle.value = '添加自定义倒计时'; activeEventData.value = { id: `new_${Date.now()}`, unit: 'day', decimalPrecision: 0 }; Object.keys(eventForm.value).forEach(k => eventForm.value[k] = ''); isModalOpen.value = true; nextTick(() => formRefs.year.value?.focus()); }
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
function handleDelete(id) { events.value = events.value.filter(e => e.id !== id); saveCustomEvents(events.value); updateAllEventsDisplay(); if (pendingDeleteId.value === id) { pendingDeleteId.value = null; } }
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
function bulkDelete() { if (selectedEventIds.value.size === 0) return; if (confirm(`您确定要删除选中的 ${selectedEventIds.value.size} 个倒计时吗？此操作不可撤销。`)) { events.value = events.value.filter(event => !selectedEventIds.value.has(event.id)); saveCustomEvents(events.value); selectedEventIds.value.clear(); isMultiSelectMode.value = false; updateAllEventsDisplay(); } }


// ========== 核心逻辑：倒计时显示与更新 ==========
let animationFrameId = null;
function getEffectiveInterval(event) { if (event.decimalPrecision === 'combo' || event.unit === 'second') { return 1000; } const precision = event.decimalPrecision || 0; if (precision === 0) { switch(event.unit) { case 'minute': return 60 * 1000; case 'hour': return 60 * 60 * 1000; default: return 1000; } } const factor = Math.pow(10, -precision); let unitMillis; switch(event.unit) { case 'minute': unitMillis = 60 * 1000; break; case 'hour': unitMillis = 60 * 60 * 1000; break; case 'day': unitMillis = 24 * 60 * 60 * 1000; break; case 'week': unitMillis = 7 * 24 * 60 * 60 * 1000; break; case 'month': unitMillis = 30.44 * 24 * 60 * 60 * 1000; break; case 'year': unitMillis = 365.24 * 24 * 60 * 60 * 1000; break; default: unitMillis = 1000; } return Math.max(50, factor * unitMillis); }
function updateSingleEventDisplay(event) {
  const { finalDisplay, dateTimeDesc } = calculateCustomDifference(event);
  event.finalDisplay = finalDisplay;
  event.dateTimeDesc = dateTimeDesc;
  nextTick(updateAllFontSizes);
}
function updateAllEventsDisplay() { events.value.forEach(event => updateSingleEventDisplay(event)); }
function mainLoop() { const now = Date.now(); events.value.forEach(event => { if (!event.nextUpdateTime || now >= event.nextUpdateTime) { updateSingleEventDisplay(event); const interval = getEffectiveInterval(event); event.nextUpdateTime = now + interval; } }); animationFrameId = requestAnimationFrame(mainLoop); }


// ========== 字号自适应逻辑 (将在后续阶段优化) ==========
const setElementRef = (el, eventId, type) => { if (el) { if (!elementRefs.value[eventId]) { elementRefs.value[eventId] = {}; } elementRefs.value[eventId][type] = el; } };
const adjustFontSize = (element) => { if (!element) { return {}; } let currentFontSize = MAX_FONT_SIZE; element.style.fontSize = `${currentFontSize}px`; while (element.scrollWidth > element.clientWidth && currentFontSize > MIN_FONT_SIZE) { currentFontSize -= 0.5; element.style.fontSize = `${currentFontSize}px`; } return { fontSize: `${currentFontSize}px` }; };
const updateAllFontSizes = () => { for (const eventId in elementRefs.value) { const refs = elementRefs.value[eventId]; if (refs) { if (!fontStyles.value[eventId]) { fontStyles.value[eventId] = {}; } if (refs.date) { fontStyles.value[eventId].date = adjustFontSize(refs.date); } if (refs.countdown) { fontStyles.value[eventId].countdown = adjustFontSize(refs.countdown); } } } };


// ========== 交互处理 (将在后续阶段优化) ==========
function toggleMenu(id) { activeMenu.value = activeMenu.value === id ? null : id; }
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
function handleGlobalKeydown(e) { if (isModalOpen.value && (e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (isFormValid.value) saveEvent(); return; } if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); if (activeMenu.value) { activeMenu.value = null; return; } if (pendingCopyId.value || pendingDeleteId.value) { pendingCopyId.value = null; pendingDeleteId.value = null; return; } const activeEl = document.activeElement; const isInModal = activeEl && activeEl.closest('.modal-content'); if (isModalOpen.value && !isInModal) { closeModal(); return; } if (isMultiSelectMode.value) { toggleMultiSelectMode(); return; } return; } const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'); if (isInputFocused || !hoveredEventId.value) return; const event = events.value.find(e => e.id === hoveredEventId.value); if (!event) return; const action = keyActionMap[e.key]; if (action) { e.preventDefault(); showOperationHint.value = false; action(event); } }
function handleGlobalClickOrTouch(e) { if (!e.target.closest('.settings-menu-container')) { activeMenu.value = null; } }


// ========== 生命周期钩子 ==========
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
  if (eventsListRef.value) { resizeObserver = new ResizeObserver(() => { updateAllFontSizes(); }); resizeObserver.observe(eventsListRef.value); }
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('click', handleGlobalClickOrTouch, true);
  document.addEventListener('touchstart', handleGlobalClickOrTouch, true);
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
  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('click', handleGlobalClickOrTouch, true);
  document.removeEventListener('touchstart', handleGlobalClickOrTouch, true);
  document.removeEventListener('mousedown', handleMouseDown, true);
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('mouseup', handleMouseUp, true);
  document.removeEventListener('touchstart', handleTouchStart, true);
  document.removeEventListener('touchmove', handleTouchMove, true);
  document.removeEventListener('touchend', handleTouchEnd, true);
  if (sortableInstance) sortableInstance.destroy();
  if (operationHintTimer) clearTimeout(operationHintTimer);
  if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
  if (resizeObserver) { resizeObserver.disconnect(); }
});
</script>

<style scoped>
/* ========== 组件容器与标题 ========== */

/* 自定义倒计时组件的根容器样式 */
.custom-countdown {
  margin-bottom: 6px; /* 与下方元素的间距 */
}

/* 头部三栏网格布局 */
.custom-countdown-header.three-column-header {
  display: grid; /* 使用网格布局 */
  grid-template-columns:35% 30% 35%; /* 定义三列：左右两列自适应，中间列内容宽度 */
  align-items: center; /* 垂直居中对齐 */
  gap: 0px; /* 列间距 */
  margin-bottom: 20px; /* 与事件列表的间距 */
}

/* 响应式：屏幕宽度小于800px时，头部变为单列布局 */
@media (max-width: 800px) {
  .custom-countdown-header {
    grid-template-columns: 1fr; /* 变为一列 */
    gap: 15px; /* 行间距 */
  }
}

/* 头部左侧区域，内容靠左 */
.header-zone-left {
  justify-self: start;
  padding: 10px;
}

/* 头部中间区域，内容居中 */
.header-zone-center {
  justify-self: center;
}

/* 头部右侧区域，内容靠右 */
.header-zone-right {
  justify-self: end;
  padding: 10px;
}

/* 模块标题样式 */
.title {
  font-size: 16px; /* 字体大小 */
  color: var(--text-secondary); /* 颜色 */
  font-weight: 400; /* 字重 */
  margin: 0; /* 无外边距 */
}

/* 响应式：小屏幕下标题也居中 */
@media (max-width: 800px) {
  .title {
    justify-self: center;
  }
}

/* 头部右侧操作按钮容器 */
.header-actions {
  display: flex; /* Flex布局 */
  justify-content: flex-end; /* 内容靠右 */
  align-items: center; /* 垂直居中 */
  gap: 10px; /* 按钮间距 */
}

/* 响应式：小屏幕下操作按钮居中并可换行 */
@media (max-width: 800px) {
  .header-actions {
    justify-content: center; /* 居中 */
    flex-wrap: wrap; /* 允许换行 */
  }
}

/* ========== 按钮通用与特定样式 ========== */

/* 头部功能按钮的基础样式 */
.action-btn {
  width: 40px;
  height: 36px; /* 高度 */
  padding: 0 12px; /* 水平内边距 */
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  gap: 6px; /* 图标与文字间距 */
  font-size: 14px; /* 字体大小 */
  background-color: var(--bg-secondary); /* 背景色 */
  color: var(--text-secondary); /* 文字颜色 */
  border: 0px solid var(--border-color); /* 边框 */
  border-radius: 6px; /* 圆角 */
}

/* 连体按钮组中的按钮无圆角 */
.joined-btn.action-btn {
  border-radius: 0;
}

/* 连体按钮内的SVG图标垂直对齐 */
.action-btn.joined-btn svg {
  vertical-align: middle;
}

/* 按钮悬停效果 */
.action-btn:hover {
  background-color: var(--bg-quaternary); /* 改变背景色 */
  color: var(--text-primary); /* 改变文字颜色 */
}

/* 按钮激活状态（如排序模式、多选模式开启时） */
.action-btn.active {
  background-color: var(--green-primary); /* 主题绿色背景 */
  color: var(--bg-primary); /* 深色文字 */
  border-color: var(--green-primary); /* 边框颜色 */
}

/* 批量删除按钮的特定样式 */
.bulk-delete-btn {
  background-color: #5f2120; /* 深红色背景 */
  color: #ffcdd2; /* 浅红色文字 */
  border: 1px solid #a13531; /* 红色边框 */
  height: 36px; /* 高度 */
  padding: 0 12px; /* 内边距 */
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  gap: 6px; /* 间距 */
  font-size: 14px; /* 字号 */
  font-weight: 500; /* 字重 */
  border-radius: 6px; /* 圆角 */
}

/* 批量删除按钮悬停效果 */
.bulk-delete-btn:hover {
  background-color: #d32f2f; /* 亮红色背景 */
  color: white; /* 白色文字 */
  border-color: #d32f2f; /* 亮红色边框 */
}

/* “添加倒计时”按钮的特定样式 */
.add-new-event-btn {
  height: 36px; /* 高度 */
  font-size: 14px; /* 字号 */
}

/* ========== 事件列表及条目 ========== */

/* 事件列表容器 */
.events-list {
  display: flex; /* Flex布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 15px; /* 条目间距 */
}

/* 单个事件条目的容器 */
.event-container {
  background: var(--bg-tertiary); /* 背景色 */
  border-radius: 12px; /* 圆角 */
  padding: 15px; /* 内边距 */
  position: relative; /* 相对定位，用于内部绝对定位元素 */
  overflow: visible; /* 允许菜单弹出外部 */
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s; /* 过渡效果 */
  cursor: default; /* 默认光标 */
}

/* [新增] 当菜单被激活时，提升整个容器的堆叠层级 */
.event-container.menu-is-active {
  z-index: 20;
}

/* 多选模式下被选中的条目样式 */
.event-container.is-selected {
  background: var(--bg-quaternary); /* 更亮的背景 */
  box-shadow: 0 0 0 2px var(--green-primary); /* 绿色外发光 */
  border-color: var(--green-primary); /* 绿色边框 */
}

/* 桌面端悬停效果 */
@media (min-width: 801px) {
  .event-container:not(.is-selected):hover {
    background: var(--bg-quaternary);
  }
  .event-container.is-selected {
    cursor: pointer; /* 多选模式下选中项显示可点击手势 */
  }
}

/* 事件条目内部内容网格布局 */
.event-item {
  position: relative; /* 相对定位 */
  display: grid; /* 网格布局 */
  grid-template-columns: minmax(220px, 1fr) 2fr minmax(320px, 2fr) 20px; /* 四列布局 */
  gap: 20px; /* 列间距 */
  align-items: center; /* 垂直居中 */
}

/* 响应式：小屏幕下事件条目变为垂直Flex布局 */
@media (max-width: 800px) {
  .event-item {
    display: flex !important; /* 强制Flex布局 */
    flex-direction: column !important; /* 垂直排列 */
    align-items: center !important; /* 居中对齐 */
    width: 100%; /* 占满宽度 */
    gap: 8px; /* 间距 */
    text-align: center; /* 文本居中 */
  }
}

/* 三个主要信息列的通用样式 */
.event-date-column,
.event-name-column,
.event-countdown-column {
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  font-size: 16px; /* 字号 */
  color: var(--text-primary); /* 颜色 */
  font-weight: 500; /* 字重 */
  text-align: center; /* 文本居中 */
  transition: color 0.2s; /* 颜色过渡效果 */
  min-height: 24px; /* 最小高度，防止空内容时塌陷 */
}

/* 响应式：小屏幕下信息列占满宽度并居中 */
@media (max-width: 800px) {
  .event-date-column,
  .event-name-column,
  .event-countdown-column {
    width: 100%; /* 占满宽度 */
    text-align: center !important; /* 强制居中 */
    justify-content: center; /* 水平居中 */
  }
}

/* 日期和倒计时列不允许换行 */
.event-date-column,
.event-countdown-column {
  white-space: nowrap;
}

/* 事件名称列允许换行 */
.event-name-column {
  white-space: normal;
  word-break: break-all;
}

/* 倒计时列中高亮的数字部分样式 */
:deep(.event-countdown-column strong),
:deep(.event-countdown-column .combo-num) {
  color: var(--green-primary); /* 主题绿色 */
  font-weight: 600; /* 加粗 */
  margin: 0 4px; /* 水平外边距 */
  font-style: normal; /* 正常字体样式 */
  transition: color 0.2s; /* 颜色过渡 */
}

/* 列表为空时的提示信息 */
.empty-tip {
  text-align: center; /* 居中 */
  color: var(--text-tertiary); /* 灰色文字 */
  font-size: 14px; /* 字号 */
  padding: 20px; /* 内边距 */
}

/* ========== 弹窗样式 ========== */

/* 弹窗遮罩层 */
.modal-overlay {
  position: fixed; /* 固定定位 */
  top: 0; left: 0; right: 0; bottom: 0; /* 铺满全屏 */
  background: rgba(0, 0, 0, 0.7); /* 半透明黑色背景 */
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  z-index: 2000; /* 置于顶层 */
}

/* 弹窗内容区域 */
.modal-content {
  background: var(--bg-secondary); /* 背景色 */
  border-radius: 12px; /* 圆角 */
  padding: 24px; /* 内边距 */
  min-width: 400px; /* 最小宽度 */
  max-width: 90vw; /* 最大宽度为视口宽度的90% */
}

/* 响应式：小屏幕下弹窗宽度调整 */
@media (max-width: 800px) {
  .modal-content {
    min-width: 90vw;
  }
}

/* 弹窗标题 */
.modal-title {
  font-size: 18px; /* 字号 */
  color: var(--text-primary); /* 颜色 */
  margin-bottom: 20px; /* 与表单的间距 */
  text-align: center; /* 居中 */
}

/* 弹窗表单容器 */
.modal-form {
  display: flex; /* Flex布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 12px; /* 项目间距 */
  align-items: center; /* 水平居中 */
  margin-bottom: 20px; /* 与操作按钮的间距 */
}

/* 表单中的输入框组（如年月日一组） */
.modal-form .input-group {
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  gap: 2px; /* 内部元素间距 */
  justify-content: center; /* 居中 */
  width: 100%; /* 占满宽度 */
  margin-bottom: 7px; /* 组间距 */
}

/* 弹窗操作按钮区域 */
.modal-actions {
  display: flex; /* Flex布局 */
  gap: 10px; /* 按钮间距 */
  justify-content: flex-end; /* 靠右对齐 */
}

/* 次要按钮样式（如取消按钮） */
.button-secondary {
  background: var(--bg-tertiary); /* 背景色 */
  color: var(--text-primary); /* 文字颜色 */
  border: 1px solid var(--border-color); /* 边框 */
}
/* 次要按钮悬停效果 */
.button-secondary:hover {
  background: var(--border-color);
}

/* 通用输入框样式 */
.input {
  height: 40px; /* 高度 */
  min-height: 40px; /* 最小高度 */
  line-height: 40px; /* 行高 */
  width: 96px; /* 宽度 */
  padding: 0 8px; /* 水平内边距 */
  border-radius: 6px; /* 圆角 */
  border: 1px solid var(--border-color); /* 边框 */
  background: var(--bg-tertiary); /* 背景色 */
  color: var(--text-primary); /* 文字颜色 */
  font-size: 14px; /* 字号 */
  text-align: center; /* 文本居中 */
  box-sizing: border-box; /* 盒模型 */
  outline: none; /* 去除焦点轮廓 */
  transition: border-color 0.2s, box-shadow 0.2s; /* 过渡效果 */
}

/* 输入框获得焦点时的样式 */
.input:focus {
  border-color: var(--green-primary); /* 绿色边框 */
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); /* 绿色外发光 */
}

/* 输入框占位符样式 */
.input::placeholder {
  color: var(--text-tertiary); /* 灰色文字 */
  opacity: 0.5; /* 透明度 */
}

/* 日期/时间分隔符样式 */
.date-separator {
  width: 10px; /* 宽度 */
  text-align: center; /* 居中 */
  color: var(--text-secondary); /* 颜色 */
  font-size: 16px; /* 字号 */
  margin: 0 2px; /* 水平外边距 */
}

/* 事件名称输入框特定样式 */
.event-name-input {
  width: 324px; /* 宽度 */
  min-width: 120px; /* 最小宽度 */
  max-width: 100%; /* 最大宽度 */
  margin: 0; /* 无外边距 */
}

/* 响应式：小屏幕下事件名称输入框宽度调整 */
@media (max-width: 800px) {
  .event-name-input {
    min-width: calc(90vw - 80px);
  }
}

/* ========== 【修改】拖拽与菜单 ========== */

/* 仅在桌面端显示的元素 */
.desktop-only { display: none; }
/* 仅在移动端显示的元素 */
.mobile-only { display: block; position: absolute; left: 0; top: 0; bottom: 0; right: 0; z-index: 5; cursor: move; }

/* 响应式：控制桌面/移动端元素的显示切换 */
@media (min-width: 801px) {
  .desktop-only { display: flex !important; }
  .mobile-only { display: none !important; }
}

/* 拖拽手柄样式 */
.drag-handle {
  position: absolute; /* 绝对定位 */
  top: 50%; /* 垂直居中 */
  transform: translateY(-50%); /* 精确垂直居中 */
  width: 20px; /* 宽度 */
  height: 40px; /* 高度 */
  display: flex; /* Flex布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  cursor: move; /* 移动手势 */
  color: var(--text-tertiary); /* 颜色 */
  opacity: 0; /* 默认透明 */
  transition: opacity 0.2s, color 0.2s, background 0.2s, transform 0.2s; /* 过渡效果 */
  z-index: 10; /* 层级 */
}

/* 响应式：桌面端悬停时显示拖拽手柄 */
@media (min-width: 801px) {
  .event-container:hover .drag-handle {
    opacity: 1;
  }
}

/* 左侧拖拽手柄定位 */
.drag-handle-left { left: -20px; }
/* 右侧拖拽手柄定位 */
.drag-handle-right { right: -20px; }

/* 拖拽手柄悬停效果 */
.drag-handle:hover {
  color: var(--green-primary); /* 绿色图标 */
  background: var(--bg-tertiary); /* 背景色 */
  transform: translateY(-50%) scale(1.1); /* 放大效果 */
}

/* Sortable.js拖拽过程中的样式 */
.drag-chosen,
.drag-dragging {
  box-shadow: 0 8px 40px rgba(52, 206, 99, .22), 0 2px 18px #0004; /* 阴影 */
  transform: scale(1.03); /* 放大 */
  z-index: 100; /* 置于顶层 */
  cursor: move; /* 移动手势 */
}

/* Sortable.js拖拽占位符的样式 */
.drag-ghost {
  opacity: 0.2 !important; /* 半透明 */
  background: var(--bg-tertiary); /* 背景色 */
  box-shadow: none !important; /* 无阴影 */
  transform: scale(1) !important; /* 不放大 */
}

/* 【新增】事件条目内菜单的容器，绝对定位到右上角 */
.settings-menu-container {
  position: absolute; top: -8px; right: -10px; z-index: 10;
}

/* 【新增】菜单触发按钮（三点）样式，与CountdownCard统一 */
.menu-trigger-btn {
  width: 32px; height: 32px; border: none; border-radius: 8px;
  background: none; color: var(--text-secondary);
  font-size: 16px; font-weight: bold; cursor: pointer;
  transition: all 0.2s; display: flex; align-items: center; justify-content: center;
}

/* 【新增】菜单触发按钮的悬停和激活状态 */
.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: var(--border-color);
  color: var(--text-primary);
}

/* 【新增】下拉菜单面板样式 */
.settings-dropdown-panel {
  position: absolute; top: calc(100% + 5px); right: 0;
  background-color: var(--bg-secondary);
  border-radius: 8px; padding: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  z-index: 11; border: 1px solid var(--border-color);
  display: flex; overflow: hidden;
}

/* 【新增】下拉菜单中的列容器 */
.dropdown-column {
  display: flex; flex-direction: column;
}

/* 【新增】为非首列的列添加左边框作为分隔线 */
.dropdown-column:not(:first-child) {
  border-left: 1px solid var(--border-color);
}

/* 【新增】菜单选项按钮样式 */
.menu-option-btn {
  height: 30px; display: flex; align-items: center; justify-content: center;
  border: none; background: var(--bg-secondary); color: var(--text-primary);
  padding: 0 14px; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: background-color 0.2s;
  white-space: nowrap; border-bottom: 1px solid var(--border-color);
  border-radius: 0;
}

/* 【新增】菜单选项中删除按钮的特定颜色 */
.menu-option-btn.delete {
  color: #f44336;
}
/* 【新增】删除按钮悬停效果 */
.menu-option-btn.delete:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

/* 【新增】移除列中最后一个按钮的下边框 */
.dropdown-column .menu-option-btn:last-child {
  border-bottom: none;
}

/* 【新增】菜单选项按钮悬停效果 */
.menu-option-btn:hover {
  background: var(--bg-quaternary);
}

/* 【新增】菜单选项激活状态 */
.menu-option-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
}

/* ========== 框选矩形样式 ========== */
.marquee-select-box {
  position: fixed; /* 固定定位 */
  background-color: rgba(76, 175, 80, 0.2); /* 半透明绿色背景 */
  border: 2px solid var(--green-primary); /* 绿色边框 */
  z-index: 9998; /* 高层级 */
  pointer-events: none; /* 不响应鼠标事件 */
}

/* ========== 交互提示与动画 ========== */

/* 提示浮层的通用样式 */
.operation-hint,
.copy-confirm-hint,
.delete-confirm-hint {
  position: fixed; padding: 6px 12px; border-radius: 6px;
  font-size: 14px; font-weight: 500; white-space: nowrap;
  pointer-events: none; z-index: 9999; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transform: translateY(-50%);
}

/* 操作快捷键提示浮层样式 */
.operation-hint { background: var(--bg-tertiary); opacity: 0.9; }
.hint-content { display: flex; flex-direction: column; gap: 2px; }
.hint-item { display: flex; justify-content: space-between; gap: 12px; }
.hint-key { color: var(--text-secondary); }
.hint-action { color: var(--text-primary); }
.hint-item:last-child .hint-action { color: #ff7575; }

/* 确认复制/删除的提示浮层样式 */
.copy-confirm-hint { background: var(--green-primary); color: #fff; }
.delete-confirm-hint { background: #d32f2f; color: #fff; }

/* 提示浮层的淡入淡出过渡效果 */
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

/* 等待确认操作时的脉冲动画 */
@keyframes pulse-animation {
  50% {
    background-color: var(--pulse-bg-color);
    border-color: var(--pulse-border-color);
    box-shadow: 0 0 20px 2px var(--pulse-shadow-color);
  }
}

/* 等待复制的条目应用脉冲动画 */
.event-container.pending-copy {
  --pulse-bg-color: rgba(76, 175, 80, 0.1);
  --pulse-border-color: rgba(76, 175, 80, 0.5);
  --pulse-shadow-color: rgba(76, 175, 80, 0.3);
  animation: pulse-animation 0.5s ease-in-out infinite;
  border: 1px solid transparent;
}

/* 等待删除的条目应用脉冲动画 */
.event-container.pending-delete {
  --pulse-bg-color: rgba(244, 67, 54, 0.1);
  --pulse-border-color: rgba(244, 67, 54, 0.5);
  --pulse-shadow-color: rgba(244, 67, 54, 0.3);
  animation: pulse-animation 0.5s ease-in-out infinite;
  border: 1px solid transparent;
}

/* 等待复制的条目内文字颜色变化 */
.event-container.pending-copy :deep(div),
.event-container.pending-copy :deep(strong),
.event-container.pending-copy :deep(.combo-num) {
  color: var(--green-secondary) !important;
}

/* 等待删除的条目内文字颜色变化 */
.event-container.pending-delete :deep(div),
.event-container.pending-delete :deep(strong),
.event-container.pending-delete :deep(.combo-num) {
  color: #f44336 !important;
}
</style>
