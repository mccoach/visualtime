// ========== src/utils/dateUtils.js ==========
// ... (文件上半部分到 getWeekRemaining 为止，都保持不变) ...

import { DateTime, Duration, Settings } from 'luxon';
import { Solar } from 'lunar-javascript';

Settings.defaultLocale = 'zh-cn';

export const getLunarInfo = (date = DateTime.now()) => {
  try {
    const nativeDate = date instanceof DateTime ? date.toJSDate() : date;
    const solar = Solar.fromDate(nativeDate);
    const lunar = solar.getLunar();
    const ganZhiYear = lunar.getYearInGanZhi();
    const zodiac = lunar.getYearShengXiao();
    const lunarMonth = lunar.getMonthInChinese() + '月';
    const lunarDay = lunar.getDayInChinese();
    const jieQiTable = lunar.getJieQiTable();
    const y = solar.getYear(), m = solar.getMonth(), d = solar.getDay();
    const dateSolar = Solar.fromYmd(y, m, d);
    const dateJulian = dateSolar.getJulianDay();
    const allJieQi = Object.entries(jieQiTable)
      .map(([name, sol]) => ({ name, jd: sol.getJulianDay() }))
      .sort((a, b) => a.jd - b.jd);
    let prevJieQi = null, nextJieQi = null;
    for (let i = 0; i < allJieQi.length; i++) {
      if (allJieQi[i].jd <= dateJulian) prevJieQi = allJieQi[i];
      if (allJieQi[i].jd > dateJulian && !nextJieQi) nextJieQi = allJieQi[i];
    }
    let jieQiInfo = '';
    if (prevJieQi && prevJieQi.jd === dateJulian) {
      jieQiInfo = prevJieQi.name;
    } else if (prevJieQi && nextJieQi && dateJulian < nextJieQi.jd) {
      const dayNum = Math.ceil(dateJulian - prevJieQi.jd + 1);
      jieQiInfo = `${prevJieQi.name}第${dayNum}天`;
    }
    return {
      ganZhiYear,
      zodiac,
      lunarMonth,
      lunarDay,
      jieQi: jieQiInfo,
      fullInfo: `${ganZhiYear}${zodiac}年 农历${lunarMonth}${lunarDay}${jieQiInfo ? ' · ' + jieQiInfo : ''}`
    };
  } catch (err) {
    console.error('农历信息异常', err);
    return { ganZhiYear: '', zodiac: '', lunarMonth: '', lunarDay: '', jieQi: '', fullInfo: '(农历信息加载失败)' };
  }
};

export const formatDate = (date) => {
  const luxonDate = date instanceof DateTime ? date : DateTime.fromJSDate(date);
  return luxonDate.toFormat('yyyy年MM月dd日 cccc');
};

export const getCurrentTime = () => {
  const now = DateTime.now();
  return {
    hours: now.toFormat('HH'),
    minutes: now.toFormat('mm'),
    seconds: now.toFormat('ss')
  };
};

export const getTodayRemaining = () => {
  const now = DateTime.now();
  const endOfDay = now.endOf('day');
  const diff = endOfDay.diff(now, ['hours', 'minutes', 'seconds', 'milliseconds']);
  return {
    hours: String(diff.hours).padStart(2, '0'),
    minutes: String(diff.minutes).padStart(2, '0'),
    seconds: String(diff.seconds).padStart(2, '0'),
    milliseconds: String(Math.floor(diff.milliseconds)).padStart(3, '0')
  };
};

const calculateRemaining = (start, end, precision = 'day', decimalPrecision = 0) => {
  const diff = end.diff(start).as(precision);
  return parseFloat(diff.toFixed(decimalPrecision));
};

export const getYearRemaining = (p = 'day', dp = 0) => calculateRemaining(DateTime.now(), DateTime.now().endOf('year'), p, dp);
export const getQuarterRemaining = (p = 'day', dp = 0) => calculateRemaining(DateTime.now(), DateTime.now().endOf('quarter'), p, dp);
export const getMonthRemaining = (p = 'day', dp = 0) => calculateRemaining(DateTime.now(), DateTime.now().endOf('month'), p, dp);

export const getWeekRemaining = (precision = 'day', decimalPrecision = 0, weekStart = 1) => {
  const now = DateTime.now();
  let endOfWeek;
  if (weekStart === 1) {
    endOfWeek = now.endOf('week');
  } else {
    const daysUntilSaturday = (6 - now.weekday + 7) % 7;
    endOfWeek = now.plus({ days: daysUntilSaturday }).endOf('day');
  }
  return calculateRemaining(now, endOfWeek, precision, decimalPrecision);
};

// --- 自定义倒计时的统一计算函数 ---
export const calculateCustomDifference = (event) => {
  try {
    const target = DateTime.fromObject({
      year: event.year,
      month: event.month,
      day: event.day,
      hour: Number(event.hour || 0),
      minute: Number(event.minute || 0),
      second: Number(event.second || 0),
    });

    if (!target.isValid) {
      return { finalDisplay: '无效日期', dateTimeDesc: '日期格式不正确' };
    }

    const now = DateTime.now();
    const isPast = target < now;
    const [start, end] = isPast ? [target, now] : [now, target];
    const prefix = isPast ? '已过 ' : '还有 ';
    let finalDisplay = '';

    if (event.decimalPrecision === 'combo') {
      const diff = end.diff(start, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);
      const parts = diff.toObject();
      const timeUnits = [
        { num: parts.years, unit: '年' }, { num: parts.months, unit: '个月' },
        { num: parts.days, unit: '天' }, { num: parts.hours, unit: '小时' },
        { num: parts.minutes, unit: '分' }, { num: Math.floor(parts.seconds), unit: '秒' }
      ];
      let outArr = [];
      let firstNonZeroFound = false;
      for (const item of timeUnits) {
        if (item.num > 0) {
          firstNonZeroFound = true;
          outArr.push(` <span class="combo-num">${item.num}</span> ${item.unit}`);
        } else if (firstNonZeroFound) {
          outArr.push(' 零');
        }
      }
      if (outArr.length > 0) {
        let lastNonZeroIndex = -1;
        for (let i = outArr.length - 1; i >= 0; i--) {
          if (outArr[i] !== ' 零') {
            lastNonZeroIndex = i;
            break;
          }
        }
        if (lastNonZeroIndex > -1 && lastNonZeroIndex < outArr.length - 1) {
          const coreParts = outArr.slice(0, lastNonZeroIndex + 1);
          outArr = [...coreParts, ' 整'];
        }
      }
      if (outArr.length === 0) {
        outArr.push(' <span class="combo-num">0</span> 秒');
      }
      finalDisplay = prefix + outArr.join('').trim().replace(/ (零 )+/g, ' 零 ');
    } else {
      const value = end.diff(start).as(event.unit);
      const unitLabels = { day: '天', hour: '小时', minute: '分钟', second: '秒', week: '周', month: '个月', year: '年' };
      finalDisplay = `${prefix}<strong class="combo-num">${value.toFixed(event.decimalPrecision)}</strong> ${unitLabels[event.unit]}`;
    }

    const yearNum = target.year;
    const yearDisplay = yearNum < 0 ? `公元前 ${Math.abs(yearNum)}` : `${yearNum}`;

    // [修改] 使用模板字符串和 luxon 的 toFormat 标记，在数字和汉字之间添加空格
    const dateTimeDesc = `${yearDisplay} 年 ${target.toFormat('MM 月 dd 日 HH:mm:ss')}`;
    
    return { finalDisplay, dateTimeDesc };

  } catch (error) {
    console.error("自定义倒计时计算错误", error);
    return { finalDisplay: '计算错误', dateTimeDesc: '无效日期' };
  }
};
