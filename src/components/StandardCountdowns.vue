<!-- E:\AppProject\VisualTime\src\components\StandardCountdowns.vue -->
<!-- 文件头注释：标准倒计时组件（本版：纯仲裁器，已移除 eventBus/灰度开关） -->
<template>
  <!-- 模板开始：渲染四张标准倒计时卡片的布局 -->
  <div class="countdown-grid">
    <!-- 容器：网格布局，承载四张标准倒计时卡片 -->
    <!-- 单个卡片外层容器（v-for渲染四张卡） 
      v-for="meta in cardMeta" // 遍历元数据 cardMeta：year/quarter/month/week
      :key="meta.key" // Key：使用类型作为唯一键
      :class="{ 'menu-active': cards[meta.key].isMenuOpen }" // 若菜单打开，提升层级 
      :ref="(el) => setCardRef(meta.key, el)" // 记录卡片根元素引用（用于尺寸观察与波浪绘制） 
    -->
    <div
      v-for="meta in cardMeta"
      :key="meta.key"
      class="countdown-card card card-cup"
      :class="{ 'menu-active': cards[meta.key].isMenuOpen }"
      :ref="(el) => setCardRef(meta.key, el)"
    >
      <div class="wave-clip-container">
        <!-- 容器：用于承载SVG液体波浪 -->
        <!--
          :viewBox="`0 0 ${cards[meta.key].cardWidth} ${ // 动态视窗：使用实时的卡片宽高 
          preserveAspectRatio="none"  不保持纵横比，拉伸充满容器 
        -->
        <svg
          class="liquid-svg"
          width="100%"
          height="100%"
          :viewBox="`0 0 ${cards[meta.key].cardWidth} ${
            cards[meta.key].cardHeight
          }`"
          preserveAspectRatio="none"
          style="
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
            pointer-events: none;
            border-radius: inherit;
          "
        >
          <!--
            :d="cards[meta.key].wavePath" // 动态路径：来自 useNaturalWave 
            :fill="meta.color" // 颜色：按卡片类型配置 
            fill-opacity="0.1" // 透明度：轻微填充效果 
          -->
          <path
            :d="cards[meta.key].wavePath"
            :fill="meta.color"
            fill-opacity="0.1"
          />
        </svg>
      </div>

      <div class="card-content">
        <!-- 卡片前景内容层（在波浪之上） -->
        <!-- 
          :ref="(el) => setMenuRef(meta.key, el)" // 记录容器引用（供仲裁器 outside 判定） 
          @click.stop // 阻止冒泡：避免点击菜单区域被认为外点击 
        -->
        <div
          class="settings-menu-container"
          :ref="(el) => setMenuRef(meta.key, el)"
          @click.stop
        >
          <!--
            @click="toggleMenu(meta.key)" // 点击切换菜单（仲裁器统一互斥） 
            :class="{ active: cards[meta.key].isMenuOpen }" title="设置" > ⋮ // 高亮：菜单打开时 
          -->
          <button
            class="menu-trigger-btn"
            @click="toggleMenu(meta.key)"
            :class="{ active: cards[meta.key].isMenuOpen }"
            title="设置"
          >
            ⋮
          </button>
          <!--
            v-if="cards[meta.key].isMenuOpen" // 面板：仅在打开时渲染 
          -->
          <div
            v-if="cards[meta.key].isMenuOpen"
            class="settings-dropdown-panel"
          >
            <div class="dropdown-column"> <!-- 列1：单位精度（天/时/分/秒） -->
              <!--
                v-for="p in precisions" // 遍历单位精度选项 
                  { active: cards[meta.key].countdown.precision === p.value } // 当前选中高亮 
                @click="handlePrecisionChange(meta.key, p.value)" // 切换精度并关闭菜单 
              -->
              <button
                v-for="p in precisions"
                :key="p.value"
                :class="[
                  'menu-option-btn',
                  { active: cards[meta.key].countdown.precision === p.value },
                ]"
                @click="handlePrecisionChange(meta.key, p.value)"
              >
                {{ p.label }}
                <!-- 标签 -->
              </button>
            </div>
            <div class="dropdow n-column"> <!-- 列2：小数位选项 -->
              <!--              
                v-for="d in getAvailableDecimalOptions(
                  cards[meta.key].countdown.precision
                )" // 根据精度过滤小数位可用项 
                :class="[ 'menu-option-btn', { active:
                cards[meta.key].countdown.decimalPrecision === d.value, }, ]" // 当前选中高亮 
                @click="handleDecimalChange(meta.key, d.value)" // 切换小数位并关闭菜单 
              -->
              <button
                v-for="d in getAvailableDecimalOptions(
                  cards[meta.key].countdown.precision
                )"
                :key="d.value"
                :class="[ 'menu-option-btn', { active:
                cards[meta.key].countdown.decimalPrecision === d.value, }, ]"
                @click="handleDecimalChange(meta.key, d.value)"
                >
                {{ d.label }}
                <!-- 标签 -->
              </button>
            </div>
            <div v-if="meta.key === 'week'" class="dropdown-column"> <!-- 列3（仅周）：设置周首日 -->
              <!--
                  { active: cards.week.countdown.weekStart === 1 }, // 周一为首日高亮
                @click="handleWeekStartChange('week', 1)" // 设置周一为首 
              -->
              <button
                :class="[
                  'menu-option-btn',
                  { active: cards.week.countdown.weekStart === 1 },
                ]"
                @click="handleWeekStartChange('week', 1)"
                > 一
                <!-- 周一 -->
              </button>
              <!--    
                  { active: cards.week.countdown.weekStart === 0 }, //周日为首日高亮
                @click="handleWeekStartChange('week', 0)" // 设置周日为首 
              -->
              <button
                :class="[
                  'menu-option-btn',
                  { active: cards.week.countdown.weekStart === 0 },
                ]"
                @click="handleWeekStartChange('week', 0)"
                > 日
                <!-- 周日 -->
              </button>
            </div>
          </div>
        </div>

        <div class="card-header">
          <!-- 标题区：左上角 -->
          <h3 class="title">{{ meta.title }}</h3>
          <!-- 标题文本 -->
        </div>
        
        <!-- 数值容器：承载主数值
          :ref="(el) => setNumberContainerRef(meta.key, el)" // 自适应字号容器引用 
        -->
        <div class="number-container" 
          :ref="(el) => setNumberContainerRef(meta.key, el)"
          >
          <!-- 主数值
            :ref="(el) => setNumberRef(meta.key, el)" // 自适应字号目标元素 
            :style="{ color: meta.color }" // 按类型着色
          -->
          <span class="number" 
            :ref="(el) => setNumberRef(meta.key, el)"
            :style="{ color: meta.color }"
            >
            {{ cards[meta.key].countdown.displayValue }}
            <!-- 实时显示值（已按精度/小数格式化） -->
          </span>
        </div>

        <div class="unit">{{ cards[meta.key].countdown.unitLabel }}</div>
        <!-- 单位标签 -->
      </div>
    </div>
  </div>
</template>

<script setup>
// 组合式脚本（<script setup> 语法糖）
/* ===== 导入依赖（仅保留仲裁器路径，移除 eventBus/灰度开关） ===== */
import {
  // Vue 核心API
  reactive, // 响应式对象
  ref, // 引用类型
  computed, // 计算属性
  onMounted, // 挂载生命周期
  onUnmounted, // 卸载生命周期
  watch, // 观察响应式变更
  nextTick, // 下一轮DOM更新后
} from "vue"; // 从 Vue 导入组合式API
import { useCountdown } from "../composables/useCountdown.js"; // 倒计时业务逻辑（进度/显示值/单位）
import { useNaturalWave } from "../composables/useNaturalWave.js"; // 自然波浪动画（SVG路径）
import {
  // 字号自适应工具
  createResponsiveFontAdapter, // 创建自适应适配器
  makeFontSchedulers, // 生成调度器（立即/帧合并）
} from "../utils/fontSizeManager.js"; // 自适应字号框架
import {
  // 仲裁器（唯一互斥机制）
  activate, // 激活会话
  closeActive, // 主动关闭当前会话
  isActive, // 判断是否当前会话
} from "../services/actionArbiter.js"; // 互斥仲裁服务

/* ===== 卡片元数据：标题与配色（顺序决定渲染顺序） ===== */
const cardMeta = [
  // 四张卡片的元信息
  { key: "year", title: "本年剩余", color: "var(--green-primary)" }, // 年卡
  { key: "quarter", title: "本季剩余", color: "var(--green-secondary)" }, // 季卡
  { key: "month", title: "本月剩余", color: "var(--green-tertiary)" }, // 月卡
  { key: "week", title: "本周剩余", color: "var(--green-quaternary)" }, // 周卡
]; // 结束元信息数组
const keys = cardMeta.map((m) => m.key); // 提取 key 列表，便于遍历统一处理

/* ===== 工厂：构造单卡片的响应式状态 ===== */
function createCardState(type, color) {
  // 入参：类型与配色
  const countdown = useCountdown(type); // 建立倒计时数据源（含 displayValue/unitLabel/progress）
  const cardWidth = ref(260); // 卡片当前宽度（供波浪计算视窗）
  const cardHeight = ref(160); // 卡片当前高度（供波浪计算视窗）
  const wave = useNaturalWave({
    // 启动液体波浪
    width: cardWidth, // 传递响应式宽度
    height: cardHeight, // 传递响应式高度
    progress: countdown.progress, // 传递进度（影响波浪高度）
  }); // 返回液体路径的响应式计算
  return {
    // 返回此卡片的完整状态
    type, // 类型
    color, // 颜色
    countdown, // 倒计时计算结果（响应式）
    wavePath: computed(() => wave.liquidPath.value), // 绑定SVG路径（解包为computed）
    cardWidth, // 宽度Ref
    cardHeight, // 高度Ref
    isMenuOpen: false, // 菜单是否打开（UI状态）
    cardEl: null, // 卡片根元素引用
    menuEl: null, // 菜单容器引用（触发器+面板；用于仲裁器 outside 判定）
    numberContainerEl: null, // 数值容器引用（作为自适应容器）
    numberEl: null, // 数值元素引用（作为自适应目标）
    fontAdapter: null, // 字号自适应适配器实例
    fontAdapterContainerEl: null, // 适配器当前容器缓存（变更则重建）
    fontAdapterTargetEl: null, // 适配器当前目标缓存（变更则重建）
    fontAdapterNeedsRecreate: true, // 标记：下次需要强制重建适配器
  }; // 返回对象结束
} // 工厂函数结束

/* ===== 四张卡片的集中状态：reactive包装 ===== */
const cards = reactive({
  // 用一个响应式对象容纳四张卡
  year: createCardState("year", "var(--green-primary)"), // 年卡
  quarter: createCardState("quarter", "var(--green-secondary)"), // 季卡
  month: createCardState("month", "var(--green-tertiary)"), // 月卡
  week: createCardState("week", "var(--green-quaternary)"), // 周卡
}); // reactive 结束

/* ===== 引用写入器：将DOM引用写入到相应卡片状态 ===== */
function setCardRef(type, el) {
  // 卡片根引用
  if (el && cards[type]) cards[type].cardEl = el; // 存储引用
} // 结束
function setMenuRef(type, el) {
  // 菜单容器引用
  if (el && cards[type]) cards[type].menuEl = el; // 存储引用
} // 结束
function setNumberContainerRef(type, el) {
  // 数值容器引用
  if (el && cards[type]) cards[type].numberContainerEl = el; // 存储引用
} // 结束
function setNumberRef(type, el) {
  // 数值元素引用
  if (el && cards[type]) cards[type].numberEl = el; // 存储引用
} // 结束

/* ===== 菜单选项：单位精度与小数位 ===== */
const precisions = [
  // 单位精度列表（倒计时展示维度）
  { value: "days", label: "天" }, // 天
  { value: "hours", label: "时" }, // 小时
  { value: "minutes", label: "分" }, // 分钟
  { value: "seconds", label: "秒" }, // 秒
]; // 列表结束
const decimalOptions = [
  // 小数位可选项
  { value: 0, label: "0" }, // 0位小数
  { value: 1, label: "0.0" }, // 1位小数
  { value: 2, label: "0.00" }, // 2位小数
]; // 列表结束
function getAvailableDecimalOptions(currentPrecision) {
  // 根据精度过滤可选小数位
  if (currentPrecision === "seconds")
    // 秒不允许小数
    return decimalOptions.filter((opt) => opt.value === 0); // 仅0
  if (currentPrecision === "minutes")
    // 分最多1位小数
    return decimalOptions.filter((opt) => opt.value <= 1); // 0或1
  return decimalOptions; // 其他精度：0/1/2均可
} // 函数结束

/* ===== 菜单 toggle：统一走仲裁器（无 eventBus/灰度） ===== */
function toggleMenu(cardType) {
  // 切换某张卡片的菜单
  const key = `menu:standard:${cardType}`; // 会话键：标准卡菜单
  const card = cards[cardType]; // 当前卡片状态

  // 若已是当前激活会话：此次点击视作 toggle → 关闭
  if (isActive(key)) {
    // 仲裁器判断当前会话
    closeActive("toggle"); // 关闭当前会话（原因：toggle）
    // onPreempt/onRelease 会保证 UI isMenuOpen=false（幂等）
    return; // 返回
  }

  // 激活新会话：后触发即取代其它菜单/会话
  activate({
    key, // 会话键
    closers: { esc: true, outside: true }, // 允许 ESC 与外点击关闭
    onPreempt: () => {
      // 被取代或主动关闭前：统一收拢UI
      card.isMenuOpen = false; // 幂等地关闭本卡菜单
    }, // onPreempt 结束
    onRelease: () => {
      // 完成释放：再次兜底关闭
      card.isMenuOpen = false; // 幂等关闭
    }, // onRelease 结束
    getRootEl: () => card.menuEl, // 外点击作用域：菜单容器（包含按钮与面板）
  }); // activate 结束

  // 打开当前菜单（其它菜单会被对方 onPreempt 关闭）
  keys.forEach((type) => {
    // 遍历其余卡
    if (type !== cardType) cards[type].isMenuOpen = false; // 收拢它们
  }); // 遍历结束
  card.isMenuOpen = true; // 打开当前卡菜单
} // toggleMenu 结束

/* ===== 菜单项：变更精度/小数/周首日（变更后收拢菜单并刷新自适配） ===== */
function handlePrecisionChange(cardType, value) {
  // 切换单位精度
  cards[cardType].countdown.setPrecision(value); // 更新精度
  closeAllMenus(); // 收拢所有菜单
  cards[cardType].fontAdapterNeedsRecreate = true; // 标记需要重建字号适配
  scheduleAdaptersImmediate(); // 立即调度刷新
} // 结束
function handleDecimalChange(cardType, value) {
  // 切换小数位
  cards[cardType].countdown.setDecimalPrecision(value); // 更新小数
  closeAllMenus(); // 收拢菜单
  cards[cardType].fontAdapterNeedsRecreate = true; // 标记重建
  scheduleAdaptersImmediate(); // 刷新
} // 结束
function handleWeekStartChange(cardType, value) {
  // 切换周首日
  if (cardType === "week") {
    // 仅周卡有效
    cards[cardType].countdown.setWeekStart(value); // 写入设置
    closeAllMenus(); // 收拢菜单
    scheduleAdaptersImmediate(); // 刷新字号
  } // 条件结束
} // 函数结束

/* ===== 工具：关闭全部菜单（供项变更后使用） ===== */
function closeAllMenus() {
  // 收拢所有卡片菜单
  keys.forEach((type) => {
    // 遍历四张卡
    cards[type].isMenuOpen = false; // 统一关闭
  }); // 遍历结束
} // 函数结束

/* ===== 尺寸观察：监听卡片尺寸以驱动波浪视窗 ===== */
function setupResizeObservers() {
  // 安装多个 ResizeObserver
  const observers = []; // 保存观察器，便于卸载
  keys.forEach((type) => {
    // 遍历卡片
    const card = cards[type]; // 当前卡
    if (card.cardEl) {
      // 存在根元素
      const observer = new ResizeObserver((entries) => {
        // 监听尺寸变化
        if (entries[0]) {
          // 有内容矩形
          const rect = entries[0].contentRect; // 提取
          card.cardWidth = rect.width; // 更新宽度
          card.cardHeight = rect.height; // 更新高度
        } // 条件结束
      }); // 观察器创建
      observer.observe(card.cardEl); // 绑定目标
      observers.push(observer); // 收集以便清理
    } // 条件结束
  }); // 遍历结束
  return () => {
    // 返回清理函数
    observers.forEach((observer) => observer.disconnect()); // 断开全部
  }; // 清理函数结束
} // 函数结束

/* ===== 字号自适应：为每张卡的数字创建/刷新适配器 ===== */
function setupFontAdapters() {
  // 创建或刷新自适应适配器
  keys.forEach((type) => {
    // 遍历四张卡
    const card = cards[type]; // 当前卡
    if (!(card.numberContainerEl && card.numberEl)) return; // 缺引用则跳过

    const needRecreate = // 判断是否需要重建
      card.fontAdapterNeedsRecreate || // 标记强制重建
      !card.fontAdapter || // 尚未创建
      card.fontAdapterContainerEl !== card.numberContainerEl || // 容器变更
      card.fontAdapterTargetEl !== card.numberEl; // 目标变更

    if (needRecreate) {
      // 需要重建
      if (card.fontAdapter) {
        // 若已有实例
        card.fontAdapter.destroy(); // 销毁旧实例
        card.fontAdapter = null; // 置空
      } // 条件结束
      card.fontAdapter = createResponsiveFontAdapter({
        // 创建新实例
        container: card.numberContainerEl, // 容器
        elements: [card.numberEl], // 目标元素
        minSize: window.innerWidth <= 800 ? 24 : 32, // 最小字号（移动端更小）
        debounceDelay: 50, // 防抖
      }); // 适配器创建结束
      card.fontAdapterContainerEl = card.numberContainerEl; // 记录容器缓存
      card.fontAdapterTargetEl = card.numberEl; // 记录目标缓存
      card.fontAdapterNeedsRecreate = false; // 清除重建标记
    } else {
      // 否则，仅刷新
      card.fontAdapter.refresh(); // 刷新测算结果
    } // 分支结束
  }); // 遍历结束
} // 函数结束

/* ===== 调度器：即时/帧合并两路，避免闪动与抖动 ===== */
const {
  // 解构调度器
  scheduleImmediate: scheduleAdaptersImmediate, // 用于内容变更（如文本变化）
  scheduleFrame: scheduleAdaptersFrame, // 用于结构/尺寸变更（如窗口/布局变化）
} = makeFontSchedulers(setupFontAdapters); // 传入执行函数

/* ===== 监听数值文本变化：触发字号即时刷新 ===== */
watch(
  // 监听多个响应式源
  keys.map((type) => () => cards[type].countdown.displayValue), // 四张卡的显示值
  () => {
    // 任一变化
    scheduleAdaptersImmediate(); // 立即刷新自适应
  } // 回调结束
); // watch 结束

/* ===== 生命周期：挂载/卸载 ===== */
let cleanupResizeObservers = null; // 保存尺寸观察清理器

onMounted(() => {
  // 组件挂载
  nextTick(() => {
    // 等DOM稳定
    cleanupResizeObservers = setupResizeObservers(); // 安装尺寸观察器
    scheduleAdaptersFrame(); // 下一帧刷新字号（合并）
  }); // nextTick 结束

  // 本组件不再注册任何“旧路径”的全局监听（外点击/ESC 由仲裁器统一桥接）
}); // onMounted 结束

onUnmounted(() => {
  // 组件卸载
  if (cleanupResizeObservers) cleanupResizeObservers(); // 断开尺寸观察
  keys.forEach((type) => {
    // 销毁各卡字号适配器
    if (cards[type].fontAdapter) cards[type].fontAdapter.destroy(); // 销毁
  }); // 遍历结束
}); // onUnmounted 结束
</script>

<style scoped>
/* 作用域样式：仅影响本组件DOM */
/* 网格容器：自适应列布局，卡片之间留白 */
.countdown-grid {
  /* 网格布局容器 */
  display: grid; /* 使用CSS Grid布局 */
  grid-template-columns: repeat(
    auto-fit,
    minmax(120px, 1fr)
  ); /* 列宽自适应，最小120px */
  gap: 30px; /* 网格间距 */
  margin-bottom: 30px; /* 与下方模块间距 */
} /* 规则结束 */

/* 卡片高度与相对定位（为前景/背景分层提供定位上下文） */
.countdown-card.card-cup {
  /* 卡片本体（杯形风格） */
  position: relative; /* 建立定位上下文 */
  z-index: 0; /* 基础层级 */
  height: 160px; /* 固定高度（桌面） */
} /* 规则结束 */

/* 波浪容器：裁切并承载SVG */
.wave-clip-container {
  /* 承载液体波浪的盒子 */
  position: absolute; /* 绝对定位覆盖卡片 */
  top: 0; /* 上边贴合 */
  left: 0; /* 左边贴合 */
  width: 100%; /* 宽度100% */
  height: 100%; /* 高度100% */
  overflow: hidden; /* 超出裁切 */
  border-radius: inherit; /* 继承卡片圆角 */
  pointer-events: none; /* 不拦截鼠标事件 */
  z-index: 1; /* 位于内容层下方 */
} /* 规则结束 */

/* 液体波浪SVG：全铺并不拦截事件 */
.liquid-svg {
  /* 波浪SVG元素 */
  position: absolute; /* 绝对定位 */
  top: 0; /* 顶部贴合 */
  left: 0; /* 左侧贴合 */
  width: 100%; /* 宽度100% */
  height: 100%; /* 高度100% */
  pointer-events: none; /* 不拦截事件 */
} /* 规则结束 */

/* 内容层：前景内容（标题/数值/单位） */
.card-content {
  /* 卡片内容层 */
  position: absolute; /* 绝对覆盖 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  width: 100%; /* 宽度100% */
  height: 100%; /* 高度100% */
  z-index: 2; /* 位于波浪之上 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 纵向排列 */
  align-items: center; /* 水平居中 */
  justify-content: center; /* 垂直居中 */
  box-sizing: border-box; /* 盒模型 */
  padding: 15px; /* 内边距 */
} /* 规则结束 */

/* 标题区域：放在左上角 */
.card-header {
  /* 标题容器 */
  position: absolute; /* 绝对定位 */
  top: 16px; /* 距顶部16px */
  left: 24px; /* 距左侧24px */
  right: 16px; /* 右侧留白（避免与菜单冲突） */
  text-align: left; /* 左对齐 */
  min-height: 28px; /* 最小高度 */
} /* 规则结束 */

.title {
  /* 标题文本 */
  font-size: 16px; /* 字号 */
  color: var(--text-secondary); /* 次要文字颜色 */
  font-weight: 400; /* 细体 */
  margin: 0; /* 去掉默认外边距 */
  line-height: 1.2; /* 行高 */
} /* 规则结束 */

/* 数值容器：提供字号自适应的测量上下文 */
.number-container {
  /* 数值容器 */
  display: flex; /* 弹性布局 */
  align-items: flex-end; /* 底部对齐，使数字对齐基线 */
  justify-content: center; /* 水平居中 */
  width: 100%; /* 占满宽度 */
  margin-top: 15px; /* 顶部间距 */
  margin-bottom: 15px; /* 底部间距 */
  line-height: 1; /* 行高1，减少空隙 */
  height: 60px; /* 固定容器高度，便于自适配 */
  padding: 0 30px; /* 两侧内边距 */
  box-sizing: border-box; /* 盒模型 */
} /* 规则结束 */

.number {
  /* 主数值样式 */
  display: block; /* 块级显示 */
  font-weight: 600; /* 加粗 */
  white-space: nowrap; /* 不换行，避免断裂 */
  text-align: center; /* 居中 */
  font-size: 52px; /* 初始字号（后续会被自适配缩放） */
} /* 规则结束 */

.unit {
  /* 单位标签 */
  font-weight: 500; /* 中等加粗 */
  color: var(--text-secondary); /* 次要文字颜色 */
  line-height: 1; /* 行高 */
  font-size: 30px; /* 字号 */
} /* 规则结束 */

/* 菜单容器：右上角的设置菜单 */
.settings-menu-container {
  /* 设置菜单容器 */
  position: absolute; /* 绝对定位 */
  top: 8px; /* 距顶部8px */
  right: 6px; /* 距右侧6px */
  z-index: 100; /* 层级较高，盖住波浪/卡片 */
} /* 规则结束 */

.menu-trigger-btn {
  /* 菜单触发按钮 */
  width: 32px; /* 宽32px */
  height: 32px; /* 高32px */
  border: none; /* 去边框 */
  border-radius: 8px; /* 圆角 */
  background: none; /* 透明背景 */
  color: var(--text-secondary); /* 文字/图标颜色 */
  font-size: 16px; /* 字号 */
  font-weight: bold; /* 加粗 */
  cursor: pointer; /* 指针样式 */
  transition: all 0.2s; /* 过渡动画 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
} /* 规则结束 */

.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  /* 悬停或激活时的高亮 */
  background: var(--bg-quaternary); /* 背景高亮 */
  color: var(--text-primary); /* 前景变亮 */
} /* 规则结束 */

.settings-dropdown-panel {
  /* 设置下拉面板 */
  position: absolute; /* 绝对定位（相对容器） */
  top: calc(100% + 5px); /* 按钮下方5px处 */
  right: 0; /* 靠右对齐 */
  background-color: var(--bg-secondary); /* 面板底色 */
  border-radius: 8px; /* 圆角 */
  padding: 0; /* 去内边距（子项自带） */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); /* 阴影 */
  z-index: 1001; /* 高层级 */
  border: 1px solid var(--border-color); /* 细边框 */
  display: flex; /* 多列并排 */
  overflow: hidden; /* 裁切溢出 */
  min-width: max-content; /* 宽度至少包裹子项 */
} /* 规则结束 */

.dropdown-column {
  /* 面板中的一列 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 纵向排列 */
} /* 规则结束 */

.dropdown-column:not(:first-child) {
  /* 除第一列外，左侧加分隔线 */
  border-left: 1px solid var(--border-color); /* 分隔线 */
} /* 规则结束 */

.countdown-card.card-cup.menu-active {
  /* 打开菜单时提升卡片层级 */
  z-index: 50; /* 层级提升，避免被其它元素遮挡 */
} /* 规则结束 */

.menu-option-btn {
  /* 面板内按钮样式 */
  height: 30px; /* 高度30px */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  border: none; /* 无边框 */
  background: var(--bg-secondary); /* 背景同面板 */
  color: var(--text-primary); /* 文字颜色 */
  padding: 0 6px; /* 水平内边距 */
  font-size: 14px; /* 字号 */
  font-weight: 500; /* 中等加粗 */
  cursor: pointer; /* 指针样式 */
  text-align: center; /* 居中 */
  transition: background-color 0.2s; /* 背景过渡 */
  white-space: nowrap; /* 不换行 */
  border-bottom: 1px solid var(--border-color); /* 行分隔线 */
  border-radius: 0; /* 去圆角（与容器统一） */
} /* 规则结束 */

.dropdown-column .menu-option-btn:last-child {
  /* 每列最后一个不画底部分隔线 */
  border-bottom: none; /* 去底线 */
} /* 规则结束 */

.menu-option-btn:hover {
  /* 悬停高亮 */
  background: var(--bg-quaternary); /* 背景变亮 */
} /* 规则结束 */

.menu-option-btn.active {
  /* 选中态高亮 */
  background: var(--green-primary); /* 主题绿 */
  color: var(--bg-primary); /* 前景深 */
  position: relative; /* 覆盖关系更稳 */
  z-index: 2; /* 高一点避免阴影覆盖 */
} /* 规则结束 */

/* 移动端适配：缩小尺寸、调整间距 */
@media (max-width: 800px) {
  /* 窗口<=800px 时 */
  .countdown-grid {
    /* 网格间距与列宽调整 */
    grid-template-columns: repeat(
      auto-fit,
      minmax(150px, 1fr)
    ); /* 更大最小宽度 */
    gap: 20px; /* 缩小间距 */
    margin-bottom: 20px; /* 下边距更小 */
  } /* 规则结束 */
  .countdown-card.card-cup {
    /* 卡片高度缩小 */
    height: 140px; /* 高度140px */
  } /* 规则结束 */
  .card-header {
    /* 标题位置微调 */
    top: 12px; /* 更靠上 */
    left: 16px; /* 更靠左 */
    right: 12px; /* 右侧留白 */
  } /* 规则结束 */
  .settings-menu-container {
    /* 菜单容器位置微调 */
    top: 8px; /* 顶部距离 */
    right: 8px; /* 右侧距离 */
  } /* 规则结束 */
  .number-container {
    /* 数值容器内边距缩小 */
    padding: 0 15px; /* 水平内边距 */
  } /* 规则结束 */
  .number {
    /* 主数值字号缩小 */
    font-size: 48px; /* 字号48px */
  } /* 规则结束 */
  .unit {
    /* 单位字号缩小 */
    font-size: 24px; /* 字号24px */
  } /* 规则结束 */

  .menu-trigger-btn:hover {
    /* 移动端避免悬停高亮影响点击手感 */
    background: transparent; /* 背景透明 */
    color: var(--text-secondary); /* 颜色回到次要 */
  } /* 规则结束 */

  .menu-trigger-btn.active {
    /* 仅在激活时高亮 */
    background: var(--bg-quaternary); /* 背景高亮 */
    color: var(--text-primary); /* 前景变亮 */
  } /* 规则结束 */
} /* 媒体查询结束 */
</style>
