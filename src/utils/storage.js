// ========== storage.js ==========
// 该文件是项目的本地存储管理中心。
// 它封装了所有与浏览器 `localStorage` 的交互操作。
// 通过提供统一的、语义化的函数，可以确保：
// 1. 存储键名（key）集中管理，避免拼写错误。
// 2. 数据格式（如 JSON 转换、数字转换）得到统一处理。
// 3. 组件代码更简洁，无需直接调用 localStorage API。

// --- 存储键名常量 ---
// 将所有 localStorage 中用到的键名以常量的形式集中定义。
// 这是一个最佳实践，可以防止在代码的不同地方使用不一致的或错误的键名。
const STORAGE_KEYS = {
  // 四个主要倒计时卡片的单位设置 ('day', 'hour', 'minute', 'second')
  PRECISION_YEAR: "precision_year",
  PRECISION_QUARTER: "precision_quarter",
  PRECISION_MONTH: "precision_month",
  PRECISION_WEEK: "precision_week",
  // “今日剩余”组件的精度设置 ('s' 或 'ms')
  PRECISION_TODAY: "precision_today",

  // 四个主要倒计时卡片的小数点精度设置 (0, 1, 2)
  DECIMAL_PRECISION_YEAR: "decimal_precision_year",
  DECIMAL_PRECISION_QUARTER: "decimal_precision_quarter",
  DECIMAL_PRECISION_MONTH: "decimal_precision_month",
  DECIMAL_PRECISION_WEEK: "decimal_precision_week",

  // 周卡片的周首日设置 (1 代表周一, 0 代表周日)
  WEEK_START: "week_start",

  // 自定义倒计时事件列表 (存储为一个 JSON 字符串)
  CUSTOM_EVENTS: "custom_events",
};

// --- 通用单位设置函数 ---

// 定义所有被允许的标准单位（必须全部是复数形式，与Luxon/formatters标准对齐）
const VALID_PRECISIONS = [
  "years",
  "quarters",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
];

/**
 * 获取某类型倒计时卡片的单位设置（比如 'days'、'hours'）
 * 自动校正脏数据：
 * - 若localStorage中是空、未定义、单数/旧名、不规范乱值，会主动升级修正后写回持久化
 * - 永远返回合法的、标准的复数单位
 * @param {string} type - 比如 'year'、'quarter'、'week'、'month'、'today'
 * @returns {string} 标准单位名称（如 'days'）
 */
export const getPrecision = (type) => {
  // 按规范动态拼接key，例如 'year' → 'PRECISION_YEAR'
  const key = `precision_${type}`.toUpperCase();

  // 专为 "today" 兼容
  if (type === "today") {
    let value = localStorage.getItem(STORAGE_KEYS[key]);
    if (value === "seconds" || value === "milliseconds") {
      return value;
    }
    // 默认“今日剩余”是“毫秒”
    localStorage.setItem(STORAGE_KEYS[key], "milliseconds");
    return "milliseconds";
  }

  // 从localStorage拿到对应单位设置。若由先前代码写入错误，会直接读到脏数据（如''、undefined、'hour'…）
  let value = localStorage.getItem(STORAGE_KEYS[key]);

  // 兼容老数据，把可能的单数英文主动映射升级为复数
  const legacyMap = {
    year: "years",
    quarter: "quarters",
    month: "months",
    week: "weeks",
    day: "days",
    hour: "hours",
    minute: "minutes",
    second: "seconds",
    millisecond: "milliseconds",
  };

  // 检查当前读到的单位是否合法
  if (!value || !VALID_PRECISIONS.includes(value)) {
    // 如果是可映射的单数老值（如 'day'），则修正升级
    if (legacyMap[value]) {
      value = legacyMap[value];
      localStorage.setItem(STORAGE_KEYS[key], value); // 自动修正写回
      // console.warn(`[storage] precision "${value}" auto-upgraded from legacyKey`);
    } else {
      // 其它无效/空设置，回退到'days'（最安全），并写回覆盖旧的脏数据
      value = "days";
      localStorage.setItem(STORAGE_KEYS[key], value);
      // console.warn(`[storage] precision auto-reset to default for ${key}`);
    }
  }
  // 保证无论内存还是下一次启动都走正确标准
  return value;
};

/**
 * 为指定类型卡片设置并保存单位。
 * @param {string} type - 卡片类型 (如 'year', 'quarter', 'today')。
 * @param {string} precision - 要保存的单位值 (如 'day', 'hour', 's', 'ms')。
 */
export const setPrecision = (type, precision) => {
  // 动态构建键名。
  const key = `precision_${type}`.toUpperCase();
  // 将单位值存入 localStorage。localStorage 只能存储字符串，这里传入的值已经是字符串，无需转换。
  localStorage.setItem(STORAGE_KEYS[key], precision);
};

// --- 通用小数点精度设置函数 ---

/**
 * 获取某类型卡片的小数点精度设置（始终返回0、1、2其中之一）
 * 自动修正所有非数字、不合法值，为0
 * @param {string} type - 比如 'year'、'quarter'、'today'
 * @returns {number} 0、1或2，默认0
 */
export const getDecimalPrecision = (type) => {
  // 动态获得key名，如 'year' → 'DECIMAL_PRECISION_YEAR'
  const key = `decimal_precision_${type}`.toUpperCase();

  // 直接从localStorage拿字符串
  let value = localStorage.getItem(STORAGE_KEYS[key]);

  // 转数字，null/undefined/无效会变NaN
  let numValue = value != null ? parseInt(value) : 0;

  // 检查是否合法（必须在0-2）
  if (isNaN(numValue) || numValue < 0 || numValue > 2) {
    numValue = 0; // 修正到安全默认
    localStorage.setItem(STORAGE_KEYS[key], "0"); // 自动覆盖坏值
    // console.warn(`[storage] decimal_precision auto-reset to 0 for ${key}`);
  }
  return numValue;
};

/**
 * 为指定类型卡片设置并保存小数点精度。
 * @param {string} type - 卡片类型。
 * @param {number} precision - 要保存的精度值 (0, 1, 2)。
 */
export const setDecimalPrecision = (type, precision) => {
  // 动态构建键名。
  const key = `decimal_precision_${type}`.toUpperCase();
  // 在存入 localStorage 前，必须将数字 `precision` 转换为字符串。
  localStorage.setItem(STORAGE_KEYS[key], precision.toString());
};

// --- 周首日设置函数 ---

/**
 * 获取“周首日”设置，只允许0（周日）或1（周一）
 * 遇到其他乱值自动升级修正回1
 * @returns {number} 0或1，默认是1
 */
export const getWeekStart = () => {
  // 把本地设置读出来（字符串、可能是undefined或脏值）
  let value = localStorage.getItem(STORAGE_KEYS.WEEK_START);

  // 强制转数字，undefined/null会变为1
  let numValue = value != null ? parseInt(value) : 1;

  // 若不合法（不是0不是1，是NaN或任何乱值），自动修正回1
  if (isNaN(numValue) || (numValue !== 0 && numValue !== 1)) {
    numValue = 1; // 最安全默认
    localStorage.setItem(STORAGE_KEYS.WEEK_START, "1"); // 自动覆盖坏值
    // console.warn(`[storage] week_start auto-reset to 1`);
  }
  return numValue;
};

/**
 * 设置并保存周首日。
 * @param {number} value - 要保存的值 (1 或 0)。
 */
export const setWeekStart = (value) => {
  // 在存入前，将数字转换为字符串。
  localStorage.setItem(STORAGE_KEYS.WEEK_START, value.toString());
};

// --- 自定义倒计时事件的增删改查 (CRUD) 函数 ---

/**
 * 获取所有自定义倒计时事件的列表。
 * @returns {Array} - 包含所有事件对象的数组。如果未找到，则返回一个空数组。
 */
export const getCustomEvents = () => {
  // 从 localStorage 读取存储事件列表的 JSON 字符串。
  const events = localStorage.getItem(STORAGE_KEYS.CUSTOM_EVENTS);
  // 如果 `events` 字符串存在，则使用 `JSON.parse` 将其从 JSON 字符串转换回 JavaScript 数组。
  // 如果不存在，返回一个空数组 `[]`，以确保调用此函数的代码总能安全地对返回值进行数组操作（如 .map, .filter）。
  return events ? JSON.parse(events) : [];
};

/**
 * 保存整个自定义事件列表。
 * @param {Array} events - 包含所有事件对象的完整数组。
 */
export const saveCustomEvents = (events) => {
  // 使用 `JSON.stringify` 将整个事件数组转换为一个 JSON 格式的字符串。
  // 这是在 localStorage 中存储复杂数据结构（如数组或对象）的标准方法。
  localStorage.setItem(STORAGE_KEYS.CUSTOM_EVENTS, JSON.stringify(events));
};

/**
 * 添加一个新的自定义事件到列表中。
 * @param {object} event - 不包含 id 和 createdAt 的新事件对象。
 * @returns {object} - 包含新生成的 id 和 createdAt 的完整事件对象。
 */
export const addCustomEvent = (event) => {
  // 1. 获取当前已有的所有事件。
  const events = getCustomEvents();
  // 2. 创建一个完整的新事件对象，为其分配一个唯一的ID（使用当前时间戳）和创建时间。
  const newEvent = {
    id: Date.now(),
    ...event,
    createdAt: new Date().toISOString(),
  };
  // 3. 将新事件添加到数组的末尾。
  events.push(newEvent);
  // 4. 将修改后的整个数组保存回 localStorage。
  saveCustomEvents(events);
  // 5. 返回创建的新事件，这对于UI即时更新非常有用。
  return newEvent;
};

/**
 * 从列表中删除一个指定ID的事件。
 * @param {number} id - 要删除的事件的ID。
 */
export const removeCustomEvent = (id) => {
  // 1. 获取当前的所有事件。
  const events = getCustomEvents();
  // 2. 使用 `Array.prototype.filter` 创建一个新数组，
  //    这个新数组包含所有 `id` 不等于传入 `id` 的事件。
  const filtered = events.filter((event) => event.id !== id);
  // 3. 将这个被过滤后的新数组保存回 localStorage，从而完成删除操作。
  saveCustomEvents(filtered);
};
