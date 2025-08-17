<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 16:26:29
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-27 22:21:49
 * @FilePath: \EleTs\src\renderer\src\view\HomePage\HomePage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="toolbox-app h-screen w-full bg-gray-50 dark:bg-gray-900 flex no-select">
    <!-- 左侧分类导航 -->
    <div 
      :class="[
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col no-select transition-all duration-300 ease-out overflow-hidden',
        sidebarCollapsed ? 'w-16' : 'w-64'
      ]"
    >
      <!-- 头部标题 -->
      <div class="border-b border-gray-200 dark:border-gray-700 no-select flex items-center justify-between min-h-[73px] relative">
        <!-- 标题容器 - 使用绝对定位避免布局变化 -->
        <div class="absolute left-0 top-0 h-full flex items-center transition-all duration-300 ease-out"
             :style="{ 
               transform: sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)',
               opacity: sidebarCollapsed ? 0 : 1
             }">
          <div class="p-6">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">工具箱</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">选择工具分类</p>
          </div>
        </div>
        
        <!-- 折叠按钮 -->
        <div :class="sidebarCollapsed ? 'p-4 w-full flex justify-center' : 'p-6 ml-auto'">
          <button
            @click="toggleSidebar"
            class="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <transition
              enter-active-class="transition-transform duration-300 ease-out"
              leave-active-class="transition-transform duration-300 ease-out"
              mode="out-in"
            >
              <component 
                :is="sidebarCollapsed ? ChevronRightIcon : ChevronLeftIcon" 
                :key="sidebarCollapsed ? 'right' : 'left'"
                class="h-5 w-5" 
              />
            </transition>
          </button>
        </div>
      </div>

      <!-- 分类菜单 -->
      <nav class="flex-1 p-4 space-y-2 no-select overflow-hidden">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectedCategory = category.id; selectedTool = null"
          :class="[
            'w-full h-12 flex items-center rounded-lg text-left transition-all duration-300 border no-select relative overflow-hidden',
            selectedCategory === category.id
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'
          ]"
          :title="sidebarCollapsed ? category.name : ''"
        >
          <!-- 图标 - 使用固定定位避免闪烁 -->
          <div 
            class="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
            :style="{ 
              left: sidebarCollapsed ? '50%' : '16px',
              transform: sidebarCollapsed ? 'translate(-50%, -50%)' : 'translateY(-50%)'
            }"
          >
            <component :is="category.icon" class="h-5 w-5 flex-shrink-0" />
          </div>
          
          <!-- 文字内容 -->
          <div 
            class="absolute left-12 right-4 top-1/2 -translate-y-1/2 flex items-center justify-between transition-all duration-300 ease-out"
            :style="{ 
              opacity: sidebarCollapsed ? 0 : 1,
              transform: sidebarCollapsed ? 'translate(20px, -50%)' : 'translateY(-50%)'
            }"
          >
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate text-sm">{{ category.name }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ category.description }}</div>
            </div>
            <div class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full flex-shrink-0 min-w-[2rem] text-center ml-3">
              {{ category.tools.length }}
            </div>
          </div>
        </button>
      </nav>

      <!-- 底部主题切换 -->
      <div class="border-t border-gray-200 dark:border-gray-700 no-select">
        <div class="p-4">
          <button
            @click="toggleTheme"
            :class="[
              'w-full h-10 flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors no-select relative overflow-hidden'
            ]"
            :title="sidebarCollapsed ? (isDark ? '切换到亮色' : '切换到暗色') : ''"
          >
            <!-- 主题图标 -->
            <div 
              class="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
              :style="{ 
                left: sidebarCollapsed ? '50%' : '16px',
                transform: sidebarCollapsed ? 'translate(-50%, -50%)' : 'translateY(-50%)'
              }"
            >
              <component :is="isDark ? SunIcon : MoonIcon" class="h-5 w-5 flex-shrink-0" />
            </div>
            
            <!-- 主题切换文字 -->
            <span 
              class="absolute left-12 top-1/2 -translate-y-1/2 text-sm transition-all duration-300 ease-out"
              :style="{ 
                opacity: sidebarCollapsed ? 0 : 1,
                transform: sidebarCollapsed ? 'translate(20px, -50%)' : 'translateY(-50%)'
              }"
            >
              {{ isDark ? '切换到亮色' : '切换到暗色' }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 如果选择了具体工具，显示工具组件 -->
      <div v-if="selectedTool" class="flex-1 flex flex-col">
        <!-- 工具头部控制栏 -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button 
              @click="selectedTool = null"
              class="flex items-center gap-2 text-blue-600 hover:text-blue-800 no-select"
            >
              <ArrowLeftIcon class="h-4 w-4" />
              返回工具列表
            </button>
            <div class="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedTool.name }}</h2>
          </div>
        </div>
        
        <!-- 工具组件容器 -->
        <div class="flex-1 p-6">
          <!-- Base64编码工具 -->
          <Base64Tool v-if="selectedTool.id === 'base64-encoder'" @back="selectedTool = null" />
          
          <!-- URL编码工具 -->
          <UrlEncoderTool v-else-if="selectedTool.id === 'url-encoder'" @back="selectedTool = null" />
          
          <!-- 其他工具组件 -->
          <div v-else class="no-select">
            <p class="text-gray-500">{{ selectedTool.name }} 功能开发中...</p>
          </div>
        </div>
      </div>

      <!-- 工具列表视图 -->
      <div v-else class="flex-1 flex flex-col no-select">
        <!-- 搜索栏和工具分类头部 -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 no-select">
          <!-- 搜索栏 -->
          <div class="mb-6">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索工具..."
                class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <button
                v-if="searchQuery"
                @click="clearSearch"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- 分类头部信息和视图控制 -->
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ searchQuery ? '搜索结果' : currentCategory?.name }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                {{ searchQuery ? `找到 ${filteredTools.length} 个相关工具` : currentCategory?.description }}
              </p>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                共 {{ searchQuery ? filteredTools.length : (currentCategory?.tools.length || 0) }} 个工具
              </div>
              <!-- 视图大小切换按钮 -->
              <button
                @click="toggleGridSize"
                class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <component :is="isLargeGrid ? ViewfinderCircleIcon : Squares2X2Icon" class="h-4 w-4" />
                {{ isLargeGrid ? '紧凑视图' : '宽松视图' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 工具网格 -->
        <div class="flex-1 p-6 overflow-y-auto no-select">
          <!-- 使用key强制重新渲染避免闪烁 -->
          <div
            :key="`${selectedCategory}-${isLargeGrid}`"
            :class="[
              'grid gap-3 transition-all duration-300',
              isLargeGrid 
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            ]"
          >
            <div
              v-for="(tool, index) in searchQuery ? filteredTools : currentCategory?.tools"
              :key="tool.id"
              @click="openTool(tool)"
              :class="[
                'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer group no-select',
                isLargeGrid ? 'p-3' : 'p-6'
              ]"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <!-- 工具图标 -->
              <div :class="['flex items-center justify-center mb-3', isLargeGrid ? 'w-8 h-8' : 'w-12 h-12']">
                <div :class="[
                  'flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg',
                  isLargeGrid ? 'w-8 h-8' : 'w-12 h-12'
                ]">
                  <component :is="tool.icon" :class="isLargeGrid ? 'h-4 w-4' : 'h-6 w-6'" class="text-white" />
                </div>
              </div>

              <!-- 工具信息 -->
              <h3 :class="['font-semibold text-gray-900 dark:text-white mb-2', isLargeGrid ? 'text-sm' : '']">
                {{ tool.name }}
              </h3>
              <p :class="['text-gray-600 dark:text-gray-400 mb-3 line-clamp-2', isLargeGrid ? 'text-xs' : 'text-sm']">
                {{ tool.description }}
              </p>

              <!-- 工具标签 -->
              <div class="flex flex-wrap gap-1 mb-3">
                <span
                  v-for="tag in tool.tags.slice(0, isLargeGrid ? 2 : 3)"
                  :key="tag"
                  :class="[
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full',
                    isLargeGrid ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-xs'
                  ]"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- 使用状态 -->
              <div class="flex items-center justify-between">
                <span :class="['text-gray-500 dark:text-gray-400', isLargeGrid ? 'text-xs' : 'text-xs']">
                  {{ isLargeGrid ? tool.lastUsed.replace('前', '') : `最近: ${tool.lastUsed}` }}
                </span>
                <div class="flex items-center gap-1">
                  <div :class="isLargeGrid ? 'w-1.5 h-1.5' : 'w-2 h-2'" class="bg-green-400 rounded-full"></div>
                  <span :class="['text-green-600 dark:text-green-400', isLargeGrid ? 'text-xs' : 'text-xs']">
                    {{ isLargeGrid ? '可用' : '可用' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="searchQuery ? !filteredTools.length : !currentCategory?.tools.length"
            class="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 no-select"
          >
            <component :is="searchQuery ? MagnifyingGlassIcon : FolderOpenIcon" class="h-16 w-16 mb-4 opacity-50" />
            <p class="text-lg font-medium mb-2">{{ searchQuery ? '未找到相关工具' : '暂无工具' }}</p>
            <p class="text-sm">{{ searchQuery ? '尝试使用其他关键词搜索' : '该分类下还没有添加任何工具' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Base64Tool from './tools/Base64Tool.vue'
import UrlEncoderTool from './tools/UrlEncoderTool.vue'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PhotoIcon,
  CodeBracketIcon,
  CpuChipIcon,
  SunIcon,
  MoonIcon,
  FolderOpenIcon,
  ScissorsIcon,
  CalculatorIcon,
  ClockIcon,
  PaintBrushIcon,
  CameraIcon,
  MusicalNoteIcon,
  FilmIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  ShieldCheckIcon,
  WifiIcon,
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Squares2X2Icon,
  ViewfinderCircleIcon
} from '@heroicons/vue/24/outline'

// 响应式状态
const selectedCategory = ref('dev-tools')
const selectedTool = ref(null)
const isDark = ref(false)
const sidebarCollapsed = ref(false) // 侧边栏折叠状态
const isLargeGrid = ref(false) // 网格大小状态
const searchQuery = ref('') // 搜索查询
const isMobile = ref(false) // 移动端检测

// ESC键返回功能
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && selectedTool.value) {
    selectedTool.value = null
    event.preventDefault()
  }
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  // 检测屏幕大小
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', checkMobile)
})

// 工具分类定义
const categories = [
  {
    id: 'dev-tools',
    name: '开发工具',
    description: '程序开发辅助工具',
    icon: CodeBracketIcon,
    tools: [
      {
        id: 'json-formatter',
        name: 'JSON格式化',
        description: '美化和验证JSON数据',
        icon: DocumentDuplicateIcon,
        tags: ['JSON', '格式化'],
        lastUsed: '30分钟前'
      },
      {
        id: 'base64-encoder',
        name: 'Base64编码',
        description: 'Base64编码解码工具',
        icon: KeyIcon,
        tags: ['编码', 'Base64'],
        lastUsed: '1天前'
      },
      {
        id: 'url-encoder',
        name: 'URL编码',
        description: 'URL编码解码工具',
        icon: LinkIcon,
        tags: ['编码', 'URL'],
        lastUsed: '刚刚'
      },
      {
        id: 'hash-generator',
        name: '哈希生成',
        description: '生成MD5、SHA1、SHA256等哈希值',
        icon: ShieldCheckIcon,
        tags: ['哈希', '加密'],
        lastUsed: '5天前'
      }
    ]
  },
  {
    id: 'text-tools',
    name: '文本工具',
    description: '文本处理和转换工具',
    icon: DocumentTextIcon,
    tools: [
      {
        id: 'text-diff',
        name: '文本对比',
        description: '比较两段文本的差异',
        icon: DocumentDuplicateIcon,
        tags: ['对比', '差异'],
        lastUsed: '2小时前'
      },
      {
        id: 'text-counter',
        name: '字符统计',
        description: '统计文本字符、单词、行数',
        icon: CalculatorIcon,
        tags: ['统计', '计数'],
        lastUsed: '1天前'
      }
    ]
  },
  {
    id: 'image-tools',
    name: '图片工具',
    description: '图片处理和转换工具',
    icon: PhotoIcon,
    tools: [
      {
        id: 'image-compress',
        name: '图片压缩',
        description: '压缩图片文件大小',
        icon: PhotoIcon,
        tags: ['压缩', '优化'],
        lastUsed: '3天前'
      }
    ]
  },
  {
    id: 'time-tools',
    name: '时间工具',
    description: '时间和日期相关工具',
    icon: ClockIcon,
    tools: [
      {
        id: 'timestamp-converter',
        name: '时间戳转换',
        description: '时间戳与日期格式互转',
        icon: ClockIcon,
        tags: ['时间戳', '转换'],
        lastUsed: '2天前'
      }
    ]
  }
]

// 计算属性
const currentCategory = computed(() => {
  return categories.find(cat => cat.id === selectedCategory.value)
})

// 搜索过滤工具
const filteredTools = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase()
  const allTools = categories.flatMap(category => category.tools)
  
  return allTools.filter(tool => 
    tool.name.toLowerCase().includes(query) ||
    tool.description.toLowerCase().includes(query) ||
    tool.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

// 事件处理
const toggleTheme = () => {
  isDark.value = !isDark.value
  console.log('切换主题:', isDark.value ? '暗色' : '亮色')
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleGridSize = () => {
  isLargeGrid.value = !isLargeGrid.value
}

const clearSearch = () => {
  searchQuery.value = ''
}

const openTool = (tool) => {
  selectedTool.value = tool
  console.log('打开工具:', tool.name)
}
</script>

<style scoped>
/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片入场动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.grid > div {
  animation: fadeInUp 0.3s ease-out forwards;
}
</style>
