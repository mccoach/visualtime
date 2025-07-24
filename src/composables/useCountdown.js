// E:\AppProject\VisualTime\src\composables\useCountdown.js (智能选择时间源版)

import { ref, computed, watch, readonly } from "vue";
// 【修改】同时导入高频和低频两个时间信号
import { now, secondTimestamp } from "../services/clockService";
import { computeCountdown } from "../services/countdownEngine";
import * as storage from "../utils/storage";
import * as formatters from "../utils/formatters";

/**
 * =================================================================
 * useCountdown - 倒计时逻辑编排 Composable (智能同步版)
 * =================================================================
 */

export function useCountdown(type) {
  // --- 状态管理 (逻辑不变) ---
  const precision = ref(storage.getPrecision(type));
  const decimalPrecision = ref(storage.getDecimalPrecision(type));
  const weekStart = type === "week" ? ref(storage.getWeekStart()) : ref(1);

  // --- 核心计算链 (响应式) ---

  // 1. 【核心修改】智能选择时间源
  //    创建一个计算属性，它会根据当前选择的精度来决定依赖哪个时间信号。
  const baseTimeSource = computed(() => {
    // 如果单位是秒或更粗粒度的单位（天、时、分等）
    if (
      [
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months",
        "years",
      ].includes(precision.value)
    ) {
      // 则订阅低频的 `secondTimestamp`，这样可以保证秒级同步并优化性能。
      return secondTimestamp.value;
    }
    // 否则 (例如精度是毫秒，虽然本Composable当前场景用不到，但为未来扩展考虑)
    // 则订阅高频的 `now`。
    return now.value;
  });

  // 2. 调用核心计算引擎
  //    `rawResult`现在依赖于 `baseTimeSource`，实现了按需订阅
  const rawResult = computed(() => {
    return computeCountdown({
      type: type,
      baseTime: baseTimeSource.value, // 使用我们智能选择的时间源
      config: {
        weekStart: weekStart.value,
      },
    });
  });

  // (后续所有依赖 `rawResult` 的计算属性，其更新频率也自然地实现了智能化)
  const displayValue = computed(() => {
    if (!rawResult.value || !rawResult.value.duration) return "...";
    return formatters.formatDurationAs(
      rawResult.value.duration,
      precision.value,
      decimalPrecision.value
    );
  });

  const unitLabel = computed(() => formatters.getUnitLabel(precision.value));

  const progress = computed(() => rawResult.value?.progress || 0);

  // `timeObject` 的计算也依赖 `rawResult`，所以它的更新频率也是智能的
  const timeObject = computed(() => {
    if (!rawResult.value || !rawResult.value.duration) {
      return { hours: "00", minutes: "00", seconds: "00", milliseconds: "000" };
    }
    // 【注意】虽然TodayCountdown需要毫秒级平滑，但它的`useCountdown('day')`如果精度设为秒，
    // 此处也会降频计算，但UI上仍会根据自己的高频需求来决定是否显示毫秒部分的 `time.milliseconds`。
    // 这看起来矛盾，但实际上没问题，因为 TodayCountdown 的毫秒显示需要订阅高频 `now`，我们将在那里处理。
    // 为了保持 useCountdown 的通用性，这里的 timeObject 仍基于 rawResult。
    // 对于 TodayCountdown，我们将直接让它订阅高频 now 来更新毫秒。
    return formatters.formatDurationAsTimeObject(rawResult.value.duration);
  });

  // --- 事件处理与持久化 (逻辑不变) ---
  const setPrecision = (newPrecision) => {
    precision.value = newPrecision;
    storage.setPrecision(type, newPrecision);
  };
  const setDecimalPrecision = (newDecimal) => {
    decimalPrecision.value = newDecimal;
    storage.setDecimalPrecision(type, newDecimal);
  };
  const setWeekStart = (newWeekStart) => {
    if (type === "week") {
      weekStart.value = newWeekStart;
      storage.setWeekStart(newWeekStart);
    }
  };

  // --- 逻辑校正 (逻辑不变) ---
  watch(
    [precision, decimalPrecision],
    ([newUnit, newDecimal]) => {
      if (newUnit === "seconds" && newDecimal > 0) {
        setDecimalPrecision(0);
      }
      if (newUnit === "minutes" && newDecimal > 1) {
        setDecimalPrecision(1);
      }
    },
    { immediate: true }
  );

  // --- 返回接口 (逻辑不变) ---
  return {
    displayValue,
    unitLabel,
    progress,
    timeObject,
    precision,
    decimalPrecision,
    weekStart: readonly(weekStart),
    setPrecision,
    setDecimalPrecision,
    setWeekStart,
  };
}
