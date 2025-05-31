`<script setup lang="ts">
import { ref } from 'vue'

// 类型定义
export interface SkeletonProps {
  loading?: boolean
  error?: string | null
  retry?: () => void
}

// 加载状态
const isLoading = ref(true)
const error = ref<string | null>(null)

// 模拟加载数据
const loadData = () => {
  isLoading.value = true
  error.value = null
  
  setTimeout(() => {
    isLoading.value = false
  }, 1500)
}

// 初始加载
loadData()
</script>

<template>
  <div class="h-full w-full flex flex-col bg-gray-50">
    <!-- 顶部区域骨架 -->
    <header class="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- 搜索框骨架 -->
        <div class="flex-1 max-w-2xl">
          <div 
            :class="[
              'h-10 rounded-lg',
              isLoading ? 'animate-pulse bg-gray-200' : 'bg-white border border-gray-200'
            ]"
          ></div>
        </div>

        <!-- 按钮骨架 -->
        <div 
          :class="[
            'ml-4 w-24 h-10 rounded-lg',
            isLoading ? 'animate-pulse bg-gray-200' : 'bg-blue-500'
          ]"
        ></div>
      </div>
    </header>

    <!-- 主要内容区骨架 -->
    <main class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-6">
        <!-- 标签过滤器骨架 -->
        <div class="mb-6 flex flex-wrap gap-2">
          <template v-if="isLoading">
            <div 
              v-for="n in 5" 
              :key="n"
              class="h-8 w-20 rounded-full bg-gray-200 animate-pulse"
            ></div>
          </template>
          <slot v-else name="tags"></slot>
        </div>

        <!-- 内容列表骨架 -->
        <div class="space-y-6">
          <template v-if="isLoading">
            <div 
              v-for="n in 3" 
              :key="n"
              class="bg-white rounded-xl p-6 space-y-4"
            >
              <!-- 标题骨架 -->
              <div class="h-7 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              
              <!-- 元信息骨架 -->
              <div class="flex space-x-4">
                <div class="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div class="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              
              <!-- 内容骨架 -->
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div class="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              </div>
              
              <!-- 底部骨架 -->
              <div class="flex justify-between items-center">
                <div class="flex space-x-2">
                  <div class="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div class="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div class="flex space-x-4">
                  <div class="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                  <div class="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          </template>
          
          <!-- 错误状态 -->
          <div 
            v-else-if="error"
            class="flex flex-col items-center justify-center p-12 bg-white rounded-xl"
          >
            <p class="text-red-500 mb-4">{{ error }}</p>
            <button
              @click="loadData"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                     transition-colors"
            >
              重试
            </button>
          </div>

          <!-- 实际内容插槽 -->
          <slot v-else name="content"></slot>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  @apply w-2;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-200 rounded-full hover:bg-gray-300 transition-colors;
}

/* 骨架屏动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 确保容器铺满 */
:deep(#app) {
  @apply h-full w-full;
}
</style>`