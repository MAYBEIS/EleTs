<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Component } from 'vue'

// 类型定义
interface MenuItem {
  key: string
  icon: string
  label: string
  component?: Component
}

interface UserInfo {
  name: string
  avatar: string
  role: string
}

// 状态管理
const isCollapsed = ref<boolean>(false)
const activeMenu = ref<string>('dashboard')
const searchQuery = ref<string>('')

// 用户信息（可从 store 或 API 获取）
const userInfo = ref<UserInfo>({
  name: 'Admin User',
  avatar: '👤',
  role: 'Administrator'
})

// 菜单配置
const menuItems = ref<MenuItem[]>([
  { key: 'dashboard', icon: '📊', label: '仪表盘' },
  { key: 'projects', icon: '📁', label: '项目管理' },
  { key: 'tasks', icon: '✅', label: '任务列表' },
  { key: 'settings', icon: '⚙️', label: '系统设置' }
])

// 计算属性
const sidebarWidth = computed(() => isCollapsed.value ? 'w-20' : 'w-64')

// 事件处理函数
const handleMenuClick = (key: string): void => {
  activeMenu.value = key
}

const toggleSidebar = (): void => {
  isCollapsed.value = !isCollapsed.value
}

const handleSearch = (): void => {
  // TODO: 实现搜索逻辑
  console.log('Search:', searchQuery.value)
}

const handleUserSettings = (): void => {
  // TODO: 实现用户设置逻辑
  console.log('Open user settings')
}
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-gray-50">
    <!-- 侧边栏 -->
    <aside
      :class="['h-screen bg-white border-r border-gray-200 transition-all duration-300', sidebarWidth]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <span 
          :class="['font-semibold transition-all', isCollapsed ? 'text-2xl' : 'text-xl']"
        >
          {{ isCollapsed ? '🚀' : '开发工具箱' }}
        </span>
        <button
          @click="toggleSidebar"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span class="text-gray-500">
            {{ isCollapsed ? '→' : '←' }}
          </span>
        </button>
      </div>

      <!-- 菜单列表 -->
      <nav class="p-2 space-y-1">
        <button
          v-for="item in menuItems"
          :key="item.key"
          @click="handleMenuClick(item.key)"
          :class="[
            'w-full flex items-center px-3 py-2 rounded-lg transition-colors',
            activeMenu === item.key
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-100'
          ]"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span 
            :class="['ml-3 font-medium', isCollapsed ? 'hidden' : 'block']"
          >
            {{ item.label }}
          </span>
        </button>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- 顶部导航栏 -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <!-- 搜索框 -->
        <div class="flex-1 max-w-2xl">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索..."
              @keyup.enter="handleSearch"
              class="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                     transition-all"
            >
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="flex items-center space-x-4">
          <button
            @click="handleUserSettings"
            class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span class="text-2xl">{{ userInfo.avatar }}</span>
            <span 
              class="text-sm font-medium text-gray-700"
            >
              {{ userInfo.name }}
            </span>
          </button>
        </div>
      </header>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-auto p-6">
        <!-- 面包屑导航 -->
        <div class="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <span>首页</span>
          <span>/</span>
          <span class="text-gray-900">
            {{ menuItems.find(item => item.key === activeMenu)?.label }}
          </span>
        </div>

        <!-- 内容卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="i in 6"
            :key="i"
            class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <h3 class="text-lg font-medium text-gray-900">卡片标题 {{ i }}</h3>
            <p class="mt-2 text-gray-500">这里是卡片的具体内容描述...</p>
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
