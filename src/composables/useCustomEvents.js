// E:\AppProject\VisualTime\src\composables\useCustomEvents.js
// 说明：自定义倒计时（列表 CRUD、排序、菜单、表单、快捷键、拖拽、二次确认、提示气泡）
// 重构点（与拖拽相关的互斥/滚屏锁，按你的“最简逻辑”实现）：
// A) 长按达到时间阈值（300ms）的瞬间：立刻触发互斥会话（关闭菜单/左滑等），并在触屏场景锁定滚动；
// B) 松手/取消时：不论是否进入真实拖拽，一律立即释放所有互斥与滚动锁；
// 其它业务逻辑保持不变，严格限制工作范围。

// ───────────────────────────────────────────────────────────────────────────────
// 依赖导入
// ───────────────────────────────────────────────────────────────────────────────
import {
  ref, // 基础响应式原子
  computed, // 派生属性
  onMounted, // 挂载生命周期
  onUnmounted, // 卸载生命周期
  nextTick, // 下一次 DOM 更新后
  reactive, // 响应式对象
  watch, // 侦听
} from "vue"; // Vue 核心 API
import Sortable from "sortablejs"; // 拖拽库
import { DateTime } from "luxon"; // 日期处理
import { now } from "../services/clockService"; // 全局时钟（高频）
import { computeCountdown } from "../services/countdownEngine"; // 倒计时引擎
import * as storage from "../utils/storage"; // 本地存储工具
import * as formatters from "../utils/formatters"; // 格式化工具
import { activate, closeActive, isActive } from "../services/actionArbiter.js"; // 互斥仲裁器

// ───────────────────────────────────────────────────────────────────────────────
// 导出主 API
// ───────────────────────────────────────────────────────────────────────────────
export function useCustomEvents() {
  // ========== 基础状态 ==========
  const events = ref([]); // 事件列表（localStorage 持久化）
  const customCounter = ref(1); // “自定义N”命名计数器
  const isModalOpen = ref(false); // 新增/编辑模态开关
  const modalTitle = ref("添加自定义倒计时"); // 模态标题
  const activeEventData = ref(null); // 当前编辑/复制的数据

  // 表单模型（字符串便于校验与补零）
  const eventForm = ref({
    year: "",
    month: "",
    day: "",
    hour: "",
    minute: "",
    second: "",
    name: "",
  });

  // 列表行态
  const activeMenu = ref(null); // 当前打开菜单的事件ID
  const sortOrder = ref("manual"); // 排序模式：manual | asc | desc

  // 悬浮提示/二次确认相关
  const hoveredEventId = ref(null); // 当前悬浮行
  const mousePosition = ref({ x: 0, y: 0 }); // 提示气泡位置
  const showOperationHint = ref(false); // 是否显示操作提示（桌面端）
  const pendingCopyId = ref(null); // 复制二次确认目标
  const pendingDeleteId = ref(null); // 删除二次确认目标
  let operationHintTimer = null; // 提示延时器
  let operationHintHideTimer = null; // 提示自动隐藏器

  // 表单字段引用与顺序
  const formYearRef = ref(null);
  const formMonthRef = ref(null);
  const formDayRef = ref(null);
  const formHourRef = ref(null);
  const formMinuteRef = ref(null);
  const formSecondRef = ref(null);
  const formNameRef = ref(null);

  const formRefs = {
    // 引用字典
    year: formYearRef,
    month: formMonthRef,
    day: formDayRef,
    hour: formHourRef,
    minute: formMinuteRef,
    second: formSecondRef,
    name: formNameRef,
  };

  const valueBeforeFocus = ref(""); // 焦点前原值（ESC 还原用）
  const fieldOrder = [
    // 自然导航顺序
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "name",
  ];

  // 字段校验配置
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
    // 精度选项过滤
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

  // 菜单方向（组件测量回写）
  const isMenuUpward = ref(false);

  // 菜单根引用（组件 setMenuRef 回传）
  const menuRefs = {}; // { [id]: { container, trigger, panel } }
  const setMenuRef = (id, el) => {
    // 记录引用
    if (el) menuRefs[id] = el;
  };

  // 拖拽实例
  let sortableInstance = null;

  // ─────────────────────────────────────────────────────────────────────────────
  // 拖拽禁用提示（排序模式下） & 交互基础设施（滚动锁、一键互斥）
  // ─────────────────────────────────────────────────────────────────────────────

  // 提示状态：在非手动排序时，长按阈值达成显示（始终位于指针左侧）
  const dragDisabledHint = reactive({
    visible: false, // 是否可见
    x: 0, // 提示左上角 X
    y: 0, // 提示左上角 Y
    text: "当前为排序视图，拖拽已禁用。\n请切回“手动排序”后再拖拽。", // 文案
  });

  // 移动端滚动锁（长按阈值达成即锁，松手统一释放）
  let _scrollLocked = false; // 是否已锁定滚动
  let _lockedByLongPress = false; // 本轮是否由长按触发的锁
  const _preventTouchMove = (e) => {
    // 捕获阶段阻止默认滚动
    if (_scrollLocked) e.preventDefault();
  };
  function lockScroll() {
    // 加锁
    if (_scrollLocked) return;
    _scrollLocked = true;
    document.addEventListener("touchmove", _preventTouchMove, {
      passive: false,
      capture: true,
    });
  }
  function unlockScroll() {
    // 解锁
    if (!_scrollLocked) return;
    _scrollLocked = false;
    document.removeEventListener("touchmove", _preventTouchMove, {
      capture: true,
    });
  }

  // 拖拽会话声明（统一互斥）：在“长按阈值到达”即刻调用
  function beginDragSession() {
    activate({
      key: "drag:custom-list", // 唯一会话键
      closers: { esc: true, outside: true }, // 允许 ESC 与外点击关闭
      onPreempt: () => {
        // 被取代/关闭前：收尾
        try {
          sortableInstance?.option?.("disabled", true);
        } catch {}
        activeMenu.value = null;
        pendingCopyId.value = null;
        pendingDeleteId.value = null;
      },
      onRelease: () => {
        // 完全释放后：恢复“手动模式”可拖拽
        try {
          sortableInstance?.option?.("disabled", sortOrder.value !== "manual");
        } catch {}
      },
    });
  }

  // 全局跟随（mouse/touchmove）句柄，用于提示跟随
  let _hintFollowMouseMove = null;
  let _hintFollowTouchMove = null;

  // 显示提示并开始跟随（仅在非手动排序时使用）
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

  // 隐藏提示并停止跟随
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

  // 一次性“把手点击抑制器”：抑制下一次把手(.menu-trigger-btn)的 click（拖拽尝试后防止误开菜单）
  let _suppressClickCleanup = null; // 清理器引用
  function suppressNextHandleClick(rootEl) {
    // 安装一次性抑制
    if (_suppressClickCleanup) return; // 已有则不重复
    const onClickCapture = (ev) => {
      const btn = ev.target?.closest?.(".menu-trigger-btn");
      if (btn && rootEl.contains(btn)) {
        ev.stopImmediatePropagation?.();
        ev.stopPropagation();
        ev.preventDefault();
      }
      cleanup();
    };
    const onNextDown = () => cleanup(); // 任意下一次按下解除抑制
    const onBlur = () => cleanup(); // 窗口失焦亦解除

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
    // 主动释放（兜底）
    if (_suppressClickCleanup) _suppressClickCleanup();
  }

  // 把手长按识别（事件委托）：采用“最简两锚点”逻辑
  // - 阈值达成：立即互斥 + 锁滚（触屏）+ 在非手动模式下显示禁用提示
  // - 松手/取消：无条件立即释放互斥 + 解锁滚动 + 抑制下一次把手 click
  function installDragHintDelegation(rootEl) {
    if (!rootEl) return () => {};

    const HOLD_DELAY = 300; // 与 Sortable delay 保持一致
    const MOVE_TOL = 8; // 长按期间允许的小位移（像素）

    let timer = null; // 长按计时器
    let startX = 0,
      startY = 0; // 起始坐标
    let triedDrag = false; // 是否达成“长按阈值”
    let wasTouchStart = false; // 是否触屏起始（移动端）

    const getXY = (e) => {
      // 抽取坐标
      const t = e.touches?.[0];
      return { x: t?.clientX ?? e.clientX, y: t?.clientY ?? e.clientY };
    };

    const clearHold = (hide = true) => {
      // 清理本轮长按与提示跟随
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (_lockedByLongPress) {
        // 若本轮由长按加锁，则释放
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
      // 按下：启动“长按识别”
      const btn = e.target?.closest?.(".menu-trigger-btn");
      if (!btn || !rootEl.contains(btn)) return;

      const { x, y } = getXY(e);
      startX = x;
      startY = y;
      triedDrag = false;
      wasTouchStart = e.type.startsWith("touch");

      timer = setTimeout(() => {
        // 阈值达成：无论能否实际进入拖拽，统一进行“互斥 + 锁滚”动作
        triedDrag = true;
        beginDragSession(); // 立刻互斥关闭菜单/左滑等
        if (wasTouchStart) {
          // 触屏场景：锁定滚动，直到松手释放
          _lockedByLongPress = true;
          lockScroll();
        }
        if (sortOrder.value !== "manual") {
          // 非手动排序：显示禁用提示（随指针）
          showDragDisabledHintAt(startX, startY);
        }
      }, HOLD_DELAY);

      // 安装本轮的全局监听
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
      // 长按前：过大位移则取消本轮识别
      if (!timer && !triedDrag) return;
      const { x, y } = getXY(e);
      const dx = Math.abs(x - startX),
        dy = Math.abs(y - startY);
      if (!triedDrag && (dx > MOVE_TOL || dy > MOVE_TOL)) {
        clearHold(false); // 阈值未达，移动过大 -> 取消尝试
      }
    };

    const onUp = () => {
      // 松手：统一收尾（核心锚点B）
      if (triedDrag) {
        suppressNextHandleClick(rootEl); // 抑制下一次把手 click（避免误开菜单）
        if (isActive("drag:custom-list")) {
          // 无条件释放互斥（不关心是否真实进入拖拽）
          closeActive("drag-up-release");
        }
      }
      clearHold(true); // 解锁滚动 + 提示收尾 + 解绑监听
    };

    // 安装委托
    rootEl.addEventListener("mousedown", onDown, true);
    rootEl.addEventListener("touchstart", onDown, {
      capture: true,
      passive: true,
    });

    // 返回清理器
    return () => {
      clearHold(false);
      rootEl.removeEventListener("mousedown", onDown, true);
      rootEl.removeEventListener("touchstart", onDown, { capture: true });
    };
  }

  // 委托清理器 & 排序监听清理器
  let _hintDelegationCleanup = null; // 把手长按委托清理器
  let _sortableWatchStop = null; // sortOrder 侦听清理器

  // 初始化拖拽（保持既有 Sortable 行为不变；onStart/onEnd 依旧工作）
  const initializeSortable = (element) => {
    // 若已有旧实例，先销毁
    if (sortableInstance) {
      try {
        sortableInstance.destroy();
      } catch {}
      sortableInstance = null;
    }
    if (!element) return;

    // 创建 Sortable（disabled 随 sortOrder 控制）
    sortableInstance = Sortable.create(element, {
      draggable: ".event-container", // 每行可拖拽
      handle: ".menu-trigger-btn", // 把手：菜单按钮
      delayOnTouchOnly: false, // 任意指针类型
      delay: 300, // 长按 300ms（与 HOLD_DELAY 对齐）
      forceFallback: true,
      fallbackOnBody: true,
      fallbackTolerance: 3,
      animation: 220,
      ghostClass: "drag-ghost",
      chosenClass: "sortable-chosen",
      scroll: true,
      disabled: sortOrder.value !== "manual", // 非手动：彻底禁用拖拽

      // 真实进入拖拽时：再抑制一次 click（双保险），刷新会话（幂等）
      onStart: () => {
        suppressNextHandleClick(element); // 防止抬手瞬间把手触发 click
        beginDragSession(); // 会话刷新（若已激活则刷新配置）
      },

      // 未产生位移或取消选中：释放会话
      onUnchoose: () => {
        if (isActive("drag:custom-list")) closeActive("drag-unchoose");
      },

      // 拖拽结束：若位置变更则保存，并释放会话
      onEnd: (evt) => {
        if (
          evt.oldIndex == null ||
          evt.newIndex == null ||
          evt.oldIndex === evt.newIndex
        ) {
          if (isActive("drag:custom-list")) closeActive("drag-end");
          return;
        }
        // 一旦手动拖拽成功，回到手动模式并保存顺序
        sortOrder.value = "manual";
        const moved = events.value.splice(evt.oldIndex, 1)[0];
        events.value.splice(evt.newIndex, 0, moved);
        saveEvents();
        if (isActive("drag:custom-list")) closeActive("drag-end");
      },

      // 取消：释放会话
      onCancel: () => {
        if (isActive("drag:custom-list")) closeActive("drag-cancel");
      },
    });

    // 排序模式变化：动态启/禁拖拽（并关闭正在进行的拖拽会话）
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

    // 安装把手长按委托（最简两锚点逻辑：阈值达成 -> 互斥+锁滚；松手 -> 释放）
    if (_hintDelegationCleanup) {
      _hintDelegationCleanup();
      _hintDelegationCleanup = null;
    }
    _hintDelegationCleanup = installDragHintDelegation(element);
  };

  // ========== 派生显示数据 ==========
  const processedEvents = computed(() => {
    const sorted = [...events.value]; // 拷贝数据
    // 非手动排序：按目标时间升/降序
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
    // 行内显示文本（日期描述 + 倒计时）
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

  // ========== 表单合法性 ==========
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

  // ========== 存取/初始化 ==========
  const saveEvents = () => storage.saveCustomEvents(events.value); // 保存列表
  const loadEvents = () => {
    // 读取 + 填充默认字段
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
    // 关闭模态
    if (isActive("modal:custom-edit")) {
      closeActive("close");
      return;
    }
    isModalOpen.value = false;
    activeEventData.value = null;
  };

  const saveEvent = () => {
    // 保存记录
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
    // 删除记录
    events.value = events.value.filter((e) => e.id !== id);
    saveEvents();
    if (pendingDeleteId.value === id) pendingDeleteId.value = null;
  };

  const copyEvent = (eventToCopy) => {
    // 复制并新增
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
    // 新增
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
    // 编辑
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

  // 行菜单 toggle（兼容导出；组件侧已有仲裁版实现）
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

  // 菜单动作
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

  // 排序模式切换（三态循环）
  const cycleSortOrder = () => {
    const map = { manual: "asc", asc: "desc", desc: "manual" };
    sortOrder.value = map[sortOrder.value];
    if (sortOrder.value === "manual") loadEvents(); // 回到手动：恢复存储顺序
  };

  // ========== 悬浮提示（桌面端） ==========
  let docMouseMoveHandler = null; // 全局 mousemove

  function handleEventMouseEnter(id) {
    if (window.innerWidth <= 800) return; // 移动端不启用悬浮提示
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
  let confirmTimers = { copy: null, delete: null }; // 超时器

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
        // 年份：允许负号
        value = value.replace(/[^0-9-]/g, "");
        if (value.lastIndexOf("-") > 0) {
          value = value.replace(/-/g, (m, off) => (off === 0 ? m : ""));
        }
      } else if (field !== "name") {
        // 其它数字字段
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
        // 导航前后字段
        event.preventDefault();
        const idx = fieldOrder.indexOf(field);
        const nextIndex = (idx + dir + fieldOrder.length) % fieldOrder.length;
        const nextKey = fieldOrder[nextIndex];
        formRefs[nextKey].value?.focus();
      };

      const adjustValue = (delta) => {
        // 数字字段增减（环绕）
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
      // 滚轮增减
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
      // 聚焦：预填 + 选中
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
      // 失焦：归一
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
        copyEvent(ev);
        closeActive("confirm");
      } else {
        openCopyConfirm(id);
      }
      return;
    }
    if (k === "Delete" || k === "-") {
      e.preventDefault();
      const key = `confirm:delete:${id}`;
      if (isActive(key)) {
        deleteEvent(id);
        closeActive("confirm");
      } else {
        openDeleteConfirm(id);
      }
    }
  };

  // ========== 生命周期 ==========
  onMounted(() => {
    loadEvents(); // 初始化数据
    document.addEventListener("keydown", handleContextualKeydown); // 注册快捷键
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleContextualKeydown); // 解绑快捷键

    if (docMouseMoveHandler) {
      // 解绑鼠标跟随
      document.removeEventListener("mousemove", docMouseMoveHandler);
      docMouseMoveHandler = null;
    }

    if (confirmTimers.copy) clearTimeout(confirmTimers.copy); // 清理计时器
    if (confirmTimers.delete) clearTimeout(confirmTimers.delete);

    if (sortableInstance) {
      // 销毁拖拽
      try {
        sortableInstance.destroy();
      } catch {}
      sortableInstance = null;
    }

    if (_hintDelegationCleanup) {
      _hintDelegationCleanup();
      _hintDelegationCleanup = null;
    } // 清理委托
    hideDragDisabledHint(); // 关闭提示
    if (_sortableWatchStop) {
      _sortableWatchStop();
      _sortableWatchStop = null;
    } // 停止侦听

    releaseHandleClickSuppression(); // 释放一次性抑制器（兜底）
    unlockScroll(); // 兜底释放滚动锁
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
  // 导出接口
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
