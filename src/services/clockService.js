// E:\AppProject\VisualTime\src\services\clockService.js (最终完美同步版)

import { ref, readonly, computed, watch } from "vue"; // 【修改】导入 watch API
import { timeApiAdapters } from "./apiAdapters";

/**
 * =================================================================
 * Clock Service - 应用的全局统一、可校准的时钟源 (双信号最终版)
 * =================================================================
 *
 * 职责:
 * 1. 提供两种频率的全局时间信号：
 *    - `now`: 高频(rAF)，用于需要毫秒级丝滑动画的组件。
 *    - `secondTimestamp`: 低频(1Hz)，用于所有秒级更新的组件，确保绝对同步并优化性能。
 * 2. 采用智能按需升频机制，在有高频需求时自动切换到rAF模式。
 * 3. 实现多源、容灾、平滑的网络授时校准机制。
 */

// --- 配置常量 ---
const SYNC_INTERVAL = 10 * 60 * 1000;
const SMOOTH_DURATION = 2000;
const FETCH_TIMEOUT = 5000;
const VISIBILITY_SYNC_COOLDOWN = 60 * 1000;

// --- 私有状态 ---
const _localNow = ref(Date.now());
const _offset = ref(0);
const _isSyncing = ref(false);
const _isSmoothing = ref(false);
let _syncTimerId = null;
let _smoothingFrameId = null;
let _lastVisibilitySync = 0;
const highFrequencyRequesters = new Set();
let _mainLoopId = null;

// --- 内部逻辑 ---

// 主更新循环函数 (逻辑不变)
function runMainLoop() {
  if (_mainLoopId) {
    cancelAnimationFrame(_mainLoopId);
    clearInterval(_mainLoopId);
    _mainLoopId = null;
  }
  const update = () => {
    if (!_isSmoothing.value) {
      _localNow.value = Date.now();
    }
  };
  if (highFrequencyRequesters.size > 0) {
    console.log("[Clock] Starting High-Frequency Mode (rAF).");
    const rAFLoop = () => {
      update();
      _mainLoopId = requestAnimationFrame(rAFLoop);
    };
    rAFLoop();
  } else {
    console.log("[Clock] Starting Low-Energy Mode (1Hz setInterval).");
    update();
    _mainLoopId = setInterval(update, 1000);
  }
}

// 平滑过渡函数 (逻辑不变)
function smoothUpdateOffset(targetOffset) {
  _isSmoothing.value = true;
  const startOffset = _offset.value;
  const diff = targetOffset - startOffset;
  let startTime = null;
  const step = (currentTime) => {
    if (!startTime) startTime = currentTime;
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / SMOOTH_DURATION, 1);
    _offset.value = startOffset + diff * progress;
    _localNow.value = Date.now();
    if (progress < 1) {
      _smoothingFrameId = requestAnimationFrame(step);
    } else {
      _isSmoothing.value = false;
      _smoothingFrameId = null;
    }
  };
  _smoothingFrameId = requestAnimationFrame(step);
}

// --- 公开API ---

// 1. 【高频信号】提供毫秒级精度的时间戳 (保持不变)
export const now = computed(() => _localNow.value + _offset.value);

// 2. 【核心新增】提供一个只在整秒变化时才更新的“秒级”时间戳
//    _secondTimestamp 是一个私有的ref，用于存储整秒的时间戳
const _secondTimestamp = ref(
  Math.floor((_localNow.value + _offset.value) / 1000) * 1000
);

//    使用 watch 监听高频的 now 信号
watch(now, (newNow) => {
  // 计算当前时间戳对应的秒数
  const currentSecond = Math.floor(newNow / 1000);
  // 获取上一次记录的秒数
  const lastSecond = Math.floor(_secondTimestamp.value / 1000);
  // 只有当秒数发生跳变时（即大于上一秒）
  if (currentSecond > lastSecond) {
    // 才更新 _secondTimestamp 的值。这确保了它每秒只变化一次。
    _secondTimestamp.value = currentSecond * 1000;
  }
});

/**
 * 【新增API】【秒级信号】全局共享的、只在整秒时刻才发生变化的响应式时间戳。
 * 所有只关心秒级更新的组件都应该订阅这个信号，以保证绝对同步和性能优化。
 */
export const secondTimestamp = readonly(_secondTimestamp);

// (其他所有API: requestHighFrequencyUpdate, releaseHighFrequencyUpdate, isSyncing, syncTime, startClockService 均保持不变)
export function requestHighFrequencyUpdate(requester) {
  if (!highFrequencyRequesters.has(requester)) {
    highFrequencyRequesters.add(requester);
    runMainLoop();
  }
}
export function releaseHighFrequencyUpdate(requester) {
  if (highFrequencyRequesters.has(requester)) {
    highFrequencyRequesters.delete(requester);
    runMainLoop();
  }
}
export const isSyncing = readonly(_isSyncing);
export async function syncTime() {
  if (_isSyncing.value || _isSmoothing.value) {
    return;
  }
  _isSyncing.value = true;
  let successfulSync = false;
  for (const adapter of timeApiAdapters) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const { serverTime, latency } = await adapter.fetch(controller);
      clearTimeout(timeoutId);
      const t1 = Date.now();
      const targetOffset = serverTime - t1;
      smoothUpdateOffset(targetOffset);
      successfulSync = true;
      break;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(
        `[Clock] Failed to sync with ${adapter.name}:`,
        error.message
      );
    }
  }
  if (!successfulSync) {
    console.error("[Clock] All time sync sources failed.");
  }
  _isSyncing.value = false;
}
export function startClockService() {
  runMainLoop();
  setTimeout(syncTime, 500);
  if (_syncTimerId) clearInterval(_syncTimerId);
  _syncTimerId = setInterval(syncTime, SYNC_INTERVAL);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const currentTime = Date.now();
      if (currentTime - _lastVisibilitySync > VISIBILITY_SYNC_COOLDOWN) {
        syncTime();
        _lastVisibilitySync = currentTime;
      }
    }
  });
}
