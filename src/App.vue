<script setup lang="ts">
import ImageWall from "./components/ImageWall.vue"
import WorkCanvas from "./components/WorkCanvas.vue"
import { ImageNode, ImageManager } from './types/ImageManager'
import type {Ref} from "vue";

const currentImageNode: Ref<undefined | ImageNode> = ref();

const updateImageNode: (imageNode: ImageNode) => void = (imageNode: ImageNode) => {
  currentImageNode.value = imageNode;
}

const imageManager: ImageManager = {
  imageNode: currentImageNode as Ref<ImageNode>,
  updateImageNode: updateImageNode
}

provide("imageManager", imageManager)

</script>

<template>
  <el-container>
    <el-aside>
      <image-wall></image-wall>
    </el-aside>
    <el-main>
      <work-canvas v-show="currentImageNode"/>
      <ChatRoom v-show="!currentImageNode"/>
    </el-main>
  </el-container>
</template>


<style scoped>
/* Add styles here */
.el-aside {
  height: 100vh;
}
</style>