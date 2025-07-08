// ========== storage.js ==========
// 局部状态类数据的本地持久化存储、读取、删除
// 精度配置、周首日配置、自定义倒计时均适用

// 所有用到的localStorage key集合。集中定义，保证不出错也方便扩展。
const STORAGE_KEYS = {
  PRECISION_YEAR: 'precision_year',           // "天/小时/分钟/秒"
  PRECISION_QUARTER: 'precision_quarter',
  PRECISION_MONTH: 'precision_month',
  PRECISION_WEEK: 'precision_week',
  DECIMAL_PRECISION_YEAR: 'decimal_precision_year',      // 小数点精度
  DECIMAL_PRECISION_QUARTER: 'decimal_precision_quarter',
  DECIMAL_PRECISION_MONTH: 'decimal_precision_month',
  DECIMAL_PRECISION_WEEK: 'decimal_precision_week',
  WEEK_START: 'week_start',                   // 周首日切换（1/0）
  CUSTOM_EVENTS: 'custom_events'              // 所有自定义倒计时条目
}

// -- 精度主单位设置万能存取 --
export const getPrecision = (type) => {
  const key = `precision_${type}`.toUpperCase()
  return localStorage.getItem(STORAGE_KEYS[key]) || 'day'
}
export const setPrecision = (type, precision) => {
  const key = `precision_${type}`.toUpperCase()
  localStorage.setItem(STORAGE_KEYS[key], precision)
}

// -- 小数点精度设置存取（可选0/1/2） --
export const getDecimalPrecision = (type) => {
  const key = `decimal_precision_${type}`.toUpperCase()
  const value = localStorage.getItem(STORAGE_KEYS[key])
  return value ? parseInt(value) : 0
}
export const setDecimalPrecision = (type, precision) => {
  const key = `decimal_precision_${type}`.toUpperCase()
  localStorage.setItem(STORAGE_KEYS[key], precision.toString())
}

// -- 周首日设置，1为周一，0为周日 --
export const getWeekStart = () => {
  return parseInt(localStorage.getItem(STORAGE_KEYS.WEEK_START) || '1')
}
export const setWeekStart = (value) => {
  localStorage.setItem(STORAGE_KEYS.WEEK_START, value.toString())
}

// -- 自定义倒计时数据：全部为列表 --
export const getCustomEvents = () => {
  const events = localStorage.getItem(STORAGE_KEYS.CUSTOM_EVENTS)
  return events ? JSON.parse(events) : []
}
export const saveCustomEvents = (events) => {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_EVENTS, JSON.stringify(events))
}
export const addCustomEvent = (event) => {
  const events = getCustomEvents()
  const newEvent = { id: Date.now(), ...event, createdAt: new Date().toISOString() }
  events.push(newEvent)
  saveCustomEvents(events)
  return newEvent
}
export const removeCustomEvent = (id) => {
  const events = getCustomEvents()
  const filtered = events.filter(event => event.id !== id)
  saveCustomEvents(filtered)
}
