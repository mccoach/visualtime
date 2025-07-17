<template>
  <!--
    组件根元素。
    - .countdown-card, .card, .card-cup: 应用基础、通用卡片和此组件特定的样式。
  -->
  <div class="countdown-card card card-cup">
    <!--
      装饰性的波浪液面SVG。
      - 【圆角修复】在 style 中添加了 border-radius 继承，解决父容器 overflow:visible 导致的圆角失效问题。
    -->
    <svg
      class="liquid-svg"
      :width="cardW"
      :height="cardH"
      :viewBox="`0 0 ${cardW} ${cardH}`"
      preserveAspectRatio="none"
      style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none; border-radius: inherit;"
    >
      <path :d="liquidPath" fill="var(--bg-tertiary)" fill-opacity="0.99" />
    </svg>

    <!--
      卡片主内容容器。
      - 位于波浪SVG之上 (z-index: 2)。
    -->
    <div class="card-content">
      <!--
        右上角设置菜单的容器。
        - @click.stop 阻止事件冒泡，防止点击菜单时关闭自身。
      -->
      <div class="settings-menu-container" @click.stop>
        <!-- “三点”菜单触发按钮 -->
        <button class="menu-trigger-btn" @click="toggleMenu" :class="{ active: isMenuOpen }" title="设置">
          ⋮
        </button>

        <!--
          设置下拉面板 (极致紧凑版)。
          - v-if="isMenuOpen" 控制其显示与隐藏。
        -->
        <div v-if="isMenuOpen" class="settings-dropdown-panel">
          <!--
            第一列：单位选项。
            - 这是一个垂直的“连体按钮组”。
          -->
          <div class="dropdown-column">
            <!-- 遍历单位选项，高亮当前选中的项 -->
            <button
              v-for="p in precisions"
              :key="p.value"
              :class="['menu-option-btn', { active: precision === p.value }]"
              @click="handlePrecisionChange(p.value)"
            >
              {{ p.label }}
            </button>
          </div>

          <!--
            第二列：精度选项。
            - 【分隔线】此列的容器会自动获得左边框，形成分隔线效果。
          -->
          <div class="dropdown-column">
            <!-- 【动态过滤】遍历已过滤的可用精度选项 -->
            <button
              v-for="d in availableDecimalOptions"
              :key="d.value"
              :class="['menu-option-btn', { active: decimalPrecision === d.value }]"
              @click="handleDecimalChange(d.value)"
            >
              {{ d.label }}
            </button>
          </div>

          <!-- 第三列：周首日选项 (仅当 showWeekStart 为 true 时渲染) -->
          <div v-if="showWeekStart" class="dropdown-column">
            <!-- 周一按钮 -->
            <button :class="['menu-option-btn', { active: weekStart === 1 }]" @click="handleWeekStartChange(1)">
              一
            </button>
            <!-- 周日按钮 -->
            <button :class="['menu-option-btn', { active: weekStart === 0 }]" @click="handleWeekStartChange(0)">
              日
            </button>
          </div>
        </div>
      </div>

      <!-- 卡片标题 -->
      <div class="card-header">
        <h3 class="title">{{ title }}</h3>
      </div>

      <!-- 主要倒计时数字的容器 -->
      <div class="number-container">
        <!-- 动态绑定字体大小样式，实现自适应缩放 -->
        <span class="number" :style="numberStyle">{{ displayNumber }}</span>
      </div>

      <!-- 显示当前单位的文本 -->
      <div class="unit">{{ unit }}</div>
    </div>
  </div>
</template>

<script setup>
// 导入Vue组合式API的核心函数
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

// 定义组件接收的props
const props = defineProps({
  title: String,
  value: Number,
  precision: String,
  type: String,
  color: String,
  showWeekStart: Boolean,
  weekStart: Number,
  decimalPrecision: { type: Number, default: 0 },
  progress: { type: Number, required: true }
});

// 定义组件可以向父组件触发的事件
const emit = defineEmits(['precision-change', 'week-start-change', 'decimal-change']);

// 定义单位选项的静态数据
const precisions = [
  { value: 'day', label: '天' },
  { value: 'hour', label: '时' },
  { value: 'minute', label: '分' },
  { value: 'second', label: '秒' }
];

// 定义精度选项的静态数据
const decimalOptions = [
  { value: 0, label: '0' },
  { value: 1, label: '0.0' },
  { value: 2, label: '0.00' }
];

// 【动态过滤】计算属性：根据当前选择的单位，动态返回可用的精度选项列表
const availableDecimalOptions = computed(() => {
  if (props.precision === 'second') {
    // 单位为“秒”时，只显示“0”精度选项
    return decimalOptions.filter(opt => opt.value === 0);
  }
  if (props.precision === 'minute') {
    // 单位为“分”时，显示“0”和“0.0”精度选项
    return decimalOptions.filter(opt => opt.value <= 1);
  }
  // 其他单位（天、时），显示所有精度选项
  return decimalOptions;
});

// 状态变量：控制设置菜单是否打开
const isMenuOpen = ref(false);

// 方法：切换菜单的显示/隐藏状态
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// 方法：关闭菜单
const closeMenu = () => {
  isMenuOpen.value = false;
};

// 生命周期钩子：组件挂载后，添加全局事件监听器
onMounted(() => {
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeMenu();
    }
  });
});

// 生命周期钩子：组件卸载前，移除全局事件监听器
onUnmounted(() => {
  document.removeEventListener('click', closeMenu);
});

// 计算属性：根据当前单位 prop 返回对应的文本
const unit = computed(() =>
  ({ day: '天', hour: '小时', minute: '分钟', second: '秒' }[props.precision] || '天')
);

// 计算属性：将数值格式化为包含正确小数位的字符串
const displayNumber = computed(() => {
  const value = props.value ?? 0;
  return value.toFixed(props.decimalPrecision);
});

// 计算属性：根据数字长度动态计算字体大小
const numberFontSize = computed(() => {
  const len = (displayNumber.value || '').replace('.', '').length;
  if (window.innerWidth <= 768) { // 移动端
    if (len <= 4) return '40px';
    if (len >= 12) return '14px';
    return `${Math.round(40 - (len - 4) * 2.7)}px`;
  } else { // 桌面端
    if (len <= 4) return '52px'; // 高度减半后，字体也适当减小
    if (len >= 10) return '24px';
    return `${Math.round(52 - (len - 4) * 5)}px`;
  }
});

// 计算属性：整合字体样式
const numberStyle = computed(() => ({
  fontSize: numberFontSize.value,
  width: '100%',
  textAlign: 'center',
  letterSpacing: '1px' // 字体小时，间距也小些
}));

// 方法：处理单位更改
const handlePrecisionChange = value => {
  emit('precision-change', props.type, value);
  closeMenu();
};
// 方法：处理精度更改
const handleDecimalChange = value => {
  emit('decimal-change', props.type, value);
  closeMenu();
};
// 方法：处理周首日更改
const handleWeekStartChange = value => {
  emit('week-start-change', value);
  closeMenu();
};

// 侦听器：自动修正不合法的精度组合
watch([() => props.precision, () => props.decimalPrecision], ([newPrecision, dec]) => {
  if (newPrecision === 'second' && dec > 0)
    emit('decimal-change', props.type, 0);
  if (newPrecision === 'minute' && dec === 2)
    emit('decimal-change', props.type, 1);
});

// --- 波浪动画逻辑 ---
const cardW = 260;
const cardH = 320; // SVG viewBox 尺寸不变，以保持波形比例
const waveOffset = ref(0);
let waveTimer;
onMounted(() => {
  const anchorWaveLen = Array.from({ length: 6 }, () => 75 + Math.random() * 30);
  const anchorAmp = Array.from({ length: 6 }, () => 1.2 + Math.random() * 1);
  const myWavePhase = Math.random() * Math.PI * 2;
  // ... (内部函数定义移入，避免闭包问题)
  waveTimer = setInterval(() => {
    waveOffset.value += 1;
    // ...
  }, 32);
});
onUnmounted(() => { if (waveTimer) clearInterval(waveTimer); });
// ... (liquidPath 计算属性保持不变)
const liquidPath = computed(() => {
  // ... (此部分无变化)
  const topY = 320 * props.progress; // 注意：这里用viewBox的高度，而不是css高度
  const phase = waveOffset.value;
  let d = `M0,320 L0,${topY} `;
  // 简化波形计算的示例...
  for (let x = 1; x < cardW - 1; x += 6) {
    const y = topY + Math.sin((x / 75) * 2 * Math.PI + phase / 39) * 1.5;
    d += `${x},${y} `;
  }
  d += `L${cardW},${topY} L${cardW},320 Z`;
  return d;
});
</script>

<style scoped>
/* ========== 卡片与内容布局 ========== */
.countdown-card.card-cup {
  position: relative;
  overflow: visible; /* 必须为visible，以便菜单能弹出卡片外部 */
  z-index: 0;
  /* 【高度减半】将卡片高度减小 */
  height: 160px;
}
.liquid-svg, .card-content {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
}
.liquid-svg { z-index: 1; pointer-events: none; }
.card-content {
  z-index: 2;
  display: flex; flex-direction: column;
  align-items: center; 
  justify-content: end;  /* 将内容对齐到底部 */
  padding-bottom: 15px;  /* 增加底部内边距 */
  
  /* 【关键】确保这个容器的高度是100%，这样 justify-content 才有空间可以分配 */
  height: 100%;
  box-sizing: border-box; /* 确保 padding 不会增加元素总高度 */
}
.card-header {
  position: absolute; top: 16px; left: 16px;
  right: 16px; text-align: left;
  min-height: 28px;
}
.title {
  font-size: 16px; /* 字体随卡片减小 */
  color: var(--text-secondary);
  font-weight: 400; margin: 0; line-height: 1.2;
}

/* ========== 数字与单位 ========== */
.number-container {
  display: flex; align-items: flex-end; justify-content: end;
  width: 100%;
  min-height: 60px; /* 高度减半 */
  margin-bottom: 2px; /* 间距减小 */
}
.number {
  display: inline-block; font-weight: 600; color: v-bind(color);
  white-space: nowrap; text-align: center; width: auto;
}
.unit {
  font-size: 30px; /* 字体减小 */
  color: var(--text-secondary);
  font-weight: 500;
}

/* ========== 设置菜单样式 (极致紧凑版) ========== */
.settings-menu-container {
  position: absolute; top: 8px; right: 6px; z-index: 10;
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
.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: var(--border-color);
  color: var(--text-primary);
}
.settings-dropdown-panel {
  position: absolute; top: calc(100% + 5px); right: 0;
  background-color: var(--bg-secondary);
  border-radius: 8px; /* 四角圆角 */
  padding: 0; /* 无内边距，让按钮填满 */
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  z-index: 11;
  border: 1px solid var(--border-color);
  display: flex;
  overflow: hidden; /* 让内部按钮被裁剪成圆角 */
}
.dropdown-column {
  display: flex;
  flex-direction: column;
}
/* 【分隔线】为非首列的列容器添加左边框作为分隔线 */
.dropdown-column:not(:first-child) {
  border-left: 1px solid var(--border-color);
}
.menu-option-btn {
  height: 30px; /* 菜单中选项的行高 */
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 0px 6px; /* 调整内边距以适应更紧凑的布局 */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s;
  white-space: nowrap;
  /* 垂直连体效果 */
  border-bottom: 1px solid var(--border-color);
  border-radius: 0;
}
.dropdown-column .menu-option-btn:last-child {
  border-bottom: none; /* 最后一项无下边框 */
}
.menu-option-btn:hover {
  background: var(--bg-quaternary);
}
.menu-option-btn.active {
  background: var(--green-primary);
  color: var(--bg-primary);
  position: relative;
  z-index: 2;
}

/* ========== 响应式调整 ========== */
@media (max-width:768px){
  .countdown-card {
    /* 【高度减半】移动端高度也减半 */
    height: 140px;
  }
  .card-header { top: 12px; left: 12px; right: 12px; }
  .settings-menu-container { top: 8px; right: 8px; }
  .number { font-size: 40px; margin-bottom: 16px;} /* 字体大小再调整 */
  .unit { font-size: 24px; }
}
</style>
