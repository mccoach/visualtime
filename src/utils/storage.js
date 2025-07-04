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

// 获取精度设置
export const getPrecision = (type) => {
  const key = `precision_${type}`
  return localStorage.getItem(STORAGE_KEYS[key.toUpperCase()]) || 'day'
}

// 设置精度
export const setPrecision = (type, precision) => {
  const key = `precision_${type}`
  localStorage.setItem(STORAGE_KEYS[key.toUpperCase()], precision)
}

// 获取小数精度设置
export const getDecimalPrecision = (type) => {
  const key = `decimal_precision_${type}`
  const value = localStorage.getItem(STORAGE_KEYS[key.toUpperCase()])
  return value ? parseInt(value) : 0
}

// 设置小数精度
export const setDecimalPrecision = (type, precision) => {
  const key = `decimal_precision_${type}`
  localStorage.setItem(STORAGE_KEYS[key.toUpperCase()], precision.toString())
}

// 获取周起始日设置
export const getWeekStart = () => {
  return parseInt(localStorage.getItem(STORAGE_KEYS.WEEK_START) || '1')
}

// 设置周起始日
export const setWeekStart = (value) => {
  localStorage.setItem(STORAGE_KEYS.WEEK_START, value.toString())
}

// 获取自定义事件
export const getCustomEvents = () => {
  const events = localStorage.getItem(STORAGE_KEYS.CUSTOM_EVENTS)
  return events ? JSON.parse(events) : []
}

// 保存自定义事件
export const saveCustomEvents = (events) => {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_EVENTS, JSON.stringify(events))
}

// 添加自定义事件
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

// 删除自定义事件
export const removeCustomEvent = (id) => {
  const events = getCustomEvents()
  const filtered = events.filter(event => event.id !== id)
  saveCustomEvents(filtered)
}
