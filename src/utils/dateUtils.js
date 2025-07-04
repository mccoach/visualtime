// ========== dateUtils.js ==========
// 日期与倒计时核心工具，所有和时间/农历/节气相关的业务逻辑只在这里出现

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

dayjs.locale('zh-cn')
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)

/* 生肖表与节气简易表，农历业务相关常量（避免重复编码） */
const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

const solarTerms = [
  { name: '立春', month: 2, day: 4 },{ name: '雨水', month: 2, day: 19 },{ name: '惊蛰', month: 3, day: 6 },
  { name: '春分', month: 3, day: 21 },{ name: '清明', month: 4, day: 5 },{ name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 6 },{ name: '小满', month: 5, day: 21 },{ name: '芒种', month: 6, day: 6 },
  { name: '夏至', month: 6, day: 21 },{ name: '小暑', month: 7, day: 7 },{ name: '大暑', month: 7, day: 23 },
  { name: '立秋', month: 8, day: 8 },{ name: '处暑', month: 8, day: 23 },{ name: '白露', month: 9, day: 8 },
  { name: '秋分', month: 9, day: 23 },{ name: '寒露', month: 10, day: 8 },{ name: '霜降', month: 10, day: 23 },
  { name: '立冬', month: 11, day: 7 },{ name: '小雪', month: 11, day: 22 },{ name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 22 },{ name: '小寒', month: 1, day: 6 },{ name: '大寒', month: 1, day: 20 }
]

// 自动推算今天属于哪个节气、第几天
function getSolarTermInfo(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  let currentTerm = null
  let daysSince = 0
  for (let i = 0; i < solarTerms.length; i++) {
    const term = solarTerms[i]
    if (month === term.month && day >= term.day) {
      currentTerm = term; daysSince = day - term.day + 1
    } else if (month === term.month + 1 && day < term.day) break
  }
  if (!currentTerm && month === 1) {
    const lastYearTerms = solarTerms.filter(t => t.month === 12)
    if (lastYearTerms.length > 0) {
      const lastTerm = lastYearTerms[lastYearTerms.length - 1]
      if (day >= lastTerm.day - 31) {
        currentTerm = lastTerm; daysSince = day + (31 - lastTerm.day) + 1
      }
    }
  }
  return currentTerm ? `${currentTerm.name}第${daysSince}天` : ''
}

/**
 * 获取当天农历信息【天干/地支/生肖/节气】等
 * @param {Date} date
 * @returns {Object} 包含 ganZhiYear, zodiac, lunarDate, solarTerm, fullInfo
 */
export const getLunarInfo = (date = new Date()) => {
  try {
    const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate()
    const tianGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
    const diZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
    const ganZhiYear = tianGan[(year - 4) % 10] + diZhi[(year - 4) % 12]
    const zodiac = zodiacAnimals[(year - 4) % 12]
    const solarTermInfo = getSolarTermInfo(date)
    // 简化农历月份/日期推断
    const lunarMonths = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月']
    const lunarDays   = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
      '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
      '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十']
    const lunarMonth = lunarMonths[(month - 1 + 11) % 12]
    const lunarDay   = lunarDays[(day - 1) % 30]
    return {
      ganZhiYear,
      zodiac,
      lunarDate: `${lunarMonth}${lunarDay}`,
      solarTerm: solarTermInfo,
      fullInfo: `${ganZhiYear}${zodiac}年 农历${lunarMonth}${lunarDay}${solarTermInfo ? ` · ${solarTermInfo}` : ''}`
    }
  } catch {
    return {ganZhiYear:'',zodiac:'',lunarDate:'',solarTerm:'',fullInfo:'农历信息获取中...'}
  }
}
/** 阳历格式化（YYYY年MM月DD日 周几） */
export const formatDate = (date) => dayjs(date).format('YYYY年MM月DD日 dddd')
/** 当前时分秒（hh:mm:ss） */
export const getCurrentTime = () => {
  const now = dayjs()
  return {
    hours: String(now.hour()).padStart(2, '0'),
    minutes: String(now.minute()).padStart(2, '0'),
    seconds: String(now.second()).padStart(2, '0')
  }
}
/** 今天剩余时间，精确到毫秒 */
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
/** **** 各倒计时主单位的剩余统一函数 **** */
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
/* 核心剩余时间差算法（精度单位控制，支持小数） */
const calculateRemaining = (start, end, precision) => {
  const diff = end.diff(start)
  switch (precision) {
    case 'day': return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(2))
    case 'hour': return parseFloat((diff / (1000 * 60 * 60)).toFixed(2))
    case 'second': return Math.ceil(diff / 1000)
    default: return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(2))
  }
}
/** 自定义日期主倒计天数 */
export const getCustomCountdown = (targetDate) => {
  const now = dayjs()
  const target = dayjs(targetDate)
  const diff = target.diff(now, 'day')
  return diff > 0 ? diff : 0
}
