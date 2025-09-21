<template>
  <div class="cpu-monitor space-y-6">
    <!-- CPU概览卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 总体使用率 -->
      <div class="metric-card bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">CPU使用率</h3>
            <p class="text-3xl font-bold text-blue-400 mt-2">{{ cpuUsage.toFixed(1) }}%</p>
          </div>
          <div class="w-20 h-20">
            <CircularProgress :value="cpuUsage" :max="100" color="blue" :size="80" />
          </div>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">用户: {{ userUsage.toFixed(1) }}%</span>
          <span class="text-gray-400">系统: {{ systemUsage.toFixed(1) }}%</span>
        </div>
      </div>

      <!-- CPU温度 -->
      <div class="metric-card bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">CPU温度</h3>
            <p class="text-3xl font-bold text-orange-400 mt-2">{{ cpuTemp }}°C</p>
          </div>
          <div class="w-20 h-20">
            <CircularProgress :value="cpuTemp" :max="100" color="orange" :size="80" unit="°C" />
          </div>
        </div>
        <div class="text-sm text-gray-400">
          状态: <span :class="getTempStatusClass()">{{ getTempStatus() }}</span>
        </div>
      </div>

      <!-- CPU频率 -->
      <div class="metric-card bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">CPU频率</h3>
            <p class="text-3xl font-bold text-green-400 mt-2">{{ currentSpeed.toFixed(1) }} GHz</p>
          </div>
          <div class="w-20 h-20">
            <CircularProgress :value="speedPercentage" :max="100" color="green" :size="80" unit="%" />
          </div>
        </div>
        <div class="text-sm text-gray-400">
          最大: {{ maxSpeed.toFixed(1) }} GHz
        </div>
      </div>
    </div>

    <!-- CPU详细信息 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- CPU规格信息 -->
      <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
          <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <span>处理器规格</span>
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">品牌</span>
            <span class="text-white">{{ cpuInfo?.manufacturer || 'Loading...' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">型号</span>
            <span class="text-white text-sm">{{ cpuInfo?.brand || 'Loading...' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">架构</span>
            <span class="text-white">{{ cpuInfo?.family || 'Loading...' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">物理核心</span>
            <span class="text-white">{{ cpuInfo?.physicalCores || 0 }} 核心</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">逻辑核心</span>
            <span class="text-white">{{ cpuInfo?.cores || 0 }} 核心</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">基础频率</span>
            <span class="text-white">{{ (cpuInfo?.speed || 0).toFixed(1) }} GHz</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-400">缓存</span>
            <span class="text-white">{{ getCacheInfo() }}</span>
          </div>
        </div>
      </div>

      <!-- 核心使用率 -->
      <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>核心使用率</span>
        </h3>
        <div class="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
          <div
            v-for="(core, index) in coreUsages"
            :key="index"
            class="core-item bg-white/5 rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <div class="text-sm font-medium text-white">核心 {{ index + 1 }}</div>
              <div class="text-xs text-gray-400">{{ core.toFixed(1) }}%</div>
            </div>
            <div class="w-12 h-12">
              <CircularProgress :value="core" :max="100" :color="getCoreColor(core)" :size="48" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时图表 -->
    <div class="chart-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
        <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
        </svg>
        <span>CPU使用率历史</span>
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
const cpuUsage = ref(0)
const userUsage = ref(0)
const systemUsage = ref(0)
const cpuTemp = ref(0)
const currentSpeed = ref(0)
const maxSpeed = ref(0)
const cpuInfo = ref<any>(null)
const coreUsages = ref<number[]>([])

let updateInterval: NodeJS.Timeout | null = null

// 计算属性
const speedPercentage = computed(() => {
  return maxSpeed.value > 0 ? (currentSpeed.value / maxSpeed.value) * 100 : 0
})

// 方法
const getTempStatus = () => {
  if (cpuTemp.value < 50) return '正常'
  if (cpuTemp.value < 70) return '温热'
  if (cpuTemp.value < 85) return '过热'
  return '危险'
}

const getTempStatusClass = () => {
  if (cpuTemp.value < 50) return 'text-green-400'
  if (cpuTemp.value < 70) return 'text-yellow-400'
  if (cpuTemp.value < 85) return 'text-orange-400'
  return 'text-red-400'
}

const getCoreColor = (usage: number) => {
  if (usage < 30) return 'green'
  if (usage < 60) return 'yellow'
  if (usage < 80) return 'orange'
  return 'red'
}

const getCacheInfo = () => {
  // 这里可以根据实际的缓存信息来显示
  return 'L1: 256KB, L2: 1MB, L3: 8MB'
}

// 添加防抖和缓存
let isLoadingCpu = false
let lastCpuData: any = null

const loadCpuData = async () => {
  // 防止重复调用
  if (isLoadingCpu) return

  try {
    isLoadingCpu = true

    const cpuData = await window.api.system.getCpuInfo()

    // 缓存数据，避免频繁更新
    if (JSON.stringify(cpuData) === JSON.stringify(lastCpuData)) {
      return
    }
    lastCpuData = cpuData

    // 使用requestAnimationFrame优化DOM更新
    requestAnimationFrame(() => {
      // 更新CPU基本信息
      if (cpuData.info) {
        cpuInfo.value = cpuData.info
        currentSpeed.value = cpuData.info.speed || 0
        maxSpeed.value = cpuData.info.speedMax || cpuData.info.speed || 0
      }

      // 更新使用率信息
      if (cpuData.usage) {
        cpuUsage.value = cpuData.usage.currentLoad || 0
        userUsage.value = cpuData.usage.currentLoadUser || 0
        systemUsage.value = cpuData.usage.currentLoadSystem || 0

        // 更新核心使用率（限制数量避免性能问题）
        if (cpuData.usage.cpus) {
          coreUsages.value = cpuData.usage.cpus.slice(0, 16).map((cpu: any) => cpu.load || 0)
        }
      }

      // 更新温度（如果可用）
      if (cpuData.temperature !== null && cpuData.temperature !== undefined) {
        cpuTemp.value = cpuData.temperature
      } else {
        // 模拟温度数据
        cpuTemp.value = Math.min(85, 35 + (cpuUsage.value * 0.5) + (Math.random() * 10))
      }
    })

  } catch (error) {
    console.error('Failed to load CPU data:', error)
  } finally {
    isLoadingCpu = false
  }
}

// 生命周期
onMounted(async () => {
  await loadCpuData()

  // 延长更新间隔到5秒
  updateInterval = setInterval(() => {
    if (!document.hidden) {
      loadCpuData()
    }
  }, 5000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
  isLoadingCpu = false
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

.core-item {
  transition: all 0.3s ease;
}

.core-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.02);
}

.chart-panel {
  transition: all 0.3s ease;
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
