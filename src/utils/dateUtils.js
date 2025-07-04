import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

// 配置 dayjs
dayjs.locale('zh-cn')
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)

// 生肖数组
const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 二十四节气及对应日期（简化版）
const solarTerms = [
  { name: '立春', month: 2, day: 4 },
  { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 6 },
  { name: '春分', month: 3, day: 21 },
  { name: '清明', month: 4, day: 5 },
  { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 6 },
  { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 6 },
  { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 },
  { name: '大暑', month: 7, day: 23 },
  { name: '立秋', month: 8, day: 8 },
  { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 8 },
  { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 },
  { name: '霜降', month: 10, day: 23 },
  { name: '立冬', month: 11, day: 7 },
  { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 22 },
  { name: '小寒', month: 1, day: 6 },
  { name: '大寒', month: 1, day: 20 }
]

// 获取节气信息
const getSolarTermInfo = (date) => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // 查找当前最近的节气
  let currentTerm = null
  let daysSince = 0
  
  for (let i = 0; i < solarTerms.length; i++) {
    const term = solarTerms[i]
    if (month === term.month && day >= term.day) {
      currentTerm = term
      daysSince = day - term.day + 1
    } else if (month === term.month + 1 && day < term.day) {
      // 如果是下个月但还没到下个节气
      break
    }
  }
  
  // 处理跨年的情况
  if (!currentTerm && month === 1) {
    const lastYearTerms = solarTerms.filter(t => t.month === 12)
    if (lastYearTerms.length > 0) {
      const lastTerm = lastYearTerms[lastYearTerms.length - 1]
      if (day >= lastTerm.day - 31) {
        currentTerm = lastTerm
        daysSince = day + (31 - lastTerm.day) + 1
      }
    }
  }
  
  return currentTerm ? `${currentTerm.name}第${daysSince}天` : ''
}

// 获取农历信息
const getLunarInfo = (date = new Date()) => {
  try {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    // 天干地支年份计算
    const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
    const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
    const ganZhiYear = tianGan[(year - 4) % 10] + diZhi[(year - 4) % 12]
    
    // 生肖计算
    const zodiac = zodiacAnimals[(year - 4) % 12]
    
    // 节气信息
    const solarTermInfo = getSolarTermInfo(date)
    
    // 简化的农历日期
    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', 
                        '七月', '八月', '九月', '十月', '冬月', '腊月']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
    
    // 简化农历计算
    const lunarMonth = lunarMonths[(month - 1 + 11) % 12]
    const lunarDay = lunarDays[(day - 1) % 30]
    
    return {
      ganZhiYear,
      zodiac,
      lunarDate: `${lunarMonth}${lunarDay}`,
      solarTerm: solarTermInfo,
      fullInfo: `${ganZhiYear}${zodiac}年 农历${lunarMonth}${lunarDay}${solarTermInfo ? ` · ${solarTermInfo}` : ''}`
    }
  } catch (error) {
    console.error('获取农历信息失败:', error)
    return {
      ganZhiYear: '',
      zodiac: '',
      lunarDate: '',
      solarTerm: '',
      fullInfo: '农历信息获取中...'
    }
  }
}

// 导出农历信息函数
export { getLunarInfo }

// 获取当前时间
export const getCurrentTime = () => {
  const now = dayjs()
  return {
    hours: String(now.hour()).padStart(2, '0'),
    minutes: String(now.minute()).padStart(2, '0'),
    seconds: String(now.second()).padStart(2, '0')
  }
}

// 获取今日剩余时间
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

// 获取年度剩余
export const getYearRemaining = (precision = 'day') => {
  const now = dayjs()
  const endOfYear = now.endOf('year')
  
  return calculateRemaining(now, endOfYear, precision)
}

// 获取季度剩余
export const getQuarterRemaining = (precision = 'day') => {
  const now = dayjs()
  const endOfQuarter = now.endOf('quarter')
  
  return calculateRemaining(now, endOfQuarter, precision)
}

// 获取月度剩余
export const getMonthRemaining = (precision = 'day') => {
  const now = dayjs()
  const endOfMonth = now.endOf('month')
  
  return calculateRemaining(now, endOfMonth, precision)
}

// 获取周剩余（可配置周起始日）
export const getWeekRemaining = (precision = 'day', weekStart = 1) => {
  const now = dayjs()
  let endOfWeek
  
  if (weekStart === 1) { // 周一为起始
    endOfWeek = now.endOf('week').add(1, 'day')
  } else { // 周日为起始
    endOfWeek = now.endOf('week')
  }
  
  return calculateRemaining(now, endOfWeek, precision)
}

// 计算剩余时间
const calculateRemaining = (start, end, precision) => {
  const diff = end.diff(start)
  
  switch (precision) {
    case 'day':
      return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(2))
    case 'hour':
      return parseFloat((diff / (1000 * 60 * 60)).toFixed(2))
    case 'second':
      return Math.ceil(diff / 1000)
    default:
      return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(2))
  }
}

// 格式化日期（月日用两位数）
export const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日 dddd')
}

// 格式化日期为YYYY-MM-DD格式
export const formatDateShort = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 计算自定义日期倒计时
export const getCustomCountdown = (targetDate) => {
  const now = dayjs()
  const target = dayjs(targetDate)
  const diff = target.diff(now, 'day')
  
  return diff > 0 ? diff : 0
}
