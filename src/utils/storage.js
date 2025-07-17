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
  PRECISION_YEAR: 'precision_year',
  PRECISION_QUARTER: 'precision_quarter',
  PRECISION_MONTH: 'precision_month',
  PRECISION_WEEK: 'precision_week',
  // “今日剩余”组件的精度设置 ('s' 或 'ms')
  PRECISION_TODAY: 'precision_today',

  // 四个主要倒计时卡片的小数点精度设置 (0, 1, 2)
  DECIMAL_PRECISION_YEAR: 'decimal_precision_year',
  DECIMAL_PRECISION_QUARTER: 'decimal_precision_quarter',
  DECIMAL_PRECISION_MONTH: 'decimal_precision_month',
  DECIMAL_PRECISION_WEEK: 'decimal_precision_week',

  // 周卡片的周首日设置 (1 代表周一, 0 代表周日)
  WEEK_START: 'week_start',

  // 自定义倒计时事件列表 (存储为一个 JSON 字符串)
  CUSTOM_EVENTS: 'custom_events'
};

// --- 通用单位设置函数 ---

/**
 * 获取指定类型卡片的单位设置。
 * @param {string} type - 卡片类型 (如 'year', 'quarter', 'today')。
 * @returns {string} - 保存的单位值。如果未找到，则返回默认值。
 */
export const getPrecision = (type) => {
  // 根据传入的类型动态构建在 STORAGE_KEYS 中对应的键名，例如 type='year' -> 'PRECISION_YEAR'。
  const key = `precision_${type}`.toUpperCase();
  // 从 localStorage 读取数据。如果 getItem 返回 null (即从未设置过)，
  // 则 `||` 操作符会返回一个默认值 'day' (这个默认值在 TodayCountdown 组件中会被覆盖)。
  return localStorage.getItem(STORAGE_KEYS[key]) || 'day';
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
 * 获取指定类型卡片的小数点精度设置。
 * @param {string} type - 卡片类型 (如 'year', 'quarter')。
 * @returns {number} - 保存的精度值 (0, 1, 2)。如果未找到，则返回默认值 0。
 */
export const getDecimalPrecision = (type) => {
  // 动态构建键名。
  const key = `decimal_precision_${type}`.toUpperCase();
  // 从 localStorage 获取保存的字符串值 (例如 '0', '1', '2')。
  const value = localStorage.getItem(STORAGE_KEYS[key]);
  // 因为 localStorage 存的是字符串，所以需要转换回数字。
  // 如果 `value` 存在 (不为 null 或 undefined)，则用 parseInt 转换；否则，返回默认值 0。
  return value ? parseInt(value) : 0;
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
 * 获取周首日的设置。
 * @returns {number} - 1 代表周一，0 代表周日。如果未找到，则默认返回 1 (周一)。
 */
export const getWeekStart = () => {
  // 从 localStorage 获取值，并使用 parseInt 将其转换为数字。
  // 如果 `getItem` 返回 null，`parseInt(null)` 是 NaN，此时 `|| '1'` 会提供默认值 '1'，再进行转换。
  return parseInt(localStorage.getItem(STORAGE_KEYS.WEEK_START) || '1');
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
  const newEvent = { id: Date.now(), ...event, createdAt: new Date().toISOString() };
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
  const filtered = events.filter(event => event.id !== id);
  // 3. 将这个被过滤后的新数组保存回 localStorage，从而完成删除操作。
  saveCustomEvents(filtered);
};
