/**
 * =================================================================
 * eventBus.js - 全局事件总线 (又称：全局广播网关)
 * =================================================================
 * 
 * 这个文件是整个应用的中央事件调度中心。它负责处理所有“跨组件树”的、
 * “一次性通知”类型的通信。通过将事件常量和收发逻辑集中在此，
 * 我们可以确保：
 * 
 * 1. 单一事实来源：避免在多个组件中使用易错的“魔法字符串”。
 * 2. 代码清晰：组件只需调用封装好的函数，无需关心底层实现。
 * 3. 易于维护：所有全局事件一目了然，方便管理和扩展。
 * 
 * --- 使用原则 ---
 * 只有当一个功能满足以下所有条件时，才应通过本文件处理：
 *   - 通信双方没有简单的父子关系 (跨组件树)。
 *   - 通信内容是“事件通知”，而非“共享状态”。
 *   - 功能本身是应用级的通用交互，与具体业务逻辑弱相关。
 */

// ========== 事件常量定义 ==========
// 将所有全局事件的名称以常量的形式统一定义。

/**
 * 当任何组件的“三点”设置菜单被打开时广播的事件。
 * 用于实现全局菜单的互斥关闭效果。
 */
export const MENU_OPEN_EVENT = 'visualtime-menu-opened';


// ========== 封装的广播与监听函数 ==========

/**
 * 广播一个菜单已经被打开的事件。
 * 任何组件在打开自己的菜单前，都应调用此函数。
 * 
 * @param {string} componentId - 发出广播的组件的唯一ID。这个ID用于让组件自身忽略自己发出的广播。
 */
export function broadcastMenuOpened(componentId) {
  // 安全检查：确保调用者提供了ID
  if (!componentId) {
    console.warn('[EventBus] 广播菜单打开事件时，必须提供一个 componentId。');
    return;
  }

  // 使用浏览器的 CustomEvent API 创建一个自定义事件
  const event = new CustomEvent(MENU_OPEN_EVENT, {
    // detail 对象用于携带额外的数据，这里我们只携带了广播源的ID
    detail: { id: componentId }
  });

  // 向全局 document 对象派发这个事件，使其能被任何地方监听到
  document.dispatchEvent(event);
}

/**
 * 监听其他组件菜单打开的事件。
 * 组件可以通过这个函数注册一个回调，当其他菜单打开时，该回调会被执行。
 * 
 * @param {string} ownId - 当前监听组件自身的唯一ID。
 * @param {function(string): void} callback - 当监听到【其他】菜单打开时需要执行的回调函数。它会接收到广播者的ID。
 * @returns {function} - 返回一个“清理函数”。在组件卸载时调用此函数，可以自动移除事件监听，防止内存泄漏。
 */
export function listenForOtherMenuOpened(ownId, callback) {
  // 定义事件处理函数
  const handler = (event) => {
    // [修复] 从 event.detail 中安全地获取广播者的ID
    const broadcasterId = event.detail?.id;

    // [修复] 检查广播源的ID是否存在，且【不等于】自身的ID
    if (broadcasterId && broadcasterId !== ownId) {
      // [修复] 如果是其他组件发出的广播，则执行传入的回调函数，并将广播者ID传给它
      callback(broadcasterId);
    }
  };

  // 在 document 上注册监听器
  document.addEventListener(MENU_OPEN_EVENT, handler);

  // 返回一个匿名函数，这个函数闭包了 handler，调用它即可移除监听
  return () => {
    document.removeEventListener(MENU_OPEN_EVENT, handler);
  };
}
