<template>
  <div class="system-monitor-layout h-full w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
    <!-- 粒子背景效果 -->
    <ParticleBackground />

    <!-- 背景动画效果 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="floating-particles">
        <div v-for="i in 30" :key="i" class="particle" :style="getParticleStyle(i)"></div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="relative z-10 h-full flex">
      <!-- 侧边栏 -->
      <div class="sidebar w-64 bg-black/20 backdrop-blur-sm border-r border-white/10 flex flex-col">
        <!-- Logo区域 -->
        <div class="logo-section p-6 border-b border-white/10">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                系统监控
              </h1>
              <p class="text-xs text-gray-400">System Monitor</p>
            </div>
          </div>
        </div>

        <!-- 导航菜单 -->
        <nav class="flex-1 p-4">
          <ul class="space-y-2">
            <li v-for="item in menuItems" :key="item.id">
              <RippleButton
                @click="activeTab = item.id"
                :variant="activeTab === item.id ? 'primary' : 'secondary'"
                :class="[
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group text-left',
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'bg-transparent hover:bg-white/5 hover:border-white/10 border border-transparent'
                ]"
              >
                <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
                <span class="font-medium">{{ item.name }}</span>
                <div v-if="activeTab === item.id" class="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </RippleButton>
            </li>
          </ul>
        </nav>

        <!-- 系统状态指示器 -->
        <div class="p-4 border-t border-white/10">
          <div class="bg-black/20 rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-400">系统状态</span>
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-xs text-green-400">正常</span>
              </div>
            </div>
            <div class="text-xs text-gray-500">
              运行时间: {{ formatUptime(systemUptime) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="flex-1 flex flex-col">
        <!-- 顶部标题栏 -->
        <div class="header bg-black/10 backdrop-blur-sm border-b border-white/10 p-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">{{ getCurrentTabName() }}</h2>
              <p class="text-sm text-gray-400 mt-1">{{ getCurrentTabDescription() }}</p>
            </div>
            <div class="flex items-center space-x-4">
              <!-- 刷新按钮 -->
              <RippleButton
                @click="refreshData"
                variant="secondary"
                size="sm"
                :class="[
                  'p-2 rounded-lg',
                  isRefreshing ? 'animate-spin' : ''
                ]"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </RippleButton>
              <!-- 设置按钮 -->
              <RippleButton variant="secondary" size="sm" class="p-2 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </RippleButton>
            </div>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="content flex-1 p-6 overflow-auto">
          <transition name="fade" mode="out-in">
            <Suspense>
              <template #default>
                <component :is="getCurrentComponent()" :key="activeTab" />
              </template>
              <template #fallback>
                <div class="flex items-center justify-center h-64">
                  <div class="text-center">
                    <div class="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p class="text-gray-400">加载中...</p>
                  </div>
                </div>
              </template>
            </Suspense>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SystemOverview from './components/SystemOverview.vue'
import CpuMonitor from './components/CpuMonitor.vue'
import MemoryMonitor from './components/MemoryMonitor.vue'
import DiskMonitor from './components/DiskMonitor.vue'
import NetworkMonitor from './components/NetworkMonitor.vue'
import HardwareInfo from './components/HardwareInfo.vue'
import ParticleBackground from './components/ParticleBackground.vue'
import RippleButton from './components/RippleButton.vue'

// 响应式数据
const activeTab = ref('overview')
const isRefreshing = ref(false)
const systemUptime = ref(0)

// 菜单项配置
const menuItems = [
  {
    id: 'overview',
    name: '系统概览',
    description: '查看系统整体状态和关键指标',
    icon: 'DashboardIcon'
  },
  {
    id: 'cpu',
    name: 'CPU监控',
    description: '实时监控CPU使用率和性能',
    icon: 'CpuIcon'
  },
  {
    id: 'memory',
    name: '内存监控',
    description: '查看内存使用情况和分配状态',
    icon: 'MemoryIcon'
  },
  {
    id: 'disk',
    name: '磁盘监控',
    description: '监控磁盘使用率和I/O性能',
    icon: 'DiskIcon'
  },
  {
    id: 'network',
    name: '网络监控',
    description: '查看网络连接和流量统计',
    icon: 'NetworkIcon'
  },
  {
    id: 'hardware',
    name: '硬件信息',
    description: '查看详细的硬件规格和配置',
    icon: 'HardwareIcon'
  }
]

// 计算属性
const getCurrentTabName = () => {
  const item = menuItems.find(item => item.id === activeTab.value)
  return item?.name || '系统监控'
}

const getCurrentTabDescription = () => {
  const item = menuItems.find(item => item.id === activeTab.value)
  return item?.description || ''
}

const getCurrentComponent = () => {
  const components: Record<string, any> = {
    overview: SystemOverview,
    cpu: CpuMonitor,
    memory: MemoryMonitor,
    disk: DiskMonitor,
    network: NetworkMonitor,
    hardware: HardwareInfo
  }
  return components[activeTab.value] || SystemOverview
}

// 方法
const refreshData = async () => {
  isRefreshing.value = true
  try {
    // 触发当前组件的数据刷新
    // 这里可以通过事件总线或其他方式通知子组件刷新
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    isRefreshing.value = false
  }
}

const formatUptime = (seconds: number) => {
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

const getParticleStyle = (_index: number) => {
  const size = Math.random() * 4 + 1
  const left = Math.random() * 100
  const animationDelay = Math.random() * 20
  const animationDuration = Math.random() * 10 + 10
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${animationDuration}s`
  }
}

// 生命周期
onMounted(async () => {
  // 获取系统运行时间
  try {
    const stats = await window.api.system.getRealTimeStats()
    systemUptime.value = stats.uptime?.uptime || 0
  } catch (error) {
    console.error('Failed to get system uptime:', error)
  }
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped>
/* 粒子动画 */
.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  background: rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  animation: float infinite linear;
}

@keyframes float {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 滚动条样式 */
.content::-webkit-scrollbar {
  width: 6px;
}

.content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
