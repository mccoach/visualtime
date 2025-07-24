// E:\AppProject\VisualTime\src\services\apiAdapters.js

/**
 * =================================================================
 * API Adapters for Time Synchronization
 * =================================================================
 * 
 * 职责:
 * 1. 为每一个外部时间API源提供一个独立的、异步的适配器函数。
 * 2. 每个适配器负责发起网络请求、处理特定数据格式、并计算网络延迟。
 * 3. 所有适配器都返回一个统一格式的成功对象: { serverTime: number, latency: number }，
 *    其中 serverTime 是一个精确到毫秒的Unix时间戳。
 * 4. 导出一个按优先级排序的适配器列表，供 clockService 调用。
 */

// --- Adapter Implementations ---

/**
 * 适配器1：淘宝NTP时间接口
 * 优点：国内访问速度极快，非常稳定。
 */
async function fetchTaobaoTime(controller) {
  const t0 = Date.now(); // 记录请求开始前的本地时间戳
  // 使用fetch API发起网络请求，并传入AbortController的signal用于超时控制
  // cache: 'no-store' 确保每次都获取最新的数据，不使用浏览器缓存
  const response = await fetch('https://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp', { signal: controller.signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Taobao API request failed'); // 如果HTTP状态码不是2xx，则抛出错误
  const data = await response.json(); // 将响应体解析为JSON
  const t1 = Date.now(); // 记录收到响应后的本地时间戳
  const timestamp = Number(data?.data?.t); // 从深层嵌套的JSON结构中安全地取出时间戳字符串并转换为数字
  if (!timestamp) throw new Error('Invalid response from Taobao'); // 如果时间戳无效，则抛出错误
  const latency = (t1 - t0) / 2; // 计算单程网络延迟
  return { serverTime: timestamp + latency, latency }; // 返回经过延迟补偿的服务器时间和延迟本身
}

/**
 * 适配器2：Cloudflare Trace
 * 优点：全球CDN网络，速度快，稳定性极高。
 */
async function fetchCloudflareTrace(controller) {
  const t0 = Date.now();
  const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { signal: controller.signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Cloudflare Trace request failed');
  const text = await response.text(); // 响应是纯文本格式
  const t1 = Date.now();
  const match = text.match(/ts=([\d.]+)/); // 使用正则表达式从文本中匹配 'ts=' 后面的时间戳
  if (!match || !match[1]) throw new Error('Invalid response from Cloudflare Trace');
  const timestamp = parseFloat(match[1]) * 1000; // 将浮点数秒级时间戳转换为毫秒级
  return { serverTime: timestamp, latency: (t1 - t0) / 2 };
}

/**
 * 适配器3：timeapi.io
 * 优点：专业的第三方时间服务，提供毫秒级精度。
 */
async function fetchTimeApiIo(controller) {
  const t0 = Date.now();
  const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC', { signal: controller.signal, cache: 'no-store' });
  if (!response.ok) throw new Error('timeapi.io request failed');
  const data = await response.json();
  const t1 = Date.now();
  const timestamp = data.milliseconds; // 直接获取毫秒级时间戳
  if (typeof timestamp !== 'number') throw new Error('Invalid response from timeapi.io');
  return { serverTime: timestamp, latency: (t1 - t0) / 2 };
}

/**
 * 适配器4：苏宁时间接口
 * 优点：国内大厂服务，稳定快速。
 */
async function fetchSuningTime(controller) {
  const t0 = Date.now();
  const response = await fetch('https://quan.suning.com/getSysTime.do', { signal: controller.signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Suning API request failed');
  const data = await response.json();
  const t1 = Date.now();
  const timestamp = Number(data.sysTime2); // 获取时间戳并转换为数字
  if (!timestamp) throw new Error('Invalid response from Suning');
  return { serverTime: timestamp, latency: (t1 - t0) / 2 };
}

/**
 * 适配器5：worldtimeapi.org
 * 优点：功能全面，知名度高。
 * 缺点：精度为秒。
 */
async function fetchWorldTimeApi(controller) {
  const t0 = Date.now();
  const response = await fetch('https://worldtimeapi.org/api/ip', { signal: controller.signal, cache: 'no-store' });
  if (!response.ok) throw new Error('worldtimeapi.org request failed');
  const data = await response.json();
  const t1 = Date.now();
  if (typeof data.unixtime !== 'number') throw new Error('Invalid response from worldtimeapi.org');
  const timestamp = data.unixtime * 1000; // 将秒级unixtime转换为毫秒
  return { serverTime: timestamp, latency: (t1 - t0) / 2 };
}

/**
 * 适配器6：worldclockapi.com
 * 缺点：为HTTP协议，在HTTPS页面中可能被浏览器阻止。
 */
async function fetchWorldClockApi(controller) {
  const t0 = Date.now();
  const response = await fetch('http://worldclockapi.com/api/json/utc/now', { signal: controller.signal, cache: 'no-store' });
  if (!response.ok) throw new Error('worldclockapi.com request failed');
  const data = await response.json();
  const t1 = Date.now();
  const fileTime = data.currentFileTime; // 获取.NET FileTime
  if (typeof fileTime !== 'number') throw new Error('Invalid response from worldclockapi.com');
  // 将.NET FileTime (从1601年1月1日起的100纳秒数) 转换为Unix时间戳 (从1970年1月1日起的毫秒数)
  const msSince1601 = fileTime / 10000;
  const msBetween1601and1970 = 11644473600000;
  const timestamp = msSince1601 - msBetween1601and1970;
  return { serverTime: timestamp, latency: (t1 - t0) / 2 };
}

/**
 * 适配器7：Google响应头 (降级备用)
 * 缺点：精度为秒，且在国内网络环境不可用。
 */
async function fetchGoogleHeader(controller) {
  const t0 = Date.now();
  // 使用HEAD方法只请求响应头，节省带宽
  const response = await fetch('https://www.google.com', { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
  const t1 = Date.now();
  const dateHeader = response.headers.get('date'); // 从响应头中获取Date字段
  if (!dateHeader) throw new Error('No Date header from Google');
  const timestamp = new Date(dateHeader).getTime(); // 将Date字符串解析为时间戳
  return { serverTime: timestamp, latency: (t1 - t0) / 2 };
}

// --- 导出的优先级列表 ---
// 按照性能、可靠性和网络环境友好度进行排序
export const timeApiAdapters = [
  { name: 'Taobao', fetch: fetchTaobaoTime },
  { name: 'Cloudflare', fetch: fetchCloudflareTrace },
  { name: 'TimeAPI.io', fetch: fetchTimeApiIo },
  { name: 'Suning', fetch: fetchSuningTime },
  { name: 'WorldTimeAPI', fetch: fetchWorldTimeApi },
  { name: 'WorldClockAPI', fetch: fetchWorldClockApi },
  { name: 'Google Header', fetch: fetchGoogleHeader },
];
