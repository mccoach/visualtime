// ========== src/utils/dateUtils.js ==========
// 所有日期/农历/节气/倒计时核心算法统一入口

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { Solar } from 'lunar-javascript'

// dayjs全局插件配置
dayjs.locale('zh-cn')
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)

/**
 * 获取精准农历和节气信息，节气当天只显示节气名，次日起依次第几天
 * @param {Date} date 默认今天
 * @returns {Object} 包含天干地支、生肖、农历、节气内容
 */
export const getLunarInfo = (date = new Date()) => {
  try {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    const ganZhiYear = lunar.getYearInGanZhi()
    const zodiac = lunar.getYearShengXiao()
    const lunarMonth = lunar.getMonthInChinese() + '月'
    const lunarDay = lunar.getDayInChinese()
    const jieQiTable = lunar.getJieQiTable()
    // 定义当天的儒略日
    const y = solar.getYear(), m = solar.getMonth(), d = solar.getDay()
    const dateSolar = Solar.fromYmd(y, m, d)
    const dateJulian = dateSolar.getJulianDay()
    // 所有节气节点，按时间排好序
    const allJieQi = Object.entries(jieQiTable)
      .map(([name, sol]) => ({
        name,
        jd: sol.getJulianDay(),
        solar: sol
      }))
      .sort((a, b) => a.jd - b.jd)
    // 找所属区间节气
    let prevJieQi = null, nextJieQi = null
    for (let i = 0; i < allJieQi.length; i++) {
      if (allJieQi[i].jd <= dateJulian) prevJieQi = allJieQi[i]
      if (allJieQi[i].jd > dateJulian && !nextJieQi) nextJieQi = allJieQi[i]
    }
    let jieQiInfo = ''
    if (prevJieQi && prevJieQi.jd === dateJulian) {
      // 节气日当天，直接显示节气名
      jieQiInfo = prevJieQi.name
    } else if (prevJieQi && nextJieQi && dateJulian < nextJieQi.jd) {
      // 只要不是当天，才显示第几天
      const dayNum = Math.ceil(dateJulian - prevJieQi.jd + 1)
      jieQiInfo = `${prevJieQi.name}第${dayNum}天`
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
 * 格式化阳历为"YYYY年MM月DD日 星期几"
 */
export const formatDate = (date) => dayjs(date).format('YYYY年MM月DD日 dddd')

/**
 * 当前时分秒
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
 * 今日剩余，返回对象{hours,minutes,seconds,milliseconds}
 */
export const getTodayRemaining = () => {
  const now = dayjs()
  const endOfDay = now.endOf('day')
  const diff = endOfDay.diff(now)
  return {
    hours: String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0'),
    minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
    seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0'),
    milliseconds: String(diff % 1000).padStart(3, '0')
  }
}

// --- 剩余倒计时主算法，全部按主单位/精度调用 ---
export const getYearRemaining    = (p='day', dp=0) => calculateRemaining(dayjs(), dayjs().endOf('year'), p, dp)
export const getQuarterRemaining = (p='day', dp=0) => calculateRemaining(dayjs(), dayjs().endOf('quarter'), p, dp)
export const getMonthRemaining   = (p='day', dp=0) => calculateRemaining(dayjs(), dayjs().endOf('month'), p, dp)
export const getWeekRemaining    = (precision='day', decimalPrecision=0, weekStart=1) => {
  const now = dayjs()
  const todayWeekday = now.day()
  let daysToEnd = weekStart === 1 ?
    (7 - ((todayWeekday === 0) ? 7 : todayWeekday))
    : (6 - todayWeekday)
  const end = now.add(daysToEnd, 'day').endOf('day')
  return calculateRemaining(now, end, precision, decimalPrecision)
}

/**
 * 统一单位+精度剩余主算法，绝不冗余
 * @param start dayjs对象
 * @param end dayjs对象
 * @param precision
 * @param decimalPrecision
 * @returns 精度控制下的主倒计时单位数值
 */
const calculateRemaining = (start, end, precision='day', decimalPrecision=0) => {
  const diff = end.diff(start)
  let base
  switch (precision) {
    case 'day':    base = 1000*60*60*24;    break
    case 'hour':   base = 1000*60*60;       break
    case 'minute': base = 1000*60;          break
    case 'second': base = 1000;             break
    default:       base = 1000*60*60*24;
  }
  return parseFloat((diff / base).toFixed(decimalPrecision))
}

/**
 * 自定义目标日期倒计时（天）
 */
export const getCustomCountdown = (targetDate) => {
  const now = dayjs()
  const target = dayjs(targetDate)
  const diff = target.diff(now, 'day')
  return diff > 0 ? diff : 0
}
