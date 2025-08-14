<!-- E:\AppProject\VisualTime\src\components\CustomCountdown.vue -->
<!-- 阶段6：统一仲裁器版本（彻底移除 eventBus 与仲裁器开关），所有互斥仅由 actionArbiter 管控 -->

<template>
  <!-- 根容器：自定义倒计时模块卡片 -->
  <div class="custom-countdown card">
    <!-- 顶部工具条 -->
    <div class="custom-countdown-header">
      <div class="header-zone-left">
        <h3 class="title">自定义倒计时</h3>
      </div>
      <div class="header-actions header-zone-right">
        <div class="joined-btn-group">
          <!-- 添加按钮：打开“新增事件”模态 -->
          <button
            class="joined-btn action-btn add-btn"
            @click="logic.openAddModal"
            title="添加新倒计时"
          >
            <!-- 加号图标（纯UI） -->
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

          <!-- 排序按钮：手动/升序/降序 三态循环 -->
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
            <!-- 三种状态对应三种SVG -->
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

    <!-- 新增/编辑模态（仲裁器管理关闭路由：ESC；外点击不关闭） -->
    <div
      v-if="logic.isModalOpen.value"
      class="modal-overlay"
      @click.self="handleModalOverlayClick"
    >
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">{{ logic.modalTitle.value }}</h3>
        <div class="modal-form">
          <!-- 日期输入区：年-月-日 -->
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
          <!-- 时间输入区：时:分:秒 -->
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
          <!-- 名称输入 -->
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

    <!-- 列表区域：每条事件支持左滑/菜单/拖拽 -->
    <div class="events-list" ref="eventsListRef">
      <!-- 事件行容器 -->
      <div
        v-for="event in logic.processedEvents.value"
        :key="event.id"
        :data-id="event.id"
        class="event-container"
        :style="{
          // 分类提升层级的场景：
          // 1) 当前行菜单打开（最顶层显示）
          // 2) 当前行左滑已打开（高度居中，保证右侧按钮阴影完整）
          // 3) 当前鼠标悬浮在本行（高度最低，确保悬浮阴影不被相邻行遮挡）
          zIndex:
            logic.activeMenu.value === event.id
              ? 2000 // 菜单打开：最高
              : activeSwipeId === event.id
              ? 1000 // 左滑展开：次高
              : logic.hoveredEventId.value === event.id
              ? 100 // 仅悬浮：最低提升
              : undefined, // 其他：不提升
        }"
        @mouseenter="logic.handleEventMouseEnter(event.id)"
        @mouseleave="logic.handleEventMouseLeave"
        @mousemove="logic.handleEventMouseMove"
        @touchstart.capture="onTouchStart($event, event.id)"
        @touchmove.capture="onTouchMove($event, event.id)"
        @touchend.capture="onTouchEnd($event, event.id)"
        @touchcancel.capture="onTouchCancel($event, event.id)"
      >
        <!-- 裁切容器：扩展窗口左边界（优雅左滑，不溢出） -->
        <div
          class="clip-wrap"
          :class="{
            'is-hovered': logic.hoveredEventId.value === event.id,
            'menu-is-active': logic.activeMenu.value === event.id,
            'pending-copy': logic.pendingCopyId.value === event.id,
            'pending-delete': logic.pendingDeleteId.value === event.id,
            'swipe-open': activeSwipeId === event.id,
          }"
          :style="getClipWrapStyle(event.id)"
        >
          <!-- 滑动层：跟随左滑移动 -->
          <div
            class="swipe-wrapper"
            :ref="(el) => (swipeWrapperRefs[event.id] = el)"
            :style="getSwipeStyle(event.id)"
            @transitionend="onSwipeTransitionEnd(event.id)"
          >
            <!-- 行内网格：名称、日期、倒计时、菜单触发 -->
            <div class="event-item">
              <!-- 名称列 -->
              <div
                class="event-name-column"
                :ref="(el) => (eventNameColumnRefs[event.id] = el)"
                :title="event.name"
              >
                <span>{{ event.name }}</span>
              </div>
              <!-- 日期列 -->
              <div
                class="event-date-column"
                :ref="(el) => (dateColumnRefs[event.id] = el)"
              >
                <span :ref="(el) => (dateContentRefs[event.id] = el)">{{
                  event.dateTimeDesc
                }}</span>
              </div>
              <!-- 倒计时列 -->
              <div
                class="event-countdown-column"
                :ref="(el) => (countdownColumnRefs[event.id] = el)"
              >
                <span
                  :ref="(el) => (countdownContentRefs[event.id] = el)"
                  v-html="event.finalDisplay"
                ></span>
              </div>

              <!-- 菜单触发（在裁切容器内，避免外点击误判） -->
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
                  :class="{ active: logic.activeMenu.value === event.id }"
                  :ref="(el) => (menuTriggerRefs[event.id] = el)"
                  @click="openMenuWithSwipeClose(event.id)"
                  title="菜单 /
                  长按拖拽"
                >
                  <!-- 三横线图标 -->
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

          <!-- 右侧功能按钮（左滑揭示） -->
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

        <!-- 菜单面板（外置；方向翻转通过 is-upward 控制） -->
        <div
          v-if="logic.activeMenu.value === event.id"
          class="settings-dropdown-panel outside-panel"
          :ref="(el) => (menuPanelRefs[event.id] = el)"
          :class="{ 'is-upward': logic.isMenuUpward.value }"
          @click.stop
        >
          <!-- 单位列 -->
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
          <!-- 精度列 -->
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
          <!-- 操作列 -->
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

      <!-- 空态提示 -->
      <p v-if="logic.processedEvents.value.length === 0" class="empty-tip">
        暂无自定义倒计时，请添加
      </p>
    </div>
  </div>

  <!-- 提示气泡：Teleport 到 body -->
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
            <span class="hint-key">按 Space 或 / 键</span>
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

    <!-- 新增：拖拽禁用提示（排序模式下长按把手触发；始终位于指针左侧） -->
    <Transition name="hint-fade">
      <div
        v-if="logic.dragDisabledHint.visible"
        class="drag-disabled-hint"
        :style="{
          left: logic.dragDisabledHint.x + 'px',
          top: logic.dragDisabledHint.y + 'px',
        }"
      >
        {{ logic.dragDisabledHint.text }}
      </div>
    </Transition>
  </teleport>
</template>

<script setup>
// =======================================
// 1) 依赖导入（纯仲裁路径版本）
// =======================================

// Vue 核心API
import {
  ref, // 响应式原子
  onMounted, // 挂载生命周期
  onUnmounted, // 卸载生命周期
  onBeforeUpdate, // 更新前重置ref映射
  watch, // 侦听响应式数据
  nextTick, // 下一次DOM更新后
  computed, // 派生数据
} from "vue";

// 业务逻辑：自定义事件（CRUD/表单/菜单/拖拽/二步确认等）
import { useCustomEvents } from "../composables/useCustomEvents.js";

// 文本自适应工具集
import {
  getEffectiveWidth, // 计算有效宽度（考虑box-sizing与padding）
  makeFontSchedulers, // 创建调度器（nextTick/rAF）
  observeContentWidth, // 观察文本内容宽度变化
  ensureAdapterSlot, // 统一创建/刷新字号适配器槽
} from "../utils/fontSizeManager.js";

// 全局互斥仲裁器（唯一机制）
import {
  activate, // 激活会话（后触发即取代）
  closeActive, // 主动关闭当前会话
  isActive, // 判断某key是否当前激活
} from "../services/actionArbiter.js";

// =======================================
// 2) 业务实例与列表容器
// =======================================

// 获得自定义倒计时的全部业务逻辑与状态
const logic = useCustomEvents(); // 含 events/菜单/模态/排序等
const eventsListRef = ref(null); // 列表根容器（用于初始化拖拽）

// =======================================
// 3) DOM 引用映射（普通对象，避免递归响应式）
// =======================================

let menuTriggerRefs = {}; // 每行菜单按钮
let menuPanelRefs = {}; // 菜单面板
let eventNameColumnRefs = {}; // 名称列容器
let dateColumnRefs = {}; // 日期列容器
let countdownColumnRefs = {}; // 倒计时列容器
let dateContentRefs = {}; // 日期文本节点
let countdownContentRefs = {}; // 倒计时HTML文本容器
let swipeWrapperRefs = {}; // 左滑移动层
let swipeActionsRefs = {}; // 右侧动作按钮容器

// 每次更新前重置映射，避免孤儿引用
onBeforeUpdate(() => {
  menuTriggerRefs = {};
  menuPanelRefs = {};
  eventNameColumnRefs = {};
  dateColumnRefs = {};
  countdownColumnRefs = {};
  dateContentRefs = {};
  countdownContentRefs = {};
  swipeWrapperRefs = {};
  swipeActionsRefs = {};
});

// =======================================
// 4) 字号适配/观察器容器
// =======================================

let listResizeObserver = null; // 列表尺寸观察器
let adapters = {}; // 各列自适配槽
let countdownObsDisconnects = {}; // 倒计时文本内容观察器的清理句柄

// =======================================
// 5) 左滑交互状态与阈值（仲裁器统一）
// =======================================

const activeSwipeId = ref(null); // 当前打开左滑的条目id
const swipeXById = ref({}); // 每条目的位移（px）
let swipingId = null; // 当前手势中条目id
const animatingIds = ref(new Set()); // 正在动画的条目

const ACTIONS_MAX_WIDTH = 180; // 右侧按钮最大揭示宽度
const OPEN_THRESHOLD = 60; // 松手后打开阈值（绝对位移）
const MOVE_THRESHOLD = 10; // 判定水平滑动的阈值

// 手势起点 & 原位移
let startX = 0,
  startY = 0,
  originX = 0;
// 轴向判定
let decidedAxis = false,
  isHorizontal = false;

// 返回“本行左滑的根容器”（供 outside 判定）：clip-wrap（swipe-wrapper 的父节点）
function getSwipeRootEl(id) {
  const swipeWrapper = swipeWrapperRefs[id];
  return swipeWrapper ? swipeWrapper.parentElement : null;
}

// =======================================
// 6) id -> event 映射（便于读取配置）
// =======================================

const eventsById = computed(() => {
  const m = {};
  logic.events.value.forEach((e) => (m[e.id] = e));
  return m;
});

// =======================================
// 7) 字号适配调度器（nextTick/帧合并）
// =======================================

const {
  scheduleImmediate: scheduleAdaptersImmediate, // 内容变化：同帧
  scheduleFrame: scheduleAdaptersFrame, // 结构变化：rAF
} = makeFontSchedulers(setupAdapters);

// =======================================
// 8) 左滑相关内联样式（CSS变量）
// =======================================

// 裁切容器样式：窗口扩展宽度（防止露出空白）
function getClipWrapStyle(id) {
  const x = swipeXById.value[id] ?? 0;
  const extra = x < 0 ? -x : 0;
  return { "--clip-extra": `${extra}px` };
}

// 滑动层样式：位移 + 动画状态
function getSwipeStyle(id) {
  const x = swipeXById.value[id] ?? 0;
  const anim = animatingIds.value.has(id);
  return {
    "--swipe-x": `${x}px`,
    transition: anim ? "transform 180ms ease-out" : "none",
    willChange: "transform",
  };
}

// 右侧按钮容器宽度：随位移揭示，且封顶
function getSwipeActionsStyle(id) {
  const x = swipeXById.value[id] ?? 0;
  const w = Math.max(0, Math.min(ACTIONS_MAX_WIDTH, -x));
  return { width: `${w}px` };
}

// =======================================
// 9) 倒计时列内容宽度监听：内容变化触发字号适配重建
// =======================================

function ensureCountdownObserverFor(id) {
  if (countdownObsDisconnects[id]) return; // 已监听则跳过
  const el = countdownContentRefs[id];
  if (!el) return;

  const key = `${id}_countdown`;
  if (!adapters[key]) adapters[key] = {};
  adapters[key].lastContentWidth = el.scrollWidth || 0;

  const disconnect = observeContentWidth(
    el,
    (changed, cur) => {
      if (changed) {
        adapters[key].needsRecreate = true; // 标记需要重建
        adapters[key].lastContentWidth = cur;
      }
      scheduleAdaptersImmediate(); // 同帧适配
    },
    { threshold: 0 }
  );
  countdownObsDisconnects[id] = disconnect; // 保存清理函数
}

// =======================================
// 10) 字号适配主入口：日期列/倒计时列各自适配
// =======================================

function setupAdapters() {
  logic.events.value.forEach((event) => {
    const id = event.id;

    // 日期列适配
    {
      const colEl = dateColumnRefs[id];
      const contentEl = dateContentRefs[id];
      if (colEl && contentEl) {
        const key = `${id}_date`;
        const slot = adapters[key] || (adapters[key] = {});
        const widthProvider = () => getEffectiveWidth(colEl);
        ensureAdapterSlot(slot, {
          container: colEl,
          elements: [contentEl],
          options: {
            container: colEl,
            elements: [contentEl],
            minSize: 10,
            debounceDelay: 50,
            observeContainerResize: false, // 由上层集中监听
            effectiveWidthProvider: widthProvider,
          },
          forceRecreate: !!slot.needsRecreate,
        });
      }
    }

    // 倒计时列适配（包含内部 HTML 节点）
    {
      const colEl = countdownColumnRefs[id];
      const contentEl = countdownContentRefs[id];
      if (colEl && contentEl) {
        ensureCountdownObserverFor(id); // 监听内容宽度
        const elementsToScale = [contentEl, ...contentEl.querySelectorAll("*")];
        const key = `${id}_countdown`;
        const slot = adapters[key] || (adapters[key] = {});
        const widthProvider = () => getEffectiveWidth(colEl);
        ensureAdapterSlot(slot, {
          container: colEl,
          elements: [contentEl],
          options: {
            container: colEl,
            elements: elementsToScale,
            minSize: 10,
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
// 11) 列表 ResizeObserver：结构变化合帧适配
// =======================================

function setupListResizeObserver() {
  if (listResizeObserver) {
    try {
      listResizeObserver.disconnect();
    } catch {}
    listResizeObserver = null;
  }
  if (!eventsListRef.value || !window.ResizeObserver) return;

  listResizeObserver = new ResizeObserver(() => {
    scheduleAdaptersFrame(); // 结构变化 → rAF 合帧
  });
  listResizeObserver.observe(eventsListRef.value);
}

// =======================================
// 12) 滑动动画结束：移除动画状态
// =======================================

function onSwipeTransitionEnd(id) {
  if (animatingIds.value.has(id)) {
    const next = new Set(animatingIds.value);
    next.delete(id);
    animatingIds.value = next;
  }
}

// =======================================
// 13) 左滑开合（UI 与会话分离；仲裁器统一管理）
// =======================================

// 仅更新UI（打开）
function openSwipeUI(id) {
  // 若已有其他条目打开，先关闭其他
  if (activeSwipeId.value && activeSwipeId.value !== id) {
    const other = activeSwipeId.value;
    swipeXById.value = { ...swipeXById.value, [other]: 0 };
    const n = new Set(animatingIds.value);
    n.add(other);
    animatingIds.value = n;
  }
  // 设置本条目展开至最大
  swipeXById.value = { ...swipeXById.value, [id]: -ACTIONS_MAX_WIDTH };
  const n = new Set(animatingIds.value);
  n.add(id);
  animatingIds.value = n;
  activeSwipeId.value = id;
}

// 仅更新UI（关闭）
function closeSwipeUI(id) {
  swipeXById.value = { ...swipeXById.value, [id]: 0 };
  const n = new Set(animatingIds.value);
  n.add(id);
  animatingIds.value = n;
  if (activeSwipeId.value === id) activeSwipeId.value = null;
}

// 打开左滑：激活会话（后触发即取代），outside/ESC关闭
function openSwipe(id) {
  // 已是当前激活则只需确保UI打开
  if (isActive(`swipe:custom:${id}`)) {
    openSwipeUI(id);
    return;
  }

  // 激活新会话（作用域：clip-wrap，避免内部点击误判为outside）
  activate({
    key: `swipe:custom:${id}`,
    closers: { esc: true, outside: true },
    onPreempt: () => {
      // 会话被取代或关闭：幂等关闭UI
      closeSwipeUI(id);
    },
    onRelease: () => {
      // 释放后兜底关闭UI
      closeSwipeUI(id);
    },
    getRootEl: () => getSwipeRootEl(id),
  });

  // 打开UI
  openSwipeUI(id);
}

// 关闭左滑：若是当前会话则通过仲裁器关闭，否则仅做UI关闭
function closeSwipe(id) {
  const key = `swipe:custom:${id}`;
  if (isActive(key)) {
    closeActive("close");
  } else {
    closeSwipeUI(id);
  }
}

// 关闭所有左滑（用于操作前收起）
function closeAllSwipes() {
  if (!activeSwipeId.value) return;
  closeSwipe(activeSwipeId.value);
}

/* 新增：仅“抢占/声明”左滑会话，不修改UI，用于一判定为水平滑动即刻互斥其它会话 */
function claimSwipeSession(id) {
  const key = `swipe:custom:${id}`;
  if (isActive(key)) return; // 已是当前，无需重复
  activate({
    key,
    closers: { esc: true, outside: true },
    onPreempt: () => {
      closeSwipeUI(id); // 被取代时收起本行（幂等）
    },
    onRelease: () => {
      closeSwipeUI(id); // 会话关闭后兜底收起（幂等）
    },
    getRootEl: () => getSwipeRootEl(id), // 作用域：clip-wrap
  });
}

// =======================================
// 14) 触摸手势（移动端左滑）
// =======================================

// 判断触点是否位于“拖拽把手”（菜单按钮）
function isOnDragHandle(id, target) {
  const handleEl = menuTriggerRefs[id];
  if (!handleEl || !target) return false;
  return handleEl === target || handleEl.contains(target);
}

// touchstart：建立手势，禁止与拖拽会话同时发生；把手区域不触发左滑
function onTouchStart(e, id) {
  if (window.innerWidth > 800) return; // 仅移动端启用
  if (!e.touches || e.touches.length !== 1) return; // 单指手势

  // 若拖拽会话正在进行，禁止左滑
  if (isActive("drag:custom-list")) return;

  // 触点若位于右侧动作按钮/菜单面板/拖拽把手，跳过左滑
  const actionsEl = swipeActionsRefs[id];
  if (actionsEl && actionsEl.contains(e.target)) return;

  const panelEl = menuPanelRefs[id];
  if (panelEl && panelEl.contains(e.target)) return;

  if (isOnDragHandle(id, e.target)) return;

  // 标记当前手势曲线
  swipingId = id;

  // 记录起点
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
  originX = swipeXById.value[id] ?? 0;
  decidedAxis = false;
  isHorizontal = false;

  // 若当前处于动画中，先移除动画状态，避免瞬移感
  if (animatingIds.value.has(id)) {
    const n = new Set(animatingIds.value);
    n.delete(id);
    animatingIds.value = n;
  }
}

// touchmove：轴向判定后，仅在水平时拦截滚动并更新位移
function onTouchMove(e, id) {
  if (window.innerWidth > 800) return;
  if (swipingId !== id) return;
  if (!e.touches || e.touches.length !== 1) return;

  // 拖拽进行时不响应左滑移动
  if (isActive("drag:custom-list")) return;

  const t = e.touches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  // 判定轴向（只判一次）
  if (
    !decidedAxis &&
    (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)
  ) {
    decidedAxis = true;
    isHorizontal = Math.abs(dx) > Math.abs(dy);
  }

  // 新增：一旦确定为“水平滑动”，立刻声明/抢占左滑会话，立即互斥掉菜单/其他左滑
  if (isHorizontal) {
    claimSwipeSession(id);
  } else {
    return; // 非水平 → 交还浏览器垂直滚动
  }

  // 水平滑动：阻止浏览器滚动，更新位移
  e.preventDefault();
  e.stopPropagation();

  let nextX = originX + dx;
  if (nextX > 0) nextX = 0;
  if (nextX < -ACTIONS_MAX_WIDTH) nextX = -ACTIONS_MAX_WIDTH;

  swipeXById.value = { ...swipeXById.value, [id]: nextX };
}

// touchend：根据阈值决定开合；拖拽优先
function onTouchEnd(e, id) {
  if (window.innerWidth > 800) return;
  if (swipingId !== id) return;

  if (isActive("drag:custom-list")) {
    swipingId = null;
    return;
  }

  if (!isHorizontal) {
    swipingId = null;
    return;
  }

  const x = swipeXById.value[id] ?? 0;
  if (Math.abs(x) > OPEN_THRESHOLD) openSwipe(id);
  else closeSwipe(id);

  swipingId = null;
}

// touchcancel：与 touchend 相同的收尾策略
function onTouchCancel(e, id) {
  if (window.innerWidth > 800) return;
  if (swipingId !== id) return;

  if (isActive("drag:custom-list")) {
    swipingId = null;
    return;
  }

  const x = swipeXById.value[id] ?? 0;
  if (Math.abs(x) > OPEN_THRESHOLD) openSwipe(id);
  else closeSwipe(id);

  swipingId = null;
}

// =======================================
// 15) 右侧按钮：编辑/复制/删除（操作前收起左滑）
// =======================================

function handleSwipeEdit(eventObj) {
  closeAllSwipes();
  // 传入原始 event 或映射后的对象均可
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

// 打开菜单：无需手动关闭左滑，菜单会话激活将取代左滑会话
function openMenuWithSwipeClose(id) {
  toggleRowMenu(id);
}

// =======================================
// 16) 模态遮罩点击：本组件的新增/编辑模态 outside=false，不响应遮罩点击
// =======================================

function handleModalOverlayClick() {
  // 故意留空：模态会话已设置 outside:false（仅 ESC 关闭）
}

// =======================================
// 16.5) 菜单方向翻转（根据触发器相对视口位置动态判断）
// =======================================

function flipMenuDirectionIfNeeded(id) {
  const triggerEl = menuTriggerRefs[id];
  const panelEl = menuPanelRefs[id];
  if (!triggerEl || !panelEl) return;

  const trigRect = triggerEl.getBoundingClientRect();
  const panelRect = panelEl.getBoundingClientRect();
  const panelHeight = panelRect.height || panelEl.offsetHeight || 0;

  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  const belowSpace = Math.max(0, viewportH - trigRect.bottom);
  const aboveSpace = Math.max(0, trigRect.top);

  let shouldUp = false;
  if (panelHeight > belowSpace && aboveSpace >= belowSpace) {
    shouldUp = panelHeight <= aboveSpace || aboveSpace >= belowSpace;
  } else if (panelHeight > aboveSpace && belowSpace >= aboveSpace) {
    shouldUp = false;
  } else if (panelHeight > aboveSpace && panelHeight > belowSpace) {
    shouldUp = aboveSpace >= belowSpace;
  } else {
    shouldUp = false;
  }

  if (logic.isMenuUpward.value !== shouldUp) {
    logic.isMenuUpward.value = shouldUp;
  }
}

// 当菜单打开时，nextTick 后进行一次方向判定
watch(
  () => logic.activeMenu.value,
  (newId) => {
    if (newId != null) {
      nextTick(() => flipMenuDirectionIfNeeded(newId));
    }
  }
);

// 窗口尺寸变化时，若有菜单打开则重新判定方向
const _onWindowResize = () => {
  const id = logic.activeMenu.value;
  if (id != null) {
    nextTick(() => flipMenuDirectionIfNeeded(id));
  }
};

// =======================================
// 17) 生命周期：初始化拖拽/观察器；移除全部旧广播/旧监听
// =======================================

onMounted(() => {
  nextTick(() => {
    // 初始化拖拽（把手：菜单按钮，长按300ms）
    if (eventsListRef.value) logic.initializeSortable(eventsListRef.value);
    // 列表尺寸观察
    setupListResizeObserver();
    // 首次适配
    scheduleAdaptersImmediate();
  });

  // 仅保留必要的 window 监听（方向翻转）
  window.addEventListener("resize", _onWindowResize);
});

onUnmounted(() => {
  // 销毁所有字号适配器
  destroyAllAdapters();
  // 取消文本内容观察
  disconnectAllContentObservers();
  // 取消列表尺寸观察
  if (listResizeObserver) {
    try {
      listResizeObserver.disconnect();
    } catch {}
    listResizeObserver = null;
  }
  // 移除窗口监听
  window.removeEventListener("resize", _onWindowResize);
});

// =======================================
// 18) 列表数据变化：重建拖拽与适配
// =======================================

watch(
  () => logic.events.value,
  () => {
    nextTick(() => {
      scheduleAdaptersImmediate();
      if (eventsListRef.value) logic.initializeSortable(eventsListRef.value);
    });
  },
  { deep: true }
);

// =======================================
// 19) 清理工具：适配器与观察器
// =======================================

function destroyAllAdapters() {
  Object.values(adapters).forEach((slot) => {
    if (slot && slot.adapter) {
      try {
        slot.adapter.destroy();
      } catch {}
    }
  });
  adapters = {};
}

function disconnectAllContentObservers() {
  Object.values(countdownObsDisconnects).forEach((fn) => {
    try {
      fn();
    } catch {}
  });
  countdownObsDisconnects = {};
}

// =======================================
// 20) 菜单 toggle（仅仲裁器路径）
// =======================================

function toggleRowMenu(eventId) {
  const key = `menu:custom:${eventId}`;

  // 已是当前激活：toggle 关闭
  if (isActive(key)) {
    closeActive("toggle");
    return;
  }

  // 激活新的菜单会话：outside/ESC关闭；scope=触发器容器+外置面板
  activate({
    key,
    closers: { esc: true, outside: true },
    onPreempt: () => {
      if (logic.activeMenu.value === eventId) {
        logic.activeMenu.value = null;
      }
    },
    onRelease: () => {
      if (logic.activeMenu.value === eventId) {
        logic.activeMenu.value = null;
      }
    },
    getRootEl: () => {
      const triggerContainer = menuTriggerRefs[eventId]?.parentElement || null; // .settings-menu-container
      const panelEl = menuPanelRefs[eventId] || null; // 外置面板
      return [triggerContainer, panelEl].filter(Boolean);
    },
  });

  // 打开当前菜单（其余菜单将被对方 onPreempt 关闭）
  logic.activeMenu.value = eventId;
}
</script>

<style scoped>
/* 外壳与工具条 */
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
  position: relative;
  overflow: visible;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  cursor: default;
}

/* 裁切容器（左滑窗口扩展法 + 柔和呼吸动效支持） */
.clip-wrap {
  position: relative;
  border-radius: var(--cc-radius, 12px);
  overflow: hidden;
  width: calc(100% + var(--clip-extra, 0px));
  transform: translateX(calc(var(--clip-extra, 0px) * -1));

  /* 新增：仅对光效相关属性做过渡，避免 transform 拖尾 */
  transition: box-shadow 0.25s ease, outline-color 0.25s ease;

  /* 新增：使用 outline 营造高级感描边，不影响布局尺寸 */
  outline: 0 solid transparent;

  /* 合并：同时提示浏览器优化 transform + 阴影 + 描边颜色 */
  will-change: transform, box-shadow, outline-color;
}

/* 新增：悬浮高亮（加强版，仍保持克制与高级感）
   - 增强项：
     1) 阴影略加强：更深的主阴影与次阴影，形成更清晰的“浮起感”
     2) 描边饱和度略升：绿色点缀从 20% -> 32%，并将宽度从 1px 提升到 1.5px
     3) 内容层轻微提亮：仅在悬浮时将内容背景微提亮，提升可感知度但不过曝
   - 不改变尺寸与位移，避免与左滑/过渡造成干扰
 */
.clip-wrap.is-hovered {
  /* 提升层级由父容器 z-index 控制，这里只负责视觉表现 */
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28),
    /* 主阴影：略深、半径略大 */ 0 4px 14px rgba(0, 0, 0, 0.22); /* 次阴影：贴近主体，层次更清晰 */
  outline-color: color-mix(
    in srgb,
    var(--green-primary) 32%,
    transparent
  ); /* 轻度提升饱和度 */
  /*outline-width: 1.5px; /* 描边更细腻 */
  /* 不做 transform 位移，避免与左滑/动画叠加引发“跳动感” */
}

/* 悬浮时对内容层做轻微提亮（仅在支持 color-mix 的浏览器生效）
   - 提亮比例谨慎（约 12% toward #fff），保证不刺眼 */
.clip-wrap.is-hovered .swipe-wrapper {
  /* 保留原色作为回退，然后尝试混合提亮 */
  background: var(--bg-quaternary);
  /* background: color-mix(in srgb, var(--bg-tertiary) 88%, #fff 8%); */
}

/* 如果希望在“左滑已展开”的情况下也维持同等高亮，可按需解注释：
.clip-wrap.is-hovered,
.clip-wrap.swipe-open {
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28), 0 4px 14px rgba(0, 0, 0, 0.22);
  outline-color: color-mix(in srgb, var(--green-primary) 32%, transparent);
  outline-width: 1.5px;
} */

/* 滑动层（跟随裁切容器位移） */
.swipe-wrapper {
  position: relative;
  z-index: 1;
  display: block;
  width: calc(100% + var(--swipe-x, 0px));
  padding: 15px;
  background: var(--bg-tertiary);
  box-sizing: border-box;
}

/* 行内网格 */
.event-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(60px, 1fr) 1.5fr minmax(320px, 2fr);
  gap: 20px;
  align-items: center;
  z-index: 1;
}

/* 右侧彩色按钮（随左滑揭示） */
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
  overflow: hidden;
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

/* 菜单触发容器与按钮 */
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
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: var(--text-tertiary);
  color: var(--text-primary);
}

/* 菜单面板（外置；默认向下） */
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
  top: 45px;
  right: 6px;
  z-index: 1002;
  touch-action: manipulation;
}
.settings-dropdown-panel.outside-panel.is-upward {
  top: auto;
  bottom: 45px;
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
  color: #ef4444;
}
.menu-option-btn.delete:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

/* 提示气泡 */
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
  background: var(--bg-primary);
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
  color: #ef4444;
}
.copy-confirm-hint {
  background: #f59e0b;
  color: #fff;
}
.delete-confirm-hint {
  background: #ef4444;
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

/* 复制待确认：琥珀黄（amber）低饱和，柔和呼吸 */
@keyframes vt-softPulse-amber {
  0% {
    box-shadow: 0 0 0 rgba(245, 158, 11, 0), 0 0 0 rgba(0, 0, 0, 0);
    outline-color: rgba(245, 158, 11, 0);
    outline-width: 0px;
    transform: translateZ(0);
  }
  50% {
    box-shadow: 0 10px 28px rgba(245, 158, 11, 0.16),
      0 0 0 4px rgba(245, 158, 11, 0.14);
    outline-color: rgba(245, 158, 11, 0.22);
    outline-width: 2px;
    transform: translateZ(0);
  }
  100% {
    box-shadow: 0 0 0 rgba(245, 158, 11, 0), 0 0 0 rgba(0, 0, 0, 0);
    outline-color: rgba(245, 158, 11, 0);
    outline-width: 0px;
    transform: translateZ(0);
  }
}

/* 删除待确认：柔和红（tailwind red-500 同色系）低饱和，轻盈呼吸 */
@keyframes vt-softPulse-red {
  0% {
    box-shadow: 0 0 0 rgba(239, 68, 68, 0), 0 0 0 rgba(0, 0, 0, 0);
    outline-color: rgba(239, 68, 68, 0);
    outline-width: 0px;
    transform: translateZ(0);
  }
  50% {
    box-shadow: 0 10px 28px rgba(239, 68, 68, 0.18),
      0 0 0 4px rgba(239, 68, 68, 0.14);
    outline-color: rgba(239, 68, 68, 0.22);
    outline-width: 2px;
    transform: translateZ(0);
  }
  100% {
    box-shadow: 0 0 0 rgba(239, 68, 68, 0), 0 0 0 rgba(0, 0, 0, 0);
    outline-color: rgba(239, 68, 68, 0);
    outline-width: 0px;
    transform: translateZ(0);
  }
}

/* 绑定在 .clip-wrap 上的状态类，触发柔和闪动（迭代3次，恰好覆盖确认窗口期） */
.clip-wrap.pending-copy {
  animation: vt-softPulse-amber 1.2s ease-in-out 3;
}
.clip-wrap.pending-delete {
  animation: vt-softPulse-red 1.2s ease-in-out 3;
}

.drag-disabled-hint {
  position: fixed;
  left: 0;
  top: 0;
  width: 240px; /* 固定宽度，避免随指针移动造成视觉抖动 */
  max-width: 240px; /* 防止被其它规则放宽 */
  white-space: pre-line; /* 允许自动换行，避免 nowrap 下内容溢出 */
  /* 定位到指针，整体向左放置避免遮挡指针与按压点 */
  transform: translate(-100%, -50%) translateX(-12px);
  background: var(--bg-primary); /* background: rgba(17, 17, 17, 0.92); */
  color: var(--text-secondary); /* color: #fff; */
  padding: 8px 12px;
  border-radius: 8px;
  /* border: 1px solid var(--border-color); */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  z-index: 10003;
  pointer-events: none;
  font-size: 14px;
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

/* 移动端适配 */
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
  }
  .event-name-column,
  .event-date-column,
  .event-countdown-column {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .menu-trigger-btn:hover {
    background: transparent;
    color: var(--text-secondary);
  }

  .menu-trigger-btn.active {
    background: var(--bg-quaternary);
    color: var(--text-primary);
  }

  .settings-menu-container {
    top: 8px;
    right: -8px;
  }
  .settings-dropdown-panel.outside-panel {
    position: absolute;
    top: 40px;
    right: 6px;
    z-index: 1002;
  }
  .settings-dropdown-panel.outside-panel.is-upward {
    bottom: 112px;
    top: auto;
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
