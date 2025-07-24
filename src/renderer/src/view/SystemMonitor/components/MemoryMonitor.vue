<template>
  <div class="memory-monitor space-y-6">
    <!-- 内存概览 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 内存使用率 -->
      <div class="metric-card bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">内存使用率</h3>
            <p class="text-3xl font-bold text-green-400 mt-2">{{ memoryUsage.toFixed(1) }}%</p>
          </div>
          <div class="w-20 h-20">
            <CircularProgress :value="memoryUsage" :max="100" color="green" :size="80" />
          </div>
        </div>
        <div class="text-sm text-gray-400">
          {{ formatBytes(memoryInfo?.used || 0) }} / {{ formatBytes(memoryInfo?.total || 0) }}
        </div>
      </div>

      <!-- 可用内存 -->
      <div class="metric-card bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">可用内存</h3>
            <p class="text-3xl font-bold text-blue-400 mt-2">{{ formatBytes(memoryInfo?.available || 0) }}</p>
          </div>
          <div class="w-20 h-20">
            <CircularProgress :value="availablePercentage" :max="100" color="blue" :size="80" />
          </div>
        </div>
        <div class="text-sm text-gray-400">
          可用率: {{ availablePercentage.toFixed(1) }}%
        </div>
      </div>

      <!-- 交换空间 -->
      <div class="metric-card bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">交换空间</h3>
            <p class="text-3xl font-bold text-purple-400 mt-2">{{ swapUsage.toFixed(1) }}%</p>
          </div>
          <div class="w-20 h-20">
            <CircularProgress :value="swapUsage" :max="100" color="purple" :size="80" />
          </div>
        </div>
        <div class="text-sm text-gray-400">
          {{ formatBytes(memoryInfo?.swapused || 0) }} / {{ formatBytes(memoryInfo?.swaptotal || 0) }}
        </div>
      </div>
    </div>

    <!-- 内存详细信息 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 内存分配详情 -->
      <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <span>内存分配</span>
        </h3>
        <div class="space-y-3">
          <div class="memory-item">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-400">已使用</span>
              <span class="text-white">{{ formatBytes(memoryInfo?.used || 0) }}</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2">
              <div class="bg-red-500 h-2 rounded-full transition-all duration-300" :style="{ width: memoryUsage + '%' }"></div>
            </div>
          </div>
          
          <div class="memory-item">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-400">缓存</span>
              <span class="text-white">{{ formatBytes(memoryInfo?.cached || 0) }}</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2">
              <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" :style="{ width: cachePercentage + '%' }"></div>
            </div>
          </div>
          
          <div class="memory-item">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-400">缓冲区</span>
              <span class="text-white">{{ formatBytes(memoryInfo?.buffers || 0) }}</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2">
              <div class="bg-yellow-500 h-2 rounded-full transition-all duration-300" :style="{ width: bufferPercentage + '%' }"></div>
            </div>
          </div>
          
          <div class="memory-item">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-400">可用</span>
              <span class="text-white">{{ formatBytes(memoryInfo?.available || 0) }}</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full transition-all duration-300" :style="{ width: availablePercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 内存模块信息 -->
      <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
          <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>内存模块</span>
        </h3>
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div v-if="memoryModules.length === 0" class="text-center text-gray-400 py-8">
            <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
            <p>正在加载内存模块信息...</p>
          </div>
          <div
            v-for="(module, index) in memoryModules"
            :key="index"
            class="module-item bg-white/5 rounded-lg p-3"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-white font-medium">插槽 {{ index + 1 }}</span>
              <span class="text-blue-400">{{ formatBytes(module.size || 0) }}</span>
            </div>
            <div class="text-xs text-gray-400 space-y-1">
              <div>类型: {{ module.type || 'Unknown' }}</div>
              <div>频率: {{ module.clockSpeed || 'Unknown' }} MHz</div>
              <div>制造商: {{ module.manufacturer || 'Unknown' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内存使用历史图表 -->
    <div class="chart-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
        <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
        </svg>
        <span>内存使用历史</span>
      </h3>
      <div class="h-64">
        <div class="w-full h-full bg-black/10 rounded-lg flex items-center justify-center">
          <div class="text-center text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            <p>实时图表功能开发中...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import CircularProgress from './CircularProgress.vue'

// 响应式数据
const memoryInfo = ref<any>(null)
const memoryModules = ref<any[]>([])

let updateInterval: NodeJS.Timeout | null = null

// 计算属性
const memoryUsage = computed(() => {
  return memoryInfo.value?.usagePercent || 0
})

const availablePercentage = computed(() => {
  return memoryInfo.value?.availablePercent || 0
})

const swapUsage = computed(() => {
  const total = memoryInfo.value?.swaptotal || 0
  const used = memoryInfo.value?.swapused || 0
  return total > 0 ? (used / total) * 100 : 0
})

const cachePercentage = computed(() => {
  const total = memoryInfo.value?.total || 0
  const cached = memoryInfo.value?.cached || 0
  return total > 0 ? (cached / total) * 100 : 0
})

const bufferPercentage = computed(() => {
  const total = memoryInfo.value?.total || 0
  const buffers = memoryInfo.value?.buffers || 0
  return total > 0 ? (buffers / total) * 100 : 0
})

// 方法
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 添加加载状态和缓存
let isLoadingMemory = false
let memoryDetailsLoaded = false

const loadMemoryData = async () => {
  if (isLoadingMemory) return

  try {
    isLoadingMemory = true

    // 优先加载内存使用信息
    const memData = await window.api.system.getMemoryInfo()
    memoryInfo.value = memData

    // 内存模块信息只加载一次（不经常变化）
    if (!memoryDetailsLoaded) {
      setTimeout(async () => {
        try {
          const memDetails = await window.api.hardware.getMemoryDetails()
          memoryModules.value = memDetails.modules || []
          memoryDetailsLoaded = true
        } catch (error) {
          console.error('Failed to load memory details:', error)
        }
      }, 500)
    }

  } catch (error) {
    console.error('Failed to load memory data:', error)
  } finally {
    isLoadingMemory = false
  }
}

// 生命周期
onMounted(async () => {
  await loadMemoryData()

  // 延长更新间隔到8秒
  updateInterval = setInterval(() => {
    if (!document.hidden) {
      loadMemoryData()
    }
  }, 8000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
  isLoadingMemory = false
})
</script>

<style scoped>
.metric-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.info-panel {
  transition: all 0.3s ease;
}

.info-panel:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.memory-item {
  transition: all 0.3s ease;
}

.module-item {
  transition: all 0.3s ease;
}

.module-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.02);
}

/* 滚动条样式 */
.max-h-64::-webkit-scrollbar {
  width: 4px;
}

.max-h-64::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.max-h-64::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.max-h-64::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
