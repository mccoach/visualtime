// ========== VisualTime\src\utils\fontSizeManager.js ==========

// 创建一个 canvas 2D 上下文的单例。
// 这样做可以避免在每次调用函数时都重新创建canvas，从而提高性能。
let canvasContext = null;

/**
 * 获取或创建一个用于文本测量的 Canvas 2D 上下文。
 * @returns {CanvasRenderingContext2D} - canvas 的 2D 渲染上下文。
 */
function getCanvasContext() {
  if (!canvasContext) { // 如果上下文不存在
    const canvas = document.createElement('canvas'); // 在内存中创建一个canvas元素
    canvasContext = canvas.getContext('2d'); // 获取其2D上下文并缓存
  }
  return canvasContext; // 返回缓存的上下文
}

/**
 * [新算法] 根据可用宽度动态计算最佳匹配的字体大小。
 * 该函数通过测量文本在基础字号下的宽度，然后按比例缩放来找到最合适的字号。
 * 
 * @param {string} text - 需要进行测量的文本内容。
 * @param {object} options - 包含字体大小计算规则的配置对象。
 * @param {number} options.containerWidth - 文本所在容器的可用像素宽度。
 * @param {number} options.baseSize - 理想状态下的基础字体大小（单位px）。
 * @param {number} options.minSize - 字体能被缩小的最小尺寸（单位px），防止字号过小。
 * @param {string} [options.fontFamily] - 字体家族，必须与CSS中使用的字体一致以保证测量准确。
 * @returns {number} - 计算后得出的最终字体大小（单位px）。
 */
export function getAdaptiveFontSize(text, { containerWidth, baseSize, minSize, fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }) {
  // 如果容器宽度无效或为0，直接返回最小字号以避免计算错误。
  if (!containerWidth || containerWidth <= 0) {
    return minSize;
  }
  
  const ctx = getCanvasContext(); // 获取共享的canvas上下文。
  
  // 设置上下文的字体样式，这对于精确测量至关重要。
  // 我们使用基础字号来测量，以此作为计算比例的基准。
  ctx.font = `${baseSize}px ${fontFamily}`;
  
  // 测量文本在基础字号下的实际渲染宽度。
  const textMetrics = ctx.measureText(text || '');
  const textWidth = textMetrics.width;

  // 如果文本在基础字号下的宽度没有超出容器宽度，那么基础字号就是最佳选择。
  if (textWidth <= containerWidth) {
    return baseSize;
  }

  // 如果文本超出了容器宽度，按比例计算一个新的、能刚好容纳下的字号。
  // 公式：新字号 = 基础字号 * (容器宽度 / 文本宽度)
  // 这样可以确保字体尽可能大地填满容器。
  const newSize = baseSize * (containerWidth / textWidth);

  // 返回计算出的新字号和设定的最小字号中的较大值。
  // 这确保了字体大小不会无限缩小，保证了最基本的可见性。
  return Math.max(minSize, newSize);
}
