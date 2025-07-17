<template>
  <!--
    组件根容器。
    - .today-countdown, .card, .today-liquid-wrap: 应用基础、通用卡片和此组件特定的样式。
    - 【修改】增加了 position: relative 和 overflow: visible 以支持内部绝对定位的菜单弹出。
  -->
  <div class="today-countdown card today-liquid-wrap">
    <!--
      液面波浪效果的SVG。
      - 它位于最底层 (z-index: 1)，作为背景动画。
      - preserveAspectRatio="none" 确保SVG能拉伸填满整个容器。
    -->
    <svg
      class="liquid-svg-h"
      :width="cardW"
      :height="cardH"
      :viewBox="`0 0 ${cardW} ${cardH}`"
      preserveAspectRatio="none"
      style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none; border-radius: inherit;"
    >
      <!--
        SVG路径。
        - :d 动态绑定到 `liquidPath` 计算属性，该属性生成波浪的路径数据。
        - fill 使用CSS变量，保持主题一致性。
      -->
      <path
        :d="liquidPath"
        fill="var(--bg-tertiary)"
        fill-opacity="0.99"
      />
    </svg>

    <!--
      【新增】右上角设置菜单的容器。
      - 结构与 CountdownCard 完全一致，确保UI统一。
      - @click.stop 阻止事件冒泡，防止点击菜单时触发全局的关闭菜单事件。
    -->
    <div class="settings-menu-container" @click.stop>
      <!--
        【新增】“三点”菜单触发按钮。
        - @click 调用 `toggleMenu` 方法来打开或关闭菜单。
        - :class="{ active: isMenuOpen }" 当菜单打开时，高亮此按钮。
      -->
      <button class="menu-trigger-btn" @click="toggleMenu" :class="{ active: isMenuOpen }" title="设置">
        ⋮
      </button>

      <!--
        【新增】设置下拉面板。
        - v-if="isMenuOpen" 根据状态控制其显示与隐藏。
      -->
      <div v-if="isMenuOpen" class="settings-dropdown-panel">
        <!--
          【新增】菜单选项列。
          - 此处只有一个功能（精度切换），所以只有一列。
        -->
        <div class="dropdown-column">
          <!--
            【新增】“秒”精度按钮。
            - :class 动态绑定 'active' 类，用于高亮当前选中的精度。
            - @click 调用 `handlePrecisionChange` 方法并传入 's'。
          -->
          <button
            :class="['menu-option-btn', { active: precision === 's' }]"
            @click="handlePrecisionChange('s')"
          >
            秒
          </button>
          <!--
            【新增】“毫秒”精度按钮。
            - 逻辑同上，但对应 'ms' 精度。
          -->
          <button
            :class="['menu-option-btn', { active: precision === 'ms' }]"
            @click="handlePrecisionChange('ms')"
          >
            毫秒
          </button>
        </div>
      </div>
    </div>

    <!--
      【修改】将标题移入一个绝对定位的头部容器，使其脱离主内容流。
    -->
    <div class="card-header">
      <h3 class="title">今日剩余</h3>
    </div>

    <!--
      【修改】主倒计时数字显示区，现在它会在卡片内水平和垂直居中。
    -->
    <div class="time-display">
      <!-- 小时数字块 -->
      <span class="num-block">{{ time.hours }}</span>
      <!-- 分隔符 -->
      <span class="sep-block">:</span>
      <!-- 分钟数字块 -->
      <span class="num-block">{{ time.minutes }}</span>
      <!-- 分隔符 -->
      <span class="sep-block">:</span>
      <!-- 秒数数字块 -->
      <span class="num-block">{{ time.seconds }}</span>
      <!--
        毫秒显示区域。
        - v-if: 仅在精度为 'ms' 时才渲染小数点和毫秒数字。
      -->
      <template v-if="precision === 'ms'">
        <!-- 小数点 -->
        <span class="dot-block">.</span>
        <!-- 毫秒数字块 -->
        <span class="ms-block">{{ time.milliseconds }}</span>
      </template>
    </div>

    <!--
      【移除】原先位于此处的连体按钮组已被新的右上角菜单替代。
    -->
  </div>
</template>

<script setup>
// 导入Vue组合式API的核心函数
import { ref, computed, onMounted, onUnmounted } from 'vue';
// 导入日期工具函数
import { getTodayRemaining } from '../utils/dateUtils';
// [修改] 导入用于持久化存储的工具函数
// 为了避免命名冲突，我们将导入的 setPrecision 重命名为 setStoragePrecision
import { getPrecision, setPrecision as setStoragePrecision } from '../utils/storage';


// --- 状态管理 ---

// 【新增】状态变量：控制设置菜单是否打开
const isMenuOpen = ref(false);
// [修改] 从 localStorage 初始化精度状态。
// 调用 getPrecision('today') 获取已保存的值，如果 localStorage 中没有，则默认使用 'ms'。
const precision = ref(getPrecision('today') || 'ms');
// 倒计时时间对象
const time = ref({ hours: '00', minutes: '00', seconds: '00', milliseconds: '000' });
// 波浪动画的水平偏移量
const waveOffset = ref(0);
// 存储两个定时器的ID，以便在组件卸载时清除
let waveTimer;
let timeTimer;

// --- 菜单交互逻辑 ---

// 【新增】方法：切换菜单的显示/隐藏状态
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// 【新增】方法：关闭菜单
const closeMenu = () => {
  isMenuOpen.value = false;
};

// 【新增】方法：处理精度更改，这是菜单按钮的点击事件处理器
const handlePrecisionChange = (val) => {
  setPrecision(val); // 调用核心的设置精度方法
  closeMenu();       // 操作完成后关闭菜单
};

// 【新增】生命周期钩子：组件挂载后，添加全局事件监听器以关闭菜单
onMounted(() => {
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeMenu();
    }
  });
});

// 【新增】生命周期钩子：组件卸载前，移除全局事件监听器，防止内存泄漏
onUnmounted(() => {
  document.removeEventListener('click', closeMenu);
});


// --- 核心功能逻辑 ---

// [修改] 设置精度的核心方法：现在它会同时更新状态、持久化到localStorage，并刷新定时器
const setPrecision = (val) => {
  precision.value = val;
  // 调用从 storage.js 导入的函数，将新值保存到 localStorage
  setStoragePrecision('today', val);
  refreshTimeTimer(); // 切换精度后立即重置定时器以应用新的刷新频率
};

// 计算属性：计算当天已过时间的进度百分比 (0到1)
const progress = computed(() => {
  const totalMsInDay = 24 * 60 * 60 * 1000;
  // 计算剩余总毫秒数
  const remainingMs =
    Number(time.value.hours) * 3600000 +
    Number(time.value.minutes) * 60000 +
    Number(time.value.seconds) * 1000 +
    Number(time.value.milliseconds);
  // 返回已过时间的百分比
  return 1 - remainingMs / totalMsInDay;
});

// 定时更新时间显示的方法
const updateTime = () => {
  let t = getTodayRemaining();
  // 如果当前是“秒”精度，则不显示毫秒，将其重置为'000'
  if (precision.value === 's') {
    t.milliseconds = '000';
  }
  time.value = t;
};

// 刷新时间更新定时器的方法
const refreshTimeTimer = () => {
  if (timeTimer) clearInterval(timeTimer); // 清除旧的定时器
  updateTime(); // 立即更新一次时间
  // 根据精度设置新的定时器：毫秒级16ms刷新（接近60fps），秒级1000ms刷新
  timeTimer = setInterval(updateTime, precision.value === 'ms' ? 16 : 1000);
};

// ... 波浪动画逻辑和生命周期钩子保持不变 ...
// --- SVG波浪动画逻辑 ---

const cardW = 520; // SVG viewBox宽度
const cardH = 120; // SVG viewBox高度

// 波形参数，使用随机值增加自然感
const anchorCount = 6;
const anchorY = Array.from({ length: anchorCount }, (_, i) => i * cardH / (anchorCount - 1));
const anchorWaveLen = anchorY.map(() => 60 + Math.random() * 36);
const anchorAmp = anchorY.map(() => 1 + Math.random() * 0.6);
const myWavePhase = Math.random() * Math.PI * 2;
// 线性插值函数，用于平滑过渡波形参数
function lerp(a, b, t) { return a + (b - a) * t; }
function getLerpValue(y, anchorArr) {
  for (let i = 0; i < anchorArr.length - 1; i++) {
    if (y >= anchorY[i] && y <= anchorY[i + 1]) {
      const t = (y - anchorY[i]) / (anchorY[i + 1] - anchorY[i]);
      return lerp(anchorArr[i], anchorArr[i + 1], t);
    }
  }
  return anchorArr[anchorArr.length - 1];
}
const randomSeed = Array.from({ length: Math.ceil(cardH / 5) + 2 }, () => Math.random() * 0.4 - 0.2);

// 计算属性：生成SVG液面波浪的路径数据
const liquidPath = computed(() => {
  const rightX = cardW * progress.value; // 液面右侧的X坐标由进度决定
  const phase = waveOffset.value;
  let d = `M${cardW},${cardH} L${cardW},0 `; // 从右下角开始，画到右上角
  let idx = 0;
  // 逐点绘制波形曲线
  for (let y = 1; y < cardH - 1; y += 5) {
    const waveLen = getLerpValue(y, anchorWaveLen);
    const amp = getLerpValue(y, anchorAmp);
    const rand = randomSeed[idx % randomSeed.length];
    const x = rightX + Math.sin((y / waveLen) * 2 * Math.PI + phase / 47 + myWavePhase) * amp + rand;
    d += `${x},${y} `;
    idx++;
  }
  d += `L${rightX},${cardH} Z`; // 连接到右下角的进度点，并闭合路径
  return d;
});


// --- 生命周期钩子 ---

onMounted(() => {
  // 启动波浪动画定时器
  waveTimer = setInterval(() => { waveOffset.value += 1; }, 32);
  // 首次启动时间更新定时器
  refreshTimeTimer();
});

onUnmounted(() => {
  // 组件卸载时，清除所有定时器
  if(waveTimer) clearInterval(waveTimer);
  if(timeTimer) clearInterval(timeTimer);
});
</script>


<style scoped>
/* ========== 主卡片布局 ========== */
.today-countdown.today-liquid-wrap {
  position: relative;
  /* 【修改】允许菜单弹出卡片外部 */
  overflow: visible;
  z-index: 0;
  height: 120px;
  display: flex;
  /* 【修改】内容居中对齐 */
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  /* [新增] 重新定义圆角：左上、右上、右下、左下 */
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
}

/* 底部液面动画SVG */
.liquid-svg-h {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 1;
}

/* 【新增】卡片标题容器，绝对定位 */
.card-header {
  position: absolute;
  top: 16px;
  left: 24px;
  z-index: 2; /* 确保在液面之上 */
}

/* 卡片标题 */
.title {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
  margin: 0;
}

/* ========== 右上角菜单 (新增样式) ========== */
.settings-menu-container {
  position: absolute; top: 8px; right: 7px; z-index: 10;
}
.menu-trigger-btn {
  width: 32px;
  height: 32px;
  border: none;
  /* 【修改】从圆形(50%)改为方形圆角(8px) */
  border-radius: 8px;
  /* 【修改】从透明背景改为有默认背景色 */
  background: none;
  /* 【修改】调整颜色、字号和字重以匹配 */
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  /* 【修改】过渡效果统一为 'all' */
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 【修改】统一悬停和激活状态的样式，完全照搬CustomCountdown的悬停效果 */
.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: var(--border-color);
  color: var(--text-primary);
}
.settings-dropdown-panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  z-index: 11;
  border: 1px solid var(--border-color);
  display: flex;
  overflow: hidden;
}
.dropdown-column {
  display: flex;
  flex-direction: column;
}
.menu-option-btn {
  height: 30px; /* 菜单中选项的行高 */
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 0px 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s;
  white-space: nowrap;
  border-bottom: 1px solid var(--border-color);
  border-radius: 0;
}
.dropdown-column .menu-option-btn:last-child {
  border-bottom: none;
}
.menu-option-btn:hover {
  background: var(--bg-quaternary);
}
.menu-option-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
}

/* ========== 倒计时数字显示 ========== */
.time-display {
  font-family: var(--font-mono);
  display: flex;
  align-items: baseline;
  justify-content: center;
  width: 100%;
  z-index: 2; /* 确保在液面之上 */
}
.num-block, .sep-block, .dot-block, .ms-block {
  z-index: 2; /* 确保在液面之上 */
}
.num-block {
  width: 64px; text-align: center;
  font-size: 56px; font-weight: 600;
  color: var(--green-primary);
}
.sep-block {
  width: 24px; text-align: center;
  font-size: 56px; font-weight: 600;
  color: var(--green-primary);
  user-select: none;
}
.dot-block {
  width: 16px; text-align: center;
  font-size: 32px; font-weight: 600;
  color: var(--green-secondary);
  user-select: none;
}
.ms-block {
  width: 20px; text-align: left;
  font-size: 32px; font-weight: 600;
  color: var(--green-secondary);
}

/* ========== 响应式调整 ========== */
@media (max-width: 768px) {
  /* 移动端，整体布局变为垂直堆叠 */
  .today-countdown.today-liquid-wrap {
    flex-direction: column;
    height: auto;
    min-height: 120px;
    gap: 12px;
    padding: 14px;
  }
  /* 标题不再绝对定位，参与流式布局 */
  .card-header {
    position: static;
    text-align: center;
  }
  .title {
    font-size: 16px;
  }
  /* 缩小数字字体以适应更小的屏幕 */
  .num-block { width: 48px; font-size: 40px; }
  .sep-block { width: 13px; font-size: 40px; }
  .dot-block { width: 9px; font-size: 22px; }
  .ms-block { width: 23px; font-size: 24px; }
  .time-display { min-width: 120px; }
}

/*
  【移除】原有的 .joined-btn-group, .today-precision-btn 等样式已被删除，
  因为它们已被新的菜单样式所取代。
*/
</style>
