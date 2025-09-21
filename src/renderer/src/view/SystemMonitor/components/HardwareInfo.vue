<template>
  <div class="hardware-info space-y-6">
    <!-- 硬件概览卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="metric-card bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">处理器</h3>
            <p class="text-sm text-gray-400">CPU</p>
          </div>
        </div>
        <div class="text-sm text-white">
          {{ hardwareOverview?.cpu?.brand || 'Loading...' }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ hardwareOverview?.cpu?.cores || 0 }} 核心 @ {{ hardwareOverview?.cpu?.speed || 0 }} GHz
        </div>
      </div>

      <div class="metric-card bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">内存</h3>
            <p class="text-sm text-gray-400">RAM</p>
          </div>
        </div>
        <div class="text-sm text-white">
          {{ formatBytes(hardwareOverview?.memory?.total || 0) }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ hardwareOverview?.memory?.modules || 0 }} 个模块
        </div>
      </div>

      <div class="metric-card bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">显卡</h3>
            <p class="text-sm text-gray-400">GPU</p>
          </div>
        </div>
        <div class="text-sm text-white">
          {{ hardwareOverview?.graphics?.primary || 'Loading...' }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ hardwareOverview?.graphics?.displays || 0 }} 个显示器
        </div>
      </div>

      <div class="metric-card bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">存储</h3>
            <p class="text-sm text-gray-400">Storage</p>
          </div>
        </div>
        <div class="text-sm text-white">
          {{ formatBytes(hardwareOverview?.storage?.totalCapacity || 0) }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ hardwareOverview?.storage?.devices || 0 }} 个设备
        </div>
      </div>
    </div>

    <!-- 详细硬件信息 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- CPU详细信息 -->
      <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
          <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <span>处理器详情</span>
        </h3>
        <div class="space-y-3" v-if="cpuDetails">
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">制造商</span>
            <span class="text-white">{{ cpuDetails.basic?.manufacturer || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">型号</span>
            <span class="text-white text-sm">{{ cpuDetails.basic?.brand || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">架构</span>
            <span class="text-white">{{ cpuDetails.architecture || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">插槽</span>
            <span class="text-white">{{ cpuDetails.basic?.socket || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-400">缓存</span>
            <span class="text-white text-sm">
              L1: {{ formatBytes(cpuDetails.cache?.l1d || 0) }}, 
              L2: {{ formatBytes(cpuDetails.cache?.l2 || 0) }}, 
              L3: {{ formatBytes(cpuDetails.cache?.l3 || 0) }}
            </span>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-8">
          <div class="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>加载中...</p>
        </div>
      </div>

      <!-- 主板信息 -->
      <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          <span>主板信息</span>
        </h3>
        <div class="space-y-3" v-if="motherboardInfo">
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">制造商</span>
            <span class="text-white">{{ motherboardInfo.baseboard?.manufacturer || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">型号</span>
            <span class="text-white">{{ motherboardInfo.baseboard?.model || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">版本</span>
            <span class="text-white">{{ motherboardInfo.baseboard?.version || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-white/5">
            <span class="text-gray-400">BIOS</span>
            <span class="text-white">{{ motherboardInfo.bios?.vendor || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-400">BIOS版本</span>
            <span class="text-white">{{ motherboardInfo.bios?.version || 'N/A' }}</span>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-8">
          <div class="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>加载中...</p>
        </div>
      </div>
    </div>

    <!-- 存储设备信息 -->
    <div class="info-panel bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
        <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
        </svg>
        <span>存储设备</span>
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm" v-if="storageDevices && storageDevices.physicalDisks">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left py-2 text-gray-400">设备</th>
              <th class="text-left py-2 text-gray-400">类型</th>
              <th class="text-left py-2 text-gray-400">容量</th>
              <th class="text-left py-2 text-gray-400">制造商</th>
              <th class="text-left py-2 text-gray-400">接口</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(device, index) in storageDevices.physicalDisks" :key="index" class="border-b border-white/5">
              <td class="py-2 text-white">{{ device.name || device.device || `设备 ${index + 1}` }}</td>
              <td class="py-2 text-gray-300">{{ device.type || 'N/A' }}</td>
              <td class="py-2 text-gray-300">{{ formatBytes(device.size || 0) }}</td>
              <td class="py-2 text-gray-300">{{ device.vendor || 'N/A' }}</td>
              <td class="py-2 text-gray-300">{{ device.interfaceType || 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="text-center text-gray-400 py-8">
          <div class="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>加载存储设备信息...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const hardwareOverview = ref<any>(null)
const cpuDetails = ref<any>(null)
const motherboardInfo = ref<any>(null)
const storageDevices = ref<any>(null)

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const loadHardwareData = async () => {
  try {
    const [overview, cpu, motherboard, storage] = await Promise.all([
      window.api.hardware.getAllHardwareInfo(),
      window.api.hardware.getCpuDetails(),
      window.api.hardware.getMotherboardInfo(),
      window.api.hardware.getStorageDevices()
    ])
    
    hardwareOverview.value = overview
    cpuDetails.value = cpu
    motherboardInfo.value = motherboard
    storageDevices.value = storage
    
  } catch (error) {
    console.error('Failed to load hardware data:', error)
  }
}

onMounted(async () => {
  await loadHardwareData()
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
</style>
