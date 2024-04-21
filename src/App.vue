<script setup lang="ts">
import ImageWall from "./components/ImageWall.vue"
import WorkCanvas from "./components/WorkCanvas.vue"
import { ImageSrc, ImageManager } from './types/ImageManager'
import type {Ref} from "vue";

const currentImageSrc: Ref<ImageSrc> = ref("");

const setImageSrc: (newSrc: string) => void = (newSrc: string) => {
  currentImageSrc.value = newSrc;
}

const imageManager: ImageManager = {
  imageSrc: currentImageSrc,
  updateImageSrc: setImageSrc
}

provide("imageSrcManager", imageManager)


</script>

<template>
  <el-container>
    <el-aside>
      <image-wall></image-wall>
    </el-aside>
    <el-main>
      <work-canvas v-show="currentImageSrc"/>
    </el-main>
  </el-container>
</template>


<style scoped>
/* Add styles here */
.el-aside {
  height: 100vh;
}
</style>