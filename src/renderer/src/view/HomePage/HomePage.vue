<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 16:26:29
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-27 21:51:03
 * @FilePath: \EleTs\src\renderer\src\view\HomePage\HomePage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="toolbox-app h-screen w-full bg-gray-50 dark:bg-gray-900 flex">
    <!-- 左侧分类导航 -->
    <div class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <!-- 头部标题 -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">工具箱</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">选择工具分类</p>
      </div>

      <!-- 分类菜单 -->
      <nav class="flex-1 p-4 space-y-2">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectedCategory = category.id; selectedTool = null"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200',
            selectedCategory === category.id
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          ]"
        >
          <component :is="category.icon" class="h-5 w-5" />
          <div class="flex-1">
            <div class="font-medium">{{ category.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ category.description }}</div>
          </div>
          <div class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {{ category.tools.length }}
          </div>
        </button>
      </nav>

      <!-- 底部主题切换 -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="toggleTheme"
          class="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <component :is="isDark ? SunIcon : MoonIcon" class="h-5 w-5" />
          <span class="text-sm">{{ isDark ? '切换到亮色' : '切换到暗色' }}</span>
        </button>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 如果选择了具体工具，显示工具组件 -->
      <div v-if="selectedTool" class="flex-1">
        <!-- Base64编码工具 -->
        <Base64Tool v-if="selectedTool.id === 'base64-encoder'" @back="selectedTool = null" />
        
        <!-- 其他工具组件可以在这里添加 -->
        <div v-else class="p-6">
          <button 
            @click="selectedTool = null"
            class="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon class="h-4 w-4" />
            返回工具列表
          </button>
          <p class="text-gray-500">{{ selectedTool.name }} 功能开发中...</p>
        </div>
      </div>

      <!-- 工具列表视图 -->
      <div v-else class="flex-1 flex flex-col">
        <!-- 工具分类头部 -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ currentCategory?.name }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                {{ currentCategory?.description }}
              </p>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              共 {{ currentCategory?.tools.length || 0 }} 个工具
            </div>
          </div>
        </div>

        <!-- 工具网格 -->
        <div class="flex-1 p-6 overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="tool in currentCategory?.tools"
              :key="tool.id"
              @click="openTool(tool)"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer group"
            >
              <!-- 工具图标 -->
              <div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                <component :is="tool.icon" class="h-6 w-6 text-white" />
              </div>

              <!-- 工具信息 -->
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                {{ tool.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {{ tool.description }}
              </p>

              <!-- 工具标签 -->
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in tool.tags"
                  :key="tag"
                  class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- 使用状态 -->
              <div class="mt-4 flex items-center justify-between">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  最近使用: {{ tool.lastUsed }}
                </span>
                <div class="flex items-center gap-1">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-xs text-green-600 dark:text-green-400">可用</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="!currentCategory?.tools.length"
            class="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400"
          >
            <component :is="FolderOpenIcon" class="h-16 w-16 mb-4 opacity-50" />
            <p class="text-lg font-medium mb-2">暂无工具</p>
            <p class="text-sm">该分类下还没有添加任何工具</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Base64Tool from './tools/Base64Tool.vue'
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
  WifiIcon
} from '@heroicons/vue/24/outline'

// 响应式状态
const selectedCategory = ref('dev-tools')
const selectedTool = ref(null)
const isDark = ref(false)

// 工具分类定义（保持原有的categories数组）
const categories = [
  {
    id: 'text-tools',
    name: '文本工具',
    description: '文本处理和编辑工具',
    icon: DocumentTextIcon,
    tools: [
      {
        id: 'text-formatter',
        name: '文本格式化',
        description: '格式化JSON、XML、HTML等文本',
        icon: CodeBracketIcon,
        tags: ['格式化', 'JSON', 'XML'],
        lastUsed: '2小时前'
      },
      {
        id: 'text-converter',
        name: '文本转换',
        description: '大小写转换、编码转换等',
        icon: ScissorsIcon,
        tags: ['转换', '编码'],
        lastUsed: '1天前'
      },
      {
        id: 'word-counter',
        name: '字数统计',
        description: '统计文本字数、行数等信息',
        icon: CalculatorIcon,
        tags: ['统计', '分析'],
        lastUsed: '3天前'
      }
    ]
  },
  {
    id: 'image-tools',
    name: '图像工具',
    description: '图片处理和编辑工具',
    icon: PhotoIcon,
    tools: [
      {
        id: 'image-compressor',
        name: '图片压缩',
        description: '无损压缩图片，减小文件大小',
        icon: CameraIcon,
        tags: ['压缩', '优化'],
        lastUsed: '1小时前'
      },
      {
        id: 'image-converter',
        name: '格式转换',
        description: '转换图片格式：JPG、PNG、WebP等',
        icon: PaintBrushIcon,
        tags: ['转换', '格式'],
        lastUsed: '2天前'
      }
    ]
  },
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
    id: 'system-tools',
    name: '系统工具',
    description: '系统信息和管理工具',
    icon: CpuChipIcon,
    tools: [
      {
        id: 'system-info',
        name: '系统信息',
        description: '查看系统硬件和软件信息',
        icon: CpuChipIcon,
        tags: ['系统', '信息'],
        lastUsed: '1周前'
      },
      {
        id: 'network-tools',
        name: '网络工具',
        description: 'Ping、端口扫描等网络工具',
        icon: WifiIcon,
        tags: ['网络', 'Ping'],
        lastUsed: '3天前'
      }
    ]
  },
  {
    id: 'media-tools',
    name: '媒体工具',
    description: '音视频处理工具',
    icon: FilmIcon,
    tools: [
      {
        id: 'audio-converter',
        name: '音频转换',
        description: '转换音频格式和压缩',
        icon: MusicalNoteIcon,
        tags: ['音频', '转换'],
        lastUsed: '1周前'
      },
      {
        id: 'video-compressor',
        name: '视频压缩',
        description: '压缩视频文件大小',
        icon: FilmIcon,
        tags: ['视频', '压缩'],
        lastUsed: '2周前'
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

// 事件处理
const toggleTheme = () => {
  isDark.value = !isDark.value
  console.log('切换主题:', isDark.value ? '暗色' : '亮色')
}

const openTool = (tool) => {
  selectedTool.value = tool
  console.log('打开工具:', tool.name)
}
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* 暗色模式滚动条 */
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}
</style>
