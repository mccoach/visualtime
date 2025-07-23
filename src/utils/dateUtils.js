// ========== src/utils/dateUtils.js ==========

import { DateTime, Duration, Settings } from 'luxon';
import { Solar } from 'lunar-javascript';

Settings.defaultLocale = 'zh-cn';

/**
 * 获取农历、干支、生肖及节气信息。
 * [已按要求修改] 节气日的计算逻辑已从“精确到秒”调整为“精确到天”，
 * 即只要节气发生的时刻在某一日内，则该日全天都视为此节气日。
 * @param {DateTime|Date} [date=DateTime.now()] - 需要计算的日期，默认为当前时间。
 * @returns {object} 包含完整农历信息的对象。
 */
export const getLunarInfo = (date = DateTime.now()) => {
  try {
    const nativeDate = date instanceof DateTime ? date.toJSDate() : date;
    const solar = Solar.fromDate(nativeDate);
    const lunar = solar.getLunar();

    const jieQiTable = lunar.getJieQiTable();
    const y = solar.getYear(), m = solar.getMonth(), d = solar.getDay();
    const dateSolar = Solar.fromYmd(y, m, d);

    // ▼▼▼ 核心修改点 ▼▼▼
    // 将儒略日(JD)加上0.5天再向下取整，是为了将其从“天文学日”（以中午12点为分界）
    // 校正为我们日常习惯的“自然日”（以午夜0点为分界）。
    // 这样，无论一天中的哪个时刻，其对应的整数日都是相同的。
    const dateJulian = Math.floor(dateSolar.getJulianDay() + 0.5);
    const allJieQi = Object.entries(jieQiTable)
      .map(([name, sol]) => ({ name, jd: Math.floor(sol.getJulianDay() + 0.5) })) // 对节气表也做同样处理
      .sort((a, b) => a.jd - b.jd);
    // ▲▲▲ 核心修改结束 ▲▲▲

    let prevJieQi = null, nextJieQi = null;

    // 循环查找上一个和下一个节气日
    for (let i = 0; i < allJieQi.length; i++) {
      if (allJieQi[i].jd <= dateJulian) {
        prevJieQi = allJieQi[i];
      }
      if (allJieQi[i].jd > dateJulian && !nextJieQi) {
        nextJieQi = allJieQi[i];
      }
    }

    let jieQiInfo = '';
    // 如果上一个节气的日期恰好就是今天，则今天就是节气日
    if (prevJieQi && prevJieQi.jd === dateJulian) {
      jieQiInfo = prevJieQi.name;
    }
    // 如果今天在上一个和下一个节气之间
    else if (prevJieQi && nextJieQi && dateJulian < nextJieQi.jd) {
      // 因为都是整数天，直接相减就是天数差
      const dayNum = dateJulian - prevJieQi.jd;
      jieQiInfo = `${prevJieQi.name}第${dayNum + 1}天`;
    }

    const ganZhiYear = lunar.getYearInGanZhi();
    const zodiac = lunar.getYearShengXiao();
    const lunarMonth = lunar.getMonthInChinese() + '月';
    const lunarDay = lunar.getDayInChinese();

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

    const dateTimeDesc = `${yearDisplay} 年 ${target.toFormat('MM 月 dd 日 HH:mm:ss')}`;
    
    return { finalDisplay, dateTimeDesc };

  } catch (error) {
    console.error("自定义倒计时计算错误", error);
    return { finalDisplay: '计算错误', dateTimeDesc: '无效日期' };
  }
};
