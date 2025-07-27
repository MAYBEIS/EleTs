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
              <KeyIcon class="h-8 w-8 text-blue-600" />
              Base64 编码转换
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              支持文本和文件的Base64编码与解码
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
        <!-- 模式切换 -->
        <div class="mb-6">
          <div class="flex items-center gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
            <button
              @click="mode = 'text'"
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                mode === 'text'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              <DocumentTextIcon class="h-4 w-4 inline mr-2" />
              文本模式
            </button>
            <button
              @click="mode = 'file'"
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                mode === 'file'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              <DocumentIcon class="h-4 w-4 inline mr-2" />
              文件模式
            </button>
          </div>
        </div>

        <!-- 文本模式 -->
        <div v-if="mode === 'text'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              placeholder="请输入要编码的文本..."
              class="w-full h-80 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
          </div>

          <!-- Base64编码结果 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Base64 编码
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
              placeholder="或者输入Base64编码进行解码..."
              class="w-full h-80 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            ></textarea>
          </div>
        </div>

        <!-- 文件模式 -->
        <div v-else class="space-y-6">
          <!-- 文件上传区域 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8">
            <div class="text-center">
              <DocumentIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div class="space-y-2">
                <p class="text-lg font-medium text-gray-900 dark:text-white">
                  选择文件进行Base64编码
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  支持任意格式的文件，最大 10MB
                </p>
              </div>
              <div class="mt-6 flex justify-center gap-4">
                <button
                  @click="selectFile"
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FolderOpenIcon class="h-5 w-5" />
                  选择文件
                </button>
                <button
                  @click="pasteFromClipboard"
                  class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <ClipboardIcon class="h-5 w-5" />
                  粘贴Base64
                </button>
              </div>
            </div>
          </div>

          <!-- 文件信息和结果 -->
          <div v-if="fileInfo" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DocumentIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">{{ fileInfo.name }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(fileInfo.size) }} • {{ fileInfo.type || '未知类型' }}
                  </p>
                </div>
              </div>
              <button
                @click="copyToClipboard(fileBase64)"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ClipboardIcon class="h-4 w-4" />
                复制Base64
              </button>
            </div>
            
            <!-- Base64结果 -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Base64 编码结果:</label>
              <textarea
                :value="fileBase64"
                readonly
                class="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs resize-none"
                placeholder="文件Base64编码将显示在这里..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <InformationCircleIcon class="h-5 w-5" />
            使用说明
          </h4>
          <div class="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>• <strong>文本模式:</strong> 在任一文本框中输入内容，另一个文本框会自动显示转换结果</p>
            <p>• <strong>文件模式:</strong> 选择文件后会自动生成Base64编码，可直接复制使用</p>
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
import { ref, reactive } from 'vue'
import {
  ArrowLeftIcon,
  KeyIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  DocumentIcon,
  ClipboardIcon,
  FolderOpenIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

// 定义 emits
defineEmits<{
  back: []
}>()

// 响应式数据
const mode = ref<'text' | 'file'>('text')
const originalText = ref('')
const encodedText = ref('')
const notification = ref('')
const fileInfo = ref<{name: string, size: number, type: string} | null>(null)
const fileBase64 = ref('')

// 文本编码
const encodeText = () => {
  if (!originalText.value) {
    encodedText.value = ''
    return
  }
  try {
    encodedText.value = btoa(unescape(encodeURIComponent(originalText.value)))
  } catch (error) {
    console.error('编码失败:', error)
    showNotification('编码失败，请检查输入内容')
  }
}

// 文本解码
const decodeText = () => {
  if (!encodedText.value) {
    originalText.value = ''
    return
  }
  try {
    originalText.value = decodeURIComponent(escape(atob(encodedText.value)))
  } catch (error) {
    console.error('解码失败:', error)
    showNotification('解码失败，请检查Base64格式')
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
  fileInfo.value = null
  fileBase64.value = ''
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

// 选择文件
const selectFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '*/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB限制
        showNotification('文件大小不能超过10MB')
        return
      }
      processFile(file)
    }
  }
  input.click()
}

// 处理文件
const processFile = (file: File) => {
  fileInfo.value = {
    name: file.name,
    size: file.size,
    type: file.type
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    fileBase64.value = result.split(',')[1] // 移除data:xxx;base64,前缀
    showNotification('文件编码完成')
  }
  reader.onerror = () => {
    showNotification('文件读取失败')
  }
  reader.readAsDataURL(file)
}

// 从剪贴板粘贴Base64
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      // 尝试解码Base64来验证格式
      try {
        atob(text)
        fileBase64.value = text
        fileInfo.value = {
          name: '来自剪贴板',
          size: text.length,
          type: 'text/plain'
        }
        showNotification('已粘贴Base64内容')
      } catch {
        showNotification('剪贴板内容不是有效的Base64格式')
      }
    } else {
      showNotification('剪贴板为空')
    }
  } catch (error) {
    showNotification('无法访问剪贴板')
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 显示通知
const showNotification = (message: string) => {
  notification.value = message
  setTimeout(() => {
    notification.value = ''
  }, 3000)
}
</script>