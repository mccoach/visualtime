// ========== dateUtils.js ==========
// 所有公历/农历/节气精算功能，全部采用 lunar-javascript 官方推荐API；无任何静态节气表

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

// 第三方高精度农历节气库（已安装npm i lunar-javascript）:
import { Solar } from 'lunar-javascript'

dayjs.locale('zh-cn')
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)

/**
 * 获取当天精确农历和节气等全部信息（天干地支/生肖/农历日期/节气）
 * @param {Date} date 默认今天
 * @returns {Object}
 */

export const getLunarInfo = (date = new Date()) => {
  try {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    const ganZhiYear = lunar.getYearInGanZhi()
    const zodiac = lunar.getYearShengXiao()
    const lunarMonth = lunar.getMonthInChinese() + '月';   // 强制加“月”字
    const lunarDay = lunar.getDayInChinese()
    const jieQiToday = lunar.getJieQi() || ''
    const jieQiTable = lunar.getJieQiTable()

    const isLeap = lunar.isLeapMonth && lunar.isLeapMonth();
    if (isLeap) lunarMonth = '闰' + lunarMonth;
    
    let currentJieQi = ''
    let jieQiDayNum = 0
    // 解析date为 y, m, d
    const y = solar.getYear()
    const m = solar.getMonth()
    const d = solar.getDay()
    const dateSolar = Solar.fromYmd(y, m, d)
    let prevName = '', prevSolar = null

    Object.entries(jieQiTable).forEach(([name, sol]) => {
      if (
        sol.getYear() < y ||
        (sol.getYear() === y && (sol.getMonth() < m || (sol.getMonth() === m && sol.getDay() <= d)))
      ) {
        if (
          !prevSolar ||
          sol.getYear() > prevSolar.getYear() ||
          (sol.getYear() === prevSolar.getYear() && (sol.getMonth() > prevSolar.getMonth() || (sol.getMonth() === prevSolar.getMonth() && sol.getDay() > prevSolar.getDay())))
        ) {
          prevName = name
          prevSolar = sol
        }
      }
    })

    if (prevSolar && prevName) {
      currentJieQi = prevName
      // 用julianDay做天数差
      jieQiDayNum = Math.floor(dateSolar.getJulianDay() - prevSolar.getJulianDay() + 1)
    }

    let jieQiInfo = jieQiToday
    if (!jieQiToday && currentJieQi && jieQiDayNum > 0) {
      jieQiInfo = `${currentJieQi}第${jieQiDayNum}天`
    }
    return {
      ganZhiYear,
      zodiac,
      lunarMonth,
      lunarDay,
      jieQi: jieQiInfo,
      fullInfo: `${ganZhiYear}${zodiac}年 农历${lunarMonth}${lunarDay}${jieQiInfo ? ' · ' + jieQiInfo : ''}`
    }
  } catch (err) {
    console.error('农历信息异常', err)
    return { ganZhiYear: '', zodiac: '', lunarMonth: '', lunarDay: '', jieQi: '', fullInfo: '(农历信息加载失败)' }
  }
}



/**
 * 格式化公历日期，“YYYY年MM月DD日 dddd”
 * @param {Date} date 
 * @returns {String}
 */
export const formatDate = (date) => dayjs(date).format('YYYY年MM月DD日 dddd')

/**
 * 当前时分秒字符串，hh:mm:ss
 * @returns {Object}
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
 * 今日剩余时间（精确到毫秒），用于页面动态秒表展示
 * @returns {Object}
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

// ====== 剩余倒计时主算法部分 ======

/**
 * 获取本年剩余（按指定精度）
 * 可精确到小数天/小时/秒
 */
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

/*
 * 计算start和end之间的剩余天/小时/秒数
 */
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
 * 计算自定义日期距离今天还有多少天（最小0）
 */
export const getCustomCountdown = (targetDate) => {
  const now = dayjs()
  const target = dayjs(targetDate)
  const diff = target.diff(now, 'day')
  return diff > 0 ? diff : 0
}
