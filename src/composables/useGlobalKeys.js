    // E:\AppProject\VisualTime\src\composables\useGlobalKeys.js

    import { watch, onUnmounted } from 'vue';

    /**
     * =================================================================
     * useGlobalKeys - 全局通用键盘交互 Composable
     * =================================================================
     * 
     * 职责:
     * 1. 统一收纳在整个应用中可被广泛复用的、与顶层UI状态相关的全局键盘交互逻辑。
     * 2. 提供独立的、按功能划分的Composable函数（如 useEscapeKey），供组件按需导入使用。
     * 3. 自动管理事件监听器的生命周期，确保在组件卸载时正确清理，防止内存泄漏。
     */


    /**
     * @description 监听全局的 ESC 键，用于取消操作或关闭顶层UI元素。
     * 这是一个非常通用的模式，可以被任何需要“ESC关闭”功能的组件复用。
     * 
     * @param {import('vue').Ref<boolean>} isListening - 一个响应式的布尔值Ref。
     *   Composable会监视这个Ref，当其值为 true 时，激活对ESC键的监听；
     *   当其值为 false 时，则停用监听，以优化性能。
     * @param {() => void} callback - 当ESC键被按下时需要执行的回调函数。
     *   这个函数通常用于修改状态，例如 `() => isModalOpen.value = false`。
     */
    export function useEscapeKey(isListening, callback) {
      
      // 定义一个私有的键盘事件处理函数
      const handleKeyDown = (event) => {
        // 检查按下的键是否是 'Escape' (标准) 或 'Esc' (兼容旧版浏览器)
        if (event.key === 'Escape' || event.key === 'Esc') {
          // 如果是，则执行由调用方传入的回调函数
          callback();
        }
      };

      // 使用 Vue 的 watch API 来响应式地控制事件监听器的添加与移除
      watch(
        isListening, // 监听的目标 Ref
        (shouldListen) => { // 当 isListening 的值变化时执行的回调
          if (shouldListen) {
            // 如果需要开始监听，则在 document 的 keydown 事件上注册我们的处理函数
            document.addEventListener('keydown', handleKeyDown);
          } else {
            // 如果需要停止监听，则移除同一个处理函数
            document.removeEventListener('keydown', handleKeyDown);
          }
        }, 
        { immediate: true } // immediate: true 确保在 Composable 被首次调用时，
                             // 就立即根据 isListening 的初始值来决定是否添加监听器。
      );

      // 使用 onUnmounted 生命周期钩子，这是防止内存泄漏的关键。
      // 它确保无论组件因为何种原因被销毁，注册在 document 上的事件监听器
      // 都一定会被清理干净。
      onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyDown);
      });
    }


    /**
     * @description 【未来扩展示例】监听全局的 Ctrl/Cmd + Enter 组合键，用于快速提交。
     * 这是一个占位函数，展示了该文件未来如何扩展以支持更多的全局快捷键。
     * 
     * @param {() => void} callback - 当组合键被按下时要执行的回调函数。
     */
    // export function useSubmitKey(callback) {
    //   const handleKeyDown = (event) => {
    //     // 检查是否同时按下了 Ctrl (Windows/Linux) 或 Meta (Mac) 键和 Enter 键
    //     if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    //       event.preventDefault(); // 阻止在表单中触发表单提交等默认行为
    //       callback();
    //     }
    //   };
      
    //   // 示例：这个可以设计为全局常驻监听，在组件挂载时添加，卸载时移除
    //   onMounted(() => {
    //     document.addEventListener('keydown', handleKeyDown);
    //   });

    //   onUnmounted(() => {
    //     document.removeEventListener('keydown', handleKeyDown);
    //   });
    // }
    