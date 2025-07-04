// ========== src/utils/dateUtils.js ==========
// 使用 lunar-javascript 作为唯一农历/节气计算源
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
// ⭐正确引入 Solar 对象，必须有 { Solar }
import { Solar } from 'lunar-javascript'

dayjs.locale('zh-cn')
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)

/**
 * 获取今天（或指定日期）的农历、天干地支、生肖、节气信息
 * 精确，自动随年份变化
 * @param {Date} date - 可传指定日期，默认今天
 * @returns {Object} 包含 ganZhiYear, zodiac, lunarMonth, lunarDay, jieQi, fullInfo
 */
export const getLunarInfo = (date = new Date()) => {
  try {
    // ⭐solar转农历、查节气
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    const ganZhiYear = lunar.getYearInGanZhi()      // 天干地支
    const zodiac = lunar.getYearShengXiao()         // 生肖（如"龙"）
    const lunarMonth = lunar.isLeap()
      ? `闰${lunar.getMonthInChinese()}`
      : lunar.getMonthInChinese()
    const lunarDay = lunar.getDayInChinese()
    const jieQi = lunar.getJieQi() || ''            // 如果当天为节气日才不为空
    return {
      ganZhiYear,
      zodiac,
      lunarMonth,
      lunarDay,
      jieQi,
      fullInfo: `${ganZhiYear}${zodiac}年 农历${lunarMonth}${lunarDay}${jieQi ? ' · ' + jieQi : ''}`
    }
  } catch (err) {
    // 输出详细报错，方便排查 while dev
    console.error('农历信息异常', err)
    return { ganZhiYear: '', zodiac: '', lunarMonth: '', lunarDay: '', jieQi: '', fullInfo: '(农历信息加载失败)' }
  }
}

/** 公历格式化后的字符串，如"2025年04月06日 星期日" */
export const formatDate = (date) => dayjs(date).format('YYYY年MM月DD日 dddd')

/** 当前hh:mm:ss，纯数字字符串对象 */
export const getCurrentTime = () => {
  const now = dayjs()
  return {
    hours: String(now.hour()).padStart(2, '0'),
    minutes: String(now.minute()).padStart(2, '0'),
    seconds: String(now.second()).padStart(2, '0')
  }
}

/** 今日倒计时（精确到毫秒） */
export const getTodayRemaining = () => {
  const now = dayjs()
  const endOfDay = now.endOf('day')
  const diff = endOfDay.diff(now)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  const milliseconds = diff % 1000
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    milliseconds: String(milliseconds).padStart(3, '0')
  }
}

// 以下倒计时计算逻辑与原有一致，直接沿用
export const getYearRemaining = (precision = 'day') => {
  const now = dayjs(), endOfYear = now.endOf('year')
  return calculateRemaining(now, endOfYear, precision)
}
export const getQuarterRemaining = (precision = 'day') => {
  const now = dayjs(), endOfQuarter = now.endOf('quarter')
  return calculateRemaining(now, endOfQuarter, precision)
}
export const getMonthRemaining = (precision = 'day') => {
  const now = dayjs(), endOfMonth = now.endOf('month')
  return calculateRemaining(now, endOfMonth, precision)
}
export const getWeekRemaining = (precision = 'day', weekStart = 1) => {
  const now = dayjs()
  let endOfWeek
  if (weekStart === 1) endOfWeek = now.endOf('week').add(1, 'day')
  else endOfWeek = now.endOf('week')
  return calculateRemaining(now, endOfWeek, precision)
}
const calculateRemaining = (start, end, precision) => {
  const diff = end.diff(start)
  switch (precision) {
    case 'day':    return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(2))
    case 'hour':   return parseFloat((diff / (1000 * 60 * 60)).toFixed(2))
    case 'second': return Math.ceil(diff / 1000)
    default:       return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(2))
  }
}
/** 自定义倒计时，天数 */
export const getCustomCountdown = (targetDate) => {
  const now = dayjs()
  const target = dayjs(targetDate)
  const diff = target.diff(now, 'day')
  return diff > 0 ? diff : 0
}
