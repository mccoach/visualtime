// E:\AppProject\VisualTime\src\services\countdownEngine.js (支持大年份版)

import { DateTime } from "luxon";
import { getEndOf, getStartOf } from "../utils/dateUtils";

/**
 * =================================================================
 * Countdown Engine - 倒计时业务计算引擎
 * =================================================================
 *
 * 职责:
 * 1. 提供一个统一的、核心的倒计时计算函数 `computeCountdown`。
 * 2. 消费一个基准时间戳，并根据指定的类型（年/季/月等）和配置进行计算。
 * 3. 返回包含原始数据（如 Luxon Duration 对象）和进度的结果对象。
 * 4. 它不关心UI展示、格式化或数据存储，只负责纯粹的业务计算。
 */

/**
 * 核心计算函数：根据类型和配置计算倒计时。
 * @param {object} options - 计算所需的所有参数。
 * @param {string} options.type - 倒计时类型: 'year', 'quarter', 'month', 'week', 'day', 或 'custom'。
 * @param {number} options.baseTime - 基准时间的Unix毫秒时间戳 (通常来自 clockService.now)。
 * @param {object} [options.config] - 额外配置。
 *   - 对于标准类型: { weekStart: 1 }。
 *   - 【核心修改】对于 'custom' 类型: { target: { year, month, day, hour, minute, second } }。
 * @returns {{duration: import('luxon').Duration, progress: number, isPast: boolean}|null} 计算结果对象，或在无效时返回null。
 */
export function computeCountdown({ type, baseTime, config = {} }) {
  try {
    const base = DateTime.fromMillis(baseTime);
    let start, end, target;
    let isPast = false;
    // [新增说明] duration变量现在将在if/else块内部被赋值
    let duration;

    if (type === "custom") {
      // [说明] 'custom' 类型的逻辑保持不变，用于确定目标时间点
      target = DateTime.fromObject({
        year: config.target.year,
        month: config.target.month,
        day: config.target.day,
        hour: config.target.hour || 0,
        minute: config.target.minute || 0,
        second: config.target.second || 0,
      });

      if (!target.isValid)
        throw new Error("Invalid target config for custom countdown");

      if (target < base) {
        isPast = true;
        [start, end] = [target, base];
      } else {
        [start, end] = [base, target];
      }

      // ========================================================================
      // [核心修改] 改变'custom'类型的倒计时计算方式
      // 从“精确毫秒差”改为“日历单位差”。
      // ------------------------------------------------------------------------
      // [旧代码] const duration = end.diff(start);
      // [说明] 旧代码计算的是两个时间点之间总的、精确的毫秒数。

      // [新代码] 使用Luxon的日历单位差值计算。
      // 这个方法会分别计算年、月、日等各个单位的差值，而不是一个总时长。
      // 这将直接产生类似于“相差7000年、0个月、1天、2小时...”这样的结果结构。
      duration = end.diff(start, [
        "years",
        "months",
        "days",
        "hours",
        "minutes",
        "seconds",
      ]);
      // ========================================================================
    } else {
      // [说明] 所有非'custom'的标准倒计时类型，保持原有的精确毫秒计算逻辑不变。
      start = base;
      end = getEndOf(type, base, { weekStart: config.weekStart });
      // [说明] duration在这里赋值，计算精确的毫秒差
      duration = end.diff(start);
    }

    if (!start.isValid || !end.isValid)
      throw new Error("Invalid start or end date for calculation");

    // [说明] 进度计算逻辑保持不变。对于'custom'类型，进度仍然是0，因为它没有一个明确的“总时长”概念。
    let progress = 0;
    if (type !== "custom") {
      const periodStart = getStartOf(type, base, {
        weekStart: config.weekStart,
      });
      const totalDuration = end.diff(periodStart).as("milliseconds");
      const elapsedDuration = base.diff(periodStart).as("milliseconds");
      if (totalDuration > 0) {
        progress = elapsedDuration / totalDuration;
      }
    }

    return {
      duration,
      progress,
      isPast,
    };
  } catch (error) {
    console.error(
      `[CountdownEngine] Error computing countdown for type '${type}':`,
      error
    );
    return null;
  }
}
