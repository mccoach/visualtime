// E:\AppProject\VisualTime\src\utils\dateUtils.js
// ============================================================================
// 本文件提供与日期相关的工具函数，包括：
// 1) 获取农历/干支/生肖/节气等信息（getLunarInfo）
// 2) 格式化日期字符串（formatDate）
// 3) 获取某时间单位的起止时刻（getStartOf / getEndOf）
//
// 本版根据你的最新要求，针对“节气列表构建与展示”进行了改造：
// - 仅使用一个“字典（对象）映射”结构：键为中文节气名，值为外文名列表（当前仅英文常量名，预留多语扩展）。
// - 从库中提取节气时：仅用“白名单（中文名字典键）判断”，不再额外判断是否中文键名；
//   只要键不在白名单，即跳过（自然会跳过英文常量键名）。
// - 每个节气条目同时保留中文名与“外文名列表”foreignNames（数组），便于未来多语扩展（当前仅展示中文）。
// - 年度内节气只以“日期范围 + 按日期去重”为准，不再以“24项”为纠错标准（取消项数纠错）。
// - 最终构建 26 条节气条目（上一年最后 1 + 当年范围内所有 + 下一年最前 1），展示时仅使用中文名。
// - 统一“民用自然日编号”的口径：toNaturalDayInt(jd) = floor(jd + 0.5)。
// ============================================================================

import { DateTime, Settings } from "luxon"; // Luxon：现代日期时间处理库
import { Solar } from "lunar-javascript"; // lunar-javascript：提供农历与节气能力

// 设置 luxon 的默认本地化为中文（影响 toFormat 输出星期/月份中文）
Settings.defaultLocale = "zh-cn";

/**
 * 将 DateTime 对象格式化为 "yyyy年MM月dd日 cccc"（例如：2025年08月08日 星期五）
 * @param {DateTime} date - Luxon 的 DateTime 对象或可被转换的日期
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDate = (date) => {
  // 若传入不是 DateTime，则从原生 Date 转换
  const luxonDate = date instanceof DateTime ? date : DateTime.fromJSDate(date);
  // 使用本地化格式输出
  return luxonDate.toFormat("yyyy年MM月dd日 cccc");
};

/**
 * 将“儒略日（JD，正午为界的天文日计数）”统一映射为“民用自然日编号”（以午夜0点为界）。
 * 规则：对 JD 先 +0.5 再向下取整。
 * 说明：
 * - JD 的整数界限在 12:00（UTC），民用日界限在 00:00（民用语义）。
 * - 通过 +(0.5) 再 floor，可以把“正午界”平移到“午夜界”，得到直观的民用自然日编号。
 * - 该函数对“节气时刻JD”与“当日JD”一视同仁，保证比较口径完全一致。
 * @param {number} jd - 儒略日（可能为小数）
 * @returns {number} - 民用自然日编号（整数）
 */
function toNaturalDayInt(jd) {
  return Math.floor(jd + 0.5);
}

/**
 * 节气映射表（最外层为字典映射）
 * - 键（key）：中文节气名
 * - 值（value）：外文名列表（数组）。当前仅保留英文常量名，未来可扩展为更多语种（在数组中追加即可）。
 * - 用途：
 *   1) 作为“白名单”：仅当库返回的节气“键名”存在于本映射表中，才接受并纳入最终列表；
 *     （这使得无需单独判断是否中文键名——不在白名单就直接跳过。）
 *   2) 为每个节气条目提供外文名列表，便于未来多语输出（当前版本仅展示中文）。
 */
const JIEQI_MAP = {
  立春: ["LI_CHUN"],
  雨水: ["YU_SHUI"],
  惊蛰: ["JING_ZHE"],
  春分: ["CHUN_FEN"],
  清明: ["QING_MING"],
  谷雨: ["GU_YU"],
  立夏: ["LI_XIA"],
  小满: ["XIAO_MAN"],
  芒种: ["MANG_ZHONG"],
  夏至: ["XIA_ZHI"],
  小暑: ["XIAO_SHU"],
  大暑: ["DA_SHU"],
  立秋: ["LI_QIU"],
  处暑: ["CHU_SHU"],
  白露: ["BAI_LU"],
  秋分: ["QIU_FEN"],
  寒露: ["HAN_LU"],
  霜降: ["SHUANG_JIANG"],
  立冬: ["LI_DONG"],
  小雪: ["XIAO_XUE"],
  大雪: ["DA_XUE"],
  冬至: ["DONG_ZHI"],
  小寒: ["XIAO_HAN"],
  大寒: ["DA_HAN"],
};
// 快速白名单集合（以中文名键判断是否接纳该条节气）
const SET_ZH_NAMES = new Set(Object.keys(JIEQI_MAP));

/**
 * 从给定年份的 jieQiTable（Map<string, Solar>）中，提取“中文 + 外文列表（数组）”的节气条目。
 * 策略（严格按你的要求）：
 * - 仅用“白名单判断”：如果库返回的键名 rawName 不在 JIEQI_MAP 中，直接跳过（英文常量键名自然被排除）；
 * - 每条目包含：nameZh / foreignNames / jd / dayInt；
 * - 按“dayInt”去重（Map 去重），保证“一个自然日仅保留一个节气条目”；
 * - 后续再用年份范围过滤，确保年度内“不错不漏”（不以条目数纠错）。
 * @param {Map<string, Solar>} jieQiTable - lunar.getJieQiTable() 返回的映射
 * @returns {{nameZh:string, foreignNames:string[], jd:number, dayInt:number}[]} - 去重后的节气数组（未按年份过滤）
 */
function extractJieQiItemsFromTable(jieQiTable) {
  // 使用 Map 以 dayInt 为键去重；值为 { nameZh, foreignNames, jd, dayInt }
  const byDayInt = new Map();

  // 遍历库返回的键值对
  for (const [rawName, sol] of Object.entries(jieQiTable)) {
    // 1) 仅接受“白名单”中的键名（白名单枚举了全部中文节气名）
    if (!SET_ZH_NAMES.has(rawName)) continue;

    // 2) 计算该节气发生时刻的 JD 与对应自然日编号
    const jd = sol.getJulianDay();
    const dayInt = toNaturalDayInt(jd);

    // 3) 构造条目（中文名 + 外文名列表（数组））
    const nameZh = rawName;
    const foreignNames = Array.isArray(JIEQI_MAP[nameZh])
      ? [...JIEQI_MAP[nameZh]]
      : [];
    const item = { nameZh, foreignNames, jd, dayInt };

    // 4) 按 dayInt 去重：若已存在则跳过（理论不会出现同一 dayInt 两个不同中文名）
    if (!byDayInt.has(dayInt)) {
      byDayInt.set(dayInt, item);
    }
  }

  // 5) 输出为数组并按 dayInt 升序
  return Array.from(byDayInt.values()).sort((a, b) => a.dayInt - b.dayInt);
}

/**
 * 收集“某公历年”的节气条目（中文 + 外文列表）并严格限制在“该年自然日范围内”。
 * 步骤：
 * - 以该年 1/1 构造 Solar -> Lunar -> jieQiTable；
 * - 提取“白名单过滤 + 按日去重”的条目（extractJieQiItemsFromTable）；
 * - 计算该年自然日区间 [yearStartDayInt, yearEndDayInt]；
 * - 仅保留落在该区间内的条目（含边界），并按 dayInt 升序；
 * - 不对条目数量做强行裁剪（不按 24 项纠错）。
 * @param {number} year - 公历年（如 2025）
 * @returns {{nameZh:string, foreignNames:string[], jd:number, dayInt:number}[]} - 该年范围内的节气条目（升序）
 */
function collectYearJieQiItems(year) {
  // 1) 以该年 1 月 1 日构造 Lunar，从而获取节气表
  const lunar = Solar.fromYmd(year, 1, 1).getLunar();
  const jieQiTable = lunar.getJieQiTable(); // Map<string, Solar>

  // 2) 提取“白名单过滤 + 按日去重”的条目
  const itemsAll = extractJieQiItemsFromTable(jieQiTable);

  // 3) 计算该年的“自然日编号区间” [yearStartDayInt, yearEndDayInt]
  const yearStartDayInt = toNaturalDayInt(
    Solar.fromYmd(year, 1, 1).getJulianDay()
  );
  const yearEndDayInt = toNaturalDayInt(
    Solar.fromYmd(year, 12, 31).getJulianDay()
  );

  // 4) 过滤到“严格属于该年区间”的条目（含边界）并升序返回
  const itemsInYear = itemsAll
    .filter((it) => it.dayInt >= yearStartDayInt && it.dayInt <= yearEndDayInt)
    .sort((a, b) => a.dayInt - b.dayInt);

  return itemsInYear;
}

/**
 * 获取指定日期的农历、干支、生肖及节气信息（使用经统一的自然日编号映射与一次遍历查找）
 * 关键点：
 * - 最终 allJieQi 固定为 26 条（上一年最后 1 + 当年范围内所有节气 + 下一年最前 1），且每条都含中文名与外文名列表；
 * - 单次前向遍历：遇到第一个“> 当日”的条目停止，其前一个即“上一节气候选”；若 dayInt 相等则为节气当日；
 * - 当前版本展示时仅使用中文名（item.nameZh）。
 * @param {DateTime} date - Luxon 的 DateTime 对象（默认当前时刻）
 * @returns {{
 *   ganZhiYear?: string,
 *   zodiac?: string,
 *   lunarMonth?: string,
 *   lunarDay?: string,
 *   jieQi?: string,
 *   fullInfo: string
 * }}
 */
export const getLunarInfo = (date = DateTime.now()) => {
  try {
    // 1) 输入归一：DateTime -> 原生 Date
    const nativeDate = date instanceof DateTime ? date.toJSDate() : date;

    // 2) 获取当日对应的 Solar/Lunar 基本信息
    const solar = Solar.fromDate(nativeDate); // 当日公历（基于传入的原生 Date 解析）
    const lunar = solar.getLunar(); // 当日农历（用于干支/生肖等）
    const ganZhiYear = lunar.getYearInGanZhi(); // 天干地支年
    const zodiac = lunar.getYearShengXiao(); // 生肖
    const lunarMonth = lunar.getMonthInChinese() + "月"; // 农历中文月
    const lunarDay = lunar.getDayInChinese(); // 农历中文日

    // 3) 计算“当日自然日编号”
    //    - 先构造“当日 civil 日期”的 Solar（剥离时分秒，固定为当日 00:00 的本地民用语义）
    //    - 再取其 JD，并用统一函数 toNaturalDayInt(JD) 转为自然日编号
    const y = solar.getYear();
    const m = solar.getMonth();
    const d = solar.getDay();
    const dateSolar = Solar.fromYmd(y, m, d); // 当日（去掉时分秒）
    const currentDayInt = toNaturalDayInt(dateSolar.getJulianDay());

    // 4) 构建「上一年最后 1 + 当年范围内所有节气 + 下一年最前 1」的 26 条节气数组
    const currentYearItems = collectYearJieQiItems(y); // 当年（范围内）节气（升序）
    const prevYearItems = collectYearJieQiItems(y - 1); // 上一年（范围内）节气
    const nextYearItems = collectYearJieQiItems(y + 1); // 下一年（范围内）节气

    //    - 上一年最后一个 & 下一年最前一个（均应存在；若极端不存在，filter(Boolean) 会剔除）
    const prevYearLast = prevYearItems[prevYearItems.length - 1] || null;
    const nextYearFirst = nextYearItems[0] || null;

    //    - 组装并升序
    const allJieQi = [prevYearLast, ...currentYearItems, nextYearFirst]
      .filter(Boolean) // 防御性过滤可能的 null
      .sort((a, b) => a.dayInt - b.dayInt);

    // 5) 单次前向遍历查找：
    //    从前到后扫描，找到第一个“节气自然日 > 当日自然日”的条目；
    //    其前一个条目即为“上一节气候选 prevCandidate”。
    let prevCandidate = null; // 记录上一节气候选
    for (let i = 0; i < allJieQi.length; i++) {
      const item = allJieQi[i]; // 当前节气条目（含 nameZh/foreignNames/jd/dayInt）
      if (item.dayInt > currentDayInt) {
        // 找到第一个“超出当日”的节气
        prevCandidate = allJieQi[i - 1] || null; // 其前一个就是“上一节气”
        break; // 终止扫描
      }
      // 若仍未越过当日，保持向前推进（此时 item 为“最近不大于当日”的节气）
      prevCandidate = item;
    }
    // 兜底：若循环未发生“> currentDayInt”的情况（拼接了 nextYearFirst，通常不会发生）
    if (!prevCandidate && allJieQi.length > 0) {
      prevCandidate = allJieQi[allJieQi.length - 1];
    }

    // 6) 依据 prevCandidate 与当日的关系，输出节气信息（当前仅展示中文名）：
    //    - 若 prevCandidate.dayInt === currentDayInt：说明“当日即为节气日”，直接显示中文节气名；
    //    - 否则（prevCandidate.dayInt < currentDayInt）：显示“上一节气第X天”，
    //      其中 X = currentDayInt - prevCandidate.dayInt + 1，中文名采用 item.nameZh。
    let jieQiInfo = "";
    if (prevCandidate) {
      if (prevCandidate.dayInt === currentDayInt) {
        // 当天正是节气日：例如“立秋”
        jieQiInfo = prevCandidate.nameZh || "";
      } else if (prevCandidate.dayInt < currentDayInt) {
        // 当天不是节气日：例如“立秋第2天”
        const dayNum = currentDayInt - prevCandidate.dayInt + 1;
        const zh = prevCandidate.nameZh || "";
        jieQiInfo = `${zh}第${dayNum}天`;
      } else {
        // 理论上不会发生（因为我们构造了 prevYearLast，prevCandidate 不可能 > currentDayInt）
        jieQiInfo = "";
      }
    }

    // 7) 组装 fullInfo 展示：如“甲辰龙年 农历闰六月十五 · 立秋第2天”
    const fullInfo =
      `${ganZhiYear}${zodiac}年 农历${lunarMonth}${lunarDay}` +
      (jieQiInfo ? " · " + jieQiInfo : "");

    // 8) 返回结构体
    return {
      ganZhiYear,
      zodiac,
      lunarMonth,
      lunarDay,
      jieQi: jieQiInfo, // 当前仅中文展示（内部条目仍保留 foreignNames 以便将来多语种拓展）
      fullInfo,
    };
  } catch (err) {
    // 捕获所有异常，避免UI崩溃，并提供可诊断的日志
    console.error("获取农历信息时发生错误:", err);
    return { fullInfo: "(农历信息加载失败)" };
  }
};

/**
 * 获取指定日期所在时间单位的“结束时刻”
 * 说明：
 * - 对于 week（周），支持自定义周起始日（weekStart = 1 为周一起；0 为周日起）。
 * - 其它单位（year/quarter/month/day）使用 luxon 的 endOf。
 * @param {string} unit - 'year' | 'quarter' | 'month' | 'week' | 'day'
 * @param {DateTime} date - Luxon 的 DateTime 对象
 * @param {object} [options] - 额外选项（仅 week 使用：{ weekStart: 1 | 0 }）
 * @returns {DateTime} - 该单位的结束时刻
 */
export const getEndOf = (unit, date, options = {}) => {
  if (unit === "week") {
    // 若周日为一周第一天（weekStart=0），则“结束”为周六（把默认的周日末退一天）
    if (options.weekStart === 0) {
      return date.endOf("week").minus({ days: 1 });
    }
    // 默认（weekStart=1，周一起）：endOf('week') 即周日末
    return date.endOf("week");
  }
  // 其它单位：直接 endOf
  return date.endOf(unit);
};

/**
 * 获取指定日期所在时间单位的“开始时刻”
 * 说明：
 * - 对于 week（周），支持自定义周起始日（weekStart = 1 为周一起；0 为周日起）。
 * - 其它单位（year/quarter/month/day）使用 luxon 的 startOf。
 * @param {string} unit - 'year' | 'quarter' | 'month' | 'week' | 'day'
 * @param {DateTime} date - Luxon 的 DateTime 对象
 * @param {object} [options] - 额外选项（仅 week 使用：{ weekStart: 1 | 0 }）
 * @returns {DateTime} - 该单位的开始时刻
 */
export const getStartOf = (unit, date, options = {}) => {
  if (unit === "week" && options.weekStart === 0) {
    // 若周日为一周第一天（weekStart=0），则把默认“周一起”的 startOf('week') 回退一天
    return date.startOf("week").minus({ days: 1 });
  }
  // 其它单位：直接 startOf
  return date.startOf(unit);
};
