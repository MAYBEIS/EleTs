<template>
  <div class="h-screen bg-background flex flex-col overflow-hidden">
    <!-- 窗口标题栏 -->
    <div 
      class="flex items-center justify-between px-4 py-2 bg-card border-b border-border"
      :style="headerStyle"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <div class="w-4 h-4 bg-white rounded-sm" />
        </div>
        <span class="font-medium">桌面程序</span>
        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
          v1.0
        </span>
      </div>
      
      <div class="flex items-center gap-2">
        <button class="p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button class="p-2 hover:bg-accent hover:text-accent-foreground rounded-md relative">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 4h7l5 5v4" />
          </svg>
          <span v-if="notifications > 0" class="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {{ notifications }}
          </span>
        </button>
        <button class="p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <div class="h-4 w-px bg-border mx-2" />
        <button class="p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>
        <button class="p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button class="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-md">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏 -->
      <div 
        class="w-64 bg-card border-r border-border flex flex-col"
        :style="sidebarStyle"
      >
        <div class="p-4">
          <h2 class="mb-4">导航菜单</h2>
          <nav class="space-y-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-accent hover:text-accent-foreground'
              ]"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              <span>{{ tab.label }}</span>
            </button>
          </nav>
        </div>
        
        <div class="mt-auto p-4">
          <div class="bg-card border rounded-lg p-3">
            <div class="text-sm">
              <div class="font-medium mb-1">系统状态</div>
              <div class="text-muted-foreground">运行正常</div>
              <div class="flex items-center gap-2 mt-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span class="text-xs">已连接</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主内容区 -->
      <div 
        class="flex-1 flex flex-col overflow-hidden"
        :style="contentStyle"
      >
        <div class="flex-1 p-6 overflow-auto">
          <Transition name="fade" mode="out-in">
            <component :is="currentTabComponent" :key="activeTab" />
          </Transition>
        </div>
        
        <!-- 状态栏 -->
        <div 
          class="border-t border-border px-6 py-2 bg-card"
          :style="statusBarStyle"
        >
          <div class="flex items-center justify-between text-sm text-muted-foreground">
            <div class="flex items-center gap-4">
              <span>就绪</span>
              <span>CPU: 45%</span>
              <span>内存: 2.1GB</span>
            </div>
            <div class="flex items-center gap-4">
              <span>版本 1.0.0</span>
              <span>{{ currentTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DashboardContent from './DashboardContent.vue'
import ProjectsContent from './ProjectsContent.vue'
import AnalyticsContent from './AnalyticsContent.vue'
import SettingsContent from './SettingsContent.vue'

const activeTab = ref('dashboard')
const notifications = ref(3)
const currentTime = ref('')
const animationStep = ref(0)

const tabs = [
  { id: 'dashboard', label: '仪表板', icon: 'HomeIcon', component: DashboardContent },
  { id: 'projects', label: '项目', icon: 'FolderIcon', component: ProjectsContent },
  { id: 'analytics', label: '分析', icon: 'ChartIcon', component: AnalyticsContent },
  { id: 'settings', label: '设置', icon: 'SettingsIcon', component: SettingsContent },
]

const currentTabComponent = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab?.component || DashboardContent
})

const headerStyle = computed(() => ({
  transform: `translateY(${Math.max(-50, -50 + animationStep.value * 2)}px)`,
  opacity: Math.min(1, animationStep.value / 25),
  transition: 'all 0.1s ease-out'
}))

const sidebarStyle = computed(() => ({
  transform: `translateX(${Math.max(-100, -100 + (animationStep.value - 10) * 4)}px)`,
  opacity: Math.min(1, Math.max(0, (animationStep.value - 10) / 25)),
  transition: 'all 0.1s ease-out'
}))

const contentStyle = computed(() => ({
  transform: `scale(${Math.min(1, Math.max(0.95, 0.95 + (animationStep.value - 20) * 0.002))})`,
  opacity: Math.min(1, Math.max(0, (animationStep.value - 20) / 25)),
  transition: 'all 0.1s ease-out'
}))

const statusBarStyle = computed(() => ({
  transform: `translateY(${Math.max(50, 50 - (animationStep.value - 30) * 2)}px)`,
  opacity: Math.min(1, Math.max(0, (animationStep.value - 30) / 25)),
  transition: 'all 0.1s ease-out'
}))

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN')
}

const animate = () => {
  if (animationStep.value < 50) {
    animationStep.value += 1
    requestAnimationFrame(animate)
  }
}

let timeInterval: number

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  requestAnimationFrame(animate)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

</style>