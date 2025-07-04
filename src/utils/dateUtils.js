// ========== dateUtils.js ==========
// 本文件负责阳历/农历/节气/天干地支/生肖信息等所有时间工具，
// 现在全部用 lunar-javascript 方案，消除所有静态表

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { Solar } from 'lunar-javascript' // ⭐powerful农历节气库

dayjs.locale('zh-cn')
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)

/**
 * 精确获取今天的农历信息，包括：
 * - 天干地支年份
 * - 生肖
 * - 农历月份日及润月
 * - 节气（如果当前日为节气则直接显示，否则为空）
 * @param {Date} date 若不传默认今天
 */
export const getLunarInfo = (date = new Date()) => {
  try {
    // 通过 lunar-javascript 获取天文/官方农历信息
    const solar = Solar.fromDate(date)           // 公历转阳历对象
    const lunar = solar.getLunar()               // 转农历对象

    // 天干地支年份，如 甲辰
    const ganZhiYear = lunar.getYearInGanZhi()

    // 生肖，如 "龙"
    const zodiac = lunar.getYearShengXiao()

    // 农历月份（润月自动带“闰”字）、农历日
    const lunarMonth = lunar.getMonthInChinese()         // 如"正月"
    const lunarDay   = lunar.getDayInChinese()           // 如"初五"
    const isLeap = lunar.isLeap()                        // 是否润月
    const lunarMonthStr = isLeap ? `闰${lunarMonth}` : lunarMonth

    // 当天节气名称（如果是节气日，否则为空字符串）
    const jieQi = lunar.getJieQi() || ''

    // （可选）获取本年全部节气日期表，如需做日历高亮
    // const allJieQiTable = lunar.getJieQiTable()

    return {
      ganZhiYear,
      zodiac,
      lunarMonth: lunarMonthStr,
      lunarDay,
      jieQi,
      // 合成完整描述，例如“甲辰龙年 农历二月初八 · 惊蛰”
      fullInfo: `${ganZhiYear}${zodiac}年 农历${lunarMonthStr}${lunarDay}${jieQi ? ' · ' + jieQi : ''}`
    }
  } catch (err) {
    return { ganZhiYear: '', zodiac: '', lunarMonth: '', lunarDay: '', jieQi: '', fullInfo: '（农历信息加载失败）' }
  }
}

/**
 * 阳历格式化YYYY年MM月DD日 dddd
 */
export const formatDate = (date) => dayjs(date).format('YYYY年MM月DD日 dddd')

/**
 * 当前时分秒（hh:mm:ss），用于时间数码管/倒计时
 */
export const getCurrentTime = () => {
  const now = dayjs()
  return {
    hours: String(now.hour()).padStart(2, '0'),
    minutes: String(now.minute()).padStart(2, '0'),
    seconds: String(now.second()).padStart(2, '0')
  }
}

/**
 * 今日剩余时间倒计时（精确到毫秒）
 */
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

// ====== 剩余倒计时主算法，和农历无关部分（保留） ======
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

/* 通用剩余数算法（天、小时、秒，小数） */
const calculateRemaining = (start, end, precision) => {
  const diff = end.diff(start)
  switch (precision) {
    case 'day':    return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(2))
    case 'hour':   return parseFloat((diff / (1000 * 60 * 60)).toFixed(2))
    case 'second': return Math.ceil(diff / 1000)
    default:       return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(2))
  }
}

/**
 * 自定义日期倒计天数
 */
export const getCustomCountdown = (targetDate) => {
  const now = dayjs()
  const target = dayjs(targetDate)
  const diff = target.diff(now, 'day')
  return diff > 0 ? diff : 0
}
