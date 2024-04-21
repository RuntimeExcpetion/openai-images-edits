<script setup lang="ts">
import {ref} from 'vue';
import {UserFilled} from "@element-plus/icons-vue";

const count = ref(0)
const load = () => {
  count.value += 2
}

interface ChatMessage {
  user: string;
  id: number;
  contents: string | { type: 'image' | 'text', content: string | number }[];
}

const messages = ref<ChatMessage[]>([]);
const currentMessage = ref('');

const sendMessage = () => {
  if (currentMessage.value.trim()) {
    const newMessage: ChatMessage = {
      user: 'You',
      id: Date.now(),
      contents: currentMessage.value
    };
    messages.value.push(newMessage);
    currentMessage.value = '';
  }
};

// 示例：假设我们能接收到图片URL
const receiveImage = (imageUrl: string) => {
  const newMessage: ChatMessage = {
    user: 'You',
    id: Date.now(),
    contents: [{type: 'image', content: imageUrl}]
  };
  messages.value.push(newMessage);
};

onMounted(() => {
  // 假设我们从服务器获取了历史消息 使用faker生成假数据
  messages.value = Array.from({length: 100}, (_, index) => ({
    user: 'You',
    id: index,
    contents: [{type: 'text', content: index}, {
      type: 'image',
      content: `https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg`
    }]
  }));
})
</script>

<template>
  <el-container class="chat-container">
    <el-main class="chat-content">
      <ul v-infinite-scroll="load" class="infinite-list" style="overflow: auto">
        <li v-for="message in messages" :key="message.id" class="chat-message">
          <el-row>
            <el-col :span="1">
              <el-avatar :size="24" :icon="UserFilled"></el-avatar>
            </el-col>
            <el-col :span="23">
              <el-text class="chat-name">{{ message.user }}</el-text>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="1">
            </el-col>
            <el-col :span="23">
              <div v-for="(item, index) in message.contents" :key="index">
                <el-image class="chat-image" v-if="item.type === 'image'" :src="item.content" fit="scale-down" />
                <div v-else>{{ item.content }}</div>
              </div>
            </el-col>
          </el-row>
        </li>
      </ul>
    </el-main>
    <el-footer class="chat-input">
      <div class="chat-input-wrapper">
        <div class="chat-input-content">
          <el-input
              type="textarea"
              v-model="currentMessage"
              placeholder="输入消息..."
              @keyup.enter="sendMessage"
          />
        </div>
        <div class="chat-input-btn">
          <el-button type="primary" @click="sendMessage">发送</el-button>
        </div>
      </div>
    </el-footer>
  </el-container>
</template>

<style scoped>

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-content {
  height: 85vh;
  overflow-y: auto;
}

.infinite-list {
  height: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

::-webkit-scrollbar {
  width: 6px;
}


::-webkit-scrollbar-thumb {
  background-color: #0003;
  border-radius: 10px;
  transition: all .2s ease-in-out;
}

::-webkit-scrollbar-thumb:hover {
  cursor: pointer;
  background-color: #0000004d
}

.chat-name {
  font-weight: bold;
  color: black;
}

.chat-message {
  margin: 10px 0;
}

.chat-image {
  width: 700px;
  height: 350px
}

.chat-input-wrapper {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}

.chat-input-content {
  flex-grow: 1;
  margin-right: 10px;
}

.chat-input {
  display: flex;
  flex-shrink: 0;
}

/* 调整样式以适应你的设计 */
</style>
