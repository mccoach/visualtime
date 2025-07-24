// E:\AppProject\VisualTime\src\composables\useCustomEvents.js (最终修复版 - 修复菜单交互所有问题)

import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue"; // 引入 watch
import { DateTime } from "luxon";
import { now } from "../services/clockService";
import { computeCountdown } from "../services/countdownEngine";
import * as storage from "../utils/storage";
import * as formatters from "../utils/formatters";
import { useEscapeKey } from "./useGlobalKeys";
import { MENU_OPEN_EVENT, broadcastMenuOpened } from "../utils/eventBus.js"; // 引入 eventBus

/**
 * =================================================================
 * useCustomEvents - 自定义倒计时模块的核心逻辑 Composable
 * =================================================================
 */
export function useCustomEvents() {
  // --- 状态与配置 (此部分代码无变化) ---
  const events = ref([]);
  const customCounter = ref(1);
  const isModalOpen = ref(false);
  const modalTitle = ref("添加自定义倒计时");
  const activeEventData = ref(null);
  const eventForm = ref({
    year: "",
    month: "",
    day: "",
    hour: "",
    minute: "",
    second: "",
    name: "",
  });
  const activeMenu = ref(null);
  const sortOrder = ref("manual");
  const isMultiSelectMode = ref(false);
  const selectedEventIds = ref(new Set());
  const hoveredEventId = ref(null);
  const mousePosition = ref({ x: 0, y: 0 });
  const showOperationHint = ref(false);
  const pendingCopyId = ref(null);
  const pendingDeleteId = ref(null);
  const isMarqueeSelecting = ref(false);
  const marqueeStartPos = ref({ x: 0, y: 0 });
  const marqueeBox = ref({ x: 0, y: 0, width: 0, height: 0 });
  let operationHintTimer = null;
  let operationHintHideTimer = null;
  const valueBeforeFocus = ref("");
  const formYearRef = ref(null);
  const formMonthRef = ref(null);
  const formDayRef = ref(null);
  const formHourRef = ref(null);
  const formMinuteRef = ref(null);
  const formSecondRef = ref(null);
  const formNameRef = ref(null);
  const formRefs = {
    year: formYearRef,
    month: formMonthRef,
    day: formDayRef,
    hour: formHourRef,
    minute: formMinuteRef,
    second: formSecondRef,
    name: formNameRef,
  };
  const fieldOrder = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "name",
  ];
  const fieldConfig = {
    year: { maxLength: 6, min: -99999, max: 99999 },
    month: { maxLength: 2, min: 1, max: 12 },
    day: {
      maxLength: 2,
      min: 1,
      get max() {
        const y = Number(eventForm.value.year) || DateTime.now().year;
        const m = Number(eventForm.value.month) || 1;
        return DateTime.fromObject({ year: y, month: m }).daysInMonth;
      },
    },
    hour: { maxLength: 2, min: 0, max: 23 },
    minute: { maxLength: 2, min: 0, max: 59 },
    second: { maxLength: 2, min: 0, max: 59 },
    name: {},
  };
  const unitOptions = [
    { value: "years", label: "年" },
    { value: "months", label: "月" },
    { value: "weeks", label: "周" },
    { value: "days", label: "天" },
    { value: "hours", label: "时" },
    { value: "minutes", label: "分" },
    { value: "seconds", label: "秒" },
  ];
  const allPrecisionOptions = [
    { value: "combo", label: "组合" },
    { value: 0, label: "0" },
    { value: 1, label: "0.0" },
    { value: 2, label: "0.00" },
  ];
  const getAvailablePrecisions = (unit) => {
    if (unit === "seconds")
      return allPrecisionOptions.filter(
        (p) => p.value === "combo" || p.value === 0
      );
    if (unit === "minutes")
      return allPrecisionOptions.filter(
        (p) => p.value === "combo" || p.value <= 1
      );
    return allPrecisionOptions;
  };

  const isMenuUpward = ref(false);
  // [核心修正] 增加一个普通对象，用于存储从组件传递过来的菜单DOM引用
  const menuRefs = {};
  const setMenuRef = (id, el) => {
    if (el) {
      menuRefs[id] = el;
    }
  };

  // --- 计算属性 (此部分代码无变化) ---
  const processedEvents = computed(() => {
    const sortedEvents = [...events.value];
    if (sortOrder.value !== "manual") {
      const getSortableDate = (event) =>
        DateTime.fromObject({
          year: event.year,
          month: event.month,
          day: event.day,
          hour: Number(event.hour || 0),
          minute: Number(event.minute || 0),
          second: Number(event.second || 0),
        });
      sortedEvents.sort((a, b) => {
        const dateA = getSortableDate(a);
        const dateB = getSortableDate(b);
        if (!dateA.isValid) return 1;
        if (!dateB.isValid) return -1;
        return sortOrder.value === "asc"
          ? dateA.toMillis() - dateB.toMillis()
          : dateB.toMillis() - dateA.toMillis();
      });
    }
    return sortedEvents.map((event) => {
      const result = computeCountdown({
        type: "custom",
        baseTime: now.value,
        config: {
          target: {
            year: event.year,
            month: event.month,
            day: event.day,
            hour: Number(event.hour || 0),
            minute: Number(event.minute || 0),
            second: Number(event.second || 0),
          },
        },
      });
      const targetDateTime = DateTime.fromObject({
        year: event.year,
        month: event.month,
        day: event.day,
        hour: Number(event.hour || 0),
        minute: Number(event.minute || 0),
        second: Number(event.second || 0),
      });
      const yearNum = targetDateTime.year;
      const yearDisplay =
        yearNum < 0 ? `公元前 ${Math.abs(yearNum)}` : `${yearNum}`;
      const dateTimeDesc = `${yearDisplay}年 ${targetDateTime.toFormat(
        "MM月dd日 HH:mm:ss"
      )}`;
      if (!result) return { ...event, finalDisplay: "日期无效", dateTimeDesc };
      let finalDisplay = "";
      if (event.decimalPrecision === "combo") {
        finalDisplay = formatters.formatDurationCombo(
          result.duration,
          result.isPast
        );
      } else {
        const value = formatters.formatDurationAs(
          result.duration,
          event.unit,
          event.decimalPrecision
        );
        const unitLabel = formatters.getUnitLabel(event.unit);
        const prefix = result.isPast ? "已过 " : "还有 ";
        finalDisplay = `${prefix}<strong class="combo-num">${value}</strong> ${unitLabel}`;
      }
      return { ...event, finalDisplay, dateTimeDesc };
    });
  });
  const isFormValid = computed(() => {
    const form = eventForm.value;
    const dt = DateTime.fromObject({
      year: Number(form.year),
      month: Number(form.month),
      day: Number(form.day),
      hour: Number(form.hour || 0),
      minute: Number(form.minute || 0),
      second: Number(form.second || 0),
    });
    const isYearValid = form.year !== "" && form.year !== "-";
    return dt.isValid && isYearValid;
  });

  // --- 方法 ---
  // [核心修正] 切换菜单的核心逻辑
  const toggleMenu = (eventId) => {
    const willOpenId = activeMenu.value === eventId ? null : eventId;
    if (willOpenId) {
      // 在打开菜单时，通过 eventBus 广播事件，通知其他组件
      broadcastMenuOpened(`custom-event-${eventId}`);
    }
    activeMenu.value = willOpenId;
  };

  // [核心修正] 使用 watch 监听菜单状态变化，以正确处理弹出方向
  watch(activeMenu, (newActiveId) => {
    if (newActiveId === null) {
      isMenuUpward.value = false; // 关闭菜单时重置方向
      return;
    }
    nextTick(() => {
      const refs = menuRefs[newActiveId];
      if (refs && refs.trigger && refs.panel) {
        const btnRect = refs.trigger.getBoundingClientRect();
        const panelHeight = refs.panel.offsetHeight;
        const windowHeight = window.innerHeight;
        if (btnRect.bottom + panelHeight > windowHeight) {
          isMenuUpward.value = true;
        } else {
          isMenuUpward.value = false;
        }
      }
    });
  });

  const loadEvents = () => {
    const savedEvents = storage.getCustomEvents();
    events.value = savedEvents.map((e) => ({
      unit: "days",
      decimalPrecision: 0,
      ...e,
    }));
    const maxId = Math.max(
      0,
      ...savedEvents.map((e) =>
        parseInt(e.name.match(/^自定义(\d+)$/)?.[1] || 0)
      )
    );
    customCounter.value = maxId + 1;
  };
  const saveEvents = () => {
    storage.saveCustomEvents(events.value);
  };
  const formInteractionHandler = {
    onInput(event, field) {
      let value = event.target.value;
      const config = fieldConfig[field];
      if (field === "year") {
        value = value.replace(/[^0-9-]/g, "");
        if (value.lastIndexOf("-") > 0) {
          value = value.replace(/-/g, (match, offset) =>
            offset === 0 ? match : ""
          );
        }
      } else if (field !== "name") {
        value = value.replace(/\D/g, "");
      }
      if (config.maxLength && value.length > config.maxLength) {
        value = value.slice(0, config.maxLength);
      }
      eventForm.value[field] = value;
      if (field !== "name" && value.length >= config.maxLength) {
        const currentIndex = fieldOrder.indexOf(field);
        const nextField = fieldOrder[currentIndex + 1];
        if (nextField) {
          formRefs[nextField].value?.focus();
        }
      }
    },
    onKeydown(event, field) {
      const { key, ctrlKey, metaKey, shiftKey, target } = event;
      const config = fieldConfig[field];
      const navigate = (direction) => {
        event.preventDefault();
        const currentIndex = fieldOrder.indexOf(field);
        const nextIndex =
          (currentIndex + direction + fieldOrder.length) % fieldOrder.length;
        const nextFieldKey = fieldOrder[nextIndex];
        formRefs[nextFieldKey].value?.focus();
      };
      const adjustValue = (delta) => {
        if (field === "name") return;
        event.preventDefault();
        let numValue = Number(eventForm.value[field]) || 0;
        numValue += delta;
        const { min, max } = config;
        const maxValue = typeof max === "function" ? max() : max;
        if (numValue > maxValue) numValue = min;
        if (numValue < min) numValue = maxValue;
        eventForm.value[field] =
          field === "year"
            ? String(numValue)
            : String(numValue).padStart(2, "0");
      };
      switch (key) {
        case "Enter":
          if (ctrlKey || metaKey) {
            event.preventDefault();
            saveEvent();
          } else if (field === "name") {
            event.preventDefault();
            saveEvent();
          } else {
            navigate(1);
          }
          break;
        case "Tab":
          navigate(shiftKey ? -1 : 1);
          break;
        case "ArrowLeft":
          if (
            ctrlKey ||
            (target.selectionStart === 0 && target.selectionEnd === 0)
          ) {
            navigate(-1);
          }
          break;
        case "ArrowRight":
          if (ctrlKey || target.selectionStart === target.value.length) {
            navigate(1);
          }
          break;
        case "ArrowUp":
          adjustValue(1);
          break;
        case "ArrowDown":
          adjustValue(-1);
          break;
        case "Escape":
        case "Esc":
          event.preventDefault();
          event.stopPropagation();
          eventForm.value[field] = valueBeforeFocus.value;
          target.blur();
          break;
        default:
          if (
            field !== "name" &&
            !/^[0-9]$/.test(key) &&
            ![
              "Backspace",
              "Delete",
              "Tab",
              "Enter",
              "ArrowLeft",
              "ArrowRight",
              "Home",
              "End",
            ].includes(key) &&
            !ctrlKey &&
            !metaKey
          ) {
            if (
              !(
                field === "year" &&
                key === "-" &&
                target.selectionStart === 0 &&
                !eventForm.value.year.includes("-")
              )
            ) {
              event.preventDefault();
            }
          }
          break;
      }
    },
    onWheel(event, field) {
      if (field === "name") return;
      const delta = event.deltaY < 0 ? 1 : -1;
      let numValue = Number(eventForm.value[field]) || 0;
      numValue += delta;
      const { min, max } = fieldConfig[field];
      const maxValue = typeof max === "function" ? max() : max;
      if (numValue > maxValue) numValue = min;
      if (numValue < min) numValue = maxValue;
      eventForm.value[field] =
        field === "year" ? String(numValue) : String(numValue).padStart(2, "0");
    },
    onFocus(event, field) {
      valueBeforeFocus.value = eventForm.value[field];
      if (!eventForm.value[field] && field !== "name") {
        const current = DateTime.now();
        const val = current[field];
        eventForm.value[field] =
          field === "year" ? String(val) : String(val).padStart(2, "0");
      }
      nextTick(() => event.target.select());
    },
    onBlur(field) {
      if (field === "name" || !eventForm.value[field]) return;
      let value = eventForm.value[field];
      if (field === "year" && (value === "-" || value === "-0")) {
        eventForm.value[field] = "";
        return;
      }
      if (field !== "year" && value.length === 1) {
        value = "0" + value;
      }
      let numValue = Number(value);
      const { min, max } = fieldConfig[field];
      const maxValue = typeof max === "function" ? max() : max;
      if (numValue < min) numValue = min;
      if (numValue > maxValue) numValue = maxValue;
      const finalValue =
        field === "year" ? String(numValue) : String(numValue).padStart(2, "0");
      if (finalValue !== eventForm.value[field]) {
        eventForm.value[field] = finalValue;
      }
    },
  };
  const openAddModal = () => {
    activeMenu.value = null;
    modalTitle.value = "添加自定义倒计时";
    activeEventData.value = { unit: "days", decimalPrecision: 0 };
    const nowDt = DateTime.now();
    eventForm.value = {
      year: String(nowDt.year),
      month: String(nowDt.month).padStart(2, "0"),
      day: String(nowDt.day).padStart(2, "0"),
      hour: String(nowDt.hour).padStart(2, "0"),
      minute: String(nowDt.minute).padStart(2, "0"),
      second: String(nowDt.second).padStart(2, "0"),
      name: "",
    };
    isModalOpen.value = true;
    nextTick(() => formRefs.year.value?.focus());
  };
  const openEditModal = (event) => {
    activeMenu.value = null;
    modalTitle.value = "编辑事件";
    activeEventData.value = { ...event };
    eventForm.value = {
      year: String(event.year),
      month: String(event.month),
      day: String(event.day),
      hour: event.hour,
      minute: event.minute,
      second: event.second,
      name: event.name,
    };
    isModalOpen.value = true;
    nextTick(() => formRefs.year.value?.focus());
  };
  const closeModal = () => {
    isModalOpen.value = false;
    activeEventData.value = null;
  };
  const saveEvent = () => {
    if (!isFormValid.value) {
      alert("请填写完整且合法的时间");
      return;
    }
    const f = eventForm.value;
    const newEventData = {
      ...activeEventData.value,
      name: f.name || `自定义${customCounter.value}`,
      year: Number(f.year),
      month: Number(f.month),
      day: Number(f.day),
      hour: String(f.hour || 0).padStart(2, "0"),
      minute: String(f.minute || 0).padStart(2, "0"),
      second: String(f.second || 0).padStart(2, "0"),
    };
    const existingIndex = events.value.findIndex(
      (e) => e.id === newEventData.id
    );
    if (existingIndex !== -1) {
      events.value.splice(existingIndex, 1, newEventData);
    } else {
      newEventData.id = Date.now();
      events.value.unshift(newEventData);
      if (!f.name) customCounter.value++;
    }
    saveEvents();
    closeModal();
  };
  const deleteEvent = (id) => {
    events.value = events.value.filter((e) => e.id !== id);
    saveEvents();
    if (pendingDeleteId.value === id) {
      pendingDeleteId.value = null;
    }
  };
  const handleMenuDelete = (id) => {
    activeMenu.value = null;
    if (confirm("确定要删除这个事件吗？")) deleteEvent(id);
  };
  const copyEvent = (eventToCopy) => {
    activeMenu.value = null;
    modalTitle.value = "复制并新增事件";
    const newEventData = {
      ...eventToCopy,
      id: `new_${Date.now()}`,
      name: `${eventToCopy.name} - 副本`,
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
    if (pendingCopyId.value === eventToCopy.id) {
      pendingCopyId.value = null;
    }
  };
  const updateEventUnit = (id, unit) => {
    const event = events.value.find((e) => e.id === id);
    if (event) {
      event.unit = unit;
      if (event.decimalPrecision === "combo") event.decimalPrecision = 0;
      if (
        unit === "seconds" &&
        event.decimalPrecision !== "combo" &&
        event.decimalPrecision > 0
      )
        event.decimalPrecision = 0;
      if (unit === "minutes" && event.decimalPrecision === 2)
        event.decimalPrecision = 1;
      saveEvents();
    }
    activeMenu.value = null;
  };
  const updateEventPrecision = (id, precision) => {
    const event = events.value.find((e) => e.id === id);
    if (event) {
      event.decimalPrecision = precision;
      saveEvents();
    }
    activeMenu.value = null;
  };
  const cycleSortOrder = () => {
    const orderCycle = { manual: "asc", asc: "desc", desc: "manual" };
    sortOrder.value = orderCycle[sortOrder.value];
    if (sortOrder.value === "manual") {
      loadEvents();
    }
  };
  const toggleMultiSelectMode = () => {
    isMultiSelectMode.value = !isMultiSelectMode.value;
    if (!isMultiSelectMode.value) selectedEventIds.value.clear();
  };
  const bulkDelete = () => {
    if (
      selectedEventIds.value.size === 0 ||
      !confirm(`您确定要删除选中的 ${selectedEventIds.value.size} 个倒计时吗？`)
    )
      return;
    const idsToDelete = new Set(selectedEventIds.value);
    events.value = events.value.filter((event) => !idsToDelete.has(event.id));
    saveEvents();
    selectedEventIds.value.clear();
    isMultiSelectMode.value = false;
  };
  const handleItemClick = (event) => {
    if (!isMultiSelectMode.value) return;
    if (selectedEventIds.value.has(event.id)) {
      selectedEventIds.value.delete(event.id);
    } else {
      selectedEventIds.value.add(event.id);
    }
  };
  const handleEventMouseEnter = (eventId) => {
    if (window.innerWidth <= 800) return;
    if (pendingCopyId.value && pendingCopyId.value !== eventId)
      pendingCopyId.value = null;
    if (pendingDeleteId.value && pendingDeleteId.value !== eventId)
      pendingDeleteId.value = null;
    hoveredEventId.value = eventId;
    if (operationHintTimer) clearTimeout(operationHintTimer);
    if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
    operationHintTimer = setTimeout(() => {
      showOperationHint.value = true;
      operationHintHideTimer = setTimeout(() => {
        showOperationHint.value = false;
      }, 3000);
    }, 500);
  };
  const handleEventMouseLeave = () => {
    if (window.innerWidth <= 800) return;
    hoveredEventId.value = null;
    showOperationHint.value = false;
    if (operationHintTimer) clearTimeout(operationHintTimer);
    if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
    pendingCopyId.value = null;
    pendingDeleteId.value = null;
  };
  const handleEventMouseMove = (e) => {
    if (window.innerWidth <= 800) return;
    mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 };
  };
  const checkIntersection = (rect1, rect2) =>
    !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  const startMarquee = (clientX, clientY) => {
    isMarqueeSelecting.value = true;
    marqueeStartPos.value = { x: clientX, y: clientY };
  };
  const moveMarquee = (clientX, clientY, eventItemRefs) => {
    if (!isMarqueeSelecting.value) return;
    const start = marqueeStartPos.value;
    const end = { x: clientX, y: clientY };
    marqueeBox.value = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(start.x - end.x),
      height: Math.abs(start.y - end.y),
    };
    const marqueeRect = {
      left: marqueeBox.value.x,
      top: marqueeBox.value.y,
      right: marqueeBox.value.x + marqueeBox.value.width,
      bottom: marqueeBox.value.y + marqueeBox.value.height,
    };
    for (const id in eventItemRefs) {
      if (eventItemRefs[id]) {
        if (
          checkIntersection(
            marqueeRect,
            eventItemRefs[id].getBoundingClientRect()
          )
        )
          selectedEventIds.value.add(Number(id));
      }
    }
  };
  const endMarquee = () => {
    if (isMarqueeSelecting.value) isMarqueeSelecting.value = false;
  };
  const handleEditShortcut = (event) => openEditModal(event);
  const handleCopyShortcut = (event) => {
    if (pendingCopyId.value === event.id) {
      copyEvent(event);
    } else {
      pendingCopyId.value = event.id;
      pendingDeleteId.value = null;
      setTimeout(() => {
        if (pendingCopyId.value === event.id) pendingCopyId.value = null;
      }, 3000);
    }
  };
  const handleDeleteShortcut = (event) => {
    if (pendingDeleteId.value === event.id) {
      deleteEvent(event.id);
    } else {
      pendingDeleteId.value = event.id;
      pendingCopyId.value = null;
      setTimeout(() => {
        if (pendingDeleteId.value === event.id) pendingDeleteId.value = null;
      }, 3000);
    }
  };
  const keyActionMap = {
    " ": handleEditShortcut,
    "/": handleEditShortcut,
    Insert: handleCopyShortcut,
    "+": handleCopyShortcut,
    Delete: handleDeleteShortcut,
    "-": handleDeleteShortcut,
  };

  const handleContextualKeydown = (e) => {
    if (isModalOpen.value && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (isFormValid.value) saveEvent();
      return;
    }
    const isInputFocused =
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA");
    if (isInputFocused || !hoveredEventId.value) return;
    const event = events.value.find((item) => item.id === hoveredEventId.value);
    if (!event) return;
    const action = keyActionMap[e.key];
    if (action) {
      e.preventDefault();
      showOperationHint.value = false;
      action(event);
    }
  };

  // --- 生命周期与全局事件监听 ---
  // [核心修正] 处理全局点击事件，用于关闭菜单
  const handleGlobalClick = (event) => {
    if (activeMenu.value !== null) {
      const activeMenuRefs = menuRefs[activeMenu.value];
      if (
        activeMenuRefs &&
        activeMenuRefs.container &&
        !activeMenuRefs.container.contains(event.target)
      ) {
        activeMenu.value = null;
      }
    }
  };

  // [核心修正] 处理广播事件，实现菜单互斥
  const handleMenuBroadcast = (event) => {
    const broadcasterId = event.detail?.id;
    if (broadcasterId && !broadcasterId.startsWith("custom-event-")) {
      activeMenu.value = null;
    }
  };

  onMounted(() => {
    loadEvents();
    document.addEventListener("keydown", handleContextualKeydown);
    // [核心修正] 挂载全局监听器
    document.addEventListener("click", handleGlobalClick, true);
    document.addEventListener(MENU_OPEN_EVENT, handleMenuBroadcast);
  });
  onUnmounted(() => {
    document.removeEventListener("keydown", handleContextualKeydown);
    // [核心修正] 卸载全局监听器
    document.removeEventListener("click", handleGlobalClick, true);
    document.removeEventListener(MENU_OPEN_EVENT, handleMenuBroadcast);
  });

  const isAnyTempStateActive = computed(
    () =>
      isModalOpen.value ||
      activeMenu.value != null ||
      pendingCopyId.value != null ||
      pendingDeleteId.value != null ||
      isMultiSelectMode.value
  );

  useEscapeKey(isAnyTempStateActive, () => {
    if (activeMenu.value) {
      activeMenu.value = null;
      return;
    }
    if (pendingCopyId.value || pendingDeleteId.value) {
      pendingCopyId.value = null;
      pendingDeleteId.value = null;
      return;
    }
    if (isModalOpen.value) {
      closeModal();
      return;
    }
    if (isMultiSelectMode.value) {
      toggleMultiSelectMode();
      return;
    }
  });

  // --- 返回给组件的完整接口 ---
  return {
    events,
    processedEvents,
    isModalOpen,
    modalTitle,
    eventForm,
    isFormValid,
    activeMenu,
    sortOrder,
    isMultiSelectMode,
    selectedEventIds,
    hoveredEventId,
    mousePosition,
    showOperationHint,
    pendingCopyId,
    pendingDeleteId,
    isMarqueeSelecting,
    marqueeBox,
    openAddModal,
    closeModal,
    saveEvent,
    deleteEvent,
    openEditModal,
    copyEvent,
    handleMenuDelete,
    cycleSortOrder,
    toggleMultiSelectMode,
    bulkDelete,
    handleItemClick,
    handleEventMouseEnter,
    handleEventMouseLeave,
    handleEventMouseMove,
    startMarquee,
    moveMarquee,
    endMarquee,
    saveEvents,
    unitOptions,
    getAvailablePrecisions,
    updateEventUnit,
    updateEventPrecision,
    formRefs,
    formInteractionHandler,
    toggleMenu,
    isMenuUpward,
    setMenuRef, // 暴露新方法和状态
  };
}
