// E:\AppProject\VisualTime\src\composables\useCustomEvents.js
// 说明：自定义倒计时（列表 CRUD、排序、菜单、表单、快捷键、拖拽、二次确认、提示气泡）
// 重构点（与拖拽相关的互斥/滚屏锁，按你的“最简逻辑”实现）：
// A) 长按达到时间阈值（300ms）的瞬间：立刻触发互斥会话（关闭菜单/左滑等），并在触屏场景锁定滚动；
// B) 松手/取消时：不论是否进入真实拖拽，一律立即释放所有互斥与滚动锁；
// 其它业务逻辑保持不变，严格限制工作范围。

import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  reactive,
  watch,
} from "vue";
import Sortable from "sortablejs";
import { DateTime } from "luxon";
import { now } from "../services/clockService";
import { computeCountdown } from "../services/countdownEngine";
import * as storage from "../utils/storage";
import * as formatters from "../utils/formatters";
import { activate, closeActive, isActive } from "../services/actionArbiter.js";

export function useCustomEvents() {
  // ========== 基础状态 ==========
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

  const hoveredEventId = ref(null);
  const mousePosition = ref({ x: 0, y: 0 });
  const showOperationHint = ref(false);
  const pendingCopyId = ref(null);
  const pendingDeleteId = ref(null);
  let operationHintTimer = null;
  let operationHintHideTimer = null;

  // 表单字段引用与顺序
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

  // 设置菜单候选
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

  let sortableInstance = null;

  // ─────────────────────────────────────────────────────────────────────────────
  // 拖拽禁用提示 & 滚动锁 & 一次性把手点击抑制
  // ─────────────────────────────────────────────────────────────────────────────
  const dragDisabledHint = reactive({
    visible: false,
    x: 0,
    y: 0,
    text: "当前为排序视图，拖拽已禁用。\n请切回“手动排序”后再拖拽。",
  });

  let _scrollLocked = false;
  let _lockedByLongPress = false;
  const _preventTouchMove = (e) => {
    if (_scrollLocked) e.preventDefault();
  };
  function lockScroll() {
    if (_scrollLocked) return;
    _scrollLocked = true;
    document.addEventListener("touchmove", _preventTouchMove, {
      passive: false,
      capture: true,
    });
  }
  function unlockScroll() {
    if (!_scrollLocked) return;
    _scrollLocked = false;
    document.removeEventListener("touchmove", _preventTouchMove, {
      capture: true,
    });
  }

  function beginDragSession() {
    activate({
      key: "drag:custom-list",
      closers: { esc: true, outside: true },
      onPreempt: () => {
        try {
          sortableInstance?.option?.("disabled", true);
        } catch {}
        activeMenu.value = null;
        pendingCopyId.value = null;
        pendingDeleteId.value = null;
      },
      onRelease: () => {
        try {
          sortableInstance?.option?.("disabled", sortOrder.value !== "manual");
        } catch {}
      },
    });
  }

  let _hintFollowMouseMove = null;
  let _hintFollowTouchMove = null;

  function showDragDisabledHintAt(x, y) {
    if (Number.isFinite(x)) dragDisabledHint.x = x;
    if (Number.isFinite(y)) dragDisabledHint.y = y;
    dragDisabledHint.visible = true;

    if (!_hintFollowMouseMove) {
      _hintFollowMouseMove = (e) => {
        dragDisabledHint.x = e.clientX;
        dragDisabledHint.y = e.clientY;
      };
      document.addEventListener("mousemove", _hintFollowMouseMove, {
        passive: true,
      });
    }
    if (!_hintFollowTouchMove) {
      _hintFollowTouchMove = (e) => {
        const t = e.touches?.[0];
        if (!t) return;
        dragDisabledHint.x = t.clientX;
        dragDisabledHint.y = t.clientY;
      };
      document.addEventListener("touchmove", _hintFollowTouchMove, {
        passive: true,
      });
    }
  }

  function hideDragDisabledHint() {
    dragDisabledHint.visible = false;
    if (_hintFollowMouseMove) {
      document.removeEventListener("mousemove", _hintFollowMouseMove);
      _hintFollowMouseMove = null;
    }
    if (_hintFollowTouchMove) {
      document.removeEventListener("touchmove", _hintFollowTouchMove);
      _hintFollowTouchMove = null;
    }
  }

  let _suppressClickCleanup = null;
  function suppressNextHandleClick(rootEl) {
    if (_suppressClickCleanup) return;
    const onClickCapture = (ev) => {
      const btn = ev.target?.closest?.(".menu-trigger-btn");
      if (btn && rootEl.contains(btn)) {
        ev.stopImmediatePropagation?.();
        ev.stopPropagation();
        ev.preventDefault();
      }
      cleanup();
    };
    const onNextDown = () => cleanup();
    const onBlur = () => cleanup();

    function cleanup() {
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("mousedown", onNextDown, true);
      document.removeEventListener("touchstart", onNextDown, true);
      document.removeEventListener("pointerdown", onNextDown, true);
      window.removeEventListener("blur", onBlur, true);
      _suppressClickCleanup = null;
    }

    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("mousedown", onNextDown, true);
    document.addEventListener("touchstart", onNextDown, true);
    document.addEventListener("pointerdown", onNextDown, true);
    window.addEventListener("blur", onBlur, true);
    _suppressClickCleanup = cleanup;
  }
  function releaseHandleClickSuppression() {
    if (_suppressClickCleanup) _suppressClickCleanup();
  }

  // 把手长按识别（事件委托）：最简两锚点逻辑
  function installDragHintDelegation(rootEl) {
    if (!rootEl) return () => {};

    const HOLD_DELAY = 300; // 与 Sortable delay 保持一致
    const MOVE_TOL = 8; // 长按期间允许的小位移（像素）

    let timer = null;
    let startX = 0,
      startY = 0;
    let triedDrag = false;
    let wasTouchStart = false;

    const getXY = (e) => {
      const t = e.touches?.[0];
      return { x: t?.clientX ?? e.clientX, y: t?.clientY ?? e.clientY };
    };

    const clearHold = (hide = true) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (_lockedByLongPress) {
        _lockedByLongPress = false;
        unlockScroll();
      }
      if (hide && triedDrag && sortOrder.value !== "manual") {
        hideDragDisabledHint();
      }
      window.removeEventListener("mouseup", onUp, true);
      window.removeEventListener("touchend", onUp, true);
      window.removeEventListener("touchcancel", onUp, true);
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("touchmove", onMove, { capture: true });
    };

    const onDown = (e) => {
      const btn = e.target?.closest?.(".menu-trigger-btn");
      if (!btn || !rootEl.contains(btn)) return;

      const { x, y } = getXY(e);
      startX = x;
      startY = y;
      triedDrag = false;
      wasTouchStart = e.type.startsWith("touch");

      timer = setTimeout(() => {
        triedDrag = true;
        beginDragSession();
        if (wasTouchStart) {
          _lockedByLongPress = true;
          lockScroll();
        }
        if (sortOrder.value !== "manual") {
          showDragDisabledHintAt(startX, startY);
        }
      }, HOLD_DELAY);

      window.addEventListener("mouseup", onUp, true);
      window.addEventListener("touchend", onUp, true);
      window.addEventListener("touchcancel", onUp, true);
      window.addEventListener("mousemove", onMove, true);
      window.addEventListener("touchmove", onMove, {
        capture: true,
        passive: true,
      });
    };

    const onMove = (e) => {
      if (!timer && !triedDrag) return;
      const { x, y } = getXY(e);
      const dx = Math.abs(x - startX),
        dy = Math.abs(y - startY);
      if (!triedDrag && (dx > MOVE_TOL || dy > MOVE_TOL)) {
        clearHold(false);
      }
    };

    const onUp = () => {
      if (triedDrag) {
        suppressNextHandleClick(rootEl);
        if (isActive("drag:custom-list")) {
          closeActive("drag-up-release");
        }
      }
      clearHold(true);
    };

    rootEl.addEventListener("mousedown", onDown, true);
    rootEl.addEventListener("touchstart", onDown, {
      capture: true,
      passive: true,
    });

    return () => {
      clearHold(false);
      rootEl.removeEventListener("mousedown", onDown, true);
      rootEl.removeEventListener("touchstart", onDown, { capture: true });
    };
  }

  // 委托清理器 & 排序监听清理器
  let _hintDelegationCleanup = null;
  let _sortableWatchStop = null;

  // 初始化拖拽（保持既有 Sortable 行为不���；onStart/onEnd 依旧工作）
  const initializeSortable = (element) => {
    if (sortableInstance) {
      try {
        sortableInstance.destroy();
      } catch {}
      sortableInstance = null;
    }
    if (!element) return;

    sortableInstance = Sortable.create(element, {
      draggable: ".event-container",
      handle: ".menu-trigger-btn",
      delayOnTouchOnly: false,
      delay: 300,
      forceFallback: true,
      fallbackOnBody: true,
      fallbackTolerance: 3,
      animation: 220,
      ghostClass: "drag-ghost",
      chosenClass: "sortable-chosen",
      scroll: true,
      disabled: sortOrder.value !== "manual",

      onStart: () => {
        suppressNextHandleClick(element);
        beginDragSession();
      },

      onUnchoose: () => {
        if (isActive("drag:custom-list")) closeActive("drag-unchoose");
      },

      onEnd: (evt) => {
        if (
          evt.oldIndex == null ||
          evt.newIndex == null ||
          evt.oldIndex === evt.newIndex
        ) {
          if (isActive("drag:custom-list")) closeActive("drag-end");
          return;
        }
        sortOrder.value = "manual";
        const moved = events.value.splice(evt.oldIndex, 1)[0];
        events.value.splice(evt.newIndex, 0, moved);
        saveEvents();
        if (isActive("drag:custom-list")) closeActive("drag-end");
      },

      onCancel: () => {
        if (isActive("drag:custom-list")) closeActive("drag-cancel");
      },
    });

    if (_sortableWatchStop) {
      _sortableWatchStop();
      _sortableWatchStop = null;
    }
    _sortableWatchStop = watch(
      () => sortOrder.value,
      (v) => {
        try {
          sortableInstance?.option?.("disabled", v !== "manual");
          if (v !== "manual" && isActive("drag:custom-list")) {
            closeActive("sort-changed");
          }
        } catch {}
      }
    );

    if (_hintDelegationCleanup) {
      _hintDelegationCleanup();
      _hintDelegationCleanup = null;
    }
    _hintDelegationCleanup = installDragHintDelegation(element);
  };

  // ========== 派生显示数据 ==========
  const processedEvents = computed(() => {
    const sorted = [...events.value];
    if (sortOrder.value !== "manual") {
      const toDt = (e) =>
        DateTime.fromObject({
          year: e.year,
          month: e.month,
          day: e.day,
          hour: Number(e.hour || 0),
          minute: Number(e.minute || 0),
          second: Number(e.second || 0),
        });
      sorted.sort((a, b) => {
        const A = toDt(a),
          B = toDt(b);
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

  // ========== 表单合法性（修复：避免 "-" 导致 NaN 抛错） ==========
  const isFormValid = computed(() => {
    const f = eventForm.value;

    // 若年份为空或仅为 "-"，或月份/日期为空，则暂视为无效，避免传 NaN 给 Luxon
    if (f.year === "" || f.year === "-" || f.month === "" || f.day === "") {
      return false;
    }

    // 安全数值解析器：空字符串/非法值回退
    const toSafeInt = (v, fallback) => {
      if (v === "" || v === "-") return fallback;
      const n = parseInt(v, 10);
      return Number.isNaN(n) ? fallback : n;
    };

    const dt = DateTime.fromObject({
      year: toSafeInt(f.year, 0),
      month: toSafeInt(f.month, 1),
      day: toSafeInt(f.day, 1),
      hour: toSafeInt(f.hour, 0),
      minute: toSafeInt(f.minute, 0),
      second: toSafeInt(f.second, 0),
    });
    const okYear = f.year !== "" && f.year !== "-";
    return dt.isValid && okYear;
  });

  // ========== 存取/初始化 ==========
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
      ...saved.map((e) => parseInt(e.name?.match?.(/^自定义(\d+)$/)?.[1] || 0))
    );
    customCounter.value = maxN + 1;
  };

  // ========== 模态（新增/编辑） ==========
  const closeModal = () => {
    if (isActive("modal:custom-edit")) {
      closeActive("close");
      return;
    }
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
    if (idx !== -1) {
      events.value.splice(idx, 1, data);
    } else {
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
    const key = `menu:custom:${eventToCopy.id}`;
    if (isActive(key)) closeActive("select"); // 修复：选择后立即关闭菜单会话

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
      month: String(data.month).padStart(2, "0"),
      day: String(data.day).padStart(2, "0"),
    });

    activate({
      key: "modal:custom-edit",
      closers: { esc: true, outside: false },
      onPreempt: () => {
        if (isModalOpen.value) isModalOpen.value = false;
      },
      onRelease: () => {
        if (isModalOpen.value) isModalOpen.value = false;
        activeEventData.value = null;
      },
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

    activate({
      key: "modal:custom-edit",
      closers: { esc: true, outside: false },
      onPreempt: () => {
        if (isModalOpen.value) isModalOpen.value = false;
      },
      onRelease: () => {
        if (isModalOpen.value) isModalOpen.value = false;
        activeEventData.value = null;
      },
    });

    isModalOpen.value = true;
    nextTick(() => formRefs.year.value?.focus());
  };

  const openEditModal = (event) => {
    activeMenu.value = null;
    const key = `menu:custom:${event.id}`;
    if (isActive(key)) closeActive("select"); // 修复：选择后立即关闭菜单会话

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

    activate({
      key: "modal:custom-edit",
      closers: { esc: true, outside: false },
      onPreempt: () => {
        if (isModalOpen.value) isModalOpen.value = false;
      },
      onRelease: () => {
        if (isModalOpen.value) isModalOpen.value = false;
        activeEventData.value = null;
      },
    });

    isModalOpen.value = true;
    nextTick(() => formRefs.year.value?.focus());
  };

  // 行菜单 toggle（兼容导出）
  const toggleMenu = (eventId) => {
    const key = `menu:custom:${eventId}`;
    if (isActive(key)) {
      closeActive("toggle");
      return;
    }
    activate({
      key,
      closers: { esc: true, outside: true },
      onPreempt: () => {
        if (activeMenu.value === eventId) activeMenu.value = null;
      },
      onRelease: () => {
        if (activeMenu.value === eventId) activeMenu.value = null;
      },
      getRootEl: () => {
        const r = menuRefs[eventId] || {};
        return [r.container, r.panel].filter(Boolean);
      },
    });
    activeMenu.value = eventId;
  };

  // 菜单动作（修复：选择后立即关闭 arbiter 会话，避免二次点击才能重开）
  const handleMenuDelete = (id) => {
    activeMenu.value = null;
    const key = `menu:custom:${id}`;
    if (confirm("确定要删除这个事件吗？")) deleteEvent(id);
    if (isActive(key)) closeActive("select");
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
    const key = `menu:custom:${id}`;
    if (isActive(key)) closeActive("select");
  };

  const updateEventPrecision = (id, precision) => {
    const ev = events.value.find((e) => e.id === id);
    if (ev) {
      ev.decimalPrecision = precision;
      saveEvents();
    }
    activeMenu.value = null;
    const key = `menu:custom:${id}`;
    if (isActive(key)) closeActive("select");
  };

  // 排序模式切换
  const cycleSortOrder = () => {
    const map = { manual: "asc", asc: "desc", desc: "manual" };
    sortOrder.value = map[sortOrder.value];
    if (sortOrder.value === "manual") loadEvents();
  };

  // ========== 悬浮提示（桌面端） ==========
  let docMouseMoveHandler = null;

  function handleEventMouseEnter(id) {
    if (window.innerWidth <= 800) return;
    if (pendingCopyId.value && pendingCopyId.value !== id)
      pendingCopyId.value = null;
    if (pendingDeleteId.value && pendingDeleteId.value !== id)
      pendingDeleteId.value = null;

    hoveredEventId.value = id;

    if (!docMouseMoveHandler) {
      docMouseMoveHandler = (e) => {
        mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 };
      };
      document.addEventListener("mousemove", docMouseMoveHandler, {
        passive: true,
      });
    }

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
    hoveredEventId.value = null;
    showOperationHint.value = false;
    if (docMouseMoveHandler) {
      document.removeEventListener("mousemove", docMouseMoveHandler);
      docMouseMoveHandler = null;
    }
    if (operationHintTimer) clearTimeout(operationHintTimer);
    if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
    pendingCopyId.value = null;
    pendingDeleteId.value = null;
  }

  function handleEventMouseMove(e) {
    if (window.innerWidth <= 800) return;
    mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 };
  }

  // ========== 二次确认（复制/删除） ==========
  let confirmTimers = { copy: null, delete: null };

  function openCopyConfirm(id) {
    if (pendingDeleteId.value && pendingDeleteId.value !== id) {
      pendingDeleteId.value = null;
      if (confirmTimers.delete) {
        clearTimeout(confirmTimers.delete);
        confirmTimers.delete = null;
      }
    }
    pendingCopyId.value = id;
    const key = `confirm:copy:${id}`;
    activate({
      key,
      closers: { esc: true, outside: true },
      onPreempt: () => {
        if (pendingCopyId.value === id) pendingCopyId.value = null;
      },
      onRelease: () => {
        if (pendingCopyId.value === id) pendingCopyId.value = null;
      },
    });
    if (confirmTimers.copy) clearTimeout(confirmTimers.copy);
    confirmTimers.copy = setTimeout(() => {
      if (isActive(key)) closeActive("timeout");
    }, 3000);
  }

  function openDeleteConfirm(id) {
    if (pendingCopyId.value && pendingCopyId.value !== id) {
      pendingCopyId.value = null;
      if (confirmTimers.copy) {
        clearTimeout(confirmTimers.copy);
        confirmTimers.copy = null;
      }
    }
    pendingDeleteId.value = id;
    const key = `confirm:delete:${id}`;
    activate({
      key,
      closers: { esc: true, outside: true },
      onPreempt: () => {
        if (pendingDeleteId.value === id) pendingDeleteId.value = null;
      },
      onRelease: () => {
        if (pendingDeleteId.value === id) pendingDeleteId.value = null;
      },
    });
    if (confirmTimers.delete) clearTimeout(confirmTimers.delete);
    confirmTimers.delete = setTimeout(() => {
      if (isActive(key)) closeActive("timeout");
    }, 3000);
  }

  // ========== 表单交互 ==========
  const formInteractionHandler = {
    onInput(event, field) {
      let value = event.target.value;
      const config = fieldConfig[field];

      if (field === "year") {
        value = value.replace(/[^0-9-]/g, "");
        if (value.lastIndexOf("-") > 0) {
          value = value.replace(/-/g, (m, off) => (off === 0 ? m : ""));
        }
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
          if (ctrlKey || metaKey || field === "name") {
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

  // ========== 悬浮快捷键（桌面端） ==========
  const handleContextualKeydown = (e) => {
    if (isModalOpen.value) return;
    const id = hoveredEventId.value;
    if (!id) return;
    const ev = events.value.find((x) => x.id === id);
    if (!ev) return;

    const k = e.key;
    if (k === " " || k === "/") {
      e.preventDefault();
      openEditModal(ev);
      return;
    }
    if (k === "Insert" || k === "+") {
      e.preventDefault();
      const key = `confirm:copy:${id}`;
      if (isActive(key)) {
        closeActive("confirm");
        copyEvent(ev);
      } else {
        openCopyConfirm(id);
      }
      return;
    }
    if (k === "Delete" || k === "-") {
      e.preventDefault();
      const key = `confirm:delete:${id}`;
      if (isActive(key)) {
        closeActive("confirm");
        deleteEvent(id);
      } else {
        openDeleteConfirm(id);
      }
    }
  };

  // ========== 生命周期 ==========
  onMounted(() => {
    loadEvents();
    document.addEventListener("keydown", handleContextualKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleContextualKeydown);

    if (docMouseMoveHandler) {
      document.removeEventListener("mousemove", docMouseMoveHandler);
      docMouseMoveHandler = null;
    }

    if (confirmTimers.copy) clearTimeout(confirmTimers.copy);
    if (confirmTimers.delete) clearTimeout(confirmTimers.delete);

    if (sortableInstance) {
      try {
        sortableInstance.destroy();
      } catch {}
      sortableInstance = null;
    }

    if (_hintDelegationCleanup) {
      _hintDelegationCleanup();
      _hintDelegationCleanup = null;
    }
    hideDragDisabledHint();
    if (_sortableWatchStop) {
      _sortableWatchStop();
      _sortableWatchStop = null;
    }

    releaseHandleClickSuppression();
    unlockScroll();
  });

  // 列表数据变化：组件会在 nextTick 后重新 initializeSortable
  watch(
    () => events.value,
    () => {
      nextTick(() => {
        if (sortableInstance) {
          try {
            sortableInstance.destroy();
          } catch {}
          sortableInstance = null;
        }
      });
    },
    { deep: true }
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // ��出接口
  // ─────────────────────────────────────────────────────────────────────────────
  return {
    // 数据/显示
    events,
    processedEvents,
    isModalOpen,
    modalTitle,
    eventForm,
    isFormValid,
    sortOrder,

    // 菜单/悬浮/提示状态
    activeMenu,
    hoveredEventId,
    mousePosition,
    showOperationHint,
    pendingCopyId,
    pendingDeleteId,

    // 主要操作
    openAddModal,
    closeModal,
    saveEvent,
    deleteEvent,
    openEditModal,
    copyEvent,
    handleMenuDelete,
    cycleSortOrder,
    saveEvents,

    // 悬浮行为（组件绑定）
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

    // 菜单切换（兼容）
    toggleMenu,

    // 菜单方向与引用（组件测量后回写）
    isMenuUpward,
    setMenuRef,

    // 拖拽初始化（组件 onMounted / 数据变动时调用）
    initializeSortable,

    // 排序模式下长按把手提示（供组件渲染）
    dragDisabledHint,
  };
}
