<template>
  <div class="disk-monitor space-y-6">
    <!-- 磁盘概览 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(disk, index) in diskInfo"
        :key="index"
        class="disk-card bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300"
      >
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">{{ disk.fs || `磁盘 ${index + 1}` }}</h3>
            <p class="text-sm text-gray-400">{{ disk.type || 'Unknown' }}</p>
          </div>
          <div class="w-16 h-16">
            <CircularProgress :value="disk.usagePercent || 0" :max="100" color="purple" :size="64" />
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">已使用:</span>
            <span class="text-white">{{ formatBytes(disk.used || 0) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">总容量:</span>
            <span class="text-white">{{ formatBytes(disk.size || 0) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">可用:</span>
            <span class="text-white">{{ formatBytes(disk.available || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 磁盘详细信息 -->
    <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4">磁盘详细信息</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left py-2 text-gray-400">设备</th>
              <th class="text-left py-2 text-gray-400">类型</th>
              <th class="text-left py-2 text-gray-400">挂载点</th>
              <th class="text-left py-2 text-gray-400">总容量</th>
              <th class="text-left py-2 text-gray-400">已使用</th>
              <th class="text-left py-2 text-gray-400">使用率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(disk, index) in diskInfo" :key="index" class="border-b border-white/5">
              <td class="py-2 text-white">{{ disk.fs }}</td>
              <td class="py-2 text-gray-300">{{ disk.type }}</td>
              <td class="py-2 text-gray-300">{{ disk.mount }}</td>
              <td class="py-2 text-gray-300">{{ formatBytes(disk.size || 0) }}</td>
              <td class="py-2 text-gray-300">{{ formatBytes(disk.used || 0) }}</td>
              <td class="py-2">
                <div class="flex items-center space-x-2">
                  <div class="w-16 bg-white/10 rounded-full h-2">
                    <div 
                      class="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                      :style="{ width: (disk.usagePercent || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="text-white text-xs">{{ (disk.usagePercent || 0).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CircularProgress from './CircularProgress.vue'

const diskInfo = ref<any[]>([])
let updateInterval: NodeJS.Timeout | null = null

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const loadDiskData = async () => {
  try {
    const data = await window.api.system.getDiskInfo()
    diskInfo.value = data || []
  } catch (error) {
    console.error('Failed to load disk data:', error)
  }
}

onMounted(async () => {
  await loadDiskData()
  updateInterval = setInterval(loadDiskData, 5000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.disk-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-panel {
  transition: all 0.3s ease;
}
</style>
