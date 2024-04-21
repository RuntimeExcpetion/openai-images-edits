import {DBSchema, openDB} from 'idb';
import {DrawCommand} from "@/types/DrawCommand";

interface MyImageDB extends DBSchema {
    images: {
        key: number;
        value: { id?: number; blob: Blob };
    };
    canvasCommandHistory: {
        key: number;
        value: { id: number, history: DrawCommand[], current: number };
    };
}

const DATABASE_NAME = 'oai-database';
const DATABASE_VERSION = 1;
const STORE_IMAGES_NAME = 'images';
const STORE_CANVAS_HISTORY_NAME = 'canvasCommandHistory';


// 初始化数据库
const dbPromise = openDB<MyImageDB>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_IMAGES_NAME)) {
            db.createObjectStore(STORE_IMAGES_NAME, {keyPath: 'id', autoIncrement: true});
        }
        if (!db.objectStoreNames.contains(STORE_CANVAS_HISTORY_NAME)) {
            db.createObjectStore(STORE_CANVAS_HISTORY_NAME, {keyPath: 'id'});
        }
    },
});

// 清空数据库
export async function clearDatabase() {
    const db = await dbPromise;
    const tx = db.transaction(STORE_IMAGES_NAME, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES_NAME);
    await store.clear();
    await tx.done;
}

// 添加图片
export async function addImage(imageBlob: Blob): Promise<number> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_IMAGES_NAME, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES_NAME);
    const result = await store.add({blob: imageBlob});
    await tx.done;
    return result;
}

// 删除图片
export async function deleteImage(id: number): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_IMAGES_NAME, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES_NAME);
    await store.delete(id);
    await tx.done;
}

// 获取图片
export async function getImage(id: number): Promise<Blob | undefined> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_IMAGES_NAME, 'readonly');
    const store = tx.objectStore(STORE_IMAGES_NAME);
    const record = await store.get(id);
    return record?.blob;
}

// 获取所有图片
export async function getAllImages(): Promise<Array<{ blob: Blob, id: number }>> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_IMAGES_NAME, 'readonly');
    const store = tx.objectStore(STORE_IMAGES_NAME);
    const records = await store.getAll();
    return records.map((record) => ({id: record.id!, blob: record.blob}));
}

// 加入画布命令历史记录
export async function addCanvasCommandHistory(id: number, history: DrawCommand[], current: number): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_CANVAS_HISTORY_NAME, 'readwrite');
    const store = tx.objectStore(STORE_CANVAS_HISTORY_NAME);
    await store.put({id: id, history: history, current: current});
    await tx.done;
}

// 获取画布历史记录
export async function getCanvasCommandHistory(id: number):
    Promise<{ id: number, history: DrawCommand[], current: number } | undefined> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_CANVAS_HISTORY_NAME, 'readonly');
    const store = tx.objectStore(STORE_CANVAS_HISTORY_NAME);
    return await store.get(id);
}

// 删除画布历史记录
export async function deleteCanvasCommandHistory(id: number): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_CANVAS_HISTORY_NAME, 'readwrite');
    const store = tx.objectStore(STORE_CANVAS_HISTORY_NAME);
    await store.delete(id);
    await tx.done;
}

// 清空画布历史记录
export async function clearCanvasCommandHistory(): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_CANVAS_HISTORY_NAME, 'readwrite');
    const store = tx.objectStore(STORE_CANVAS_HISTORY_NAME);
    await store.clear();
    await tx.done;
}