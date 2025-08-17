<template>
  <div class="h-full bg-gray-50 dark:bg-gray-900">
    <!-- 工具头部 -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button 
            @click="$emit('back')"
            class="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeftIcon class="h-5 w-5" />
            返回
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <LinkIcon class="h-8 w-8 text-blue-600" />
              URL 编码转换
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              支持URL编码与解码
            </p>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex items-center gap-3">
          <button
            @click="clearAll"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            清空
          </button>
          <button
            @click="swapContent"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowsRightLeftIcon class="h-4 w-4" />
            交换
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- 编码解码区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 原始文本 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                原始文本
              </h3>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ originalText.length }} 字符
                </span>
                <button
                  @click="copyToClipboard(originalText)"
                  class="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  title="复制"
                >
                  <ClipboardIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
            <textarea
              v-model="originalText"
              @input="encodeText"
              placeholder="请输入要编码的URL..."
              class="w-full h-80 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
          </div>

          <!-- 编码结果 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                URL 编码
              </h3>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ encodedText.length }} 字符
                </span>
                <button
                  @click="copyToClipboard(encodedText)"
                  class="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  title="复制"
                >
                  <ClipboardIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
            <textarea
              v-model="encodedText"
              @input="decodeText"
              placeholder="或者输入URL编码进行解码..."
              class="w-full h-80 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            ></textarea>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <InformationCircleIcon class="h-5 w-5" />
            使用说明
          </h4>
          <div class="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>• <strong>编码功能:</strong> 在左侧文本框中输入URL或文本，右侧会自动显示URL编码结果</p>
            <p>• <strong>解码功能:</strong> 在右侧文本框中输入URL编码，左侧会自动显示解码结果</p>
            <p>• <strong>交换功能:</strong> 点击"交换"按钮可以快速交换两个文本框的内容</p>
            <p>• <strong>复制功能:</strong> 点击复制按钮可以将内容复制到剪贴板</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知消息 -->
    <div
      v-if="notification"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300"
    >
      {{ notification }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowLeftIcon,
  LinkIcon,
  ArrowsRightLeftIcon,
  ClipboardIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

// 定义 emits
defineEmits<{
  back: []
}>()

// 响应式数据
const originalText = ref('')
const encodedText = ref('')
const notification = ref('')

// URL编码
const encodeText = () => {
  if (!originalText.value) {
    encodedText.value = ''
    return
  }
  try {
    encodedText.value = encodeURIComponent(originalText.value)
  } catch (error) {
    console.error('编码失败:', error)
    showNotification('编码失败，请检查输入内容')
  }
}

// URL解码
const decodeText = () => {
  if (!encodedText.value) {
    originalText.value = ''
    return
  }
  try {
    originalText.value = decodeURIComponent(encodedText.value)
  } catch (error) {
    console.error('解码失败:', error)
    showNotification('解码失败，请检查URL编码格式')
  }
}

// 交换内容
const swapContent = () => {
  const temp = originalText.value
  originalText.value = encodedText.value
  encodedText.value = temp
  showNotification('内容已交换')
}

// 清空所有内容
const clearAll = () => {
  originalText.value = ''
  encodedText.value = ''
  showNotification('已清空所有内容')
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  if (!text) {
    showNotification('没有内容可复制')
    return
  }
  
  try {
    await navigator.clipboard.writeText(text)
    showNotification('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    showNotification('复制失败')
  }
}

// 显示通知
const showNotification = (message: string) => {
  notification.value = message
  setTimeout(() => {
    notification.value = ''
  }, 3000)
}
</script>