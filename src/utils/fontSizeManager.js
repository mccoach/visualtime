// ========== E:\AppProject\VisualTime\src\utils\fontSizeManager.js ==========

/**
 * =================================================================================
 * VisualTime 字号及布局自适应管理器 (Font & Layout Manager) v9.2 - Smart Sizing Engine
 * ---------------------------------------------------------------------------------
 * 架构核心：智能盒模型驱动的有效宽度缩放 (Smart Box-Sizing Driven Scaling)
 *
 * 【设计原则】 (最终版)
 * 1.  **关注点分离 (Separation of Concerns)**：CSS完全负责布局，包括内边距(padding)和盒模型(box-sizing)。JS的职责仅限于在内容将要溢出时，对内容本身进行缩放。
 * 2.  **智能有效宽度计算 (Smart Effective Width Calculation)**：算法能自动识别容器的 `box-sizing` 模式，并据此精确计算出真正的“有效宽度”（纯内容区域宽度），作为缩放的唯一基准。
 * 3.  **内容整体缩放 (Content Holistic Scaling)**：将内容相关的CSS属性（如fontSize, letterSpacing等）视为一个整体，在超出有效宽度时进行等比例缩放。
 * 4.  **尊重CSS意图 (Respect for CSS Intent)**：完全尊重并依赖CSS定义的布局框架，代码更直观、健壮。
 * 5.  **高性能与响应式 (High Performance & Responsive)**：结合 `ResizeObserver` 和防抖（debounce）技术，高效地监听容器尺寸变化，并仅在必要时执行重算，确保流畅的响应式体验。
 * =================================================================================
 */

// 缓存元素的原始布局属性，WeakMap可以防止内存泄漏
const originalStylesCache = new WeakMap();

// 定义需要被等比例缩放的CSS属性列表
export const SCALABLE_PROPERTIES = [
  'fontSize',
  'width',
  'height',
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  'letterSpacing',
  'wordSpacing'
];

/**
 * (内部工具) 读取并缓存一个元素的原始布局样式。
 * 如果缓存中已存在，则直接返回；否则，进行计算并存入缓存。
 * @param {HTMLElement} element - 需要读取样式的DOM元素。
 * @returns {Object} - 包含所有需缩放属性的原始像素值的对象。
 */
function getOrCacheOriginalStyles(element) {
  if (originalStylesCache.has(element)) {
    return originalStylesCache.get(element);
  }

  const style = window.getComputedStyle(element);
  const original = {};
  
  SCALABLE_PROPERTIES.forEach(prop => {
    original[prop] = parseFloat(style[prop]) || 0;
  });

  original.totalWidth = element.scrollWidth + original.marginLeft + original.marginRight;

  originalStylesCache.set(element, original);
  return original;
}

/**
 * (核心算法 v9.2) 基于智能计算的有效宽度，对一组元素进行整体等比例缩放。
 *
 * @param {Object} options - 配置对象。
 * @param {HTMLElement} options.container - 作为宽度基准的容器元素。
 * @param {NodeListOf<HTMLElement> | HTMLElement[]} options.elements - 需要一起进行缩放的元素集合。
 * @param {number} options.minSize - 允许的最小字体大小（像素）。
 * @returns {Object} - 返回包含详细适配信息的对象。
 */
export function scaleElementsProportionally(options) {
  const { container, elements, minSize } = options;

  if (!container || !elements || elements.length === 0 || typeof minSize !== 'number') {
    return { success: false, error: '缺少必要参数 (container, elements, minSize)' };
  }

  let originalTotalWidth = 0;
  let minOriginalFontSize = Infinity;
  
  const elementMetas = Array.from(elements).map(el => {
    const original = getOrCacheOriginalStyles(el);
    originalTotalWidth += original.totalWidth;
    if (original.fontSize < minOriginalFontSize) {
      minOriginalFontSize = original.fontSize;
    }
    return { element: el, original };
  });

  if (minOriginalFontSize === Infinity) minOriginalFontSize = minSize;

  // 智能计算有效宽度
  const containerStyle = window.getComputedStyle(container);
  const width = parseFloat(containerStyle.width);
  const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
  let effectiveWidth;

  if (containerStyle.boxSizing === 'border-box') {
    effectiveWidth = width - paddingLeft - paddingRight;
  } else {
    effectiveWidth = width;
  }
  
  let scaleRatio = 1.0;

  if (originalTotalWidth > effectiveWidth) {
    scaleRatio = effectiveWidth / originalTotalWidth;
  }

  const finalMinElementSize = minOriginalFontSize * scaleRatio;
  if (finalMinElementSize < minSize) {
    scaleRatio = minSize / minOriginalFontSize;
  }
  
  // ========== DEBUG START: 实时监控关键数据 ==========
  // 您可以随时用 /* ... */ 将此代码块注释掉来禁用监控
  /*
  console.groupCollapsed(`[FontAdapter Debug] - 舞台: .${container.className}`);
    console.log("--- 1. 有效宽度计算 ---");
    console.log("盒模型 (box-sizing):", containerStyle.boxSizing);
    console.log("计算样式 width (数值):", width);
    console.log("计算样式 padding (数值):", `${paddingLeft} (左) + ${paddingRight} (右)`);
    if (containerStyle.boxSizing === 'border-box') {
      console.log("计算公式: width - paddingLeft - paddingRight");
    } else {
      console.log("计算公式: width");
    }
    console.log("%c=> 有效宽度 (Effective Width):", "color: #33ccff; font-weight: bold;", effectiveWidth);

    console.log("--- 2. 内容宽度计算 ---");
    console.log("%c=> 内容宽度 (Content Width):", "color: #ff9900; font-weight: bold;", originalTotalWidth);

    console.log("--- 3. 缩放决策 ---");
    console.log("条件 (内容 > 有效):", `${originalTotalWidth.toFixed(2)} > ${effectiveWidth.toFixed(2)}`, "=>", originalTotalWidth > effectiveWidth);
    console.log("%c=> 缩放比例 (Scale Ratio):", "color: #4caf50; font-weight: bold;", scaleRatio.toFixed(4));
  console.groupEnd();
  */
  // ========== DEBUG END ==========

  elementMetas.forEach(meta => {
    const { element, original } = meta;
    SCALABLE_PROPERTIES.forEach(prop => {
      element.style[prop] = `${original[prop] * scaleRatio}px`;
    });
  });

  return {
    success: true,
    scaleRatio,
    containerEffectiveWidth: effectiveWidth,
    originalTotalWidth,
    finalTotalWidth: originalTotalWidth * scaleRatio
  };
}


/**
 * (原子工具) 创建一个带防抖功能的函数。
 * @param {Function} func - 需要防抖的函数。
 * @param {number} delay - 延迟时间（ms）。
 * @returns {Function} - 防抖处理后的新函数。
 */
function createDebouncedAdjuster(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * (v9.2 响应式适配器) 创建一个当容器尺寸变化时自动进行等比例缩放的适配器。
 * 
 * @param {Object} options - 与 scaleElementsProportionally 相同的配置，外加防抖延迟。
 * @param {number} [options.debounceDelay=50] - 尺寸变化时的防抖延迟（ms）。
 * @returns {Object} - 一个包含 refresh 和 destroy 方法的控制器对象。
 */
export function createResponsiveFontAdapter(options) {
  const { container, debounceDelay = 50 } = options;
  let observer = null;
  let lastResult = null;

  const performAdaptation = () => {
    lastResult = scaleElementsProportionally(options);
    return lastResult;
  };
  
  performAdaptation();
  
  if (container && typeof window !== 'undefined' && window.ResizeObserver) {
    const debouncedCallback = createDebouncedAdjuster(performAdaptation, debounceDelay);
    observer = new ResizeObserver(debouncedCallback);
    observer.observe(container);
  }
  
  return {
    get result() { return lastResult; },
    refresh: performAdaptation,
    destroy() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (options.elements) {
        Array.from(options.elements).forEach(el => {
            SCALABLE_PROPERTIES.forEach(prop => {
                if (el.style[prop]) {
                    el.style[prop] = '';
                }
            });
            originalStylesCache.delete(el);
        });
      }
    }
  };
}

// 导出版本信息
export const VERSION = '9.2.0';
export const ALGORITHM = {
  name: 'Smart Box-Sizing Driven Scaling',
  description: '智能盒模型驱动的有效宽度缩放',
  features: [
    '自动识别box-sizing，精确计算有效宽度',
    'CSS完全负责布局(含padding)，JS只负责内容缩放',
    '以纯内容区宽度(有效宽度)为缩放基准',
    '高性能，响应式，尊重并兼容所有CSS单位'
  ]
};
