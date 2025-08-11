// E:\AppProject\VisualTime\src\composables\useCountdown.js (最终优化版 - 已修复watch bug)

import { ref, computed, watch, readonly, onUnmounted } from "vue";
import {
  now,
  secondTimestamp,
  requestHighFrequencyUpdate,
  releaseHighFrequencyUpdate,
} from "../services/clockService";
import { computeCountdown } from "../services/countdownEngine";
import * as storage from "../utils/storage";
import * as formatters from "../utils/formatters";

/**
 * =================================================================
 * useCountdown - 倒计时逻辑编排 Composable (智能频率控制版)
 * =================================================================
 * @param {string} type - 倒计时类型 (e.g., 'year', 'day')
 * @param {import('vue').ComputedRef<object>} [config] - 【注意】这里期望传入一个响应式的 computed 对象
 */
export function useCountdown(type, config) {
  // <--- 移除默认值{}, 强调config必须是响应式的
  // --- 状态管理 (大部分不变) ---
  const precision = ref(storage.getPrecision(type));
  const decimalPrecision = ref(storage.getDecimalPrecision(type));
  const weekStart = type === "week" ? ref(storage.getWeekStart()) : ref(1);

  // --- 频率控制 ---
  const requesterId = Symbol(`useCountdown-${type}-${Date.now()}`);

  // 【核心修复】侦听源必须是 `config.value.frequency`
  // 这样当外部的 computed 值变化时，这个 watch 才能被正确触发
  watch(
    () => config?.value?.frequency, // 安全地访问 config.value.frequency
    (newFrequency) => {
      if (newFrequency === "high") {
        requestHighFrequencyUpdate(requesterId);
      } else {
        releaseHighFrequencyUpdate(requesterId);
      }
    },
    { immediate: true } // 立即执行一次以设置初始频率
  );

  // 组件卸载时，自动清理时钟请求，防止内存泄漏
  onUnmounted(() => {
    releaseHighFrequencyUpdate(requesterId);
  });

  // --- 核心计算链 (双源驱动) ---

  // 低频计算源：永远绑定低频的 secondTimestamp
  const lowFrequencyResult = computed(() => {
    return computeCountdown({
      type: type,
      baseTime: secondTimestamp.value,
      config: { weekStart: weekStart.value },
    });
  });

  // 高频计算源：仅在需要时，基于高频 now 信号计算
  const highFrequencyResult = computed(() => {
    // 只有在明确要求高频时才进行高频计算，否则返回null
    if (config?.value?.frequency !== "high") return null;
    return computeCountdown({
      type: type,
      baseTime: now.value,
      config: { weekStart: weekStart.value },
    });
  });

  // --- 对外暴露的响应式数据 ---

  const progress = computed(() => lowFrequencyResult.value?.progress || 0);

  const displayValue = computed(() => {
    if (!lowFrequencyResult.value || !lowFrequencyResult.value.duration)
      return "...";
    return formatters.formatDurationAs(
      lowFrequencyResult.value.duration,
      precision.value,
      decimalPrecision.value
    );
  });

  const unitLabel = computed(() => formatters.getUnitLabel(precision.value));

  const timeObject = computed(() => {
    // 优先使用高频计算结果
    if (highFrequencyResult.value?.duration) {
      return formatters.formatDurationAsTimeObject(
        highFrequencyResult.value.duration
      );
    }
    // 回退到低频结果
    if (lowFrequencyResult.value?.duration) {
      return formatters.formatDurationAsTimeObject(
        lowFrequencyResult.value.duration
      );
    }
    // 兜底值
    return { hours: "00", minutes: "00", seconds: "00", milliseconds: "000" };
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
