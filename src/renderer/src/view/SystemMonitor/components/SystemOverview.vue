<template>
  <div class="system-overview space-y-6">
    <!-- 关键指标卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- CPU使用率 -->
      <div class="metric-card bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-300">CPU使用率</h3>
              <p class="text-2xl font-bold text-white">{{ cpuUsage.toFixed(1) }}%</p>
            </div>
          </div>
          <div class="w-16 h-16">
            <CircularProgress :value="cpuUsage" :max="100" color="blue" />
          </div>
        </div>
        <div class="text-xs text-gray-400">
          {{ cpuInfo?.brand || 'Loading...' }}
        </div>
      </div>

      <!-- 内存使用率 -->
      <div class="metric-card bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-300">内存使用率</h3>
              <p class="text-2xl font-bold text-white">{{ memoryUsage.toFixed(1) }}%</p>
            </div>
          </div>
          <div class="w-16 h-16">
            <CircularProgress :value="memoryUsage" :max="100" color="green" />
          </div>
        </div>
        <div class="text-xs text-gray-400">
          {{ formatBytes(memoryInfo?.used || 0) }} / {{ formatBytes(memoryInfo?.total || 0) }}
        </div>
      </div>

      <!-- 磁盘使用率 -->
      <div class="metric-card bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-300">磁盘使用率</h3>
              <p class="text-2xl font-bold text-white">{{ diskUsage.toFixed(1) }}%</p>
            </div>
          </div>
          <div class="w-16 h-16">
            <CircularProgress :value="diskUsage" :max="100" color="purple" />
          </div>
        </div>
        <div class="text-xs text-gray-400">
          {{ formatBytes(totalDiskUsed) }} / {{ formatBytes(totalDiskSize) }}
        </div>
      </div>

      <!-- 网络状态 -->
      <div class="metric-card bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-300">网络状态</h3>
              <p class="text-2xl font-bold text-white">{{ networkStatus }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span class="text-xs text-green-400">在线</span>
          </div>
        </div>
        <div class="text-xs text-gray-400">
          ↑ {{ formatBytes(networkUpload) }}/s ↓ {{ formatBytes(networkDownload) }}/s
        </div>
      </div>
    </div>

    <!-- 详细信息面板 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 系统信息 -->
      <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
          <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <span>系统信息</span>
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">操作系统</span>
            <span class="text-white">{{ systemInfo?.os?.distro || 'Loading...' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">内核版本</span>
            <span class="text-white">{{ systemInfo?.os?.kernel || 'Loading...' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">架构</span>
            <span class="text-white">{{ systemInfo?.os?.arch || 'Loading...' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">主机名</span>
            <span class="text-white">{{ systemInfo?.os?.hostname || 'Loading...' }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-400">运行时间</span>
            <span class="text-white">{{ formatUptime(uptime) }}</span>
          </div>
        </div>
      </div>

      <!-- 硬件概览 -->
      <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <span>硬件概览</span>
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">处理器</span>
            <span class="text-white text-sm">{{ cpuInfo?.brand || 'Loading...' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">核心数</span>
            <span class="text-white">{{ cpuInfo?.cores || 0 }} 核心</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">内存总量</span>
            <span class="text-white">{{ formatBytes(memoryInfo?.total || 0) }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">存储设备</span>
            <span class="text-white">{{ diskInfo?.length || 0 }} 个设备</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-400">网络接口</span>
            <span class="text-white">{{ networkInterfaces?.length || 0 }} 个接口</span>
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
        <span>实时性能监控</span>
      </h3>
      <div class="h-64 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <p>实时图表功能开发中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CircularProgress from './CircularProgress.vue'

// 响应式数据
const cpuUsage = ref(0)
const memoryUsage = ref(0)
const diskUsage = ref(0)
const networkStatus = ref('正常')
const networkUpload = ref(0)
const networkDownload = ref(0)
const uptime = ref(0)

const cpuInfo = ref<any>(null)
const memoryInfo = ref<any>(null)
const diskInfo = ref<any>(null)
const systemInfo = ref<any>(null)
const networkInterfaces = ref<any>(null)

const totalDiskSize = ref(0)
const totalDiskUsed = ref(0)

let updateInterval: NodeJS.Timeout | null = null

// 方法
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}天 ${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

// 添加加载状态
const isLoading = ref(true)
const loadingProgress = ref(0)

// 分批异步加载数据
const loadSystemData = async () => {
  try {
    isLoading.value = true
    loadingProgress.value = 0

    // 第一批：快速加载的基础数据
    const basicPromises = [
      window.api.system.getCpuInfo().catch(() => ({ info: null, usage: null })),
      window.api.system.getMemoryInfo().catch(() => null)
    ]

    const [cpu, memory] = await Promise.all(basicPromises)
    loadingProgress.value = 30

    // 立即更新基础信息
    if (cpu) {
      cpuInfo.value = cpu.info
      cpuUsage.value = cpu.usage?.currentLoad || 0
    }
    if (memory) {
      memoryInfo.value = memory
      memoryUsage.value = memory.usagePercent || 0
    }

    // 第二批：中等耗时的数据
    setTimeout(async () => {
      try {
        const [disk, stats] = await Promise.all([
          window.api.system.getDiskInfo().catch(() => []),
          window.api.system.getRealTimeStats().catch(() => ({ uptime: null }))
        ])
        loadingProgress.value = 60

        // 更新磁盘信息
        if (disk && disk.length > 0) {
          diskInfo.value = disk
          totalDiskSize.value = disk.reduce((sum: number, d: any) => sum + (d.size || 0), 0)
          totalDiskUsed.value = disk.reduce((sum: number, d: any) => sum + (d.used || 0), 0)
          diskUsage.value = totalDiskSize.value > 0 ? (totalDiskUsed.value / totalDiskSize.value) * 100 : 0
        }

        // 更新运行时间
        uptime.value = stats.uptime?.uptime || 0
      } catch (error) {
        console.error('Failed to load disk/stats data:', error)
      }
    }, 100)

    // 第三批：最耗时的数据
    setTimeout(async () => {
      try {
        const [system, network] = await Promise.all([
          window.api.system.getSystemOverview().catch(() => null),
          window.api.system.getNetworkInfo().catch(() => ({ interfaces: [] }))
        ])
        loadingProgress.value = 100

        // 更新系统信息
        systemInfo.value = system

        // 更新网络信息
        networkInterfaces.value = network?.interfaces || []

        // 模拟网络流量数据
        networkUpload.value = Math.random() * 1024 * 1024
        networkDownload.value = Math.random() * 1024 * 1024 * 5

        isLoading.value = false
      } catch (error) {
        console.error('Failed to load system/network data:', error)
        isLoading.value = false
      }
    }, 200)

  } catch (error) {
    console.error('Failed to load basic system data:', error)
    isLoading.value = false
  }
}

// 生命周期
onMounted(async () => {
  await loadSystemData()

  // 延长更新间隔到10秒，减少系统负载
  updateInterval = setInterval(() => {
    // 只有在页面可见时才更新数据
    if (!document.hidden) {
      loadSystemData()
    }
  }, 10000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
})
</script>

<style scoped>
.metric-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.info-panel {
  transition: all 0.3s ease;
}

.info-panel:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.chart-panel {
  transition: all 0.3s ease;
}
</style>
