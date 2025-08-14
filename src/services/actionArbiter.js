// E:\AppProject\VisualTime\src\services\actionArbiter.js
// 说明：统一仲裁器（actionArbiter）——全局唯一的交互互斥机制
// 本版为“纯仲裁架构”，无开关、无灰度分支，所有互斥会话一律通过它来调度。
// 会话典型场景：下拉菜单、模态框、列表左滑、二步确认、拖拽会话等。

// 当前激活的会话对象，结构为：{ key, closers, onPreempt, onRelease, scopeProvider }
let current = null; // 初始无会话

// 标识全局拦截路由（ESC/Outside Click）是否已安装
let installed = false; // 仅安装一次，避免重复绑定事件

// 一个简单的调试开关：在 localStorage 中设置 arbiter_debug=1 即可输出调试日志
const dbg = () =>
  typeof localStorage !== "undefined" && // 运行环境存在 localStorage
  localStorage.getItem("arbiter_debug") === "1"; // 只有值为字符串 '1' 才视为开启

// 判断给定 key 是否为当前激活会话
export function isActive(key) {
  // 当且仅当 current 存在且 key 相同，返回 true
  return !!(current && current.key === key);
}

// 激活一个新的会话；若有旧会话则“后触发即取代”旧会话
export function activate(opts) {
  // 确保全局事件桥（ESC/Outside）已安装
  ensureInstalled();

  // 解构传入参数，提供合理默认值
  const {
    key, // 必填：唯一键（用于互斥与判断）
    closers = { esc: true, outside: true }, // 关闭路由（ESC键、外点击）
    onPreempt, // 当被取代或关闭前回调（执行UI收尾）
    onRelease, // 当完全释放后回调（幂等收尾）
    getRootEl, // 函数：返回内部作用域DOM或DOM数组（用于外点击判定）
    scope, // 也支持直接传 scope（DOM/DOM数组/函数），与 getRootEl 二选一
  } = opts || {}; // 容错：若未传opts则使用空对象

  // 归一化“作用域提供者”：统一返回 DOM 数组
  const scopeProvider = normalizeScopeProvider(scope, getRootEl);

  // 若 key 与当前会话相同 → 刷新配置（允许更新 closers/作用域等）
  if (current && current.key === key) {
    current = { key, closers, onPreempt, onRelease, scopeProvider }; // 直接覆盖
    dbg() && console.log("[arbiter] refresh", key); // 调试日志
    return; // 返回，不触发开闭
  }

  // 存在旧会话时，先通知旧会话做“收尾”（onPreempt）
  if (current && current.onPreempt) {
    try {
      current.onPreempt(); // 调用旧 onPreempt
    } catch (e) {
      console.warn("[arbiter] onPreempt error:", e); // 防守式日志
    }
  }

  // 切换为新会话
  current = { key, closers, onPreempt, onRelease, scopeProvider }; // 设置当前会话
  dbg() && console.log("[arbiter] activate", key); // 调试日志
}

// 主动关闭当前会话；可传入 reason 仅用于日志
export function closeActive(reason = "close") {
  if (!current) return; // 无会话则直接返回

  // 保存一份当前会话引用用于回调
  const prev = current;
  // 清空当前会话（先置空，确保回调期间全局已视为“无会话”）
  current = null;

  // 调试日志
  dbg() && console.log("[arbiter] close", reason, "->", prev.key);

  // 调用 onPreempt（关闭前）
  try {
    prev.onPreempt && prev.onPreempt();
  } catch (e) {
    console.warn("[arbiter] onPreempt error:", e);
  }
  // 调用 onRelease（关闭后）
  try {
    prev.onRelease && prev.onRelease();
  } catch (e) {
    console.warn("[arbiter] onRelease error:", e);
  }
}

/* ---------------- 内部工具：作用域与外点击判定 ---------------- */

// 归一化“作用域提供者”：优先使用 scope（可为函数/DOM/DOM数组），其次 getRootEl（函数）
function normalizeScopeProvider(scope, getRootEl) {
  // 若 scope 是函数，包装为“每次调用都取新数组”的提供者
  if (typeof scope === "function") {
    return () => toArray(scope()); // 转为数组
  }
  // 若直接传了 scope（DOM/数组）
  if (scope) {
    const arr = toArray(scope); // 归一化为数组
    return () => arr.filter(Boolean); // 返回过滤空值
  }
  // 若提供了 getRootEl 函数
  if (typeof getRootEl === "function") {
    return () => toArray(getRootEl()); // 同样归一化为数组
  }
  // 默认返回空数组（表示“无内部作用域”，任何点击都视为外部）
  return () => [];
}

// 工具：将传入值统一转换为数组（过滤假值）
function toArray(v) {
  if (!v) return []; // 空/假值 -> 空数组
  if (Array.isArray(v)) return v.filter(Boolean); // 数组 -> 过滤空
  return [v]; // 单个DOM -> 数组
}

// 后备 contains 判定（无 composedPath 时使用）：判断事件目标是否在任一作用域节点内
function isInScopeFallback(target, nodes) {
  if (!target || !nodes || nodes.length === 0) return false; // 参数校验
  let el = target; // 从目标元素开始向上回溯
  while (el) {
    for (const node of nodes) {
      if (node && node.contains && node.contains(el)) return true; // 命中内部
    }
    el = el.parentElement; // 向上
  }
  return false; // 未命中即为外部
}

// 使用事件的 composedPath 更稳健地判断事件是否在作用域内
function isEventInScope(e, nodes) {
  if (!nodes || nodes.length === 0) return false; // 无作用域则恒为外部
  const t = e.target; // 事件目标
  if (!t) return false; // 无目标，判外部

  // 现代浏览器：优先使用 composedPath（支持 Shadow DOM/Teleport 等）
  const path = typeof e.composedPath === "function" ? e.composedPath() : null;
  if (path && path.length) {
    for (const n of nodes) {
      if (n && path.includes(n)) return true; // 命中内部
    }
    return false; // 不在路径中 -> 外部
  }

  // 回退：使用 DOM contains 链判定
  return isInScopeFallback(t, nodes);
}

/* ---------------- 全局事件路由（一次安装） ---------------- */

function ensureInstalled() {
  if (installed) return; // 已安装则直接返回

  // 1) ESC 键关闭：捕获阶段监听，优先于组件自身
  document.addEventListener(
    "keydown", // 键盘按下
    (e) => {
      // 仅当存在会话且该会话允许 esc 关闭时处理
      if (!current || !current.closers || !current.closers.esc) return;
      if (e.key === "Escape") {
        // ESC 键按下
        dbg() && console.log("[arbiter] esc -> close"); // 调试日志
        closeActive("esc"); // 统一关闭
      }
    },
    true // 捕获阶段
  );

  // 2) 外点击关闭：使用捕获阶段的 click 事件
  // 选择 click 而非 pointerdown/mousedown 可以自然避免触屏“滚动导致误触发”的问题（滚动通常不产生 click）
  document.addEventListener(
    "click", // 完整点击
    (e) => {
      // 仅当存在会话且该会话允许 outside 关闭时处理
      if (!current || !current.closers || !current.closers.outside) return;

      // 获取内部作用域节点集合
      const nodes = current.scopeProvider ? current.scopeProvider() : [];
      // 判定此次点击是否在作用域内部
      const inScope = isEventInScope(e, nodes);

      if (!inScope) {
        // 在作用域外部：关闭当前会话
        dbg() && console.log("[arbiter] outside click -> close", current.key);
        closeActive("outside");
      } else {
        // 在作用域内部：保持会话不变
        dbg() && console.log("[arbiter] click in scope -> keep");
      }
    },
    true // 捕获阶段
  );

  // 标记为已安装，避免重复绑定
  installed = true;
}

/* ---------------- 向外暴露的“桥接启动”API ---------------- */

// 供应用在启动时显式调用（可多次调用，内部幂等）
// 目的：让上层代码明确地表达“启用仲裁器全局路由”
export function startActionArbiterBridge() {
  try {
    ensureInstalled(); // 幂等安装
  } catch (e) {
    console.warn("[arbiter] start bridge failed:", e); // 防守式日志
  }
}
