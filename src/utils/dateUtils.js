    // E:\AppProject\VisualTime\src\utils\dateUtils.js

    import { DateTime, Settings } from 'luxon';
    import { Solar } from 'lunar-javascript';

    // 设置luxon的默认语言为中文
    Settings.defaultLocale = 'zh-cn';

    /**
     * 获取指定日期的农历、干支、生肖及节气信息。
     * @param {DateTime} date - Luxon的DateTime对象。
     * @returns {object} 包含完整农历信息的对象。
     */
    export const getLunarInfo = (date = DateTime.now()) => {
      // (此函数逻辑保持不变，但确保其健壮性)
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
        console.error('获取农历信息时发生错误:', err);
        return { fullInfo: '(农历信息加载失败)' };
      }
    };

    /**
     * 将DateTime对象格式化为 "YYYY年MM月DD日 星期X" 的格式。
     * @param {DateTime} date - Luxon的DateTime对象。
     * @returns {string} 格式化后的日期字符串。
     */
    export const formatDate = (date) => {
      const luxonDate = date instanceof DateTime ? date : DateTime.fromJSDate(date);
      return luxonDate.toFormat('yyyy年MM月dd日 cccc');
    };

    /**
     * 【新增】一个通用的函数，用于获取指定日期所在时间单位的结束时刻。
     * 这是countdownEngine进行计算的底层依赖。
     * @param {string} unit - 时间单位 ('year', 'quarter', 'month', 'week', 'day')。
     * @param {DateTime} date - 基准日期。
     * @param {object} [options] - 额外选项，如 { weekStart: 1 } 用于周。
     * @returns {DateTime} 该时间单位结束时刻的DateTime对象。
     */
    export const getEndOf = (unit, date, options = {}) => {
      if (unit === 'week') {
        // Luxon的 `endOf('week')` 默认周日为结束。如果我们需要周一为开始，周日为结束，
        // 则需要根据 weekStart (1为周一, 0为周日) 进行判断。
        // Luxon默认周一为weekday=1, 周日为weekday=7。
        // 如果 weekStart=1(周一为一周第一天), endOf('week') 正好是周日，符合预期。
        if (options.weekStart === 0) { // 如果周日为一周第一天，则周六为结束
          return date.endOf('week').minus({ days: 1 });
        }
        return date.endOf('week');
      }
      return date.endOf(unit);
    };

    /**
     * 【新增】一个通用的函数，用于获取指定日期所在时间单位的开始时刻。
     * @param {string} unit - 时间单位。
     * @param {DateTime} date - 基准日期。
     * @param {object} [options] - 额外选项。
     * @returns {DateTime} 该时间单位开始时刻的DateTime对象。
     */
    export const getStartOf = (unit, date, options = {}) => {
      if (unit === 'week' && options.weekStart === 0) {
        return date.startOf('week').minus({ days: 1 });
      }
      return date.startOf(unit);
    };
    