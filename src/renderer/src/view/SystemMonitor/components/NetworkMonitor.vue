<template>
  <div class="network-monitor space-y-6">
    <!-- 网络概览 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="metric-card bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 class="text-lg font-semibold text-white mb-2">网络状态</h3>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span class="text-green-400">在线</span>
        </div>
      </div>

      <div class="metric-card bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 class="text-lg font-semibold text-white mb-2">下载速度</h3>
        <p class="text-2xl font-bold text-green-400">{{ formatSpeed(downloadSpeed) }}</p>
      </div>

      <div class="metric-card bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 class="text-lg font-semibold text-white mb-2">上传速度</h3>
        <p class="text-2xl font-bold text-orange-400">{{ formatSpeed(uploadSpeed) }}</p>
      </div>

      <div class="metric-card bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
        <h3 class="text-lg font-semibold text-white mb-2">延迟</h3>
        <p class="text-2xl font-bold text-purple-400">{{ ping }}ms</p>
      </div>
    </div>

    <!-- 网络接口 -->
    <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4">网络接口</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="(interface_, index) in networkInterfaces"
          :key="index"
          class="interface-card bg-white/5 rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-white">{{ interface_.displayName || interface_.name }}</h4>
            <span :class="interface_.operationalStatus === 'up' ? 'text-green-400' : 'text-red-400'">
              {{ interface_.operationalStatus === 'up' ? '活动' : '非活动' }}
            </span>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">IP地址:</span>
              <span class="text-white">{{ interface_.ipv4 || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">MAC地址:</span>
              <span class="text-white">{{ interface_.mac || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">速度:</span>
              <span class="text-white">{{ interface_.speed ? interface_.speed + ' Mbps' : 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 网络统计 -->
    <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4">网络统计</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left py-2 text-gray-400">接口</th>
              <th class="text-left py-2 text-gray-400">接收字节</th>
              <th class="text-left py-2 text-gray-400">发送字节</th>
              <th class="text-left py-2 text-gray-400">接收速度</th>
              <th class="text-left py-2 text-gray-400">发送速度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stat, index) in networkStats" :key="index" class="border-b border-white/5">
              <td class="py-2 text-white">{{ stat.interface }}</td>
              <td class="py-2 text-gray-300">{{ formatBytes(stat.bytesReceived || 0) }}</td>
              <td class="py-2 text-gray-300">{{ formatBytes(stat.bytesSent || 0) }}</td>
              <td class="py-2 text-gray-300">{{ formatSpeed(stat.receiveSpeed || 0) }}</td>
              <td class="py-2 text-gray-300">{{ formatSpeed(stat.transmitSpeed || 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const networkInterfaces = ref<any[]>([])
const networkStats = ref<any[]>([])
const downloadSpeed = ref(0)
const uploadSpeed = ref(0)
const ping = ref(0)

let updateInterval: NodeJS.Timeout | null = null

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const loadNetworkData = async () => {
  try {
    const [interfaces, stats, speed] = await Promise.all([
      window.api.network.getNetworkInterfaces(),
      window.api.network.getNetworkStats(),
      window.api.network.getNetworkSpeed()
    ])
    
    networkInterfaces.value = interfaces || []
    networkStats.value = stats || []
    
    if (speed && speed.length > 0) {
      downloadSpeed.value = speed[0].downloadSpeed || 0
      uploadSpeed.value = speed[0].uploadSpeed || 0
    }
    
    // 测试ping
    try {
      const pingResult = await window.api.network.pingHost({ host: '8.8.8.8', count: 1 })
      ping.value = pingResult.avg || 0
    } catch (error) {
      ping.value = 0
    }
    
  } catch (error) {
    console.error('Failed to load network data:', error)
  }
}

onMounted(async () => {
  await loadNetworkData()
  updateInterval = setInterval(loadNetworkData, 3000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.metric-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-card:hover {
  transform: translateY(-2px);
}

.interface-card {
  transition: all 0.3s ease;
}

.interface-card:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
