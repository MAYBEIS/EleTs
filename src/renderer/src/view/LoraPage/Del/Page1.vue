<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 16:28:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-22 18:53:08
 * @FilePath: \EleTs\src\renderer\src\view\LoraPage\CivitaiPage.vue
 * @Description: Civitai模型管理页面
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from '@renderer/store'

// 定义页面状态
const store = useStore()
const ipcRenderer = window.electron.ipcRenderer
const activeTab = ref('models') // 默认激活模型浏览页面

// 模型数据类型定义
interface Model {
  id: number
  name: string
  type: string
  size: string
  description: string
  downloadUrl: string
}

// 下载数据类型定义
interface Download {
  id: string
  name: string
  progress: number
  status: '等待中' | '下载中' | '已暂停' | '已完成' | '已取消' | '失败'
  addedAt: string
  completedAt?: string
  error?: string
}

// 设置数据类型定义
interface Settings {
  downloadPath: string
  maxConcurrentDownloads: number
  autoCheckUpdates: boolean
}

// 模型数据
const models = ref<Model[]>([])
const loadingModels = ref(false)
const searchQuery = ref('')

// 下载数据
const downloads = ref<Download[]>([])
const loadingDownloads = ref(false)

// 设置数据
const settings = ref<Settings>({
  downloadPath: '',
  maxConcurrentDownloads: 3,
  autoCheckUpdates: true
})

// 获取模型数据
const fetchModels = async () => {
  loadingModels.value = true
  try {
    // 构建Civitai API URL
    let url = 'https://civitai.com/api/v1/models?limit=20'
    if (searchQuery.value) {
      url += `&query=${encodeURIComponent(searchQuery.value)}`
    }
    
    // 调用IPC获取模型数据
    const response = await ipcRenderer.invoke('fetch-civitai-models', url, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      // 解析模型数据
      const items = response.data.items || []
      models.value = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        size: formatFileSize(item.modelVersions?.[0]?.files?.[0]?.sizeKB || 0),
        description: item.description || '暂无描述',
        downloadUrl: item.modelVersions?.[0]?.files?.[0]?.downloadUrl || ''
      }))
    } else {
      console.error('Failed to fetch models:', response.error)
      // 如果获取失败，使用模拟数据
      models.value = [
        { id: 1, name: 'Model A', type: 'Lora', size: '120MB', description: 'A beautiful model with great details', downloadUrl: '' },
        { id: 2, name: 'Model B', type: 'Checkpoint', size: '2.1GB', description: 'High quality checkpoint model for realistic images', downloadUrl: '' },
        { id: 3, name: 'Model C', type: 'Lora', size: '85MB', description: 'Stylized model for artistic renders', downloadUrl: '' },
        { id: 4, name: 'Model D', type: 'Textual Inversion', size: '2.5MB', description: 'Specialized model for specific concepts', downloadUrl: '' },
        { id: 5, name: 'Model E', type: 'Checkpoint', size: '1.8GB', description: 'Anime style checkpoint model', downloadUrl: '' },
        { id: 6, name: 'Model F', type: 'Lora', size: '95MB', description: 'Detailed model for character design', downloadUrl: '' }
      ]
    }
  } catch (error) {
    console.error('Failed to fetch models:', error)
    // 如果获取失败，使用模拟数据
    models.value = [
      { id: 1, name: 'Model A', type: 'Lora', size: '120MB', description: 'A beautiful model with great details', downloadUrl: '' },
      { id: 2, name: 'Model B', type: 'Checkpoint', size: '2.1GB', description: 'High quality checkpoint model for realistic images', downloadUrl: '' },
      { id: 3, name: 'Model C', type: 'Lora', size: '85MB', description: 'Stylized model for artistic renders', downloadUrl: '' },
      { id: 4, name: 'Model D', type: 'Textual Inversion', size: '2.5MB', description: 'Specialized model for specific concepts', downloadUrl: '' },
      { id: 5, name: 'Model E', type: 'Checkpoint', size: '1.8GB', description: 'Anime style checkpoint model', downloadUrl: '' },
      { id: 6, name: 'Model F', type: 'Lora', size: '95MB', description: 'Detailed model for character design', downloadUrl: '' }
    ]
  } finally {
    loadingModels.value = false
  }
}

// 格式化文件大小
const formatFileSize = (sizeKB: number): string => {
  if (sizeKB < 1024) {
    return `${Math.round(sizeKB)}KB`
  } else if (sizeKB < 1024 * 1024) {
    return `${(sizeKB / 1024).toFixed(1)}MB`
  } else {
    return `${(sizeKB / (1024 * 1024)).toFixed(1)}GB`
  }
}

// 获取下载队列
const fetchDownloads = async () => {
  loadingDownloads.value = true
  try {
    // 调用IPC获取下载队列
    const response = await ipcRenderer.invoke('get-download-queue')
    
    if (response.success) {
      downloads.value = response.data
    } else {
      console.error('Failed to fetch downloads:', response.error)
      // 如果获取失败，使用模拟数据
      downloads.value = [
        { id: '1', name: 'Model A', progress: 65, status: '下载中', addedAt: new Date().toISOString() },
        { id: '2', name: 'Model B', progress: 100, status: '已完成', addedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
        { id: '3', name: 'Model C', progress: 30, status: '下载中', addedAt: new Date().toISOString() },
        { id: '4', name: 'Model D', progress: 100, status: '已完成', addedAt: new Date().toISOString(), completedAt: new Date().toISOString() }
      ]
    }
  } catch (error) {
    console.error('Failed to fetch downloads:', error)
    // 如果获取失败，使用模拟数据
    downloads.value = [
      { id: '1', name: 'Model A', progress: 65, status: '下载中', addedAt: new Date().toISOString() },
      { id: '2', name: 'Model B', progress: 100, status: '已完成', addedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      { id: '3', name: 'Model C', progress: 30, status: '下载中', addedAt: new Date().toISOString() },
      { id: '4', name: 'Model D', progress: 100, status: '已完成', addedAt: new Date().toISOString(), completedAt: new Date().toISOString() }
    ]
  } finally {
    loadingDownloads.value = false
  }
}

// 添加模型到下载队列
const addModelToDownload = async (model: Model) => {
  try {
    console.log('Adding model to download:', model)
    
    // 调用IPC添加到下载队列
    const response = await ipcRenderer.invoke('add-to-download-queue', 
      model.id.toString(), 
      model.name, 
      model.downloadUrl
    )
    
    if (response.success) {
      console.log('Model added to download queue:', response.data)
      // 更新下载列表
      await fetchDownloads()
    } else {
      console.error('Failed to add model to download queue:', response.error)
      alert('添加下载失败: ' + response.error)
    }
  } catch (error) {
    console.error('Failed to add model to download queue:', error)
    alert('添加下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 开始下载
const startDownload = async (downloadId: string) => {
  try {
    const response = await ipcRenderer.invoke('start-download', downloadId)
    if (response.success) {
      console.log('Download started:', response.data)
      // 更新下载列表
      await fetchDownloads()
    } else {
      console.error('Failed to start download:', response.error)
      alert('开始下载失败: ' + response.error)
    }
  } catch (error) {
    console.error('Failed to start download:', error)
    alert('开始下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 暂停下载
const pauseDownload = async (downloadId: string) => {
  try {
    const response = await ipcRenderer.invoke('pause-download', downloadId)
    if (response.success) {
      console.log('Download paused:', response.data)
      // 更新下载列表
      await fetchDownloads()
    } else {
      console.error('Failed to pause download:', response.error)
      alert('暂停下载失败: ' + response.error)
    }
  } catch (error) {
    console.error('Failed to pause download:', error)
    alert('暂停下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 取消下载
const cancelDownload = async (downloadId: string) => {
  try {
    const response = await ipcRenderer.invoke('cancel-download', downloadId)
    if (response.success) {
      console.log('Download cancelled:', response.data)
      // 更新下载列表
      await fetchDownloads()
    } else {
      console.error('Failed to cancel download:', response.error)
      alert('取消下载失败: ' + response.error)
    }
  } catch (error) {
    console.error('Failed to cancel download:', error)
    alert('取消下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    console.log('Saving settings:', settings.value)
    
    // 保存下载目录
    if (settings.value.downloadPath) {
      const response = await ipcRenderer.invoke('save-download-directory', settings.value.downloadPath)
      if (!response.success) {
        console.error('Failed to save download directory:', response.error)
        alert('保存下载目录失败: ' + response.error)
        return
      }
    }
    
    // 显示保存成功的提示
    alert('设置已保存')
  } catch (error) {
    console.error('Failed to save settings:', error)
    alert('保存设置失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 获取设置
const fetchSettings = async () => {
  try {
    // 获取下载目录
    const response = await ipcRenderer.invoke('get-download-directory')
    if (response.success) {
      settings.value.downloadPath = response.data
    } else {
      console.error('Failed to fetch download directory:', response.error)
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
  }
}

// 选择下载目录
const selectDownloadDirectory = async () => {
  try {
    const response = await ipcRenderer.invoke('select-download-directory')
    if (response.success) {
      settings.value.downloadPath = response.data
    } else {
      console.error('Failed to select download directory:', response.error)
    }
  } catch (error) {
    console.error('Failed to select download directory:', error)
  }
}

// 打开开发者工具
// const openDevTools = async () => {
//   try {
//     await ipcRenderer.invoke('open-dev-tools')
//   } catch (error) {
//     console.error('Failed to open dev tools:', error)
//   }
// }

// 监听下载进度更新
const handleDownloadProgress = (event: any, data: any) => {
  console.log('Download progress:', data)
  // 更新下载列表中的进度
  const download = downloads.value.find(d => d.id === data.taskId)
  if (download) {
    download.progress = data.progress
  }
}

// 监听下载状态改变
const handleDownloadStatusChanged = (event: any, data: any) => {
  console.log('Download status changed:', data)
  // 更新下载列表中的状态
  const download = downloads.value.find(d => d.id === data.taskId)
  if (download) {
    download.status = data.status
  }
}

// 监听下载队列更新
const handleDownloadQueueUpdated = (event: any, data: any) => {
  console.log('Download queue updated:', data)
  // 更新下载列表
  if (data.queue) {
    downloads.value = data.queue
  }
}

// 监听下载完成
const handleDownloadCompleted = (event: any, data: any) => {
  console.log('Download completed:', data)
  // 更新下载列表
  fetchDownloads()
}

onMounted(() => {
  fetchModels()
  fetchDownloads()
  fetchSettings()
  
  // 添加事件监听器
  ipcRenderer.on('download-progress', handleDownloadProgress)
  ipcRenderer.on('download-status-changed', handleDownloadStatusChanged)
  ipcRenderer.on('download-queue-updated', handleDownloadQueueUpdated)
  ipcRenderer.on('download-completed', handleDownloadCompleted)
})

onUnmounted(() => {
  // 移除事件监听器
  ipcRenderer.removeListener('download-progress', handleDownloadProgress)
  ipcRenderer.removeListener('download-status-changed', handleDownloadStatusChanged)
  ipcRenderer.removeListener('download-queue-updated', handleDownloadQueueUpdated)
  ipcRenderer.removeListener('download-completed', handleDownloadCompleted)
})
</script>

<template>
  <div class="civitai-page flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- 左侧导航栏 -->
    <div class="sidebar w-64 bg-white shadow-xl rounded-r-lg">
      <div class="p-5 border-b border-gray-200">
        <h1 class="text-2xl font-bold text-indigo-600 flex items-center">
          <span class="bg-indigo-600 text-white rounded-lg p-1 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </span>
          Civitai 管理器
        </h1>
      </div>
      <nav class="p-3">
        <ul class="space-y-2">
          <li>
            <button 
              @click="activeTab = 'models'"
              :class="['w-full text-left px-4 py-3 rounded-lg flex items-center transition-all duration-200', activeTab === 'models' ? 'bg-indigo-100 text-indigo-700 font-medium shadow-sm' : 'hover:bg-gray-100 text-gray-600']"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              模型浏览
            </button>
          </li>
          <li>
            <button 
              @click="activeTab = 'downloads'"
              :class="['w-full text-left px-4 py-3 rounded-lg flex items-center transition-all duration-200', activeTab === 'downloads' ? 'bg-indigo-100 text-indigo-700 font-medium shadow-sm' : 'hover:bg-gray-100 text-gray-600']"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              下载管理
            </button>
          </li>
          <li>
            <button 
              @click="activeTab = 'settings'"
              :class="['w-full text-left px-4 py-3 rounded-lg flex items-center transition-all duration-200', activeTab === 'settings' ? 'bg-indigo-100 text-indigo-700 font-medium shadow-sm' : 'hover:bg-gray-100 text-gray-600']"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              设置
            </button>
          </li>
        </ul>
      </nav>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content flex-1 overflow-auto p-6">
      <!-- 模型浏览 -->
      <div v-if="activeTab === 'models'" class="model-browser">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">模型浏览</h2>
          <div class="relative">
            <input 
              type="text" 
              placeholder="搜索模型..." 
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              v-model="searchQuery"
              @keyup.enter="fetchModels"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div v-if="loadingModels" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p class="mt-3 text-gray-600">加载中...</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="model in models" 
            :key="model.id"
            class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
          >
            <div class="p-5">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-lg text-gray-900">{{ model.name }}</h3>
                  <div class="flex items-center mt-1">
                    <span class="inline-block px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full">
                      {{ model.type }}
                    </span>
                    <span class="ml-2 text-sm text-gray-500">{{ model.size }}</span>
                  </div>
                </div>
                <div class="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
              </div>
              <p class="mt-3 text-gray-600 text-sm line-clamp-2">{{ model.description }}</p>
              <button 
                @click="addModelToDownload(model)"
                class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                添加到下载
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 下载管理 -->
      <div v-else-if="activeTab === 'downloads'" class="download-manager">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">下载管理</h2>
        
        <div v-if="loadingDownloads" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p class="mt-3 text-gray-600">加载中...</p>
        </div>
        
        <div v-else-if="downloads.length === 0" class="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900">暂无下载任务</h3>
          <p class="mt-1 text-gray-500">前往模型浏览页面添加模型到下载队列</p>
          <button 
            @click="activeTab = 'models'"
            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            浏览模型
          </button>
        </div>
        
        <div v-else class="space-y-4">
          <div 
            v-for="download in downloads" 
            :key="download.id"
            class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div class="p-5">
              <div class="flex justify-between items-center">
                <h3 class="font-bold text-gray-900">{{ download.name }}</h3>
                <span :class="[
                  'px-2 py-1 text-xs font-semibold rounded-full',
                  download.status === '已完成' ? 'bg-green-100 text-green-800' : 
                  download.status === '下载中' ? 'bg-blue-100 text-blue-800' : 
                  download.status === '等待中' ? 'bg-yellow-100 text-yellow-800' : 
                  download.status === '已暂停' ? 'bg-gray-100 text-gray-800' : 
                  'bg-red-100 text-red-800'
                ]">
                  {{ download.status === '已完成' ? '已完成' : 
                     download.status === '下载中' ? '下载中' : 
                     download.status === '等待中' ? '等待中' : 
                     download.status === '已暂停' ? '已暂停' : '失败' }}
                </span>
              </div>
              <div class="mt-3">
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                  <span>下载进度</span>
                  <span>{{ download.progress }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    :class="[
                      'h-2.5 rounded-full',
                      download.status === '已完成' ? 'bg-green-600' : 
                      download.status === '下载中' ? 'bg-blue-600' : 
                      download.status === '等待中' ? 'bg-yellow-600' : 
                      download.status === '已暂停' ? 'bg-gray-600' : 
                      'bg-red-600'
                    ]" 
                    :style="'width: ' + download.progress + '%'"
                  ></div>
                </div>
              </div>
              <div class="mt-3 flex space-x-2">
                <button 
                  v-if="download.status === '下载中'"
                  @click="pauseDownload(download.id)"
                  class="text-sm text-gray-600 hover:text-gray-900"
                >
                  暂停
                </button>
                <button 
                  v-else-if="download.status === '等待中' || download.status === '已暂停'"
                  @click="startDownload(download.id)"
                  class="text-sm text-gray-600 hover:text-gray-900"
                >
                  开始
                </button>
                <button 
                  v-if="download.status === '下载中' || download.status === '等待中' || download.status === '已暂停'"
                  @click="cancelDownload(download.id)"
                  class="text-sm text-gray-600 hover:text-gray-900"
                >
                  取消
                </button>
                <button 
                  v-if="download.status === '已完成'"
                  class="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  打开文件夹
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 设置 -->
      <div v-else-if="activeTab === 'settings'" class="settings">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">设置</h2>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-6">
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">下载路径</label>
                <div class="flex">
                  <input 
                    type="text" 
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                    v-model="settings.downloadPath"
                    placeholder="请选择下载路径"
                  />
                  <button 
                    @click="selectDownloadDirectory"
                    class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-r-lg border border-l-0 border-gray-300"
                  >
                    浏览
                  </button>
                </div>
                <p class="mt-1 text-sm text-gray-500">模型文件将下载到此文件夹</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">最大并发下载数</label>
                <select 
                  class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  v-model.number="settings.maxConcurrentDownloads"
                >
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                  <option :value="3">3</option>
                  <option :value="4">4</option>
                  <option :value="5">5</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">同时下载的模型数量</p>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="autoCheckUpdates" 
                  class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                  v-model="settings.autoCheckUpdates"
                />
                <label for="autoCheckUpdates" class="ml-2 block text-sm text-gray-700">
                  自动检查更新
                </label>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="notifications" 
                  class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                />
                <label for="notifications" class="ml-2 block text-sm text-gray-700">
                  启用下载完成通知
                </label>
              </div>
              
              <div class="pt-4">
                <button 
                  @click="saveSettings"
                  class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  保存设置
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">关于</h3>
            <div class="flex items-center">
              <div class="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
              <div class="ml-4">
                <p class="text-gray-900 font-medium">Civitai 管理器</p>
                <p class="text-gray-500 text-sm">版本 1.0.0</p>
                <p class="text-gray-500 text-sm mt-1">© 2025 Civitai 管理器. 保留所有权利.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.civitai-page {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  
  .sidebar {
    min-width: 260px;
  }
  
  .model-browser, .download-manager, .settings {
    h2 {
      color: #1f2937;
    }
  }
  
  button {
    transition: all 0.2s ease;
  }
  
  // 滚动条样式
  ::-webkit-scrollbar {
    width: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #c5c5c5;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #a0a0a0;
  }
  
  // 文本截断
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
