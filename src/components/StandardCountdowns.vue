<!-- E:\AppProject\VisualTime\src\components\StandardCountdowns.vue (模板去重 + 刷新优先 + rAF 批处理) -->
<template>
  <div class="countdown-grid">
    <div
      v-for="meta in cardMeta"
      :key="meta.key"
      class="countdown-card card card-cup"
      :class="{ 'menu-active': cards[meta.key].isMenuOpen }"
      :ref="(el) => setCardRef(meta.key, el)"
    >
      <div class="wave-clip-container">
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
          <path
            :d="cards[meta.key].wavePath"
            :fill="meta.color"
            fill-opacity="0.1"
          />
        </svg>
      </div>

      <div class="card-content">
        <div
          class="settings-menu-container"
          :ref="(el) => setMenuRef(meta.key, el)"
          @click.stop
        >
          <button
            class="menu-trigger-btn"
            @click="toggleMenu(meta.key)"
            :class="{ active: cards[meta.key].isMenuOpen }"
            title="设置"
          >
            ⋮
          </button>
          <div
            v-if="cards[meta.key].isMenuOpen"
            class="settings-dropdown-panel"
          >
            <div class="dropdown-column">
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
              </button>
            </div>
            <div class="dropdown-column">
              <button
                v-for="d in getAvailableDecimalOptions(
                  cards[meta.key].countdown.precision
                )"
                :key="d.value"
                :class="[
                  'menu-option-btn',
                  {
                    active:
                      cards[meta.key].countdown.decimalPrecision === d.value,
                  },
                ]"
                @click="handleDecimalChange(meta.key, d.value)"
              >
                {{ d.label }}
              </button>
            </div>
            <div v-if="meta.key === 'week'" class="dropdown-column">
              <button
                :class="[
                  'menu-option-btn',
                  { active: cards.week.countdown.weekStart === 1 },
                ]"
                @click="handleWeekStartChange('week', 1)"
              >
                一
              </button>
              <button
                :class="[
                  'menu-option-btn',
                  { active: cards.week.countdown.weekStart === 0 },
                ]"
                @click="handleWeekStartChange('week', 0)"
              >
                日
              </button>
            </div>
          </div>
        </div>

        <div class="card-header">
          <h3 class="title">{{ meta.title }}</h3>
        </div>

        <div
          class="number-container"
          :ref="(el) => setNumberContainerRef(meta.key, el)"
        >
          <span
            class="number"
            :ref="(el) => setNumberRef(meta.key, el)"
            :style="{ color: meta.color }"
          >
            {{ cards[meta.key].countdown.displayValue }}
          </span>
        </div>

        <div class="unit">{{ cards[meta.key].countdown.unitLabel }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  reactive,
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import { useCountdown } from "../composables/useCountdown.js";
import { useNaturalWave } from "../composables/useNaturalWave.js";
import {
  broadcastMenuOpened,
  listenForOtherMenuOpened,
} from "../utils/eventBus.js";
import {
  createResponsiveFontAdapter,
  makeFontSchedulers,
} from "../utils/fontSizeManager.js";

const cardMeta = [
  { key: "year", title: "本年剩余", color: "var(--green-primary)" },
  { key: "quarter", title: "本季剩余", color: "var(--green-secondary)" },
  { key: "month", title: "本月剩余", color: "var(--green-tertiary)" },
  { key: "week", title: "本周剩余", color: "var(--green-quaternary)" },
];
const keys = cardMeta.map((m) => m.key);

function createCardState(type, color) {
  const countdown = useCountdown(type);
  const cardWidth = ref(260);
  const cardHeight = ref(160);
  const wave = useNaturalWave({
    width: cardWidth,
    height: cardHeight,
    progress: countdown.progress,
  });
  return {
    type,
    color,
    countdown,
    wavePath: computed(() => wave.liquidPath.value),
    cardWidth,
    cardHeight,
    isMenuOpen: false,
    cardEl: null,
    menuEl: null,
    numberContainerEl: null,
    numberEl: null,
    fontAdapter: null,
    fontAdapterContainerEl: null,
    fontAdapterTargetEl: null,
    fontAdapterNeedsRecreate: true,
  };
}

const cards = reactive({
  year: createCardState("year", "var(--green-primary)"),
  quarter: createCardState("quarter", "var(--green-secondary)"),
  month: createCardState("month", "var(--green-tertiary)"),
  week: createCardState("week", "var(--green-quaternary)"),
});

function setCardRef(type, el) {
  if (el && cards[type]) cards[type].cardEl = el;
}
function setMenuRef(type, el) {
  if (el && cards[type]) cards[type].menuEl = el;
}
function setNumberContainerRef(type, el) {
  if (el && cards[type]) cards[type].numberContainerEl = el;
}
function setNumberRef(type, el) {
  if (el && cards[type]) cards[type].numberEl = el;
}

const precisions = [
  { value: "days", label: "天" },
  { value: "hours", label: "时" },
  { value: "minutes", label: "分" },
  { value: "seconds", label: "秒" },
];
const decimalOptions = [
  { value: 0, label: "0" },
  { value: 1, label: "0.0" },
  { value: 2, label: "0.00" },
];
function getAvailableDecimalOptions(currentPrecision) {
  if (currentPrecision === "seconds")
    return decimalOptions.filter((opt) => opt.value === 0);
  if (currentPrecision === "minutes")
    return decimalOptions.filter((opt) => opt.value <= 1);
  return decimalOptions;
}

function toggleMenu(cardType) {
  const card = cards[cardType];
  const willOpen = !card.isMenuOpen;
  if (willOpen) broadcastMenuOpened(`countdown-card-${cardType}`);
  keys.forEach((type) => {
    if (type !== cardType) cards[type].isMenuOpen = false;
  });
  card.isMenuOpen = willOpen;
}
function closeAllMenus() {
  keys.forEach((type) => {
    cards[type].isMenuOpen = false;
  });
}

function handlePrecisionChange(cardType, value) {
  cards[cardType].countdown.setPrecision(value);
  closeAllMenus();
  cards[cardType].fontAdapterNeedsRecreate = true;
  scheduleAdaptersImmediate();
}
function handleDecimalChange(cardType, value) {
  cards[cardType].countdown.setDecimalPrecision(value);
  closeAllMenus();
  cards[cardType].fontAdapterNeedsRecreate = true;
  scheduleAdaptersImmediate();
}
function handleWeekStartChange(cardType, value) {
  if (cardType === "week") {
    cards[cardType].countdown.setWeekStart(value);
    closeAllMenus();
    scheduleAdaptersImmediate();
  }
}

function setupResizeObservers() {
  const observers = [];
  keys.forEach((type) => {
    const card = cards[type];
    if (card.cardEl) {
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          const rect = entries[0].contentRect;
          card.cardWidth = rect.width;
          card.cardHeight = rect.height;
        }
      });
      observer.observe(card.cardEl);
      observers.push(observer);
    }
  });
  return () => {
    observers.forEach((observer) => observer.disconnect());
  };
}

function setupFontAdapters() {
  keys.forEach((type) => {
    const card = cards[type];
    if (!(card.numberContainerEl && card.numberEl)) return;

    const needRecreate =
      card.fontAdapterNeedsRecreate ||
      !card.fontAdapter ||
      card.fontAdapterContainerEl !== card.numberContainerEl ||
      card.fontAdapterTargetEl !== card.numberEl;

    if (needRecreate) {
      if (card.fontAdapter) {
        card.fontAdapter.destroy();
        card.fontAdapter = null;
      }
      card.fontAdapter = createResponsiveFontAdapter({
        container: card.numberContainerEl,
        elements: [card.numberEl],
        minSize: window.innerWidth <= 800 ? 24 : 32,
        debounceDelay: 50,
      });
      card.fontAdapterContainerEl = card.numberContainerEl;
      card.fontAdapterTargetEl = card.numberEl;
      card.fontAdapterNeedsRecreate = false;
    } else {
      card.fontAdapter.refresh();
    }
  });
}

const {
  scheduleImmediate: scheduleAdaptersImmediate,
  scheduleFrame: scheduleAdaptersFrame,
} = makeFontSchedulers(setupFontAdapters);

watch(
  keys.map((type) => () => cards[type].countdown.displayValue),
  () => {
    scheduleAdaptersImmediate();
  }
);

function handleGlobalClick(event) {
  const clickedInsideMenu = keys.some((type) =>
    cards[type].menuEl?.contains(event.target)
  );
  if (!clickedInsideMenu) closeAllMenus();
}
function handleGlobalKeydown(event) {
  if (event.key === "Escape" || event.key === "Esc") closeAllMenus();
}

let cleanupMenuListeners = [];
let cleanupResizeObservers = null;

onMounted(() => {
  nextTick(() => {
    cleanupResizeObservers = setupResizeObservers();
    scheduleAdaptersFrame();
  });
  document.addEventListener("click", handleGlobalClick, true);
  document.addEventListener("keydown", handleGlobalKeydown);
  cleanupMenuListeners = keys.map((type) =>
    listenForOtherMenuOpened(`countdown-card-${type}`, () => {
      cards[type].isMenuOpen = false;
    })
  );
});

onUnmounted(() => {
  document.removeEventListener("click", handleGlobalClick, true);
  document.removeEventListener("keydown", handleGlobalKeydown);
  cleanupMenuListeners.forEach((cleanup) => cleanup());
  if (cleanupResizeObservers) cleanupResizeObservers();
  keys.forEach((type) => {
    if (cards[type].fontAdapter) cards[type].fontAdapter.destroy();
  });
});
</script>

<style scoped>
.countdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}
.countdown-card.card-cup {
  position: relative;
  z-index: 0;
  height: 160px;
}
.wave-clip-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
}
.liquid-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.card-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 15px;
}
.card-header {
  position: absolute;
  top: 16px;
  left: 24px;
  right: 16px;
  text-align: left;
  min-height: 28px;
}
.title {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 400;
  margin: 0;
  line-height: 1.2;
}
.number-container {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  margin-top: 15px;
  margin-bottom: 15px;
  line-height: 1;
  height: 60px;
  padding: 0 30px;
  box-sizing: border-box;
}
.number {
  display: block;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
  font-size: 52px;
}
.unit {
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1;
  font-size: 30px;
}
.settings-menu-container {
  position: absolute;
  top: 8px;
  right: 6px;
  z-index: 100;
}
.menu-trigger-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.menu-trigger-btn:hover,
.menu-trigger-btn.active {
  background: var(--bg-quaternary);
  color: var(--text-primary);
}
.settings-dropdown-panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  border: 1px solid var(--border-color);
  display: flex;
  overflow: hidden;
  min-width: max-content;
}
.dropdown-column {
  display: flex;
  flex-direction: column;
}
.dropdown-column:not(:first-child) {
  border-left: 1px solid var(--border-color);
}
.countdown-card.card-cup.menu-active {
  z-index: 50;
}
.menu-option-btn {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 0 6px;
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
  position: relative;
  z-index: 2;
}

@media (max-width: 800px) {
  .countdown-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }
  .countdown-card.card-cup {
    height: 140px;
  }
  .card-header {
    top: 12px;
    left: 16px;
    right: 12px;
  }
  .settings-menu-container {
    top: 8px;
    right: 8px;
  }
  .number-container {
    padding: 0 15px;
  }
  .number {
    font-size: 48px;
  }
  .unit {
    font-size: 24px;
  }
}
</style>
