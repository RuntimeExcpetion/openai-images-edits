// 定义类型
import type{Ref} from "vue";

export type ImageNode = {
    src: string;
    id: number
};

// 定义接口
export interface ImageManager {
    imageNode: Ref<ImageNode>;
    updateImageNode: (imageNode: ImageNode) => void;
}
