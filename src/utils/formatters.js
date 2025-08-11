// E:\AppProject\VisualTime\src\utils\formatters.js (最终版 - 全局单位标准化)

/**
 * =================================================================
 * Formatters - 数据格式化工具集
 * =================================================================
 */

/**
 * 将 Luxon Duration 对象格式化为指定单位的字符串。
 * @param {import('luxon').Duration} duration - Luxon Duration 对象。
 * @param {string} unit - 目标单位 (复数形式, e.g., 'years', 'days')。
 * @param {number} decimalPrecision - 小数点精度。
 * @returns {string} 格式化后的数值字符串。
 */
export function formatDurationAs(duration, unit, decimalPrecision = 0) {
  if (!duration || !duration.isValid) return "0";
  const value = duration.as(unit);
  return value.toFixed(decimalPrecision);
}

/**
 * 将 Luxon Duration 对象格式化为 "X年 Y月 Z天..." 的组合字符串。
 * @param {import('luxon').Duration} duration - Luxon Duration 对象。
 * @param {boolean} isPast - 是否是过去的时间。
 * @returns {string} 拼接好的HTML字符串。
 */
export function formatDurationCombo(duration, isPast = false) {
  if (!duration || !duration.isValid) return "计算中...";

  const prefix = isPast ? "已过 " : "还有 ";

  // ========================================================================
  // [核心修改] 适应新的Duration对象结构
  // ------------------------------------------------------------------------
  // [旧代码]
  // const parts = duration
  //  .shiftTo("years", "months", "days", "hours", "minutes", "seconds")
  //  .toObject();
  // [说明] 旧代码中，duration是一个总毫秒数，需要用.shiftTo()来将其智能分解为年月日等单位。

  // [新代码]
  // 由于countdownEngine现在直接返回一个已经按日历单位分解好的Duration对象，
  // 我们不再需要.shiftTo()进行转换，可以直接将其转换为普通对象。
  const parts = duration.toObject();
  // ========================================================================

  const timeUnits = [
    { num: parts.years, unit: "年" },
    { num: parts.months, unit: "个月" },
    { num: parts.days, unit: "天" },
    { num: parts.hours, unit: "小时" },
    { num: parts.minutes, unit: "分" },
    { num: Math.floor(parts.seconds || 0), unit: "秒" },
  ];

  // [说明] 后续的显示逻辑完全保持不变，因为`parts`对象的结构是一致的。
  let outArr = [];
  let firstNonZeroFound = false;

  for (const item of timeUnits) {
    if (item.num > 0) {
      firstNonZeroFound = true;
      outArr.push(` <span class="combo-num">${item.num}</span> ${item.unit}`);
    } else if (firstNonZeroFound) {
      outArr.push(" 零");
    }
  }

  if (outArr.length > 0) {
    let lastNonZeroIndex = -1;
    for (let i = outArr.length - 1; i >= 0; i--) {
      if (outArr[i] !== " 零") {
        lastNonZeroIndex = i;
        break;
      }
    }
    if (lastNonZeroIndex > -1 && lastNonZeroIndex < outArr.length - 1) {
      const coreParts = outArr.slice(0, lastNonZeroIndex + 1);
      outArr = [...coreParts, " 整"];
    }
  }

  if (outArr.length === 0) {
    return `${prefix}<strong class="combo-num">0</strong>秒`;
  }

  return (
    prefix +
    outArr
      .join("")
      .trim()
      .replace(/ (零 )+/g, " 零 ")
  );
}

/**
 * [核心修改] 获取指定单位的中文标签。键名已全部标准化为复数。
 * @param {string} unit - 单位 (复数形式, e.g., 'years', 'days')。
 * @returns {string} 中文标签。
 */
export function getUnitLabel(unit) {
  const labels = {
    years: "年",
    quarters: "季",
    months: "月",
    weeks: "周",
    days: "天",
    hours: "小时",
    minutes: "分钟",
    seconds: "秒",
  };
  return labels[unit] || "";
}

/**
 * 将 Luxon Duration 对象格式化为包含时、分、秒、毫秒的对象。
 * @param {import('luxon').Duration} duration - Luxon Duration 对象。
 * @returns {{hours: string, minutes: string, seconds: string, milliseconds: string}}
 */
export function formatDurationAsTimeObject(duration) {
  if (!duration || !duration.isValid) {
    return { hours: "00", minutes: "00", seconds: "00", milliseconds: "000" };
  }
  const parts = duration
    .shiftTo("hours", "minutes", "seconds", "milliseconds")
    .toObject();
  return {
    hours: String(Math.floor(parts.hours || 0)).padStart(2, "0"),
    minutes: String(Math.floor(parts.minutes || 0)).padStart(2, "0"),
    seconds: String(Math.floor(parts.seconds || 0)).padStart(2, "0"),
    milliseconds: String(Math.floor(parts.milliseconds || 0)).padStart(3, "0"),
  };
}
