// E:\AppProject\VisualTime\src\composables\useDateDisplay.js (智能选择时间源版)

import { computed } from "vue";
import { DateTime } from "luxon";
// 【修改】同时导入高频和低频两个时间信号
import { now, secondTimestamp } from "../services/clockService";
import * as dateUtils from "../utils/dateUtils";

/**
 * =================================================================
 * useDateDisplay - 日期显示组件的逻辑编排 Composable (智能同步版)
 * =================================================================
 */
export function useDateDisplay() {
  // --- 响应式计算 ---

  // 【核心修改】对于日期和农历这种每天或每秒才需要更新一次的信息，
  // 我们让它订阅低频的 `secondTimestamp` 信号，从而极大地优化性能。
  const dateSource = computed(() => DateTime.fromMillis(secondTimestamp.value));

  // 这两个计算属性现在每秒才重新计算一次
  const currentDate = computed(() => dateUtils.formatDate(dateSource.value));
  const lunarInfo = computed(
    () => dateUtils.getLunarInfo(dateSource.value).fullInfo
  );

  // 【核心修改】对于需要平滑跳动的实时时钟（HH:mm:ss），
  // 它必须订阅高频的 `now` 信号，以确保与 `TodayCountdown` 的毫秒显示完美同步。
  const timeSource = computed(() => DateTime.fromMillis(now.value));

  // 这个计算属性现在以rAF频率（约60Hz）重新计算
  const time = computed(() => {
    const dt = timeSource.value;
    return {
      hours: dt.toFormat("HH"),
      minutes: dt.toFormat("mm"),
      seconds: dt.toFormat("ss"),
    };
  });

  // --- 返回接口 ---
  // 将所有计算好的、响应式的数据作为一个对象返回
  return {
    currentDate,
    lunarInfo,
    time,
  };
}
