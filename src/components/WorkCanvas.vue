<script setup lang="ts">
import {ImageManager, ImageNode} from "@/types/ImageManager";
import {DrawCommand} from "@/types/DrawCommand";
import {ArrowLeftBold, ArrowRightBold, EditPen, Refresh} from "@element-plus/icons-vue";
import {addCanvasCommandHistory, getCanvasCommandHistory} from "@/stores/useDatabase";

const {imageNode} = inject<ImageManager>('imageManager') as ImageManager;

// 定义变量
const canvasWrapper = ref<HTMLDivElement>();
const backgroundCanvas = ref<HTMLCanvasElement>();
const drawingCanvas = ref<HTMLCanvasElement>();
const bgCtx = ref<CanvasRenderingContext2D>();
const drawingCtx = ref<CanvasRenderingContext2D>();
// 命令列表
const drawCommand: Ref<DrawCommand[]> = ref([]);
// 当前命令索引
const currentCommandIndex = ref<number>(0);
// 画笔大小
const brushSize = ref<number>(50);

/**
 * 获取缩放比例
 * @param img 图片
 * @param width 指定宽度
 * @param height 指定高度
 * @param getMax 是否获取最大缩放比例
 * @returns 缩放比例
 */
const getScale = (img: HTMLImageElement, width?: number, height?: number, getMax: boolean = false) => {
  // 获取window的宽高
  const windowWidth = width || canvasWrapper.value!.clientWidth * 0.85;
  const windowHeight = height || canvasWrapper.value!.clientHeight * 0.85;
  // 计算缩放比例
  const scaleX = windowWidth / img.width;
  const scaleY = windowHeight / img.height;
  return getMax ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
}
/**
 * 加载并绘制图片
 * @param src 图片地址
 */
const loadAndDrawImage = (src: string) => {
  const img = new Image();
  img.onload = () => {
    if (backgroundCanvas.value && drawingCanvas.value) {
      // 获取画布上下文
      bgCtx.value = backgroundCanvas.value.getContext('2d')!;
      drawingCtx.value = drawingCanvas.value.getContext('2d')!;
      // 计算缩放比例
      const scale = getScale(img);
      // 缩放图片并绘制到背景画布
      const scaleWidth = scale * img.width;
      const scaleHeight = scale * img.height;
      backgroundCanvas.value.width = scaleWidth;
      backgroundCanvas.value.height = scaleHeight;
      drawingCanvas.value.width = scaleWidth;
      drawingCanvas.value.height = scaleHeight;
      bgCtx.value?.drawImage(img, 0, 0, scaleWidth, scaleHeight);
      // 重绘画布
      redrawCanvas(drawingCanvas.value!, drawCommand.value, 0, currentCommandIndex.value);
    }
  };
  img.src = src;
}

/**
 * 保存历史记录
 */
const saveHistory = async (nodeId: number = imageNode.value.id) => {
  const commands: DrawCommand[] = drawCommand.value.map((cmd, _) => {
    const newParams: any = {};
    for (const key in cmd.params) {
      newParams[key] = cmd.params[key];
    }
    return {
      type: cmd.type,
      params: newParams,
    }
  });
  await addCanvasCommandHistory(nodeId, commands, currentCommandIndex.value);
}

watch(() => imageNode.value, async (newImageNode, oldImageNode) => {
  if (newImageNode !== oldImageNode) {
    if (drawCommand.value.length > 0) {
      await saveHistory(oldImageNode!.id);
    }
    const canvasCommandHistory = await getCanvasCommandHistory(imageNode.value.id);
    if (canvasCommandHistory) {
      drawCommand.value = canvasCommandHistory.history;
      currentCommandIndex.value = canvasCommandHistory.current;
    } else {
      drawCommand.value = [];
      currentCommandIndex.value = 0;
    }
    loadAndDrawImage(newImageNode.src);
    console.log('image loaded', imageNode.value.id, drawCommand.value, currentCommandIndex.value);
  }
}, {immediate: true});


onBeforeUnmount(() => {
  // 组件销毁时保存历史记录
  if (drawCommand.value.length > 0) {
    saveHistory();
  }
})

/**
 * 绘制遮罩
 * @param source 遮罩图片的URL
 * @param canvas 画板
 * @param ctx 画板上下文
 */
const drawMask = (source: string | null, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  if (source) {
    const img = new Image();
    img.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除当前画布
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // 绘制上一状态
    };
    img.src = source;
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 如果没有上一状态，清除画布
  }
}

let isDrawing = false; // 是否正在绘制
/**
 * 开始绘制
 * @param event 鼠标事件
 */
const startDrawing = (event: MouseEvent) => {
  isDrawing = true;
  draw(event); // 开始绘制
}

/**
 * 绘制
 * @param event 鼠标事件
 */
const draw = (event: MouseEvent) => {
  if (!isDrawing) return;
  const canvas = drawingCanvas.value!;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const params = {
    x: x,
    y: y,
    dx: x + event.movementX,
    dy: y + event.movementY,
    lineWidth: brushSize.value,
    lineCap: 'round',
    strokeStyle: 'rgba(0,0,0,0.5)'
  }
  // 移除当前索引之后的命令
  drawCommand.value = drawCommand.value.splice(0, currentCommandIndex.value);
  // 记录绘制命令
  drawCommand.value.push({
    type: 'line',
    params: params
  });
  redrawCanvas(canvas, drawCommand.value, currentCommandIndex.value++, currentCommandIndex.value); // 重绘画布
}

/**
 * 重绘画布
 * @param canvas 画布
 * @param commands 绘制命令
 * @param startIndex 开始索引，默认为0
 * @param endIndex 结束索引，默认为-1
 */
const redrawCanvas = (canvas: HTMLCanvasElement, commands: DrawCommand[], startIndex: number = 0, endIndex: number = commands.length - 1) => {
  const ctx = canvas.getContext('2d')!;
  if (startIndex === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布
  }
  commands.slice(startIndex, endIndex).forEach(cmd => {
    switch (cmd.type) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(cmd.params.x, cmd.params.y);
        ctx.lineTo(cmd.params.dx, cmd.params.dy);
        ctx.strokeStyle = cmd.params.strokeStyle;
        ctx.lineWidth = cmd.params.lineWidth;
        ctx.lineCap = cmd.params.lineCap;
        ctx.stroke();
        break;
        // 添加其他类型的绘制处理
    }
  });
}

/**
 * 停止绘制
 */
const stopDrawing = () => {
  isDrawing = false;
  drawingCtx.value?.beginPath(); // 重置路径
}

/**
 * 撤销
 * @param step 步数，默认为1
 */
const undo = (step: number = 1) => {
  if (currentCommandIndex.value >= 0) {
    currentCommandIndex.value += step;
    redrawCanvas(drawingCanvas.value!, drawCommand.value, 0, currentCommandIndex.value); // 重绘画布
  }
}

/**
 * 改变当前命令索引
 */
const changCurrentCommandIndex = () => {
  redrawCanvas(drawingCanvas.value!, drawCommand.value, 0, currentCommandIndex.value); // 重绘画布
}

/**
 * 清空画布
 */
const clearCanvas = () => {
  drawCommand.value = [];
  currentCommandIndex.value = 0;
  redrawCanvas(drawingCanvas.value!, drawCommand.value); // 重绘画布
}

/**
 * 撤销遮罩
 * @param canvas 画布
 */
const undoMask = (canvas: HTMLCanvasElement) => {
  redrawCanvas(canvas, drawCommand.value, 0, currentCommandIndex.value)
}

/**
 * 节流函数
 * @param callback 回调函数
 * @param delay 延迟时间
 */
const throttle = (callback: Function, delay: number) => {
  let lastCall = 0;  // 初始化上一次调用的时间为 0
  return function (...args: any[]) {  // 返回一个函数，接收任意数量的参数
    const now = new Date().getTime();  // 获取当前时间
    if (now - lastCall < delay) return;  // 如果距离上一次调用的时间小于延迟时间，则直接返回
    lastCall = now;  // 更新上一次调用的时间为当前时间
    callback(...args);  // 调用传入的回调函数并传入参数
  };
}

// 设置画笔大小
const updateBrushSize = () => {
  // 计算圆的半径，可以根据实际需要调整公式
  const size = brushSize.value;
  let radius = size / 2;
  // 应用新光标样式
  drawingCanvas.value!.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewport="0 0 ${size} ${size}" style="fill:black;font-size:24px;"><circle cx="${radius}" cy="${radius}" r="${radius - 1}" stroke="black" stroke-width="2" fill="none" /></svg>') ${radius} ${radius}, auto`;
}

onMounted(() => {
  updateBrushSize();
  const canvas = drawingCanvas.value!;
  // 绑定事件
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'z') {
      if (currentCommandIndex.value > 0) {
        --currentCommandIndex.value;
      }
      // 按下Ctrl+Z撤销
      throttle(undoMask, 200)(canvas);
    }
  })
})

</script>


<template>
  <div class="canvas-container">
    <el-row class="toolbar">
      <el-col :span="24">
        <el-form inline>
          <el-form-item style="width: 175px;">
            <template #label>
              <el-icon style="font-size: 1.5em; width: 100%; height: 100%;">
                <EditPen/>
              </el-icon>
            </template>
            <el-slider label="画笔大小" v-model="brushSize" :min="5" :max="100"
                       range-start-label="5" range-end-label="100" size="small"
                       @change="updateBrushSize"/>
          </el-form-item>
          <el-form-item>
            <el-button :icon="Refresh" @click="clearCanvas">清空</el-button>
          </el-form-item>
          <el-form-item label="上一步">
            <el-button :icon="ArrowLeftBold" type="primary" @click="undo(-1)"></el-button>
          </el-form-item>
          <el-form-item style="width: 175px;">
            <el-slider label="历史操作列表" v-model="currentCommandIndex" :min="0" :max="drawCommand.length"
                       range-start-label="0" size="small"
                       @change="changCurrentCommandIndex"/>
          </el-form-item>
          <el-form-item label="下一步">
            <el-button :disabled="currentCommandIndex >= drawCommand.length" :icon="ArrowRightBold" type="primary"
                       @click="undo(1)"></el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <div ref="canvasWrapper" id="canvas-wrapper">
      <canvas ref="backgroundCanvas" id="backgroundCanvas"></canvas>
      <canvas ref="drawingCanvas" id="drawingCanvas"></canvas>
    </div>
  </div>

</template>

<style scoped>

.canvas-container {
  height: 100%;
  width: 100%;
  --toolbard-height: 50px;
  text-align: center;
}

.toolbar {
  margin: 0 auto;
  height: var(--toolbard-height);
}

#canvas-wrapper {
  height: calc(100% - var(--toolbard-height));
  width: 100%;
  background: #f0f0f0; /* 添加背景颜色以便在开发时看到画布 */
  position: relative;
}

#backgroundCanvas, #drawingCanvas {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  margin: auto;
}

#backgroundCanvas {
  z-index: 999991;
}

#drawingCanvas {
  z-index: 999992;
}

canvas {
  display: block; /* 帮助消除额外的空间 */
}
</style>