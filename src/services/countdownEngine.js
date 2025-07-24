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

    if (type === "custom") {
      // [核心修改] 直接使用传入的原始配置对象创建Luxon日期。
      // Luxon能够健壮地处理大年份（如-99999），避免了JS原生Date对象的限制。
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
    } else {
      // 处理标准倒计时类型 (逻辑不变)
      start = base;
      end = getEndOf(type, base, { weekStart: config.weekStart });
    }

    if (!start.isValid || !end.isValid)
      throw new Error("Invalid start or end date for calculation");

    // 计算差值，得到一个Luxon Duration对象，这是最原始的数据
    const duration = end.diff(start);

    // 计算进度 (逻辑不变)
    let progress = 0;
    if (type !== "custom") {
      // 标准倒计时的进度计算
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
    return null; // 在计算失败时返回null，让上层处理
  }
}
