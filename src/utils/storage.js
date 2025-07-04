// ========== storage.js ==========
// 负责所有本地持久化设置的读写，包括倒计时精度、周起始日、自定义倒计时记录

// Key常量，保证一致性和易于批量维护
const STORAGE_KEYS = {
  PRECISION_YEAR: 'precision_year',
  PRECISION_QUARTER: 'precision_quarter',
  PRECISION_MONTH: 'precision_month',
  PRECISION_WEEK: 'precision_week',
  DECIMAL_PRECISION_YEAR: 'decimal_precision_year',
  DECIMAL_PRECISION_QUARTER: 'decimal_precision_quarter',
  DECIMAL_PRECISION_MONTH: 'decimal_precision_month',
  DECIMAL_PRECISION_WEEK: 'decimal_precision_week',
  WEEK_START: 'week_start',
  CUSTOM_EVENTS: 'custom_events'
}

// ==== 精度设置获取和保存 ====
// @param type: 'year'|'quarter'|'month'|'week'
// 读取指定单位的天/小时/秒精度
export const getPrecision = (type) => {
  const key = `precision_${type}`.toUpperCase()
  return localStorage.getItem(STORAGE_KEYS[key]) || 'day'
}
// 保存指定单位的精度
export const setPrecision = (type, precision) => {
  const key = `precision_${type}`.toUpperCase()
  localStorage.setItem(STORAGE_KEYS[key], precision)
}

// ==== 小数点精度设置 ====
// 读取单位小数点格式
export const getDecimalPrecision = (type) => {
  const key = `decimal_precision_${type}`.toUpperCase()
  const value = localStorage.getItem(STORAGE_KEYS[key])
  return value ? parseInt(value) : 0
}
// 保存单位小数点格式
export const setDecimalPrecision = (type, precision) => {
  const key = `decimal_precision_${type}`.toUpperCase()
  localStorage.setItem(STORAGE_KEYS[key], precision.toString())
}

// ==== 周起始日，1为周一，0为周日 ====
// 读取
export const getWeekStart = () => {
  return parseInt(localStorage.getItem(STORAGE_KEYS.WEEK_START) || '1')
}
// 保存
export const setWeekStart = (value) => {
  localStorage.setItem(STORAGE_KEYS.WEEK_START, value.toString())
}

// ==== 自定义倒计时记录 ====
// 获取全部已保存自定义事件
export const getCustomEvents = () => {
  const events = localStorage.getItem(STORAGE_KEYS.CUSTOM_EVENTS)
  return events ? JSON.parse(events) : []
}
// 保存全部自定义事件（覆盖全部）
export const saveCustomEvents = (events) => {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_EVENTS, JSON.stringify(events))
}
// 添加单条自定义事件
export const addCustomEvent = (event) => {
  const events = getCustomEvents()
  const newEvent = {
    id: Date.now(),
    ...event,
    createdAt: new Date().toISOString()
  }
  events.push(newEvent)
  saveCustomEvents(events)
  return newEvent
}
// 删除单条
export const removeCustomEvent = (id) => {
  const events = getCustomEvents()
  const filtered = events.filter(event => event.id !== id)
  saveCustomEvents(filtered)
}
