// E:\AppProject\VisualTime\src\composables\useCustomEvents.js
// 说明：
// - 自定义倒计时业务逻辑（列表 CRUD、排序、菜单、表单、快捷键���拖拽、二次确认、模态）
// - 单一架构：仅使用 actionArbiter 进行互斥（无任何 eventBus / 开关灰度 / 旧全局监听）
// - 组件（CustomCountdown.vue）负责“菜单/左滑”的 DOM 具体实现；此处暴露状态与动作

// ───────────────────────────────────────────────────────────────────────────────
// 导入依赖
// ───────────────────────────────────────────────────────────────────────────────
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue"; // Vue 响应式与生命周期
import Sortable from "sortablejs"; // 拖拽库
import { DateTime } from "luxon"; // 日期计算
import { now } from "../services/clockService"; // 全局时钟（高频）
import { computeCountdown } from "../services/countdownEngine"; // 倒计时引擎
import * as storage from "../utils/storage"; // 本地存储
import * as formatters from "../utils/formatters"; // 文本格式化
import { activate, closeActive, isActive } from "../services/actionArbiter.js"; // 全局仲裁器

// ───────────────────────────────────────────────────────────────────────────────
// 导出主函数：提供自定义倒计时的全部逻辑与状态
// ───────────────────────────────────────────────────────────────────────────────
export function useCustomEvents() {
  // ========== 基础状态 ==========
  const events = ref([]); // 事件列表（存储于 localStorage）
  const customCounter = ref(1); // 默认命名用“自定义N”的 N 计数器

  const isModalOpen = ref(false); // 编辑/新增模态是否打开
  const modalTitle = ref("添加自定义倒计时"); // 模态标题
  const activeEventData = ref(null); // 正在编辑/复制的事件数据

  // 表单数据模型（使用字符串以便前端校验与补零）
  const eventForm = ref({
    year: "",
    month: "",
    day: "",
    hour: "",
    minute: "",
    second: "",
    name: "",
  });

  const activeMenu = ref(null); // 当前行的设置菜单打开的事件ID（由组件层仲裁后设置/清理）
  const sortOrder = ref("manual"); // 排序模式：manual | asc | desc

  // 悬浮提示/二次确认相关状态
  const hoveredEventId = ref(null); // 鼠标悬浮的事件ID（桌面端）
  const mousePosition = ref({ x: 0, y: 0 }); // 提示气泡位置（fixed）
  const showOperationHint = ref(false); // 是否显示操作提示
  const pendingCopyId = ref(null); // 复制二次确认的目标ID
  const pendingDeleteId = ref(null); // 删除二次确认的目标ID
  let operationHintTimer = null, // 提示延时器
    operationHintHideTimer = null; // 提示自动隐藏延时器

  // 表单字段引用（便于聚焦与逐字段校验/导航）
  const formYearRef = ref(null);
  const formMonthRef = ref(null);
  const formDayRef = ref(null);
  const formHourRef = ref(null);
  const formMinuteRef = ref(null);
  const formSecondRef = ref(null);
  const formNameRef = ref(null);

  // 将引用整理为字典，便于按字段名访问
  const formRefs = {
    year: formYearRef,
    month: formMonthRef,
    day: formDayRef,
    hour: formHourRef,
    minute: formMinuteRef,
    second: formSecondRef,
    name: formNameRef,
  };

  const valueBeforeFocus = ref(""); // 输入框获得焦点前的原值（供 ESC/修正）
  const fieldOrder = [
    // 表单字段自然导航顺序
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "name",
  ];

  // 每个字段的长度/范围校验配置
  const fieldConfig = {
    year: { maxLength: 6, min: -99999, max: 99999 }, // 年份允许更大范围（支持公元前）
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

  // 设置菜单中可选的显示单位（与 formatters 保持一致）
  const unitOptions = [
    { value: "years", label: "年" },
    { value: "months", label: "月" },
    { value: "weeks", label: "周" },
    { value: "days", label: "天" },
    { value: "hours", label: "时" },
    { value: "minutes", label: "分" },
    { value: "seconds", label: "秒" },
  ];

  // 精度可选项（组合 or 小数位）
  const allPrecisionOptions = [
    { value: "combo", label: "组合" },
    { value: 0, label: "0" },
    { value: 1, label: "0.0" },
    { value: 2, label: "0.00" },
  ];

  // 根据单位过滤可用精度
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

  // 菜单方向翻转标记（上/下展开），具体测量在组件层进行，这里仅存值
  const isMenuUpward = ref(false);

  // 菜单相关 DOM 引用的字典（组件层通过 setMenuRef 回传）
  const menuRefs = {};
  const setMenuRef = (id, el) => {
    // el: { container, trigger, panel }
    if (el) menuRefs[id] = el;
  };

  // 拖拽实例（整个列表）
  let sortableInstance = null;

  // ========== 派生显示数据 ==========
  const processedEvents = computed(() => {
    // 复制一份排序，不破坏原数组顺序
    const sorted = [...events.value];

    // 非手动排序：按目标 DateTime 排序
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

    // 为 UI 计算最终展示文本（组合/单位+小数）与日期描述
    return sorted.map((event) => {
      // 使用引擎计算与当前时刻的差值（面向“自定义目标时间点”）
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

      // 生成“YYYY年 MM月dd日 HH:mm:ss”的描述（支持公元前显示）
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

      // 若无效则直接提示
      if (!result) return { ...event, finalDisplay: "日期无效", dateTimeDesc };

      // 组合 or 单位+小数 显示
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

      // 返回扩展后的行对象
      return { ...event, finalDisplay, dateTimeDesc };
    });
  });

  // 表单有效性：年非空/非“-”，整体时间合法
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
  const saveEvents = () => storage.saveCustomEvents(events.value); // 保存列表到 localStorage

  const loadEvents = () => {
    // 读取并填充默认字段
    const saved = storage.getCustomEvents();
    events.value = saved.map((e) => ({
      unit: "days",
      decimalPrecision: 0,
      ...e,
    }));

    // 自增命名计数：扫描现有“自定义N”的最大 N
    const maxN = Math.max(
      0,
      ...saved.map((e) => parseInt(e.name.match(/^自定义(\d+)$/)?.[1] || 0))
    );
    customCounter.value = maxN + 1;
  };

  // ========== 模态（新增/编辑） ==========
  const closeModal = () => {
    // 若当前仲裁会话正是“自定义编辑模态”，通过仲裁关闭（触发 onPreempt/onRelease 收尾）
    if (isActive("modal:custom-edit")) {
      closeActive("close");
      return;
    }
    // 容错：非当前会话（或已无会话），直接本地隐藏
    isModalOpen.value = false;
    activeEventData.value = null;
  };

  const saveEvent = () => {
    // 校验
    if (!isFormValid.value) {
      alert("请填写完整且合法的时间");
      return;
    }
    const f = eventForm.value;

    // 合成/更新记录
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

    // 写回到列表（替换或插入）
    const idx = events.value.findIndex((e) => e.id === data.id);
    if (idx !== -1) {
      events.value.splice(idx, 1, data);
    } else {
      data.id = Date.now();
      events.value.unshift(data);
      if (!f.name) customCounter.value++;
    }

    // 落盘并关闭
    saveEvents();
    closeModal();
  };

  const deleteEvent = (id) => {
    // 移除
    events.value = events.value.filter((e) => e.id !== id);
    saveEvents();
    // 清理可能残留的二次确认态
    if (pendingDeleteId.value === id) pendingDeleteId.value = null;
  };

  const copyEvent = (eventToCopy) => {
    // 关闭当前行��单
    activeMenu.value = null;

    // 设置模态为“复制并新增”
    modalTitle.value = "复制并新增事件";
    const data = {
      ...eventToCopy,
      id: `new_${Date.now()}`, // 新记录的临时ID（保存后会改成时间戳）
      name: `${eventToCopy.name} - 副本`,
    };
    activeEventData.value = data;

    // 表单填充
    Object.assign(eventForm.value, {
      ...data,
      year: String(data.year),
      month: String(data.month).padStart(2, "0"),
      day: String(data.day).padStart(2, "0"),
    });

    // 激活模态仲裁会话（禁止外点击、允许 ESC）
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

    // 开启模态并聚焦
    isModalOpen.value = true;
    nextTick(() => formRefs.year.value?.focus());

    // 若来自“复制二次确认”，清理该确认态
    if (pendingCopyId.value === eventToCopy.id) pendingCopyId.value = null;
  };

  const openAddModal = () => {
    // 关闭菜单
    activeMenu.value = null;

    // 新建模板
    modalTitle.value = "添加自定义倒计时";
    activeEventData.value = { unit: "days", decimalPrecision: 0 };

    // 默认时间：当前时刻
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

    // 激活模态仲裁会话（禁止外点击、允许 ESC）
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

    // 打开并聚焦
    isModalOpen.value = true;
    nextTick(() => formRefs.year.value?.focus());
  };

  const openEditModal = (event) => {
    // 关闭菜单
    activeMenu.value = null;

    // 编辑现有条目
    modalTitle.value = "编辑事件";
    activeEventData.value = { ...event };

    // 表单填充（保留已有补零）
    eventForm.value = {
      year: String(event.year),
      month: String(event.month),
      day: String(event.day),
      hour: event.hour,
      minute: event.minute,
      second: event.second,
      name: event.name,
    };

    // 激活模态仲裁会话
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

    // 打开并聚焦
    isModalOpen.value = true;
    nextTick(() => formRefs.year.value?.focus());
  };

  // 列表行菜单 toggle（仅为兼容导出；当前组件层有独立的仲裁实现，通常不直接使用此方法）
  const toggleMenu = (eventId) => {
    const key = `menu:custom:${eventId}`; // 为每行菜单分配唯一会话键
    if (isActive(key)) {
      // 已激活 → 点击视为 toggle 关闭
      closeActive("toggle");
      return;
    }
    // 激活当前行菜单，会自动取代其它菜单/左滑/拖拽等会话
    activate({
      key,
      closers: { esc: true, outside: true }, // 允许 ESC 与外点击关闭
      onPreempt: () => {
        if (activeMenu.value === eventId) activeMenu.value = null;
      },
      onRelease: () => {
        if (activeMenu.value === eventId) activeMenu.value = null;
      },
      // 作用域：菜单触发容器 + 面板，由组件层通过 setMenuRef 提供
      getRootEl: () => {
        const r = menuRefs[eventId] || {};
        return [r.container, r.panel].filter(Boolean);
      },
    });
    // UI 打开
    activeMenu.value = eventId;
  };

  // 菜单中的“删除”操作（立即确认方式；如需两步确认，可改为 openDeleteConfirm + deleteEvent）
  const handleMenuDelete = (id) => {
    activeMenu.value = null; // 收起菜单
    if (confirm("确定要删除这个事件吗？")) deleteEvent(id); // 简单浏览器确认
  };

  // 更新行单位（自动校正非法小数方案）
  const updateEventUnit = (id, unit) => {
    const ev = events.value.find((e) => e.id === id);
    if (ev) {
      ev.unit = unit;
      if (ev.decimalPrecision === "combo") ev.decimalPrecision = 0;
      if (
        unit === "seconds" &&
        ev.decimalPrecision !== "combo" &&
        ev.decimalPrecision > 0
      ) {
        ev.decimalPrecision = 0;
      }
      if (unit === "minutes" && ev.decimalPrecision === 2) {
        ev.decimalPrecision = 1;
      }
      saveEvents();
    }
    activeMenu.value = null; // 收起菜单
  };

  // 更新行精度
  const updateEventPrecision = (id, precision) => {
    const ev = events.value.find((e) => e.id === id);
    if (ev) {
      ev.decimalPrecision = precision;
      saveEvents();
    }
    activeMenu.value = null; // 收起菜单
  };

  // 循环切换排序模式
  const cycleSortOrder = () => {
    const map = { manual: "asc", asc: "desc", desc: "manual" };
    sortOrder.value = map[sortOrder.value];
    if (sortOrder.value === "manual") loadEvents(); // 回到手动时，恢复存储顺序
  };

  // ========== 悬浮提示（桌面端） ==========
  let docMouseMoveHandler = null; // 全局 mousemove 句柄

  function handleEventMouseEnter(id) {
    if (window.innerWidth <= 800) return; // 移动端不启用悬浮提示

    // 清理与其他行的二次确认互斥
    if (pendingCopyId.value && pendingCopyId.value !== id)
      pendingCopyId.value = null;
    if (pendingDeleteId.value && pendingDeleteId.value !== id)
      pendingDeleteId.value = null;

    // 标记当前悬浮
    hoveredEventId.value = id;

    // 启动全局 mousemove，保证提示跟随
    if (!docMouseMoveHandler) {
      docMouseMoveHandler = (e) => {
        mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 }; // 轻微偏移不遮挡指针
      };
      document.addEventListener("mousemove", docMouseMoveHandler, {
        passive: true,
      });
    }

    // 延时出现 + 自动隐藏
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

    // 清理悬浮态
    hoveredEventId.value = null;
    showOperationHint.value = false;

    // 停止全局追踪
    if (docMouseMoveHandler) {
      document.removeEventListener("mousemove", docMouseMoveHandler);
      docMouseMoveHandler = null;
    }

    // 清理计时器与二次确认
    if (operationHintTimer) clearTimeout(operationHintTimer);
    if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
    pendingCopyId.value = null;
    pendingDeleteId.value = null;
  }

  function handleEventMouseMove(e) {
    if (window.innerWidth <= 800) return;
    // 行内跟随（更及时）
    mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 };
  }

  // ========== 二步确认（复制/删除）接入仲裁器 ==========
  let confirmTimers = { copy: null, delete: null }; // 自动撤销计时器

  function openCopyConfirm(id) {
    // 清理另一类确认
    if (pendingDeleteId.value && pendingDeleteId.value !== id) {
      pendingDeleteId.value = null;
      if (confirmTimers.delete) {
        clearTimeout(confirmTimers.delete);
        confirmTimers.delete = null;
      }
    }

    // 设置当前确认态
    pendingCopyId.value = id;

    // 激活确认会话（ESC/外点击关闭）
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

    // 3 秒自动撤销
    if (confirmTimers.copy) clearTimeout(confirmTimers.copy);
    confirmTimers.copy = setTimeout(() => {
      if (isActive(key)) closeActive("timeout");
    }, 3000);
  }

  function openDeleteConfirm(id) {
    // 清理另一类确认
    if (pendingCopyId.value && pendingCopyId.value !== id) {
      pendingCopyId.value = null;
      if (confirmTimers.copy) {
        clearTimeout(confirmTimers.copy);
        confirmTimers.copy = null;
      }
    }

    // 设置当前确认态
    pendingDeleteId.value = id;

    // 激活确认会话（ESC/外点击关闭）
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

    // 3 秒自动撤销
    if (confirmTimers.delete) clearTimeout(confirmTimers.delete);
    confirmTimers.delete = setTimeout(() => {
      if (isActive(key)) closeActive("timeout");
    }, 3000);
  }

  // ========== 表单交互（输入修正/键盘导航/滚轮增减） ==========
  const formInteractionHandler = {
    onInput(event, field) {
      let value = event.target.value;
      const config = fieldConfig[field];

      // 年份允许负号，其余仅数字
      if (field === "year") {
        value = value.replace(/[^0-9-]/g, "");
        if (value.lastIndexOf("-") > 0) {
          value = value.replace(/-/g, (m, off) => (off === 0 ? m : ""));
        }
      } else if (field !== "name") {
        value = value.replace(/\D/g, "");
      }

      // 最大长度截断
      if (config.maxLength && value.length > config.maxLength)
        value = value.slice(0, config.maxLength);

      // 写回
      eventForm.value[field] = value;

      // 自动跳到下一个字段（数字字段达到长度）
      if (field !== "name" && value.length >= config.maxLength) {
        const idx = fieldOrder.indexOf(field);
        const nextField = fieldOrder[idx + 1];
        if (nextField) formRefs[nextField].value?.focus();
      }
    },

    onKeydown(event, field) {
      const { key, ctrlKey, metaKey, shiftKey, target } = event;
      const config = fieldConfig[field];

      // 导航到前/后字段
      const navigate = (dir) => {
        event.preventDefault();
        const idx = fieldOrder.indexOf(field);
        const nextIndex = (idx + dir + fieldOrder.length) % fieldOrder.length;
        const nextKey = fieldOrder[nextIndex];
        formRefs[nextKey].value?.focus();
      };

      // 数字字段值增减（环绕）
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
            saveEvent(); // Ctrl/Cmd+Enter 强制保存
          } else if (field === "name") {
            event.preventDefault();
            saveEvent(); // 名称字段 Enter 直接保存
          } else {
            navigate(1); // 其它字段 Enter 导航到下一个
          }
          break;
        case "Tab":
          navigate(shiftKey ? -1 : 1); // Tab 在字段间切换
          break;
        case "ArrowLeft":
          if (
            ctrlKey ||
            (target.selectionStart === 0 && target.selectionEnd === 0)
          )
            navigate(-1); // 光标在头或按住Ctrl，向左切换字段
          break;
        case "ArrowRight":
          if (ctrlKey || target.selectionStart === target.value.length)
            navigate(1); // 光标在尾或按住Ctrl，向右切换字段
          break;
        case "ArrowUp":
          adjustValue(1); // ↑ 数值+1（环绕）
          break;
        case "ArrowDown":
          adjustValue(-1); // ↓ 数值-1（环绕）
          break;
        case "Escape":
        case "Esc":
          event.preventDefault();
          event.stopPropagation();
          eventForm.value[field] = valueBeforeFocus.value; // ESC 恢复焦点前值
          target.blur(); // 取消焦点
          break;
        default:
          // 非数字按键阻止输入（保留必要控制键）
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
            // 年字段允许首位负号
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
      // 记录原值
      valueBeforeFocus.value = eventForm.value[field];

      // 非 name 空值时，自动预填当前日期对应值，提升可用性
      if (!eventForm.value[field] && field !== "name") {
        const cur = DateTime.now();
        const v = cur[field];
        eventForm.value[field] =
          field === "year" ? String(v) : String(v).padStart(2, "0");
      }

      // 选中全部文本
      nextTick(() => event.target.select());
    },

    onBlur(field) {
      if (field === "name" || !eventForm.value[field]) return;
      let v = eventForm.value[field];

      // 年字段特例：孤立“-”或“-0”视为无输入
      if (field === "year" && (v === "-" || v === "-0")) {
        eventForm.value[field] = "";
        return;
      }

      // 数字字段单位补零
      if (field !== "year" && v.length === 1) v = "0" + v;

      // 归一化并夹取范围
      let num = Number(v);
      const { min, max } = fieldConfig[field];
      const maxv = typeof max === "function" ? max() : max;
      if (num < min) num = min;
      if (num > maxv) num = maxv;

      // 写回（年不补零，其余补两位）
      const fin = field === "year" ? String(num) : String(num).padStart(2, "0");
      if (fin !== eventForm.value[field]) eventForm.value[field] = fin;
    },
  };

  // ========== 悬浮快捷键（编辑/复制/删除） ==========
  const handleContextualKeydown = (e) => {
    if (isModalOpen.value) return; // 模态打开时不响应悬浮快捷键

    const id = hoveredEventId.value; // 当前悬浮条目
    if (!id) return;

    const ev = events.value.find((x) => x.id === id);
    if (!ev) return;

    const k = e.key;

    // 空格 或 / → 编辑
    if (k === " " || k === "/") {
      e.preventDefault();
      openEditModal(ev);
      return;
    }

    // Insert 或 + → 复制（二次确认）
    if (k === "Insert" || k === "+") {
      e.preventDefault();
      const key = `confirm:copy:${id}`;
      if (isActive(key)) {
        // 已在确认态 → 第二次触发执行复制
        closeActive("confirm");
        copyEvent(ev);
      } else {
        openCopyConfirm(id);
      }
      return;
    }

    // Delete 或 - → 删除（二次确认）
    if (k === "Delete" || k === "-") {
      e.preventDefault();
      const key = `confirm:delete:${id}`;
      if (isActive(key)) {
        // 已在确认态 → 第二次触发执行删除
        deleteEvent(id);
        closeActive("confirm");
      } else {
        openDeleteConfirm(id);
      }
      return;
    }
  };

  // ============ 拖拽初始化（三条横线按钮，把手：.menu-trigger-btn）【接入仲裁器】 ============
  const initializeSortable = (element) => {
    if (sortableInstance) sortableInstance.destroy();

    // 新增：抽取“开启拖拽会话”的幂等方法，供 onChoose/onStart 共用
    const beginDragSession = () => {
      // 触发仲裁会话：后触发即取代，确保菜单/左滑在 onPreempt 中被立即收起
      activate({
        key: "drag:custom-list",
        closers: { esc: true, outside: true },
        onPreempt: () => {
          // 会话被取代时：尽可能禁用拖拽并清理本组件的临时状态
          try {
            if (sortableInstance?.option) {
              sortableInstance.option("disabled", true);
            }
          } catch {}
          activeMenu.value = null;
          pendingCopyId.value = null;
          pendingDeleteId.value = null;
        },
        onRelease: () => {
          // 拖拽结束或会话关闭：恢复拖拽可用
          try {
            if (sortableInstance?.option) {
              sortableInstance.option("disabled", false);
            }
          } catch {}
        },
      });
    };

    sortableInstance = Sortable.create(element, {
      draggable: ".event-container",   // 每行可拖拽
      handle: ".menu-trigger-btn",     // 三条横线作为拖拽手柄（入口消歧：手柄不参与左滑）
      delayOnTouchOnly: false,
      delay: 300,                      // 长按 0.3s 进入拖拽（短按为点击）
      forceFallback: true,
      fallbackOnBody: true,
      fallbackTolerance: 3,
      animation: 220,
      ghostClass: "drag-ghost",
      chosenClass: "sortable-chosen",
      scroll: true,

      // 新增：一旦“被选中”（长按成立时刻）立即开启会话 → 立刻互斥关闭菜单/左滑
      onChoose: () => {
        beginDragSession();            // 幂等：若已是当前会话，会被 refresh
      },

      // 新增收尾：覆盖“长按选中但未触发有效拖拽，直接原地松手”的场景
      onUnchoose: () => {
        if (isActive("drag:custom-list")) {
          closeActive("drag-unchoose");
        }
      },

      // 保留：有些端/场景只在产生位移时才触发 onStart，兜底再激活一次（幂等）
      onStart: () => {
        beginDragSession();            // 与 onChoose 相同逻辑，确保一致
      },

      onEnd: (evt) => {
        if (
          evt.oldIndex == null ||
          evt.newIndex == null ||
          evt.oldIndex === evt.newIndex
        ) {
          // 无位置变更也要释放拖拽会话
          if (isActive("drag:custom-list")) {
            closeActive("drag-end");
          }
          return;
        }

        // 有位置变更：保存并释放会话
        sortOrder.value = "manual";
        const moved = events.value.splice(evt.oldIndex, 1)[0];
        events.value.splice(evt.newIndex, 0, moved);
        saveEvents();

        if (isActive("drag:custom-list")) {
          closeActive("drag-end");
        }
      },

      onCancel: () => {
        if (isActive("drag:custom-list")) {
          closeActive("drag-cancel");
        }
      },
    });
  };

  // ========== 生命周期 ==========
  onMounted(() => {
    loadEvents(); // 初始化数据
    document.addEventListener("keydown", handleContextualKeydown); // 注册悬浮快捷键
  });

  onUnmounted(() => {
    // 解除悬浮快捷键
    document.removeEventListener("keydown", handleContextualKeydown);

    // 解除全局 mousemove（若仍在）
    if (docMouseMoveHandler) {
      document.removeEventListener("mousemove", docMouseMoveHandler);
      docMouseMoveHandler = null;
    }

    // 清理二次确认的超时器
    if (confirmTimers.copy) clearTimeout(confirmTimers.copy);
    if (confirmTimers.delete) clearTimeout(confirmTimers.delete);

    // 销毁拖拽实例
    if (sortableInstance) sortableInstance.destroy();
  });

  // ========== 导出接口 ==========
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

    // 菜单切换（备用：组件已自行实现仲裁版菜单开关，此导出仅做兼容）
    toggleMenu,

    // 菜单方向与引用（组件测算方向后回写、并提供根元素供外点判定）
    isMenuUpward,
    setMenuRef,

    // 拖拽初始化（组件 onMounted / 数据变动后调用）
    initializeSortable,
  };
}
