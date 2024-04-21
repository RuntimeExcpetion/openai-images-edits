<script setup lang="ts">

import {DeleteFilled} from "@element-plus/icons-vue"
import {ImageManager, ImageNode} from "@/types/ImageManager"
import {addImage, getAllImages, deleteImage} from '@/stores/useDatabase';


// 注入imageSrcManager
const {updateImageNode} = inject('imageManager') as ImageManager
/**
 * 选择图片
 * @param imageNode 图片节点信息
 */
const selectImage = (imageNode: ImageNode) => {
  // 调用updateImageNode方法，更新imageSrcManager中的图片节点信息
  updateImageNode(imageNode)
}

// 定义一个变量，用于存储图片列表
const imageList = ref<{ src: string, id: number }[]>([])

/**
 * 处理拖拽事件
 * @param event 拖拽事件对象
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();  // 这一行是必须的，它允许我们放下数据
}

/**
 * 处理文件拖拽事件
 * @param event 文件拖拽事件对象
 */
const handleDrop = (event: DragEvent) => {
  // 防止默认行为，避免打开文件
  event.preventDefault();
  // 获取文件列表
  const files = event.dataTransfer?.files;
  // 如有文件，则添加到图片列表中
  if (files) {
    // 添加文件到图片列表
    addFilesToImageList(files);
  }
}

/**
 * 添加文件到图片列表中
 * @param files 文件列表
 */
const addFilesToImageList = async (files: FileList) => {
  // 遍历文件列表
  for (let i = 0; i < files.length; i++) {
    // 获取文件
    const file = files[i];
    // 如是图片文件，则添加到图片列表中
    if (file.type.startsWith('image/')) {
      const blob = await file.arrayBuffer().then(buffer => new Blob([buffer]));
      const id = await addImage(blob);
      const url = URL.createObjectURL(blob);
      imageList.value.push({src: url, id});
    }
  }
}

/**
 * 删除图片
 * @param index 图片索引
 */
const removeImage = (index: number) => {
  // 删除数据库中的图片
  deleteImage(imageList.value[index].id);
  // 删除图片列表中的图片
  imageList.value.splice(index, 1);
}

/**
 * 图片墙是否为空
 */
const isImageWallEmpty = computed(() => {
  return imageList.value.length === 0
});

onMounted(() => {
  getAllImages().then(images => {
    for (let i = 0; i < images.length; i++) {
      const id = images[i].id;
      const url = URL.createObjectURL(images[i].blob);
      imageList.value.push({src: url, id});
    }
  });
});
</script>

<template>
  <div class="image-wall-wrapper" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
    <el-empty v-show="isImageWallEmpty" description="请将图片拖拽到此处."/>
    <div v-for="(item, index) in imageList" :key="index" class="image-item">
      <el-badge :value="index + 1"
                dot-style=" top: 0;left: 50%;transform: translateY(-50%) translateX(-50%); right:unset;"
                type="primary">
        <el-image @click="selectImage(item)" :src="item.src" fit="scale-down"></el-image>
        <el-popconfirm @confirm="removeImage(index)"
                       confirm-button-text="是"
                       cancel-button-text="否"
                       confirm-button-type="danger"
                       cancel-button-type="primary"
                       title="您确认要删除该图片吗?">
          <template #reference>
            <el-button class="delete-button">
              <el-icon>
                <DeleteFilled/>
              </el-icon>
            </el-button>
          </template>
        </el-popconfirm>
      </el-badge>
    </div>
  </div>
</template>

<style scoped>

::v-global(:root) {
  --image-wall-pd: 10px; /* 图片墙的内边距 */
  --image-wall-border: 2px; /* 图片墙的边框 */
}

.el-empty {
  margin: 0 auto; /* 居中显示 */
  text-align: center; /* 文字居中 */
  padding: 50px 0; /* 空白区域的高度 */
}

.image-wall-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 10px; /* 控制图片间距 */
  overflow-y: auto; /* 允许垂直滚动 */
  height: calc(100vh - var(--image-wall-pd) * 2 - var(--image-wall-border) * 2); /* 图片墙的高度 */
  padding: var(--image-wall-pd);
  border: var(--image-wall-border) dashed #ccc; /* 为图片墙添加边框样式 */
}

.image-item {
  position: relative;
  display: inline-block;
}

.delete-button {
  position: absolute;
  top: -10px;
  right: -15px;
  background: none;
  border: none;
  cursor: pointer;
  color: red; /* Adjust the color if needed */
  font-size: 1.5rem; /* Adjust the font size if needed */
}

</style>
