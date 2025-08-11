<!-- E:\AppProject\VisualTime\src\components\CustomCountdown.vue -->
<template>
  <div class="custom-countdown card">
    <!-- 顶部工具条（保持原样） -->
    <div class="custom-countdown-header">
      <div class="header-zone-left">
        <h3 class="title">自定义倒计时</h3>
      </div>
      <div class="header-actions header-zone-right">
        <div class="joined-btn-group">
          <button
            class="joined-btn action-btn add-btn"
            @click="logic.openAddModal"
            title="添加新倒计时"
          >
            <!-- 加号图标 -->
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
              <line x1="12" y1="3" x2="12" y2="21" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </button>

          <button
            class="joined-btn action-btn"
            :class="{ active: logic.sortOrder.value !== 'manual' }"
            @click="logic.cycleSortOrder"
            :title="`当前排序: ${
              logic.sortOrder.value === 'manual'
                ? '手动'
                : logic.sortOrder.value === 'asc'
                ? '升序'
                : '降序'
            }`"
          >
            <svg
              v-if="logic.sortOrder.value === 'manual'"
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
              <line x1="9" y1="3" x2="9" y2="21" stroke-width="3" />
              <line x1="9" y1="3" x2="4" y2="10" stroke-width="2" />
              <line x1="15" y1="3" x2="15" y2="21" stroke-width="3" />
              <line x1="20" y1="14" x2="15" y2="21" stroke-width="2" />
            </svg>
            <svg
              v-else-if="logic.sortOrder.value === 'asc'"
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
              <line x1="9" y1="1" x2="9" y2="23" stroke-width="4" />
              <line x1="9" y1="1" x2="4" y2="10" stroke-width="3" />
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
              <line x1="15" y1="1" x2="15" y2="23" stroke-width="4" />
              <line x1="20" y1="14" x2="15" y2="23" stroke-width="3" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 模态（保持原样） -->
    <div
      v-if="logic.isModalOpen.value"
      class="modal-overlay"
      @click.self="logic.closeModal"
    >
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">{{ logic.modalTitle.value }}</h3>
        <div class="modal-form">
          <!-- 日期 -->
          <div class="input-group">
            <input
              :ref="logic.formRefs.year"
              v-model="logic.eventForm.value.year"
              type="text"
              class="input"
              placeholder="年"
              @input="logic.formInteractionHandler.onInput($event, 'year')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'year')"
              @focus="logic.formInteractionHandler.onFocus($event, 'year')"
              @blur="logic.formInteractionHandler.onBlur('year')"
              @wheel.prevent="
                logic.formInteractionHandler.onWheel($event, 'year')
              "
            />
            <span class="date-separator">-</span>
            <input
              :ref="logic.formRefs.month"
              v-model="logic.eventForm.value.month"
              type="text"
              class="input"
              placeholder="月"
              @input="logic.formInteractionHandler.onInput($event, 'month')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'month')"
              @focus="logic.formInteractionHandler.onFocus($event, 'month')"
              @blur="logic.formInteractionHandler.onBlur('month')"
              @wheel.prevent="
                logic.formInteractionHandler.onWheel($event, 'month')
              "
            />
            <span class="date-separator">-</span>
            <input
              :ref="logic.formRefs.day"
              v-model="logic.eventForm.value.day"
              type="text"
              class="input"
              placeholder="日"
              @input="logic.formInteractionHandler.onInput($event, 'day')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'day')"
              @focus="logic.formInteractionHandler.onFocus($event, 'day')"
              @blur="logic.formInteractionHandler.onBlur('day')"
              @wheel.prevent="
                logic.formInteractionHandler.onWheel($event, 'day')
              "
            />
          </div>
          <!-- 时间 -->
          <div class="input-group">
            <input
              :ref="logic.formRefs.hour"
              v-model="logic.eventForm.value.hour"
              type="text"
              class="input"
              placeholder="时"
              @input="logic.formInteractionHandler.onInput($event, 'hour')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'hour')"
              @focus="logic.formInteractionHandler.onFocus($event, 'hour')"
              @blur="logic.formInteractionHandler.onBlur('hour')"
              @wheel.prevent="
                logic.formInteractionHandler.onWheel($event, 'hour')
              "
            />
            <span class="date-separator">:</span>
            <input
              :ref="logic.formRefs.minute"
              v-model="logic.eventForm.value.minute"
              type="text"
              class="input"
              placeholder="分"
              @input="logic.formInteractionHandler.onInput($event, 'minute')"
              @keydown="
                logic.formInteractionHandler.onKeydown($event, 'minute')
              "
              @focus="logic.formInteractionHandler.onFocus($event, 'minute')"
              @blur="logic.formInteractionHandler.onBlur('minute')"
              @wheel.prevent="
                logic.formInteractionHandler.onWheel($event, 'minute')
              "
            />
            <span class="date-separator">:</span>
            <input
              :ref="logic.formRefs.second"
              v-model="logic.eventForm.value.second"
              type="text"
              class="input"
              placeholder="秒"
              @input="logic.formInteractionHandler.onInput($event, 'second')"
              @keydown="
                logic.formInteractionHandler.onKeydown($event, 'second')
              "
              @focus="logic.formInteractionHandler.onFocus($event, 'second')"
              @blur="logic.formInteractionHandler.onBlur('second')"
              @wheel.prevent="
                logic.formInteractionHandler.onWheel($event, 'second')
              "
            />
          </div>
          <!-- 名称 -->
          <input
            :ref="logic.formRefs.name"
            v-model="logic.eventForm.value.name"
            type="text"
            class="input event-name-input"
            placeholder="事件名称（可选）"
            @keydown="logic.formInteractionHandler.onKeydown($event, 'name')"
            @focus="logic.formInteractionHandler.onFocus($event, 'name')"
            @blur="logic.formInteractionHandler.onBlur('name')"
          />
        </div>
        <div class="modal-actions">
          <button class="button button-secondary" @click="logic.closeModal">
            取消
          </button>
          <button
            class="button button-primary"
            @click="logic.saveEvent"
            :disabled="!logic.isFormValid.value"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 列表 -->
    <div class="events-list" ref="eventsListRef">
      <div
        v-for="event in logic.processedEvents.value"
        :key="event.id"
        :data-id="event.id"
        class="event-container"
        :class="{
          'menu-is-active': logic.activeMenu.value === event.id,
          'pending-copy': logic.pendingCopyId.value === event.id,
          'pending-delete': logic.pendingDeleteId.value === event.id,
          'swipe-open': activeSwipeId === event.id,
        }"
        @mouseenter="logic.handleEventMouseEnter(event.id)"
        @mouseleave="logic.handleEventMouseLeave"
        @mousemove="logic.handleEventMouseMove"
        @touchstart.capture="onTouchStart($event, event.id)"
        @touchmove.capture="onTouchMove($event, event.id)"
        @touchend.capture="onTouchEnd($event, event.id)"
        @touchcancel.capture="onTouchCancel($event, event.id)"
      >
        <!-- 裁切容器：注入 --clip-extra 和 padding-left 扩展窗口左边界 -->
        <div class="clip-wrap" :style="getClipWrapStyle(event.id)">
          <!-- 滑动层：transform 采用 --swipe-x 与 --clip-extra 的合成 -->
          <div
            class="swipe-wrapper"
            :ref="(el) => (swipeWrapperRefs[event.id] = el)"
            :style="getSwipeStyle(event.id)"
            @transitionend="onSwipeTransitionEnd(event.id)"
          >
            <div class="event-item">
              <div
                class="event-name-column"
                :ref="(el) => (eventNameColumnRefs[event.id] = el)"
                :title="event.name"
              >
                <span>{{ event.name }}</span>
              </div>
              <div
                class="event-date-column"
                :ref="(el) => (dateColumnRefs[event.id] = el)"
              >
                <span :ref="(el) => (dateContentRefs[event.id] = el)">{{
                  event.dateTimeDesc
                }}</span>
              </div>
              <div
                class="event-countdown-column"
                :ref="(el) => (countdownColumnRefs[event.id] = el)"
              >
                <span
                  :ref="(el) => (countdownContentRefs[event.id] = el)"
                  v-html="event.finalDisplay"
                ></span>
              </div>

              <!-- 触发按钮仍在裁切容器内；面板外置 -->
              <div
                class="settings-menu-container"
                :ref="
                  (el) =>
                    logic.setMenuRef(event.id, {
                      container: el,
                      trigger: menuTriggerRefs[event.id],
                      panel: menuPanelRefs[event.id],
                    })
                "
                @click.stop
              >
                <button
                  class="menu-trigger-btn"
                  :ref="(el) => (menuTriggerRefs[event.id] = el)"
                  @click="openMenuWithSwipeClose(event.id)"
                  title="菜单 / 长按拖拽"
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
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 按钮在裁切容器内，右侧固定；宽度按揭示 -->
          <div
            class="swipe-actions"
            :ref="(el) => (swipeActionsRefs[event.id] = el)"
            :style="getSwipeActionsStyle(event.id)"
            @click.stop
          >
            <button class="swipe-btn edit" @click.stop="handleSwipeEdit(event)">
              编辑
            </button>
            <button class="swipe-btn copy" @click.stop="handleSwipeCopy(event)">
              复制
            </button>
            <button
              class="swipe-btn delete"
              @click.stop="handleSwipeDelete(event.id)"
            >
              删除
            </button>
          </div>
        </div>

        <!-- 面板外置，不受裁切 -->
        <div
          v-if="logic.activeMenu.value === event.id"
          class="settings-dropdown-panel outside-panel"
          :ref="(el) => (menuPanelRefs[event.id] = el)"
          :class="{ 'is-upward': logic.isMenuUpward.value }"
          @click.stop
        >
          <div class="dropdown-column">
            <button
              v-for="unit in logic.unitOptions"
              :key="unit.value"
              :class="[
                'menu-option-btn',
                {
                  active: (eventsById[event.id]?.unit ?? 'days') === unit.value,
                },
              ]"
              @click="logic.updateEventUnit(event.id, unit.value)"
            >
              {{ unit.label }}
            </button>
          </div>
          <div class="dropdown-column">
            <button
              v-for="p in logic.getAvailablePrecisions(
                eventsById[event.id]?.unit ?? 'days'
              )"
              :key="p.value"
              :class="[
                'menu-option-btn',
                {
                  active:
                    (eventsById[event.id]?.decimalPrecision ?? 0) === p.value,
                },
              ]"
              @click="logic.updateEventPrecision(event.id, p.value)"
            >
              {{ p.label }}
            </button>
          </div>
          <div class="dropdown-column">
            <button
              class="menu-option-btn"
              @click="logic.openEditModal(eventsById[event.id])"
            >
              编辑
            </button>
            <button
              class="menu-option-btn"
              @click="logic.copyEvent(eventsById[event.id])"
            >
              复制
            </button>
            <button
              class="menu-option-btn delete"
              @click="logic.handleMenuDelete(event.id)"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <p v-if="logic.processedEvents.value.length === 0" class="empty-tip">
        暂无自定义倒计时，请添加
      </p>
    </div>
  </div>

  <!-- 提示气泡（Teleport 到 body） -->
  <teleport to="body">
    <Transition name="hint-fade">
      <div
        v-if="
          logic.showOperationHint.value &&
          logic.hoveredEventId.value &&
          !logic.pendingDeleteId.value &&
          !logic.pendingCopyId.value
        "
        class="operation-hint"
        :style="{
          left: logic.mousePosition.value.x + 'px',
          top: logic.mousePosition.value.y + 'px',
        }"
      >
        <div class="hint-content">
          <div class="hint-item">
            <span class="hint-key">按 Space 或 / 键</span
            ><span class="hint-action">编辑</span>
          </div>
          <div class="hint-item">
            <span class="hint-key">按 Insert 或 + 键</span
            ><span class="hint-action">复制</span>
          </div>
          <div class="hint-item">
            <span class="hint-key">按 Delete 或 - 键</span
            ><span class="hint-action">删除</span>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="hint-fade">
      <div
        v-if="
          logic.pendingCopyId.value &&
          logic.pendingCopyId.value === logic.hoveredEventId.value
        "
        class="copy-confirm-hint"
        :style="{
          left: logic.mousePosition.value.x + 'px',
          top: logic.mousePosition.value.y + 'px',
        }"
      >
        再按一次 Insert 或 + 确认复制
      </div>
    </Transition>

    <Transition name="hint-fade">
      <div
        v-if="
          logic.pendingDeleteId.value &&
          logic.pendingDeleteId.value === logic.hoveredEventId.value
        "
        class="delete-confirm-hint"
        :style="{
          left: logic.mousePosition.value.x + 'px',
          top: logic.mousePosition.value.y + 'px',
        }"
      >
        再按一次 Delete 或 - 确认删除
      </div>
    </Transition>
  </teleport>
</template>

<script setup>
// =======================================
// 1) 依赖导入
// =======================================
import {
  ref,                 // 基础响应式引用（用于列表根、滑动状态等）
  onMounted,           // 挂载钩子
  onUnmounted,         // 卸载钩子
  onBeforeUpdate,      // 更新前清空节点映射，避免旧引用残留
  watch,               // 侦听
  nextTick,            // DOM 更新后执行
  computed,            // 派生映射
} from "vue";

import { useCustomEvents } from "../composables/useCustomEvents.js"; // 业务逻辑（列表、菜单、拖拽、快捷键等）

import {
  getEffectiveWidth,        // 容器“有效宽度”读取（box-sizing 修正）
  makeFontSchedulers,       // 适配调度器（立即/合帧）
  observeContentWidth,      // 内容宽度监听（MutationObserver）
  ensureAdapterSlot,        // 适配器统一创建/刷新
} from "../utils/fontSizeManager.js";

// 引入事件名与广播工具：我们要在“左滑开始”就广播“菜单互斥”
import {
  MENU_OPEN_EVENT,          // 全站统一的“菜单打开/互斥”事件名
  broadcastMenuOpened,      // 广播（会携带 componentId）
} from "../utils/eventBus.js";


// =======================================
// 2) 业务逻辑与列表状态
// =======================================
const logic = useCustomEvents();         // 不动你原有的业务逻辑
const eventsListRef = ref(null);         // 列表根（RO 观察对象）

// =======================================
// 3) 节点映射（关键：普通对象，避免渲染期写响应式对象导致递归）
// =======================================
let menuTriggerRefs       = {}; // eventId -> HTMLElement（三横线触发按钮）
let menuPanelRefs         = {}; // eventId -> HTMLElement（外置菜单面板）
let eventNameColumnRefs   = {}; // eventId -> HTMLElement（名称列容器）
let dateColumnRefs        = {}; // eventId -> HTMLElement（日期列容器）
let countdownColumnRefs   = {}; // eventId -> HTMLElement（倒计时列容器）
let dateContentRefs       = {}; // eventId -> HTMLElement（日期文本）
let countdownContentRefs  = {}; // eventId -> HTMLElement（倒计时文本）
let swipeWrapperRefs      = {}; // eventId -> HTMLElement（滑动层）
let swipeActionsRefs      = {}; // eventId -> HTMLElement（右侧按钮容器）

// 更新前统一清空，配合模板的 :ref 回调安全重建
onBeforeUpdate(() => {
  menuTriggerRefs       = {};
  menuPanelRefs         = {};
  eventNameColumnRefs   = {};
  dateColumnRefs        = {};
  countdownColumnRefs   = {};
  dateContentRefs       = {};
  countdownContentRefs  = {};
  swipeWrapperRefs      = {};
  swipeActionsRefs      = {};
});


// =======================================
// 4) 适配器与观察器容器
// =======================================
let listResizeObserver = null;       // 列表容器 RO（只触发 refresh，不写任何响应式状态）
let adapters = {};                   // 字号适配器槽位
let countdownObsDisconnects = {};    // 内容宽度观察清理


// =======================================
// 5) 左滑交互状态与阈值（保持你现有行为）
// =======================================
const activeSwipeId = ref(null);          // 当前打开的条目 id
const swipeXById    = ref({});            // 各条目的左滑偏移（px，负值表示左滑）
let swipingId       = null;               // 当前是否在滑动
const animatingIds  = ref(new Set());     // 正在过渡动画中的条目

const ACTIONS_MAX_WIDTH = 180;            // 右侧按钮最大揭示宽度
const OPEN_THRESHOLD    = 60;             // 松手后判定为“打开”的阈值
const MOVE_THRESHOLD    = 10;             // 触摸移动阈值（判定水平/垂直）

let startX = 0, startY = 0, originX = 0;  // 手势起点
let decidedAxis = false, isHorizontal = false;

// 新增：记录“本次左滑开始所广播的 componentId”，用于在互斥回调里识别自发事件并忽略
const lastSwipeBroadcastId = ref(null);


// =======================================
// 6) id -> event 快速映射（只读）
// =======================================
const eventsById = computed(() => {
  const m = {};
  logic.events.value.forEach(e => m[e.id] = e);
  return m;
});


// =======================================
// 7) 字号适配调度器（立即/合帧）
// =======================================
const {
  scheduleImmediate: scheduleAdaptersImmediate, // 内容变更 -> 立即适配
  scheduleFrame:     scheduleAdaptersFrame,     // 尺寸/结构变更 -> 合帧适配
} = makeFontSchedulers(setupAdapters);


// =======================================
// 8) 窗口扩展法：样式变量注入（与模板/样式一致）
// =======================================
function getClipWrapStyle(id) {
  const x = swipeXById.value[id] ?? 0;
  const extra = x < 0 ? -x : 0;    // 左滑才扩展
  return { '--clip-extra': `${extra}px` };
}

function getSwipeStyle(id) {
  const x    = swipeXById.value[id] ?? 0;
  const anim = animatingIds.value.has(id);
  return {
    '--swipe-x': `${x}px`,
    transition:  anim ? 'transform 180ms ease-out' : 'none',
    willChange: 'transform',
  };
}

function getSwipeActionsStyle(id) {
  const x = swipeXById.value[id] ?? 0;
  const w = Math.max(0, Math.min(ACTIONS_MAX_WIDTH, -x));
  return { width: `${w}px` };
}


// =======================================
// 9) 内容宽度观察（倒计时列），触发“立即适配”
// =======================================
function ensureCountdownObserverFor(id) {
  if (countdownObsDisconnects[id]) return;
  const el = countdownContentRefs[id];
  if (!el) return;

  const key = `${id}_countdown`;
  if (!adapters[key]) adapters[key] = {};
  adapters[key].lastContentWidth = el.scrollWidth || 0;

  const disconnect = observeContentWidth(
    el,
    (changed, cur) => {
      if (changed) {
        adapters[key].needsRecreate = true;
        adapters[key].lastContentWidth = cur;
      }
      scheduleAdaptersImmediate();    // 内容变更：同帧适配，避免闪动
    },
    { threshold: 0 }
  );
  countdownObsDisconnects[id] = disconnect;
}


// =======================================
// 10) 适配器主入口（不写响应式列宽，用 provider 即时读 DOM 宽度）
// =======================================
function setupAdapters() {
  logic.events.value.forEach(event => {
    const id = event.id;

    // ---- 日期列 ----
    {
      const colEl     = dateColumnRefs[id];
      const contentEl = dateContentRefs[id];
      if (colEl && contentEl) {
        const key  = `${id}_date`;
        const slot = adapters[key] || (adapters[key] = {});
        const widthProvider = () => getEffectiveWidth(colEl);  // 即时读宽

        ensureAdapterSlot(slot, {
          container: colEl,
          elements:  [contentEl],
          options: {
            container: colEl,
            elements:  [contentEl],
            minSize:   10,
            debounceDelay: 50,
            observeContainerResize: false,        // 统一外层 RO 调度
            effectiveWidthProvider: widthProvider,
          },
          forceRecreate: !!slot.needsRecreate,
        });
      }
    }

    // ---- 倒计时列 ----
    {
      const colEl     = countdownColumnRefs[id];
      const contentEl = countdownContentRefs[id];
      if (colEl && contentEl) {
        ensureCountdownObserverFor(id);           // 监听内容变动

        const elementsToScale = [contentEl, ...contentEl.querySelectorAll('*')];
        const key  = `${id}_countdown`;
        const slot = adapters[key] || (adapters[key] = {});
        const widthProvider = () => getEffectiveWidth(colEl);  // 即时读宽

        ensureAdapterSlot(slot, {
          container: colEl,
          elements:  [contentEl],
          options: {
            container: colEl,
            elements:  elementsToScale,
            minSize:   10,
            debounceDelay: 50,
            observeContainerResize: false,
            effectiveWidthProvider: widthProvider,
          },
          forceRecreate: !!slot.needsRecreate,
        });
      }
    }
  });
}


// =======================================
// 11) 列表 RO：仅触发 refresh（不写状态，避免闭环）
// =======================================
function setupListResizeObserver() {
  if (listResizeObserver) {
    try { listResizeObserver.disconnect(); } catch {}
    listResizeObserver = null;
  }
  if (!eventsListRef.value || !window.ResizeObserver) return;

  listResizeObserver = new ResizeObserver(() => {
    scheduleAdaptersFrame(); // 合帧刷新
  });
  listResizeObserver.observe(eventsListRef.value);
}


// =======================================
// 12) 滑动动画结束（清理动画集中标记）
// =======================================
function onSwipeTransitionEnd(id) {
  if (animatingIds.value.has(id)) {
    const next = new Set(animatingIds.value);
    next.delete(id);
    animatingIds.value = next;
  }
}


// =======================================
// 13) 左滑开合（不改你现有行为）
// =======================================
function openSwipe(id) {
  if (activeSwipeId.value && activeSwipeId.value !== id) {
    const other = activeSwipeId.value;
    swipeXById.value = { ...swipeXById.value, [other]: 0 };
    const n = new Set(animatingIds.value);
    n.add(other);
    animatingIds.value = n;
  }
  swipeXById.value = { ...swipeXById.value, [id]: -ACTIONS_MAX_WIDTH };
  const n = new Set(animatingIds.value);
  n.add(id);
  animatingIds.value = n;
  activeSwipeId.value = id;
}

function closeSwipe(id) {
  swipeXById.value = { ...swipeXById.value, [id]: 0 };
  const n = new Set(animatingIds.value);
  n.add(id);
  animatingIds.value = n;
  if (activeSwipeId.value === id) activeSwipeId.value = null;
}

function closeAllSwipes() {
  if (!activeSwipeId.value) return;
  closeSwipe(activeSwipeId.value);
}


// =======================================
// 14) 触摸手势（移动端）
//      新增：左滑开始立即广播“菜单互斥事件”，关闭全站菜单/弹层；
//            但通过 sourceId 让本条目自身不受影响（不关闭自己）。
// =======================================
function onTouchStart(e, id) {
  // 仅移动端
  if (window.innerWidth > 800) return;
  // 单指
  if (!e.touches || e.touches.length !== 1) return;
  // 若命中按钮容器，不进入滑动（交由按钮点击）
  const actionsEl = swipeActionsRefs[id];
  if (actionsEl && actionsEl.contains(e.target)) return;

  // 新增：命中“外置菜单面板”时，完全忽略滑动（避免捕获阶段抢走事件）
  const panelEl = menuPanelRefs[id];
  if (panelEl && panelEl.contains(e.target)) return;

  // 记录“正在滑动的条目”
  swipingId = id;

  // 新增：一开始就广播“菜单互斥”，关闭全站其它弹出菜单/面板
  // 约定 componentId：custom-swipe-{id}；后续在 handleAnyMenuOpened 中识别并忽略本条目
  lastSwipeBroadcastId.value = `custom-swipe-${id}`;
  broadcastMenuOpened(lastSwipeBroadcastId.value);

  // 记录手势起点
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
  originX = swipeXById.value[id] ?? 0;
  decidedAxis = false;
  isHorizontal = false;

  // 若该条目处于“动画中”，先移除其动画标记
  if (animatingIds.value.has(id)) {
    const n = new Set(animatingIds.value);
    n.delete(id);
    animatingIds.value = n;
  }
}

function onTouchMove(e, id) {
  if (window.innerWidth > 800) return;
  if (swipingId !== id) return;
  if (!e.touches || e.touches.length !== 1) return;

  const t  = e.touches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  if (!decidedAxis && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
    decidedAxis  = true;
    isHorizontal = Math.abs(dx) > Math.abs(dy);
  }
  if (!isHorizontal) return;

  e.preventDefault();
  e.stopPropagation();

  let nextX = originX + dx;
  if (nextX > 0) nextX = 0;
  if (nextX < -ACTIONS_MAX_WIDTH) nextX = -ACTIONS_MAX_WIDTH;

  swipeXById.value = { ...swipeXById.value, [id]: nextX };
}

function onTouchEnd(e, id) {
  if (window.innerWidth > 800) return;
  if (swipingId !== id) return;

  if (!isHorizontal) {
    swipingId = null;
    lastSwipeBroadcastId.value = null; // 结束本次“左滑广播”标识
    return;
  }
  const x = swipeXById.value[id] ?? 0;
  if (Math.abs(x) > OPEN_THRESHOLD) openSwipe(id);
  else closeSwipe(id);

  swipingId = null;
  lastSwipeBroadcastId.value = null;     // 结束本次“左滑广播”标识
}

function onTouchCancel(e, id) {
  onTouchEnd(e, id);
}


// =======================================
// 15) 右侧按钮点击（先收起左滑，再执行）
// =======================================
function handleSwipeEdit(eventObj) {
  closeAllSwipes();
  logic.openEditModal(eventsById.value[eventObj.id] || eventObj);
}
function handleSwipeCopy(eventObj) {
  closeAllSwipes();
  logic.copyEvent(eventsById.value[eventObj.id] || eventObj);
}
function handleSwipeDelete(id) {
  closeAllSwipes();
  logic.handleMenuDelete(id);
}
function openMenuWithSwipeClose(id) {
  closeAllSwipes();
  logic.toggleMenu(id);
}


// =======================================
// 16) 全局点击捕获 & 菜单互斥广播处理
//      修改：互斥事件到来时，若是“本条目左滑开始”发出的广播，则忽略，不关闭本条目。
// =======================================
function handleGlobalClickCapture(e) {
  if (!activeSwipeId.value) return;

  const id        = activeSwipeId.value;
  const wrapperEl = swipeWrapperRefs[id];
  const actionsEl = swipeActionsRefs[id];
  const target    = e.target;

  // 命中滑层 / 右侧按钮 / 外置面板：都不关闭，不干扰菜单点击
  if (
    (wrapperEl && wrapperEl.contains(target)) ||
    (actionsEl && actionsEl.contains(target)) ||
    (panelEl && panelEl.contains(target))     // 新增白名单
  ) {
    return;
  }
  // 其它区域：照常关闭已打开的左滑
  closeAllSwipes();
}

function handleAnyMenuOpened(ev) {
  // 提取广播源 componentId（可能为空）
  const srcId = ev && ev.detail && ev.detail.id;

  // 若是“本条目在 onTouchStart 发出的自广播”，则忽略，不关闭本条目的左滑
  if (srcId && lastSwipeBroadcastId.value && srcId === lastSwipeBroadcastId.value) {
    return;
  }

  // 否则按原逻辑：收到任何菜单打开 -> 收起当前左滑
  closeAllSwipes();
}


// =======================================
// 17) 生命周期：挂载/卸载
// =======================================
onMounted(() => {
  nextTick(() => {
    if (eventsListRef.value) logic.initializeSortable(eventsListRef.value);
    setupListResizeObserver();       // RO 仅触发 refresh
    scheduleAdaptersImmediate();     // 首次适配
  });

  // 点击外部关闭左滑（捕获阶段）
  document.addEventListener('click', handleGlobalClickCapture, true);
  // 监听互斥广播（带 event 参数）
  document.addEventListener(MENU_OPEN_EVENT, handleAnyMenuOpened);
});

onUnmounted(() => {
  destroyAllAdapters();
  disconnectAllContentObservers();
  if (listResizeObserver) {
    try { listResizeObserver.disconnect(); } catch {}
    listResizeObserver = null;
  }
  document.removeEventListener('click', handleGlobalClickCapture, true);
  document.removeEventListener(MENU_OPEN_EVENT, handleAnyMenuOpened);
});


// =======================================
// 18) 列表数据变更：适配 + 拖拽
// =======================================
watch(
  () => logic.events.value,
  () => {
    nextTick(() => {
      scheduleAdaptersImmediate();                      // 立即适配
      if (eventsListRef.value) logic.initializeSortable(eventsListRef.value); // 重建拖拽
    });
  },
  { deep: true }
);


// =======================================
// 19) 清理工具
// =======================================
function destroyAllAdapters() {
  Object.values(adapters).forEach(slot => {
    if (slot && slot.adapter) {
      try { slot.adapter.destroy(); } catch {}
    }
  });
  adapters = {};
}

function disconnectAllContentObservers() {
  Object.values(countdownObsDisconnects).forEach(fn => {
    try { fn(); } catch {}
  });
  countdownObsDisconnects = {};
}
</script>

<style scoped>
/* 外壳与工具条（保持原样） */
.custom-countdown {
  margin-bottom: 6px;
  position: relative;
}
.custom-countdown-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  margin-bottom: 12px;
  margin-top: -12px;
}
.header-zone-left {
  justify-self: start;
}
.header-zone-right {
  justify-self: end;
}
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
.header-actions {
  display: flex;
  align-items: top;
  gap: 10px;
}
.joined-btn-group {
  display: flex;
}
.joined-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 16px;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  border: 0;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}
.joined-btn:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}
.joined-btn:last-child {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}
.joined-btn:hover {
  background-color: var(--bg-quaternary);
  color: var(--text-primary);
}
.joined-btn.active {
  background-color: var(--green-primary);
  color: var(--bg-primary);
}

/* 列表容器与外层卡片 */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.event-container {
  background: var(--bg-tertiary);
  border-radius: 12px;
  position: relative; /* 用于外置面板定位 */
  overflow: visible; /* 面板可溢出 */
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  cursor: default;
}
.event-container.menu-is-active {
  z-index: 20;
}

.clip-wrap {
  position: relative;
  border-radius: var(--cc-radius, 12px);
  overflow: hidden; /* 做减法：裁切内部内容与按钮 */

  /* 关键：窗口扩展法（左边界随滑动向左移动，右边界固定）
     - 宽度增加 absX
     - 自身整体向左平移 absX，使右边界不动、左边界左移 */
  width: calc(100% + var(--clip-extra, 0px));
  transform: translateX(calc(var(--clip-extra, 0px) * -1));
  will-change: transform;
  /*border: 1px dashed #10998e;/* [保留] 保留您的测试用边框 */
}

.swipe-wrapper {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  padding: 15px;
  will-change: transform;
  background: var(--bg-tertiary);
  box-sizing: border-box;

  /* 子层 = var(--swipe-x) + var(--clip-extra)
     父层 clip-wrap = translateX(-var(--clip-extra))
     合成后整体 = var(--swipe-x)，与按钮等速度一致 */
  transform: translateX(calc(var(--swipe-x, 0px) + var(--clip-extra, 0px)));
  transition: transform 180ms ease-out; /* 内联 transition 依然会覆盖这个值，不冲突 */
  /*border: 1px dashed #201099; /* [保留] 保留您的测试用边框 */
}
/* 行内容栅格（高度/布局保持） */
.event-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(60px, 1fr) 1.5fr minmax(320px, 2fr);
  gap: 20px;
  align-items: center;
  z-index: 1;
  /*border: 1px dashed #991070; /* [保留] 保留您的测试用边框 */
}

/* 按钮：裁切容器内，右对齐、宽度揭示 */
.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 0px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 0;
  z-index: 2;
  overflow: hidden; /**/
}
.swipe-btn {
  flex: 1 1 0;
  border: none;
  margin: 0;
  padding: 0 6px;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  background: var(--bg-quaternary);
  cursor: pointer;
  transition: background 0.15s ease-out;
}
.swipe-btn.edit {
  background: var(--green-primary);
}
.swipe-btn.copy {
  background: #f59e0b;
}
.swipe-btn.delete {
  background: #ef4444;
}
.swipe-btn:active {
  filter: brightness(0.9);
}

/* 文本列样式 */
.event-date-column,
.event-countdown-column {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  text-align: left;
  transition: color 0.2s;
  min-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  /*border: 1px dashed #991070;/* [保留] 保留您的测试用边框 */
}
.event-name-column {
  align-items: center;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  transition: color 0.2s;
  min-height: 24px;
  white-space: nowrap;
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

/* 触发按钮（仍在裁切容器内；面板外置） */
.settings-menu-container {
  position: absolute;
  top: 50%;
  right: -8px;
  transform: translateY(-50%);
  z-index: 50;
}
.menu-trigger-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent !important;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: transparent !important;
  color: var(--text-primary);
}

/* 面板（外置） */
.settings-dropdown-panel {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  display: flex;
  overflow: hidden;
}
.settings-dropdown-panel.outside-panel {
  position: absolute;
  top: 40px;
  right: 13px;
  z-index: 1002;
  touch-action: manipulation;
}
.settings-dropdown-panel.is-upward {
  /* 预留翻转类 */
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
.menu-option-btn.delete {
  color: #f44336;
}
.menu-option-btn.delete:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

/* 提示气泡（Teleport 到 body） */
.operation-hint,
.copy-confirm-hint,
.delete-confirm-hint {
  position: fixed;
  left: 0;
  top: 0;
  transform: translateY(-50%);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.operation-hint {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  opacity: 0.95;
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

/* 拖拽视觉 */
.sortable-chosen {
  box-shadow: 0 8px 40px rgba(52, 206, 99, 0.22), 0 2px 18px #0004;
  transform: scale(1.03);
  z-index: 100;
  cursor: grabbing;
}
.drag-ghost {
  opacity: 0.4 !important;
  background: rgba(76, 175, 80, 0.15) !important;
  border: 1px solid rgba(76, 175, 80, 0.35) !important;
  box-shadow: none !important;
}

/* 空态/模态 */
.empty-tip {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 20px;
}
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

/* 移动端 */
@media (max-width: 800px) {
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
    transform: translateX(calc(var(--clip-extra, 0px) * -0.5));
    will-change: transform;
  }
  .event-name-column,
  .event-date-column,
  .event-countdown-column {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .settings-menu-container {
    top: 8px;
    right: -8px;
    transform: translateX(calc(var(--clip-extra, 0px) * -0.5)) translateY(-50%);
  }
  .settings-dropdown-panel.outside-panel {
    position: absolute;
    top: 36px;
    right: 13px;
    z-index: 1002;
  }

  .modal-content {
    min-width: 90vw;
  }
  .event-name-input {
    min-width: calc(90vw - 80px);
  }

  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: block !important;
  }

  .swipe-actions {
    display: flex !important;
  }
  .events-list,
  .event-container,
  .clip-wrap,
  .swipe-wrapper {
    touch-action: pan-y;
  }
}
</style>
