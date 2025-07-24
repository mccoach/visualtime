<!-- E:\AppProject\VisualTime\src\components\CustomCountdown.vue (最终修复版 - 修复菜单交互所有问题) -->
<template>
  <div class="custom-countdown card" @mousedown.left.self="logic.startMarquee($event.clientX, $event.clientY, $event)"
    @touchstart.self="logic.startMarquee($event.touches[0].clientX, $event.touches[0].clientY, $event)">
    <div class="custom-countdown-header">
      <div class="header-zone-left">
        <h3 class="title">自定义倒计时</h3>
      </div>
      <div class="header-actions header-zone-right">
        <button v-if="logic.isMultiSelectMode.value && logic.selectedEventIds.value.size > 0"
          class="button button-danger bulk-delete-btn" @click="logic.bulkDelete"
          :title="`删除选中的 ${logic.selectedEventIds.value.size} 个项目`">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          批量删除
        </button>
        <div class="joined-btn-group">
          <button class="joined-btn action-btn add-btn" @click="logic.openAddModal" title="添加新倒计时">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="3" x2="12" y2="21"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
            </svg>
          </button>
          <button class="joined-btn action-btn" :class="{ active: logic.sortOrder.value !== 'manual' }"
            @click="logic.cycleSortOrder"
            :title="`当前排序: ${logic.sortOrder.value === 'manual' ? '手动' : (logic.sortOrder.value === 'asc' ? '升序' : '降序')}`">
            <svg v-if="logic.sortOrder.value === 'manual'" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <line x1="9" y1="3" x2="9" y2="21" stroke-width="3" stroke-linecap="round" />
              <line x1="9" y1="3" x2="4" y2="10" stroke-width="2" stroke-linecap="round" />
              <line x1="15" y1="3" x2="15" y2="21" stroke-width="3" stroke-linecap="round" />
              <line x1="20" y1="14" x2="15" y2="21" stroke-width="2" stroke-linecap="round" />
            </svg>
            <svg v-else-if="logic.sortOrder.value === 'asc'" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <line x1="9" y1="1" x2="9" y2="23" stroke-width="4" stroke-linecap="round" />
              <line x1="9" y1="1" x2="4" y2="10" stroke-width="3" stroke-linecap="round" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="15" y1="1" x2="15" y2="23" stroke-width="4" stroke-linecap="round" />
              <line x1="20" y1="14" x2="15" y2="23" stroke-width="3" stroke-linecap="round" />
            </svg>
          </button>
          <button class="joined-btn action-btn" :class="{ active: logic.isMultiSelectMode.value }"
            @click="logic.toggleMultiSelectMode" title="切换多选模式">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="1" width="22" height="22" rx="0" ry="0" />
              <path d="m5 14 4 4 10 -12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="logic.isModalOpen.value" class="modal-overlay" @click.self="logic.closeModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">{{ logic.modalTitle.value }}</h3>
        <div class="modal-form">
          <div class="input-group">
            <input :ref="logic.formRefs.year" v-model="logic.eventForm.value.year" type="text" class="input"
              placeholder="年" @input="logic.formInteractionHandler.onInput($event, 'year')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'year')"
              @focus="logic.formInteractionHandler.onFocus($event, 'year')"
              @blur="logic.formInteractionHandler.onBlur('year')"
              @wheel.prevent="logic.formInteractionHandler.onWheel($event, 'year')">
            <span class="date-separator">-</span>
            <input :ref="logic.formRefs.month" v-model="logic.eventForm.value.month" type="text" class="input"
              placeholder="月" @input="logic.formInteractionHandler.onInput($event, 'month')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'month')"
              @focus="logic.formInteractionHandler.onFocus($event, 'month')"
              @blur="logic.formInteractionHandler.onBlur('month')"
              @wheel.prevent="logic.formInteractionHandler.onWheel($event, 'month')">
            <span class="date-separator">-</span>
            <input :ref="logic.formRefs.day" v-model="logic.eventForm.value.day" type="text" class="input"
              placeholder="日" @input="logic.formInteractionHandler.onInput($event, 'day')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'day')"
              @focus="logic.formInteractionHandler.onFocus($event, 'day')"
              @blur="logic.formInteractionHandler.onBlur('day')"
              @wheel.prevent="logic.formInteractionHandler.onWheel($event, 'day')">
          </div>
          <div class="input-group">
            <input :ref="logic.formRefs.hour" v-model="logic.eventForm.value.hour" type="text" class="input"
              placeholder="时" @input="logic.formInteractionHandler.onInput($event, 'hour')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'hour')"
              @focus="logic.formInteractionHandler.onFocus($event, 'hour')"
              @blur="logic.formInteractionHandler.onBlur('hour')"
              @wheel.prevent="logic.formInteractionHandler.onWheel($event, 'hour')">
            <span class="date-separator">:</span>
            <input :ref="logic.formRefs.minute" v-model="logic.eventForm.value.minute" type="text" class="input"
              placeholder="分" @input="logic.formInteractionHandler.onInput($event, 'minute')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'minute')"
              @focus="logic.formInteractionHandler.onFocus($event, 'minute')"
              @blur="logic.formInteractionHandler.onBlur('minute')"
              @wheel.prevent="logic.formInteractionHandler.onWheel($event, 'minute')">
            <span class="date-separator">:</span>
            <input :ref="logic.formRefs.second" v-model="logic.eventForm.value.second" type="text" class="input"
              placeholder="秒" @input="logic.formInteractionHandler.onInput($event, 'second')"
              @keydown="logic.formInteractionHandler.onKeydown($event, 'second')"
              @focus="logic.formInteractionHandler.onFocus($event, 'second')"
              @blur="logic.formInteractionHandler.onBlur('second')"
              @wheel.prevent="logic.formInteractionHandler.onWheel($event, 'second')">
          </div>
          <input :ref="logic.formRefs.name" v-model="logic.eventForm.value.name" type="text"
            class="input event-name-input" placeholder="事件名称（可选）"
            @keydown="logic.formInteractionHandler.onKeydown($event, 'name')"
            @focus="logic.formInteractionHandler.onFocus($event, 'name')"
            @blur="logic.formInteractionHandler.onBlur('name')">
        </div>
        <div class="modal-actions">
          <button class="button button-secondary" @click="logic.closeModal">取消</button>
          <button class="button button-primary" @click="logic.saveEvent"
            :disabled="!logic.isFormValid.value">保存</button>
        </div>
      </div>
    </div>

    <div class="events-list" ref="eventsListRef">
      <div v-for="event in logic.processedEvents.value" :key="event.id" :ref="el => eventItemRefs[event.id] = el"
        class="event-container" :class="{
          'pending-copy': logic.pendingCopyId.value === event.id,
          'pending-delete': logic.pendingDeleteId.value === event.id,
          'is-selected': logic.isMultiSelectMode.value && logic.selectedEventIds.value.has(event.id),
          'menu-is-active': logic.activeMenu.value === event.id
        }" @click="logic.handleItemClick(event)" @mouseenter="logic.handleEventMouseEnter(event.id)"
        @mouseleave="logic.handleEventMouseLeave" @mousemove="logic.handleEventMouseMove">
        <div class="drag-handle drag-handle-left desktop-only" title="拖动排序"><svg width="10" height="24"
            fill="currentColor">
            <circle cx="8" cy="6" r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
            <circle cx="8" cy="18" r="1.5" />
          </svg></div>
        <div class="event-item">
          <div class="drag-blank-area mobile-only" title="拖动排序"></div>
          <div class="event-name-column" :title="event.name">{{ event.name }}</div>
          <div class="event-date-column">{{ event.dateTimeDesc }}</div>
          <div class="event-countdown-column" v-html="event.finalDisplay"></div>

          <!-- [核心修正] 使用 setMenuRef 注册整个菜单容器的引用 -->
          <div class="settings-menu-container"
            :ref="el => logic.setMenuRef(event.id, { container: el, trigger: menuTriggerRefs[event.id], panel: menuPanelRefs[event.id] })"
            @click.stop>
            <button class="menu-trigger-btn" :ref="el => menuTriggerRefs[event.id] = el"
              @click="logic.toggleMenu(event.id)">⋮</button>
            <div v-if="logic.activeMenu.value === event.id" class="settings-dropdown-panel"
              :ref="el => menuPanelRefs[event.id] = el" :class="{ 'is-upward': logic.isMenuUpward.value }">
              <div class="dropdown-column"> <button v-for="unit in logic.unitOptions" :key="unit.value"
                  :class="['menu-option-btn', { active: event.unit === unit.value }]"
                  @click="logic.updateEventUnit(event.id, unit.value)">{{ unit.label }}</button> </div>
              <div class="dropdown-column"> <button v-for="p in logic.getAvailablePrecisions(event.unit)" :key="p.value"
                  :class="['menu-option-btn', { active: event.decimalPrecision === p.value }]"
                  @click="logic.updateEventPrecision(event.id, p.value)">{{ p.label }}</button> </div>
              <div class="dropdown-column"> <button class="menu-option-btn"
                  @click="logic.openEditModal(event)">编辑</button> <button class="menu-option-btn"
                  @click="logic.copyEvent(event)">复制</button> <button class="menu-option-btn delete"
                  @click="logic.handleMenuDelete(event.id)">删除</button> </div>
            </div>
          </div>
        </div>
        <div class="drag-handle drag-handle-right desktop-only" title="拖动排序"><svg width="10" height="24"
            fill="currentColor">
            <circle cx="2" cy="6" r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
            <circle cx="2" cy="18" r="1.5" />
          </svg></div>
      </div>
      <p v-if="logic.processedEvents.value.length === 0" class="empty-tip">暂无自定义倒计时，请添加</p>
    </div>

    <div v-if="logic.isMarqueeSelecting.value" class="marquee-select-box"
      :style="{ left: logic.marqueeBox.value.x + 'px', top: logic.marqueeBox.value.y + 'px', width: logic.marqueeBox.value.width + 'px', height: logic.marqueeBox.value.height + 'px' }">
    </div>
  </div>

  <Transition name="hint-fade">
    <div
      v-if="logic.showOperationHint.value && logic.hoveredEventId.value && !logic.pendingDeleteId.value && !logic.pendingCopyId.value"
      class="operation-hint"
      :style="{ left: logic.mousePosition.value.x + 'px', top: logic.mousePosition.value.y + 'px' }">
      <div class="hint-content">
        <div class="hint-item"><span class="hint-key">按 Space 或 / 键</span><span class="hint-action">编辑</span></div>
        <div class="hint-item"><span class="hint-key">按 Insert 或 + 键</span><span class="hint-action">复制</span></div>
        <div class="hint-item"><span class="hint-key">按 Delete 或 - 键</span><span class="hint-action">删除</span></div>
      </div>
    </div>
  </Transition>
  <Transition name="hint-fade">
    <div v-if="logic.pendingCopyId.value && logic.pendingCopyId.value === logic.hoveredEventId.value"
      class="copy-confirm-hint"
      :style="{ left: logic.mousePosition.value.x + 'px', top: logic.mousePosition.value.y + 'px' }">再按一次 Insert 或 +
      确认复制</div>
  </Transition>
  <Transition name="hint-fade">
    <div v-if="logic.pendingDeleteId.value && logic.pendingDeleteId.value === logic.hoveredEventId.value"
      class="delete-confirm-hint"
      :style="{ left: logic.mousePosition.value.x + 'px', top: logic.mousePosition.value.y + 'px' }">再按一次 Delete 或 -
      确认删除</div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onBeforeUpdate, watch } from 'vue';
import Sortable from 'sortablejs';
import { useCustomEvents } from '../composables/useCustomEvents.js';

const logic = useCustomEvents();

// [核心修正] 简化 ref 声明，只保留必要的
const menuTriggerRefs = ref({});
const menuPanelRefs = ref({});
const eventsListRef = ref(null);
const eventItemRefs = ref({});

onMounted(() => {
  if (eventsListRef.value) {
    Sortable.create(eventsListRef.value, {
      animation: 220, handle: '.drag-handle, .drag-blank-area', ghostClass: 'drag-ghost',
      onEnd: (evt) => {
        if (evt.oldIndex != null && evt.newIndex != null) {
          const movedItem = logic.events.value.splice(evt.oldIndex, 1)[0];
          logic.events.value.splice(evt.newIndex, 0, movedItem);
          logic.saveEvents();
          logic.sortOrder.value = 'manual';
        }
      },
    });
  }
});

onBeforeUpdate(() => {
  eventItemRefs.value = {};
  menuTriggerRefs.value = {};
  menuPanelRefs.value = {};
});

const handleMouseMove = (e) => logic.moveMarquee(e.clientX, e.clientY, eventItemRefs.value);
const handleMouseUp = () => logic.endMarquee();
const handleTouchMove = (e) => { if (e.touches.length === 1) logic.moveMarquee(e.touches[0].clientX, e.touches[0].clientY, eventItemRefs.value); };
const handleTouchEnd = () => logic.endMarquee();

watch(logic.isMultiSelectMode, (isMulti) => {
  if (isMulti) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  } else {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }
}, { immediate: true });

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);
});
</script>

<style scoped>
.settings-dropdown-panel.is-upward {
  top: auto;
  bottom: calc(100% + 5px);
}

.custom-countdown {
  margin-bottom: 6px;
  position: relative;
}

.custom-countdown-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  margin-bottom: 12px;
  margin-top: -8px;
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

.joined-btn-group {
  display: flex;
}

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

.joined-btn:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
  border-left-width: 0px;
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
  border-color: var(--green-primary);
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
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

  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    z-index: 5;
    cursor: grab;
  }

  .title {
    top: 12px;
    left: 16px;
  }
}
</style>
