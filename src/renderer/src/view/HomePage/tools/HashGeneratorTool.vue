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
              <ShieldCheckIcon class="h-8 w-8 text-blue-600" />
              哈希生成
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              生成MD5、SHA1、SHA256等哈希值
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
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- 输入区域 -->
        <div class="space-y-4 mb-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              输入文本
            </h3>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ inputText.length }} 字符
              </span>
              <button
                @click="pasteFromClipboard"
                class="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                title="从剪贴板粘贴"
              >
                <ClipboardIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
          <textarea
            v-model="inputText"
            placeholder="请输入要生成哈希的文本..."
            class="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- 哈希算法选择 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            哈希算法
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <button
              v-for="algorithm in algorithms"
              :key="algorithm.value"
              @click="selectedAlgorithm = algorithm.value"
              :class="[
                'px-4 py-3 rounded-lg text-sm font-medium transition-all',
                selectedAlgorithm === algorithm.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ algorithm.name }}
            </button>
          </div>
        </div>

        <!-- 结果区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              哈希结果
            </h3>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ hashResult.length }} 字符
              </span>
              <button
                @click="copyToClipboard(hashResult)"
                class="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                title="复制"
              >
                <ClipboardIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div class="relative">
            <textarea
              :value="hashResult"
              readonly
              placeholder="哈希结果将显示在这里..."
              class="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm resize-none"
            ></textarea>
            <div 
              v-if="!inputText" 
              class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none"
            >
              请输入文本以生成哈希值
            </div>
          </div>
        </div>

        <!-- 批量哈希生成 -->
        <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            批量哈希生成
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                每行一个文本（最多100行）
              </label>
              <textarea
                v-model="batchInput"
                placeholder="每行输入一个文本..."
                class="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ batchInputLines }} 行
              </span>
              <button
                @click="generateBatchHashes"
                :disabled="!batchInput.trim() || batchInputLines > 100"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  batchInput.trim() && batchInputLines <= 100
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                ]"
              >
                生成批量哈希
              </button>
            </div>
          </div>
          
          <!-- 批量结果 -->
          <div v-if="batchResults.length" class="mt-6">
            <h4 class="font-medium text-gray-900 dark:text-white mb-3">
              批量结果
            </h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" class="px-4 py-3">原文</th>
                    <th scope="col" class="px-4 py-3">哈希值</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(result, index) in batchResults" 
                    :key="index" 
                    class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">{{ result.text }}</td>
                    <td class="px-4 py-3 font-mono text-xs max-w-md truncate">{{ result.hash }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-4 flex justify-end">
              <button
                @click="copyBatchResults"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <ClipboardIcon class="h-4 w-4" />
                复制所有结果
              </button>
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
            <p>• <strong>单个哈希:</strong> 在输入框中输入文本，选择算法后会自动计算哈希值</p>
            <p>• <strong>批量哈希:</strong> 在批量输入框中每行输入一个文本，点击生成批量哈希</p>
            <p>• <strong>算法支持:</strong> 支持MD5、SHA1、SHA256、SHA384、SHA512算法</p>
            <p>• <strong>复制功能:</strong> 点击复制按钮可以将结果复制到剪贴板</p>
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
import { ref, computed, watch } from 'vue'
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  ClipboardIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import CryptoJS from 'crypto-js'

// 定义 emits
defineEmits<{
  back: []
}>()

// 响应式数据
const inputText = ref('')
const hashResult = ref('')
const notification = ref('')
const selectedAlgorithm = ref('md5')
const batchInput = ref('')
const batchResults = ref<Array<{text: string, hash: string}>>([])

// 哈希算法选项
const algorithms = [
  { name: 'MD5', value: 'md5' },
  { name: 'SHA1', value: 'sha1' },
  { name: 'SHA256', value: 'sha256' },
  { name: 'SHA384', value: 'sha384' },
  { name: 'SHA512', value: 'sha512' }
]

// 计算批量输入行数
const batchInputLines = computed(() => {
  return batchInput.value ? batchInput.value.split('\n').filter(line => line.trim()).length : 0
})

// 监听输入文本变化，自动计算哈希
watch(inputText, () => {
  generateHash()
})

// 监听算法选择变化，重新计算哈希
watch(selectedAlgorithm, () => {
  generateHash()
})

// 生成哈希
const generateHash = () => {
  if (!inputText.value) {
    hashResult.value = ''
    return
  }
  
  try {
    switch (selectedAlgorithm.value) {
      case 'md5':
        hashResult.value = CryptoJS.MD5(inputText.value).toString()
        break
      case 'sha1':
        hashResult.value = CryptoJS.SHA1(inputText.value).toString()
        break
      case 'sha256':
        hashResult.value = CryptoJS.SHA256(inputText.value).toString()
        break
      case 'sha384':
        hashResult.value = CryptoJS.SHA384(inputText.value).toString()
        break
      case 'sha512':
        hashResult.value = CryptoJS.SHA512(inputText.value).toString()
        break
      default:
        hashResult.value = CryptoJS.MD5(inputText.value).toString()
    }
  } catch (error) {
    console.error('哈希生成失败:', error)
    showNotification('哈希生成失败')
  }
}

// 生成批量哈希
const generateBatchHashes = () => {
  if (!batchInput.value.trim()) {
    showNotification('请输入批量文本')
    return
  }
  
  const lines = batchInput.value.split('\n').filter(line => line.trim())
  if (lines.length > 100) {
    showNotification('批量文本不能超过100行')
    return
  }
  
  batchResults.value = lines.map(line => {
    let hash = ''
    try {
      switch (selectedAlgorithm.value) {
        case 'md5':
          hash = CryptoJS.MD5(line).toString()
          break
        case 'sha1':
          hash = CryptoJS.SHA1(line).toString()
          break
        case 'sha256':
          hash = CryptoJS.SHA256(line).toString()
          break
        case 'sha384':
          hash = CryptoJS.SHA384(line).toString()
          break
        case 'sha512':
          hash = CryptoJS.SHA512(line).toString()
          break
        default:
          hash = CryptoJS.MD5(line).toString()
      }
    } catch (error) {
      console.error('哈希生成失败:', error)
      hash = '生成失败'
    }
    return { text: line, hash }
  })
  
  showNotification(`批量哈希生成完成 (${lines.length} 项)`)
}

// 清空所有内容
const clearAll = () => {
  inputText.value = ''
  hashResult.value = ''
  batchInput.value = ''
  batchResults.value = []
  showNotification('已清空所有内容')
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      inputText.value = text
      showNotification('已从剪贴板粘贴')
    } else {
      showNotification('剪贴板为空')
    }
  } catch (error) {
    showNotification('无法访问剪贴板')
  }
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

// 复制批量结果
const copyBatchResults = async () => {
  if (!batchResults.value.length) {
    showNotification('没有内容可复制')
    return
  }
  
  const text = batchResults.value.map(result => `${result.text} -> ${result.hash}`).join('\n')
  
  try {
    await navigator.clipboard.writeText(text)
    showNotification('已复制批量结果到剪贴板')
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