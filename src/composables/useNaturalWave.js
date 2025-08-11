// E:\AppProject\VisualTime\src\composables\useNaturalWave.js (已修复版)

// 导入Vue核心API
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

// 线性插值 (Lerp) 函数：在 a 和 b 之间按比例 t (0到1) 进行插值
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * useNaturalWave - 一个高性能、可配置的自然波浪动画 Composable
 * @param {object} options - 配置选项
 * @param {import('vue').Ref<number>} options.width - 容器宽度 (px)
 * @param {import('vue').Ref<number>} options.height - 容器高度 (px)
 * @param {import('vue').Ref<number>} options.progress - 进度 (0到1), 代表已逝去时间的比例
 * @param {object} [config] - 详细的波形配置 (可选)
 */
export function useNaturalWave(options, config = {}) {
  // 从选项中解构出响应式引用
  const { width, height, progress } = options;

  // --- 默认配置 ---
  // 将所有可调参数作为默认配置，方便覆盖和理解
  const defaultConfig = {
    anchorCount: 7, // 波形随机化的锚点数量
    minWaveLength: 100, // 最小波长
    maxWaveLength: 400, // 最大波长
    minAmplitude: 1.0, // 最小振幅 (浪高)
    maxAmplitude: 3.0, // 最大振幅 (浪高)
    basePhaseSpeed: 20, // 主波浪横向移动速度的除数 (越小越快)
    noiseSpeed: 222, // 细节噪点波浪的移动速度
    noiseAmplitude: 0.3, // 细节噪点波浪的振幅
    step: 4, // 绘图的步长(px)，越小曲线越平滑，但计算量稍大
  };
  // 合并默认配置和用户传入的配置
  const finalConfig = { ...defaultConfig, ...config };

  // --- 内部响应式状态 ---
  const waveOffset = ref(0); // 控制波浪相位，实现动画效果的计时器
  const anchors = ref([]); // 存储所有随机化锚点参数的数组

  // --- 核心函数：重建波形锚点 ---
  // 当宽度变化或需要重置时调用，生成一组新的随机波形参数
  function rebuildWaves() {
    const w = width.value;
    if (w <= 0) return; // 如果宽度无效则不执行

    const newAnchors = [];
    for (let i = 0; i < finalConfig.anchorCount; i++) {
      newAnchors.push({
        x: (i * w) / (finalConfig.anchorCount - 1), // 计算每个锚点的x坐标，使其均匀分布
        // 在设定的最大最小值之间随机生成波长
        waveLength:
          finalConfig.minWaveLength +
          Math.random() *
            (finalConfig.maxWaveLength - finalConfig.minWaveLength),
        // 在设定的最大最小值之间随机生成振幅
        amplitude:
          finalConfig.minAmplitude +
          Math.random() * (finalConfig.maxAmplitude - finalConfig.minAmplitude),
        phase: Math.random() * Math.PI * 2, // 随机生成一个初始相位，让波形起始位置错开
      });
    }
    anchors.value = newAnchors; // 更新锚点数组
  }

  // --- 辅助函数：根据x坐标插值计算当前点的波形参数 ---
  function getInterpolatedParams(x) {
    if (anchors.value.length < 2) return null; // 至少需要两个锚点才能插值

    // 遍历锚点，找到 x 所在的区间
    for (let i = 0; i < anchors.value.length - 1; i++) {
      const start = anchors.value[i];
      const end = anchors.value[i + 1];

      if (x >= start.x && x <= end.x) {
        // 计算 x 在这个区间的相对位置 (0到1)
        const t = (x - start.x) / (end.x - start.x);
        // 对波长、振幅和相位进行线性插值，确保平滑过渡
        return {
          waveLength: lerp(start.waveLength, end.waveLength, t),
          amplitude: lerp(start.amplitude, end.amplitude, t),
          phase: lerp(start.phase, end.phase, t),
        };
      }
    }
    // 如果 x 超出范围，返回最后一个锚点的参数
    return anchors.value[anchors.value.length - 1];
  }

  // --- 边缘衰减函数：确保波浪在左右两端振幅为0，完美贴合边缘 ---
  function edgeTaper(x, totalWidth) {
    // 使用正弦曲线 (sin(t * PI)) 实现一个从0 -> 1 -> 0的平滑衰减窗口
    return Math.sin((x / totalWidth) * Math.PI);
  }

  // --- 生命周期与侦听器 ---
  let waveTimer; // 存储定时器ID
  onMounted(() => {
    rebuildWaves(); // 组件挂载时，立即构建一次波形
    waveTimer = setInterval(() => {
      waveOffset.value += 1;
    }, 32); // 启动动画计时器
  });
  onUnmounted(() => {
    if (waveTimer) clearInterval(waveTimer); // 组件卸载时，清理定时器
  });

  // 侦听容器宽度的变化，如果变化则自动重建波形
  watch(width, rebuildWaves);

  // --- 计算属性：生成最终的SVG路径字符串 ---
  const liquidPath = computed(() => {
    const w = width.value;
    const h = height.value;
    if (w <= 0 || h <= 0) return ""; // 如果尺寸无效，返回空路径

    // 液面随时间下降：topY从0(顶部) -> h(底部)
    const topY = h * progress.value;
    const phase = waveOffset.value; // 当前的动画相位

    // SVG路径指令：从左下角开始，移动到右下角，再到右上角
    let d = `M0,${h} L${w},${h} L${w},${topY} `;

    // 从右向左循环绘制波浪线上的点
    for (let x = w; x >= 0; x -= finalConfig.step) {
      const params = getInterpolatedParams(x); // 获取当前x坐标的插值参数
      if (!params) continue; // 如果没获取到，跳过

      const taper = edgeTaper(x, w); // 计算当前x坐标的边缘衰减系数 (0到1)

      // 主波浪：使用插值出的参数计算
      const mainWave = Math.sin(
        (x / params.waveLength) * 2 * Math.PI +
          phase / finalConfig.basePhaseSpeed +
          params.phase
      );
      // 细节噪点波浪：使用固定的参数，增加高频细节
      const noiseWave = Math.sin(x / 10 + phase / finalConfig.noiseSpeed);

      // 混合波形：将主波和噪点波按各自振幅加权，再乘以边缘衰减系数
      const y =
        topY +
        (mainWave * params.amplitude + noiseWave * finalConfig.noiseAmplitude) *
          taper;

      d += `L${x},${y} `; // 将计算出的点添加到路径指令中
    }

    d += `L0,${topY} Z`; // 移动到左上角，并闭合路径 (Z)
    return d; // 返回完整的路径字符串
  });

  // 返回接口对象
  return { liquidPath };
}
