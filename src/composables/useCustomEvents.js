// E:\AppProject\VisualTime\src\composables\useCustomEvents.js
// 说明：
// - 自定义倒计时的业务逻辑（列表 CRUD、排序、菜单、表单、快捷键等）。
// - 本次新增：全局 mousemove 追踪（悬浮期实时更新提示位置，复刻“原版跟随感”）。
// - 其它关键保持：initializeSortable（handle 为 .menu-trigger-btn；长按 300ms 触发；JS fallback）。

import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import Sortable from "sortablejs";
import { DateTime } from "luxon";
import { now } from "../services/clockService";
import { computeCountdown } from "../services/countdownEngine";
import * as storage from "../utils/storage";
import * as formatters from "../utils/formatters";
import { useEscapeKey } from "./useGlobalKeys";
import { MENU_OPEN_EVENT, broadcastMenuOpened } from "../utils/eventBus.js";

export function useCustomEvents() {
  // ============ 基础状态 ============
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

  const hoveredEventId = ref(null); // 当前悬浮的条目ID
  const mousePosition = ref({ x: 0, y: 0 }); // 悬浮提示坐标（fixed）
  const showOperationHint = ref(false);
  const pendingCopyId = ref(null);
  const pendingDeleteId = ref(null);
  let operationHintTimer = null,
    operationHintHideTimer = null;

  // 表单引用与配置（保持原样）
  const formYearRef = ref(null),
    formMonthRef = ref(null),
    formDayRef = ref(null);
  const formHourRef = ref(null),
    formMinuteRef = ref(null),
    formSecondRef = ref(null);
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
  const valueBeforeFocus = ref("");
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

  // 菜单选项
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
  const menuRefs = {};
  const setMenuRef = (id, el) => {
    if (el) menuRefs[id] = el;
  };

  // 拖拽实例
  let sortableInstance = null;

  // ============ 派生显示数据 ============
  const processedEvents = computed(() => {
    const sorted = [...events.value];
    if (sortOrder.value !== "manual") {
      const getDate = (e) =>
        DateTime.fromObject({
          year: e.year,
          month: e.month,
          day: e.day,
          hour: Number(e.hour || 0),
          minute: Number(e.minute || 0),
          second: Number(e.second || 0),
        });
      sorted.sort((a, b) => {
        const A = getDate(a),
          B = getDate(b);
        if (!A.isValid) return 1;
        if (!B.isValid) return -1;
        return sortOrder.value === "asc"
          ? A.toMillis() - B.toMillis()
          : B.toMillis() - A.toMillis();
      });
    }
    return sorted.map((event) => {
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
      const dt = DateTime.fromObject({
        year: event.year,
        month: event.month,
        day: event.day,
        hour: Number(event.hour || 0),
        minute: Number(event.minute || 0),
        second: Number(event.second || 0),
      });
      const y = dt.year;
      const yearDisplay = y < 0 ? `公元前 ${Math.abs(y)}` : `${y}`;
      const dateTimeDesc = `${yearDisplay}年 ${dt.toFormat(
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
    const f = eventForm.value;
    const dt = DateTime.fromObject({
      year: Number(f.year),
      month: Number(f.month),
      day: Number(f.day),
      hour: Number(f.hour || 0),
      minute: Number(f.minute || 0),
      second: Number(f.second || 0),
    });
    const okYear = f.year !== "" && f.year !== "-";
    return dt.isValid && okYear;
  });

  // ============ CRUD 与菜单 ============
  const saveEvents = () => storage.saveCustomEvents(events.value);
  const loadEvents = () => {
    const saved = storage.getCustomEvents();
    events.value = saved.map((e) => ({
      unit: "days",
      decimalPrecision: 0,
      ...e,
    }));
    const maxN = Math.max(
      0,
      ...saved.map((e) => parseInt(e.name.match(/^自定义(\d+)$/)?.[1] || 0))
    );
    customCounter.value = maxN + 1;
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
    const data = {
      ...activeEventData.value,
      name: f.name || `自定义${customCounter.value}`,
      year: Number(f.year),
      month: Number(f.month),
      day: Number(f.day),
      hour: String(f.hour || 0).padStart(2, "0"),
      minute: String(f.minute || 0).padStart(2, "0"),
      second: String(f.second || 0).padStart(2, "0"),
    };
    const idx = events.value.findIndex((e) => e.id === data.id);
    if (idx !== -1) events.value.splice(idx, 1, data);
    else {
      data.id = Date.now();
      events.value.unshift(data);
      if (!f.name) customCounter.value++;
    }
    saveEvents();
    closeModal();
  };
  const deleteEvent = (id) => {
    events.value = events.value.filter((e) => e.id !== id);
    saveEvents();
    if (pendingDeleteId.value === id) pendingDeleteId.value = null;
  };
  const copyEvent = (eventToCopy) => {
    activeMenu.value = null;
    modalTitle.value = "复制并新增事件";
    const data = {
      ...eventToCopy,
      id: `new_${Date.now()}`,
      name: `${eventToCopy.name} - 副本`,
    };
    activeEventData.value = data;
    Object.assign(eventForm.value, {
      ...data,
      year: String(data.year),
      month: String(data.month),
      day: String(data.day),
    });
    isModalOpen.value = true;
    nextTick(() => formRefs.year.value?.focus());
    if (pendingCopyId.value === eventToCopy.id) pendingCopyId.value = null;
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
  const toggleMenu = (eventId) => {
    const willOpenId = activeMenu.value === eventId ? null : eventId;
    if (willOpenId) broadcastMenuOpened(`custom-event-${eventId}`);
    activeMenu.value = willOpenId;
  };
  const handleMenuDelete = (id) => {
    activeMenu.value = null;
    if (confirm("确定要删除这个事件吗？")) deleteEvent(id);
  };
  const updateEventUnit = (id, unit) => {
    const ev = events.value.find((e) => e.id === id);
    if (ev) {
      ev.unit = unit;
      if (ev.decimalPrecision === "combo") ev.decimalPrecision = 0;
      if (
        unit === "seconds" &&
        ev.decimalPrecision !== "combo" &&
        ev.decimalPrecision > 0
      )
        ev.decimalPrecision = 0;
      if (unit === "minutes" && ev.decimalPrecision === 2)
        ev.decimalPrecision = 1;
      saveEvents();
    }
    activeMenu.value = null;
  };
  const updateEventPrecision = (id, precision) => {
    const ev = events.value.find((e) => e.id === id);
    if (ev) {
      ev.decimalPrecision = precision;
      saveEvents();
    }
    activeMenu.value = null;
  };
  const cycleSortOrder = () => {
    const map = { manual: "asc", asc: "desc", desc: "manual" };
    sortOrder.value = map[sortOrder.value];
    if (sortOrder.value === "manual") loadEvents();
  };

  // ============ 悬浮提示（修复：全局 mousemove 跟随） ============
  let docMouseMoveHandler = null; // 全局 mousemove 句柄

  function handleEventMouseEnter(id) {
    if (window.innerWidth <= 800) return; // 移动端不启用
    // 二次确认状态清理
    if (pendingCopyId.value && pendingCopyId.value !== id)
      pendingCopyId.value = null;
    if (pendingDeleteId.value && pendingDeleteId.value !== id)
      pendingDeleteId.value = null;

    hoveredEventId.value = id; // 设置悬浮条目ID

    // 启动全局 mousemove 追踪，保证提示始终跟随
    if (!docMouseMoveHandler) {
      docMouseMoveHandler = (e) => {
        mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 }; // 轻微偏移，避免遮挡指针
      };
      document.addEventListener("mousemove", docMouseMoveHandler, {
        passive: true,
      });
    }

    // 延时显示提示，3秒后自动隐藏（保留原逻辑）
    if (operationHintTimer) clearTimeout(operationHintTimer);
    if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
    operationHintTimer = setTimeout(() => {
      showOperationHint.value = true;
      operationHintHideTimer = setTimeout(() => {
        showOperationHint.value = false;
      }, 3000);
    }, 500);
  }

  function handleEventMouseLeave() {
    if (window.innerWidth <= 800) return;
    hoveredEventId.value = null; // 清空悬浮ID
    showOperationHint.value = false; // 隐藏提示

    // 停止全局追踪
    if (docMouseMoveHandler) {
      document.removeEventListener("mousemove", docMouseMoveHandler);
      docMouseMoveHandler = null;
    }

    // 清理提示计时器与二次确认状态
    if (operationHintTimer) clearTimeout(operationHintTimer);
    if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
    pendingCopyId.value = null;
    pendingDeleteId.value = null;
  }

  function handleEventMouseMove(e) {
    if (window.innerWidth <= 800) return;
    // 行内 mousemove 仍然保留（在全局追踪的情况下也能更新更及时）
    mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 };
  }

  // ============ 表单交互（保持原样） ============
  const formInteractionHandler = {
    onInput(event, field) {
      let value = event.target.value;
      const config = fieldConfig[field];
      if (field === "year") {
        value = value.replace(/[^0-9-]/g, "");
        if (value.lastIndexOf("-") > 0)
          value = value.replace(/-/g, (m, off) => (off === 0 ? m : ""));
      } else if (field !== "name") {
        value = value.replace(/\D/g, "");
      }
      if (config.maxLength && value.length > config.maxLength)
        value = value.slice(0, config.maxLength);
      eventForm.value[field] = value;
      if (field !== "name" && value.length >= config.maxLength) {
        const idx = fieldOrder.indexOf(field);
        const nextField = fieldOrder[idx + 1];
        if (nextField) formRefs[nextField].value?.focus();
      }
    },
    onKeydown(event, field) {
      const { key, ctrlKey, metaKey, shiftKey, target } = event;
      const config = fieldConfig[field];
      const navigate = (dir) => {
        event.preventDefault();
        const idx = fieldOrder.indexOf(field);
        const nextIndex = (idx + dir + fieldOrder.length) % fieldOrder.length;
        const nextKey = fieldOrder[nextIndex];
        formRefs[nextKey].value?.focus();
      };
      const adjustValue = (delta) => {
        if (field === "name") return;
        event.preventDefault();
        let num = Number(eventForm.value[field]) || 0;
        num += delta;
        const { min, max } = config;
        const maxv = typeof max === "function" ? max() : max;
        if (num > maxv) num = min;
        if (num < min) num = maxv;
        eventForm.value[field] =
          field === "year" ? String(num) : String(num).padStart(2, "0");
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
          )
            navigate(-1);
          break;
        case "ArrowRight":
          if (ctrlKey || target.selectionStart === target.value.length)
            navigate(1);
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
      }
    },
    onWheel(event, field) {
      if (field === "name") return;
      const delta = event.deltaY < 0 ? 1 : -1;
      let num = Number(eventForm.value[field]) || 0;
      num += delta;
      const { min, max } = fieldConfig[field];
      const maxv = typeof max === "function" ? max() : max;
      if (num > maxv) num = min;
      if (num < min) num = maxv;
      eventForm.value[field] =
        field === "year" ? String(num) : String(num).padStart(2, "0");
    },
    onFocus(event, field) {
      valueBeforeFocus.value = eventForm.value[field];
      if (!eventForm.value[field] && field !== "name") {
        const cur = DateTime.now();
        const v = cur[field];
        eventForm.value[field] =
          field === "year" ? String(v) : String(v).padStart(2, "0");
      }
      nextTick(() => event.target.select());
    },
    onBlur(field) {
      if (field === "name" || !eventForm.value[field]) return;
      let v = eventForm.value[field];
      if (field === "year" && (v === "-" || v === "-0")) {
        eventForm.value[field] = "";
        return;
      }
      if (field !== "year" && v.length === 1) v = "0" + v;
      let num = Number(v);
      const { min, max } = fieldConfig[field];
      const maxv = typeof max === "function" ? max() : max;
      if (num < min) num = min;
      if (num > maxv) num = maxv;
      const fin = field === "year" ? String(num) : String(num).padStart(2, "0");
      if (fin !== eventForm.value[field]) eventForm.value[field] = fin;
    },
  };

  // ============ 全局快捷键（悬浮条目） ============
  const handleContextualKeydown = (e) => {
    if (isModalOpen.value) return; // 模态打开时不触发悬浮快捷键

    const id = hoveredEventId.value; // 当前悬浮条目
    if (!id) return;
    const ev = events.value.find((x) => x.id === id);
    if (!ev) return;

    const k = e.key;
    if (k === " " || k === "/") {
      // 空格或 / ：编辑
      e.preventDefault();
      openEditModal(ev);
      return;
    }
    if (k === "Insert" || k === "+") {
      // Insert 或 + ：复制（两步确认）
      e.preventDefault();
      if (pendingCopyId.value === id) {
        copyEvent(ev);
      } else {
        pendingCopyId.value = id;
        pendingDeleteId.value = null;
        setTimeout(() => {
          if (pendingCopyId.value === id) pendingCopyId.value = null;
        }, 3000);
      }
      return;
    }
    if (k === "Delete" || k === "-") {
      // Delete 或 - ：删除（两步确认）
      e.preventDefault();
      if (pendingDeleteId.value === id) {
        deleteEvent(id);
      } else {
        pendingDeleteId.value = id;
        pendingCopyId.value = null;
        setTimeout(() => {
          if (pendingDeleteId.value === id) pendingDeleteId.value = null;
        }, 3000);
      }
      return;
    }
  };

  // ============ 全局点击 / 菜单互斥 ============
  const handleGlobalClick = (event) => {
    if (activeMenu.value !== null) {
      const refs = menuRefs[activeMenu.value];
      if (refs && refs.container && !refs.container.contains(event.target))
        activeMenu.value = null;
    }
  };
  const handleMenuBroadcast = (event) => {
    const broadcasterId = event.detail?.id;
    if (broadcasterId && !broadcasterId.startsWith("custom-event-"))
      activeMenu.value = null;
  };

  // ============ 拖拽初始化（三条横线按钮） ============
  const initializeSortable = (element) => {
    if (sortableInstance) sortableInstance.destroy();
    sortableInstance = Sortable.create(element, {
      draggable: ".event-container", // 每行可拖拽
      handle: ".menu-trigger-btn", // 三条横线作为拖拽手柄
      delayOnTouchOnly: false, // 网页/移动端一致启用延时
      delay: 300, // 长按 0.3s 进入拖拽（短按为点击）
      forceFallback: true, // JS 拖拽回退，稳定性更好
      fallbackOnBody: true,
      fallbackTolerance: 3,
      animation: 220,
      ghostClass: "drag-ghost",
      chosenClass: "sortable-chosen",
      scroll: true,
      onEnd: (evt) => {
        if (
          evt.oldIndex == null ||
          evt.newIndex == null ||
          evt.oldIndex === evt.newIndex
        )
          return;
        sortOrder.value = "manual";
        const moved = events.value.splice(evt.oldIndex, 1)[0];
        events.value.splice(evt.newIndex, 0, moved);
        saveEvents();
      },
    });
  };

  // ============ 生命周期 ============
  onMounted(() => {
    loadEvents();
    document.addEventListener("keydown", handleContextualKeydown);
    document.addEventListener("click", handleGlobalClick, true);
    document.addEventListener(MENU_OPEN_EVENT, handleMenuBroadcast);
  });
  onUnmounted(() => {
    document.removeEventListener("keydown", handleContextualKeydown);
    document.removeEventListener("click", handleGlobalClick, true);
    document.removeEventListener(MENU_OPEN_EVENT, handleMenuBroadcast);

    // 解除全局 mousemove（防守式）
    if (docMouseMoveHandler) {
      document.removeEventListener("mousemove", docMouseMoveHandler);
      docMouseMoveHandler = null;
    }

    if (sortableInstance) sortableInstance.destroy();
  });

  // ESC 退出（关闭菜单/悬浮状态/模态）
  const isAnyTempStateActive = computed(
    () =>
      isModalOpen.value ||
      activeMenu.value != null ||
      pendingCopyId.value != null ||
      pendingDeleteId.value != null
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
  });

  // ============ 导出 ============
  return {
    // 数据/显示
    events,
    processedEvents,
    isModalOpen,
    modalTitle,
    eventForm,
    isFormValid,
    sortOrder,
    // 菜单/悬浮/提示
    activeMenu,
    hoveredEventId,
    mousePosition,
    showOperationHint,
    pendingCopyId,
    pendingDeleteId,
    // 操作
    openAddModal,
    closeModal,
    saveEvent,
    deleteEvent,
    openEditModal,
    copyEvent,
    handleMenuDelete,
    cycleSortOrder,
    saveEvents,
    // 悬浮回调（组件绑定用）
    handleEventMouseEnter,
    handleEventMouseLeave,
    handleEventMouseMove,
    // 菜单与表单
    unitOptions,
    getAvailablePrecisions,
    updateEventUnit,
    updateEventPrecision,
    formRefs,
    formInteractionHandler,
    toggleMenu,
    isMenuUpward,
    setMenuRef,
    // 拖拽初始化（组件 onMounted / watch 调用）
    initializeSortable,
  };
}
