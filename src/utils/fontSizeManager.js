// ========== E:\AppProject\VisualTime\src\utils\fontSizeManager.js ==========

/**
 * =================================================================================
 * VisualTime 字号及布局自适应管理器 (Font & Layout Manager) v9.4 - Toolkit Unified
 * ---------------------------------------------------------------------------------
 * 新增（可选工具，向后兼容）：
 * 1) getEffectiveWidth(el): number
 *    - 计算元素“有效宽度”（按 box-sizing 修正 padding）
 * 2) makeFontSchedulers(setupFn)
 *    - 返回 { scheduleImmediate, scheduleFrame }
 *    - scheduleImmediate: 内容变更场景，nextTick 内完成（避免跨帧抖动）
 *    - scheduleFrame: 结构/尺寸变更，requestAnimationFrame 合并
 * 3) observeContentWidth(el, callback, { threshold=0 })
 *    - 监听文本/子树变化，按 scrollWidth 改变判定，触发回调；返回 disconnect()
 * 4) ensureAdapterSlot(slot, { container, elements, options, forceRecreate })
 *    - 统一“刷新优先 / 绑定变化或内容宽度变化才重建”的逻辑封装
 *
 * 保留与扩展（仍向后兼容）：
 * - createResponsiveFontAdapter(options):
 *    observeContainerResize?: boolean = true   // 关闭内部容器RO（集中监听场景）
 *    effectiveWidthProvider?: () => number     // 外部供给有效宽度（集中测量场景）
 *
 * 注意：
 * - 所有函数声明采用 function 声明，避免TDZ
 * =================================================================================
 */

// 缓存元素的原始布局属性，WeakMap可以防止内存泄漏
const originalStylesCache = new WeakMap();

// 定义需要被等比例缩放的CSS属性列表
export const SCALABLE_PROPERTIES = [
  "fontSize",
  "width",
  "height",
  "marginLeft",
  "marginRight",
  "paddingLeft",
  "paddingRight",
  "letterSpacing",
  "wordSpacing",
];

/**
 * 计算元素“有效宽度”（按 box-sizing 修正 padding）
 * @param {HTMLElement} el
 * @returns {number}
 */
export function getEffectiveWidth(el) {
  if (!el) return 0;
  const cs = window.getComputedStyle(el);
  const w = parseFloat(cs.width) || 0;
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  return cs.boxSizing === "border-box" ? Math.max(0, w - pl - pr) : w;
}

/**
 * (内部) 读取并缓存一个元素的原始布局样式与原始内容宽度
 * @param {HTMLElement} element
 * @returns {{[prop:string]:number, totalWidth:number}}
 */
function getOrCacheOriginalStyles(element) {
  if (originalStylesCache.has(element)) {
    return originalStylesCache.get(element);
  }
  const style = window.getComputedStyle(element);
  const original = {};
  SCALABLE_PROPERTIES.forEach((prop) => {
    original[prop] = parseFloat(style[prop]) || 0;
  });
  original.totalWidth =
    element.scrollWidth + original.marginLeft + original.marginRight;
  originalStylesCache.set(element, original);
  return original;
}

/**
 * (核心算法) 基于智能计算的有效宽度，对一组元素进行整体等比例缩放
 * - 支持 effectiveWidthProvider 由外部供给有效宽度（集中测量场景）
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} options.elements
 * @param {number} options.minSize
 * @param {() => number} [options.effectiveWidthProvider]
 * @returns {{success:boolean, scaleRatio?:number, containerEffectiveWidth?:number, originalTotalWidth?:number, finalTotalWidth?:number, error?:string}}
 */
export function scaleElementsProportionally(options) {
  const { container, elements, minSize, effectiveWidthProvider } = options;

  if (
    !container ||
    !elements ||
    elements.length === 0 ||
    typeof minSize !== "number"
  ) {
    return {
      success: false,
      error: "缺少必要参数 (container, elements, minSize)",
    };
  }

  let originalTotalWidth = 0;
  let minOriginalFontSize = Infinity;

  const elementMetas = Array.from(elements).map((el) => {
    const original = getOrCacheOriginalStyles(el);
    originalTotalWidth += original.totalWidth;
    if (original.fontSize < minOriginalFontSize) {
      minOriginalFontSize = original.fontSize;
    }
    return { element: el, original };
  });

  if (minOriginalFontSize === Infinity) minOriginalFontSize = minSize;

  // 1) 优先使用外部供给的“有效宽度”
  let effectiveWidth;
  if (typeof effectiveWidthProvider === "function") {
    const provided = Number(effectiveWidthProvider());
    effectiveWidth = Number.isFinite(provided) ? provided : 0;
  }

  // 2) 如无外部供给，则按容器计算
  if (effectiveWidth == null || effectiveWidth <= 0) {
    effectiveWidth = getEffectiveWidth(container);
  }

  let scaleRatio = 1.0;
  if (originalTotalWidth > effectiveWidth && effectiveWidth > 0) {
    scaleRatio = effectiveWidth / originalTotalWidth;
  }

  const finalMinElementSize = minOriginalFontSize * scaleRatio;
  if (finalMinElementSize < minSize && minOriginalFontSize > 0) {
    scaleRatio = minSize / minOriginalFontSize;
  }

  elementMetas.forEach((meta) => {
    const { element, original } = meta;
    SCALABLE_PROPERTIES.forEach((prop) => {
      element.style[prop] = `${original[prop] * scaleRatio}px`;
    });
  });

  return {
    success: true,
    scaleRatio,
    containerEffectiveWidth: effectiveWidth,
    originalTotalWidth,
    finalTotalWidth: originalTotalWidth * scaleRatio,
  };
}

/**
 * (原子工具) 创建一个带防抖功能的函数
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
function createDebouncedAdjuster(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * (响应式适配器) 创建一个当容器尺寸变化时自动进行等比例缩放的适配器
 * - 新增 observeContainerResize / effectiveWidthProvider
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} options.elements
 * @param {number} options.minSize
 * @param {number} [options.debounceDelay=50]
 * @param {boolean} [options.observeContainerResize=true]
 * @param {() => number} [options.effectiveWidthProvider]
 * @returns {{result?:any, refresh:Function, destroy:Function}}
 */
export function createResponsiveFontAdapter(options) {
  const {
    container,
    debounceDelay = 50,
    observeContainerResize = true,
    effectiveWidthProvider,
  } = options;

  let observer = null;
  let lastResult = null;

  function performAdaptation() {
    lastResult = scaleElementsProportionally(options);
    return lastResult;
  }

  performAdaptation();

  if (
    container &&
    typeof window !== "undefined" &&
    window.ResizeObserver &&
    observeContainerResize
  ) {
    const debouncedCallback = createDebouncedAdjuster(
      performAdaptation,
      debounceDelay
    );
    observer = new ResizeObserver(debouncedCallback);
    observer.observe(container);
  }

  return {
    get result() {
      return lastResult;
    },
    refresh: performAdaptation,
    destroy() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (options.elements) {
        Array.from(options.elements).forEach((el) => {
          SCALABLE_PROPERTIES.forEach((prop) => {
            if (el.style[prop]) {
              el.style[prop] = "";
            }
          });
          originalStylesCache.delete(el);
        });
      }
    },
  };
}

/**
 * 调度器工厂：返回“立即（nextTick）/帧合并（rAF）”两个调度函数
 * - scheduleImmediate：内容变化使用，避免跨帧抖动
 * - scheduleFrame：结构变化使用，合并同一帧内多次刷新
 * @param {Function} setupFn 要调度的执行函数
 * @returns {{ scheduleImmediate: Function, scheduleFrame: Function }}
 */
export function makeFontSchedulers(setupFn) {
  function scheduleImmediate() {
    // 延迟到DOM更新微任务后，保证与本轮DOM变更同帧完成，避免先渲染后缩放的闪动
    Promise.resolve().then(() => {
      setupFn();
    });
  }
  let rafPending = false;
  function scheduleFrame() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      setupFn();
    });
  }
  return { scheduleImmediate, scheduleFrame };
}

/**
 * 监听“内容宽度（scrollWidth）变化”的工具
 * - 用于文本/子树变化频繁的场景（如组合精度）
 * - 返回 disconnect() 以便清理
 * @param {HTMLElement} el
 * @param {(changed:boolean, curWidth:number, prevWidth:number) => void} callback
 * @param {{threshold?:number}} [opts]
 * @returns {Function} disconnect
 */
export function observeContentWidth(el, callback, opts = {}) {
  if (!el || typeof MutationObserver === "undefined") {
    return () => {};
  }
  let last = el.scrollWidth || 0;
  const threshold = Number.isFinite(opts.threshold) ? opts.threshold : 0;

  const observer = new MutationObserver(() => {
    const cur = el.scrollWidth || 0;
    const changed = Math.abs(cur - last) > threshold;
    if (changed) {
      callback(true, cur, last);
      last = cur;
    } else {
      callback(false, cur, last);
    }
  });

  observer.observe(el, { childList: true, characterData: true, subtree: true });
  return () => {
    try {
      observer.disconnect();
    } catch {}
  };
}

/**
 * 统一保障“适配器槽位”的创建/刷新逻辑
 * - 刷新优先：仅当 forceRecreate 或 绑定目标变更 时重建
 * - 自动写回 slot.containerEl / slot.elements / slot.needsRecreate
 * @param {Object} slot 适配器槽位对象（外部持有）
 * @param {{
 *  container: HTMLElement,
 *  elements: HTMLElement[],
 *  options: Parameters<typeof createResponsiveFontAdapter>[0],
 *  forceRecreate?: boolean
 * }} cfg
 * @returns {Object} slot
 */
export function ensureAdapterSlot(slot, cfg) {
  const { container, elements, options, forceRecreate } = cfg;
  const targetChanged =
    slot.containerEl !== container ||
    !(slot.elements && slot.elements[0] === elements[0]);

  if (!slot.adapter || forceRecreate || targetChanged) {
    if (slot.adapter) slot.adapter.destroy();
    slot.adapter = createResponsiveFontAdapter(options);
    slot.containerEl = container;
    slot.elements = elements;
    slot.needsRecreate = false;
  } else {
    slot.adapter.refresh();
  }
  return slot;
}

// 版本/算法信息
export const VERSION = "9.4.0";
export const ALGORITHM = {
  name: "Smart Box-Sizing Driven Scaling",
  description:
    "智能盒模型驱动的有效宽度缩放（支持外部宽度供给/容器监听关闭/调度与观察工具）",
  features: [
    "自动识别box-sizing，精确计算有效宽度",
    "CSS负责布局，JS只负责内容缩放",
    "可外部供给有效宽度，集中监听父容器",
    "可关闭内部容器ResizeObserver",
    "内容宽度变化观察器（组合精度友好）",
    "双调度器：nextTick同步与rAF合并",
    "高性能，响应式，尊重CSS单位",
  ],
};
