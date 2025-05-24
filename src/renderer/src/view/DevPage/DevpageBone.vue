<script setup lang="ts">
import { ref } from 'vue'

// 侧边栏状态
const isCollapsed = ref(false)
const activeMenu = ref('quickstart')

// 菜单项配置
const menuItems = [
  { id: 'quickstart', icon: '⚡', label: '快速启动' },
  { id: 'websites', icon: '🌐', label: '常用网站' },
  { id: 'tools', icon: '🛠️', label: '工具集合' },
  { id: 'workflow', icon: '📋', label: '工作流' },
  { id: 'settings', icon: '⚙️', label: '设置' }
]

// 快速启动项
const quickTools = [
  { id: 'vscode', icon: '📝', name: 'VS Code', type: 'app', path: 'code' },
  { id: 'chrome', icon: '🌐', name: 'Chrome', type: 'app', path: 'chrome' },
  { id: 'terminal', icon: '⌨️', name: '终端', type: 'app', path: 'terminal' },
  { id: 'github', icon: '🐱', name: 'GitHub', type: 'web', url: 'https://github.com' },
  { id: 'notion', icon: '📔', name: 'Notion', type: 'web', url: 'https://notion.so' },
  { id: 'figma', icon: '🎨', name: 'Figma', type: 'web', url: 'https://figma.com' }
]

// 工作流配置
const workflows = [
  { 
    id: 'dev',
    name: '开发环境',
    apps: ['vscode', 'chrome', 'terminal'],
    description: '启动完整开发环境'
  },
  {
    id: 'design',
    name: '设计环境',
    apps: ['figma', 'chrome'],
    description: '启动设计相关工具'
  }
]

// 切换侧边栏
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 处理工具启动
const launchTool = (tool: any) => {
  if (tool.type === 'app') {
    console.log('启动应用:', tool.path)
    // TODO: 实现应用启动逻辑
  } else if (tool.type === 'web') {
    window.open(tool.url, '_blank')
  }
}

// 启动工作流
const launchWorkflow = (workflow: any) => {
  console.log('启动工作流:', workflow.name)
  // TODO: 实现工作流启动逻辑
}
</script>

<template>
  <!-- 主容器：使用 flex 布局，确保全屏显示 -->
  <div class="flex min-h-screen w-full bg-gray-100 overflow-hidden">
    <!-- 左侧边栏：可折叠 -->
    <aside
      :class="[
        'transition-all duration-300 ease-in-out border-r border-gray-200 bg-white',
        isCollapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- 顶部 Logo 区域 -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <span :class="['font-semibold transition-all duration-300', isCollapsed ? 'text-base' : 'text-xl']">
          {{ isCollapsed ? '📦' : '工具箱' }}
        </span>
        <button 
          @click="toggleSidebar"
          class="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <svg 
            class="w-5 h-5 text-gray-500"
            :class="{ 'rotate-180': isCollapsed }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- 导航菜单：使用 grid 确保均匀间距 -->
      <nav class="py-4 space-y-1">
        <div
          v-for="item in menuItems"
          :key="item.id"
          @click="activeMenu = item.id"
          :class="[
            'group flex items-center cursor-pointer transition-all duration-200',
            isCollapsed ? 'px-4' : 'px-6',
            activeMenu === item.id
              ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          ]"
        >
          <!-- 图标容器：固定大小确保对齐 -->
          <div class="h-10 flex items-center justify-center">
            <span class="text-xl group-hover:scale-110 transition-transform">
              {{ item.icon }}
            </span>
          </div>
          <!-- 标签文字：折叠时隐藏 -->
          <span
            :class="[
              'ml-3 text-sm font-medium transition-all duration-300',
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            ]"
          >
            {{ item.label }}
          </span>
        </div>
      </nav>
    </aside>

    <!-- 主内容区：自适应宽度 -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- 顶部搜索栏：固定高度 -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
        <div class="max-w-2xl w-full relative">
          <input
            type="text"
            placeholder="搜索工具、网站或工作流..."
            class="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                   transition-all duration-200"
          >
          <svg
            class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </header>

      <!-- 内容区域：可滚动 -->
      <div class="flex-1 overflow-auto p-6">
        <!-- 内容网格：响应式布局 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <!-- 卡片示例 -->
          <div v-for="i in 10" :key="i"
            class="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300
                   p-6 flex flex-col space-y-4 group hover:-translate-y-1"
          >
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center
                          group-hover:scale-110 transition-transform"
              >
                🚀
              </div>
              <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                ⋮
              </button>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">工具 {{ i }}</h3>
              <p class="text-sm text-gray-500 mt-1">工具描述信息</p>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">分类标签</span>
              <button class="text-blue-600 hover:text-blue-700 hover:underline">
                启动
              </button>
            </div>
          </div>
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
  @apply bg-gray-300 rounded-full hover:bg-gray-400 transition-colors;
}

/* 确保全屏显示 */
:deep(#app) {
  @apply h-screen w-screen;
}
</style>
