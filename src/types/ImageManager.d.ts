// 定义类型
import type{Ref} from "vue";

export type ImageSrc = string;

// 定义接口
export interface ImageManager {
    imageSrc: Ref<ImageSrc>;
    updateImageSrc: (src: ImageSrc) => void;
}
