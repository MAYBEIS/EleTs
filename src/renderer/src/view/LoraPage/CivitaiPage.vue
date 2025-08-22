<script setup lang="ts">
// 导入ipcRenderer


import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  HomeFilled,
  Search,
  Star,
  Clock,
  Setting,
  Download,
  View,
  Plus,
  VideoPlay,
  VideoPause,
  RefreshRight,
  Delete,
  DocumentCopy,
  Check,
  Close
} from '@element-plus/icons-vue'

// 导航菜单相关
const activeMenu = ref('home')
const menuItems = [
  { key: 'home', icon: HomeFilled, label: '主页' },
  { key: 'search', icon: Search, label: '搜索' },
  { key: 'favorites', icon: Star, label: '喜欢' },
  { key: 'downloads', icon: Download, label: '下载列表' },
  { key: 'history', icon: Clock, label: '下载历史' },
  { key: 'settings', icon: Setting, label: '设置' }
]

// 模型数据相关
const models = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchQuery = ref('')
const selectedType = ref('')
// 添加分页缓存
const pageCache = ref<Record<string, any[]>>({})

// 显示模式相关
const displayMode = ref('detailed') // 'detailed' 或 'compact'
const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === 'detailed' ? 'compact' : 'detailed'
}

// 批量下载相关
const batchModelIds = ref('')
const downloadQueue = ref<any[]>([])
const downloadHistory = ref<any[]>([])
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(0)

// 批量下载UI状态
const showBatchHelp = ref(false)
const isAddingToQueue = ref(false)
const isStartingDownload = ref(false)

// 计算属性
const modelIdCount = computed(() => {
  if (!batchModelIds.value.trim()) return 0
  return batchModelIds.value.split('\n').filter(id => id.trim()).length
})

const validModelIdCount = computed(() => {
  if (!batchModelIds.value.trim()) return 0
  return batchModelIds.value.split('\n')
    .filter(id => id.trim())
    .filter(id => !isNaN(Number(id.trim())))
    .length
})

const waitingCount = computed(() => {
  return downloadQueue.value.filter(item => item.status === '等待中').length
})

const downloadingCount = computed(() => {
  return downloadQueue.value.filter(item => item.status === '下载中').length
})

const pausedCount = computed(() => {
  return downloadQueue.value.filter(item => item.status === '已暂停').length
})

const overallProgress = computed(() => {
  if (downloadQueue.value.length === 0) return 0
  const totalProgress = downloadQueue.value.reduce((sum, item) => sum + item.progress, 0)
  return Math.round(totalProgress / downloadQueue.value.length)
})

const hasActiveDownloads = computed(() => {
  return downloadQueue.value.some(item => item.status === '下载中')
})

// 批量下载模型
const batchDownloadModels = async () => {
  if (!batchModelIds.value.trim()) {
    ElMessage.warning('请输入模型ID')
    return
  }
  
  // 验证并过滤ID
  const allIds = batchModelIds.value.split('\n').map(id => id.trim()).filter(id => id)
  const validIds = allIds.filter(id => !isNaN(Number(id)))
  
  if (validIds.length === 0) {
    ElMessage.warning('请输入有效的模型ID')
    return
  }
  
  try {
    isAddingToQueue.value = true
    console.log('批量添加模型到下载队列:', validIds)
    const result = await window.api.invoke('batch-add-to-download-queue', validIds)
    
    if (result.success) {
      const { added, failed } = result.data
      if (added.length > 0) {
        ElMessage.success(`已添加 ${added.length} 个模型到下载队列`)
      }
      if (failed.length > 0) {
        ElMessage.warning(`${failed.length} 个模型添加失败（可能已在队列中）`)
      }
      // 刷新下载队列
      await fetchDownloadQueue()
      
      // 询问是否清空输入
      if (batchModelIds.value.trim()) {
        try {
          await ElMessageBox.confirm(
            '已成功添加模型到下载队列，是否清空输入框？',
            '操作完成',
            {
              confirmButtonText: '清空',
              cancelButtonText: '保留',
              type: 'info'
            }
          )
          batchModelIds.value = ''
        } catch (error) {
          // 用户选择保留，不做任何操作
        }
      }
    } else {
      ElMessage.error('批量添加失败: ' + result.error)
    }
  } catch (error) {
    console.error('批量添加下载失败:', error)
    ElMessage.error('批量添加失败: ' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    isAddingToQueue.value = false
  }
}

// 获取下载状态类型（用于标签颜色）
const getDownloadStatusType = (status: string) => {
  switch (status) {
    case '下载中':
      return 'primary'
    case '已完成':
      return 'success'
    case '已暂停':
      return 'warning'
    case '已取消':
    case '失败':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取下载队列
const fetchDownloadQueue = async () => {
  try {
    const result = await window.api.invoke('get-download-queue')
    if (result.success) {
      downloadQueue.value = result.data
    } else {
      console.error('获取下载队列失败:', result.error)
    }
  } catch (error) {
    console.error('获取下载队列失败:', error)
  }
}

// 获取下载历史
const fetchDownloadHistory = async () => {
  try {
    const result = await window.api.invoke('get-download-history', historyPage.value, historyPageSize.value)
    if (result.success) {
      downloadHistory.value = result.data.items
      historyTotal.value = result.data.total
    } else {
      console.error('获取下载历史失败:', result.error)
    }
  } catch (error) {
    console.error('获取下载历史失败:', error)
  }
}

// 开始下载
const startDownload = async (item: any) => {
  try {
    const result = await window.api.invoke('start-download', item.id)
    if (result.success) {
      // 更新本地状态
      const index = downloadQueue.value.findIndex(i => i.id === item.id)
      if (index !== -1) {
        downloadQueue.value[index] = result.data
      }
      ElMessage.success('下载已开始')
    } else {
      ElMessage.error('开始下载失败: ' + result.error)
    }
  } catch (error) {
    console.error('开始下载失败:', error)
    ElMessage.error('开始下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 暂停下载
const pauseDownload = async (item: any) => {
  try {
    const result = await window.api.invoke('pause-download', item.id)
    if (result.success) {
      // 更新本地状态
      const index = downloadQueue.value.findIndex(i => i.id === item.id)
      if (index !== -1) {
        downloadQueue.value[index] = result.data
      }
      ElMessage.success('下载已暂停')
    } else {
      ElMessage.error('暂停下载失败: ' + result.error)
    }
  } catch (error) {
    console.error('暂停下载失败:', error)
    ElMessage.error('暂停下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 取消下载
const cancelDownload = async (item: any) => {
  try {
    const result = await window.api.invoke('cancel-download', item.id)
    if (result.success) {
      // 从队列中移除
      downloadQueue.value = downloadQueue.value.filter(i => i.id !== item.id)
      // 刷新历史记录
      await fetchDownloadHistory()
      ElMessage.success('下载已取消')
    } else {
      ElMessage.error('取消下载失败: ' + result.error)
    }
  } catch (error) {
    console.error('取消下载失败:', error)
    ElMessage.error('取消下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 查看下载结果
const viewDownloadResult = (item: any) => {
  ElMessage.info(`查看下载结果: ${item.name}`)
}

// 处理历史页面变化
const handleHistoryPageChange = async (page: number) => {
  historyPage.value = page
  await fetchDownloadHistory()
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      // 如果已有内容，询问是否追加
      if (batchModelIds.value.trim()) {
        const result = await ElMessageBox.confirm(
          '是否将剪贴板内容追加到现有内容？',
          '确认操作',
          {
            confirmButtonText: '追加',
            cancelButtonText: '替换',
            type: 'info'
          }
        )
        
        if (result === 'confirm') {
          batchModelIds.value += '\n' + text
        } else {
          batchModelIds.value = text
        }
      } else {
        batchModelIds.value = text
      }
      ElMessage.success('已从剪贴板粘贴')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('从剪贴板粘贴失败:', error)
      ElMessage.error('从剪贴板粘贴失败')
    }
  }
}

// 清空批量输入
const clearBatchInput = () => {
  ElMessageBox.confirm(
    '确定要清空所有输入的模型ID吗？',
    '确认清空',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    batchModelIds.value = ''
    ElMessage.success('已清空输入')
  }).catch(() => {})
}

// 验证模型ID
const validateModelIds = () => {
  if (!batchModelIds.value.trim()) {
    ElMessage.warning('请先输入模型ID')
    return
  }
  
  const ids = batchModelIds.value.split('\n')
  const validIds: string[] = []
  const invalidIds: string[] = []
  
  ids.forEach(id => {
    const trimmedId = id.trim()
    if (trimmedId) {
      if (!isNaN(Number(trimmedId))) {
        validIds.push(trimmedId)
      } else {
        invalidIds.push(trimmedId)
      }
    }
  })
  
  if (invalidIds.length === 0) {
    ElMessage.success(`所有 ${validIds.length} 个ID格式正确`)
  } else {
    ElMessage.warning(`发现 ${invalidIds.length} 个无效ID，已自动过滤`)
    // 更新输入框，只保留有效ID
    batchModelIds.value = validIds.join('\n')
  }
}

// 批量开始下载
const batchStartDownload = async () => {
  if (downloadQueue.value.length === 0) {
    ElMessage.warning('下载队列为空')
    return
  }
  
  const waitingIds = downloadQueue.value
    .filter(item => item.status === '等待中' || item.status === '已暂停')
    .map(item => item.id)
  
  if (waitingIds.length === 0) {
    ElMessage.warning('没有可开始下载的任务')
    return
  }
  
  try {
    isStartingDownload.value = true
    console.log('批量开始下载:', waitingIds)
    const result = await window.api.invoke('batch-start-download', waitingIds)
    
    if (result.success) {
      const { successCount, failCount } = result.data
      if (successCount > 0) {
        ElMessage.success(`已开始 ${successCount} 个任务下载`)
      }
      if (failCount > 0) {
        ElMessage.warning(`${failCount} 个任务开始失败`)
      }
      // 刷新下载队列
      await fetchDownloadQueue()
    } else {
      ElMessage.error('批量开始下载失败: ' + result.error)
    }
  } catch (error) {
    console.error('批量开始下载失败:', error)
    ElMessage.error('批量开始下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    isStartingDownload.value = false
  }
}

// 刷新下载队列
const refreshDownloadQueue = async () => {
  await fetchDownloadQueue()
  ElMessage.success('已刷新下载队列')
}

// 暂停所有下载
const pauseAllDownloads = async () => {
  const downloadingIds = downloadQueue.value
    .filter(item => item.status === '下载中')
    .map(item => item.id)
  
  if (downloadingIds.length === 0) {
    ElMessage.warning('没有正在下载的任务')
    return
  }
  
  try {
    const results = []
    for (const id of downloadingIds) {
      const item = downloadQueue.value.find(i => i.id === id)
      if (item) {
        await pauseDownload(item)
        results.push({ id, success: true })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    ElMessage.success(`已暂停 ${successCount} 个下载任务`)
  } catch (error) {
    console.error('暂停所有下载失败:', error)
    ElMessage.error('暂停所有下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 清空所有下载
const clearAllDownloads = async () => {
  if (downloadQueue.value.length === 0) {
    ElMessage.warning('下载队列为空')
    return
  }
  
  try {
    const result = await ElMessageBox.confirm(
      `确定要清空所有 ${downloadQueue.value.length} 个下载任务吗？此操作不可恢复。`,
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      const ids = downloadQueue.value.map(item => item.id)
      for (const id of ids) {
        const item = downloadQueue.value.find(i => i.id === id)
        if (item) {
          await cancelDownload(item)
        }
      }
      ElMessage.success(`已清空 ${ids.length} 个下载任务`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空所有下载失败:', error)
      ElMessage.error('清空所有下载失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }
}

// 获取表格行类名
const getRowClassName = ({ row }: { row: any }) => {
  switch (row.status) {
    case '下载中':
      return 'downloading-row'
    case '已完成':
      return 'completed-row'
    case '已暂停':
      return 'paused-row'
    case '已取消':
    case '失败':
      return 'cancelled-row'
    default:
      return 'waiting-row'
  }
}

// 获取进度状态
const getProgressStatus = (status: string) => {
  switch (status) {
    case '下载中':
      return ''
    case '已完成':
      return 'success'
    case '已暂停':
      return 'warning'
    case '已取消':
    case '失败':
      return 'exception'
    default:
      return ''
  }
}

// 格式化速度
const formatSpeed = (speed?: number) => {
  if (!speed) return '0 KB/s'
  if (speed < 1024) return `${speed} B/s`
  if (speed < 1024 * 1024) return `${(speed / 1024).toFixed(1)} KB/s`
  return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`
}

// 格式化时间
const formatTime = (time?: number) => {
  if (!time) return '计算中...'
  if (time < 1000) return '即将完成'
  
  const seconds = Math.floor(time / 1000)
  if (seconds < 60) return `${seconds}秒`
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}分${remainingSeconds}秒`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}小时${remainingMinutes}分`
}

// 清空下载历史
const clearDownloadHistory = async () => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要清空所有下载历史记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      const response = await window.api.invoke('clear-download-history')
      if (response.success) {
        downloadHistory.value = []
        historyTotal.value = 0
        ElMessage.success(`已清空 ${response.data.clearedCount} 条历史记录`)
      } else {
        ElMessage.error('清空失败: ' + response.error)
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空下载历史失败:', error)
      ElMessage.error('清空失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }
}

// 模型类型
const modelTypes = [
  { value: '', label: '全部类型' },
  { value: 'Checkpoint', label: 'Checkpoint' },
  { value: 'LORA', label: 'LORA' },
  { value: 'TextualInversion', label: 'TextualInversion' },
  { value: 'Hypernetwork', label: 'Hypernetwork' },
  { value: 'AestheticGradient', label: 'AestheticGradient' },
  { value: 'Controlnet', label: 'Controlnet' },
  { value: 'Poses', label: 'Poses' }
]

// 排序选项
const sortOptions = [
  { value: 'Highest Rated', label: '最高评分' },
  { value: 'Most Downloaded', label: '最多下载' },
  { value: 'Most Liked', label: '最多喜欢' },
  { value: 'Newest', label: '最新发布' }
]
const selectedSort = ref('Highest Rated')

// API 设置
const apiKey = ref(localStorage.getItem('civitai_api_key') || '')
const apiEndpoint = ref(localStorage.getItem('civitai_api_endpoint') || 'https://civitai.com/api/v1')

// 代理设置
const proxyServer = ref(localStorage.getItem('proxy_server') || '')
const proxyEnabled = ref(localStorage.getItem('proxy_enabled') === 'true')
const useSystemProxy = ref(localStorage.getItem('use_system_proxy') === 'true')

// 下载目录设置
const downloadDirectory = ref('')

// 选择下载目录
const selectDownloadDirectory = async () => {
  try {
    const result = await window.api.invoke('select-download-directory')
    if (result.success) {
      downloadDirectory.value = result.data
    } else {
      ElMessage.error('选择下载目录失败: ' + result.error)
    }
  } catch (error) {
    console.error('选择下载目录失败:', error)
    ElMessage.error('选择下载目录失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 保存下载设置
const saveDownloadSettings = async () => {
  try {
    const result = await window.api.invoke('save-download-directory', downloadDirectory.value)
    if (result.success) {
      ElMessage.success('下载设置已保存')
    } else {
      ElMessage.error('保存下载设置失败: ' + result.error)
    }
  } catch (error) {
    console.error('保存下载设置失败:', error)
    ElMessage.error('保存下载设置失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 加载下载设置
const loadDownloadSettings = async () => {
  try {
    const result = await window.api.invoke('get-download-directory')
    if (result.success) {
      downloadDirectory.value = result.data
    } else {
      console.warn('加载下载目录设置失败:', result.error)
    }
  } catch (error) {
    console.error('加载下载设置失败:', error)
  }
}

// 保存 API 设置
const saveApiSettings = (key: string, endpoint: string) => {
  try {
    apiKey.value = key
    apiEndpoint.value = endpoint
    localStorage.setItem('civitai_api_key', key)
    localStorage.setItem('civitai_api_endpoint', endpoint)
    ElMessage.success('API设置已保存')
    setTimeout(() => {
      fetchModels() // 重新加载数据
    }, 500) // 延迟500ms执行，确保设置已保存
  } catch (error) {
    console.error('保存API设置失败:', error)
    ElMessage.error('保存API设置失败')
  }
}

// 保存代理设置
const saveProxySettings = () => {
  try {
    localStorage.setItem('proxy_server', proxyServer.value)
    localStorage.setItem('proxy_enabled', proxyEnabled.value.toString())
    localStorage.setItem('use_system_proxy', useSystemProxy.value.toString())
    ElMessage.success('代理设置已保存')
    
    // 通知主进程更新代理设置
    window.api.invoke('update-proxy-settings', {
      server: proxyServer.value,
      enabled: proxyEnabled.value,
      useSystemProxy: useSystemProxy.value
    })
    
    // 重新加载数据
    setTimeout(() => {
      fetchModels()
    }, 500) // 延迟500ms执行，确保设置已保存
  } catch (error) {
    console.error('保存代理设置失败:', error)
    ElMessage.error('保存代理设置失败')
  }
}

// 测试代理连接
const testProxyConnection = async () => {
  if (!proxyServer.value) {
    ElMessage.warning('请先输入代理服务器地址')
    return
  }
  
  try {
    ElMessage.info('正在测试代理连接...')
    const result = await window.api.invoke('test-proxy-connection', proxyServer.value)
    if (result.success) {
      ElMessage.success('代理连接测试成功')
    } else {
      ElMessage.error('代理连接测试失败: ' + (result.error || '连接失败'))
    }
  } catch (error) {
    console.error('代理连接测试失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    ElMessage.error('代理连接测试失败: ' + errorMessage)
  }
}

// 获取模型列表
const fetchModels = async () => {
  // 生成缓存键
  const cacheKey = `${currentPage.value}-${pageSize.value}-${selectedSort.value}-${searchQuery.value}-${selectedType.value}`;
  
  // 检查缓存中是否已有数据
  if (pageCache.value[cacheKey]) {
    models.value = pageCache.value[cacheKey];
    console.log(`从缓存中获取第 ${currentPage.value} 页数据`);
    return;
  }
  
  loading.value = true
  try {
    // 构建请求参数
    const params = new URLSearchParams({
      limit: pageSize.value.toString(),
      page: currentPage.value.toString(),
      sort: selectedSort.value,
      query: searchQuery.value,
      ...(selectedType.value && { types: selectedType.value })
    })

    // 构建请求头
    const headers: HeadersInit = {}
    if (apiKey.value) {
      headers['Authorization'] = `Bearer ${apiKey.value}`
    }

    // 构建完整的API URL
    const apiUrl = `${apiEndpoint.value}/models?${params}`
    console.log('请求API URL:', apiUrl)

    // 重新使用 Electron 的 IPC 调用来发送请求
    // 由于CSP限制，直接使用fetch在Electron中可能无法正常工作
    console.log('发送 Civitai 模型数据请求');
    console.log('API URL:', apiUrl);
    console.log('请求头:', headers);
    console.log('代理设置:', {
      proxy: proxyEnabled.value ? proxyServer.value : undefined,
      useSystemProxy: useSystemProxy.value
    });
    
    const response = await window.api.invoke('fetch-civitai-models', apiUrl, {
      headers,
      proxy: proxyEnabled.value ? proxyServer.value : undefined,
      useSystemProxy: useSystemProxy.value
    });
    
    console.log('收到 Civitai 模型数据响应:', response);
    
    console.log('API响应:', response)
    
    if (!response.ok) {
      throw new Error(`获取模型数据失败: ${response.status} ${response.statusText}`)
    }

    const data = response.data
    
    // 检查数据结构
    if (!data || !Array.isArray(data.items)) {
      console.error('无效的数据结构:', data)
      throw new Error('返回的数据格式不正确')
    }
    
    const processedModels = data.items.map((item: any) => {
      // 确保必要的字段存在
      // 获取模型版本和图片信息
      const modelVersion = item.modelVersions?.[0] || {};
      // 尝试从不同字段获取图片URL
      const image = modelVersion.images?.[0] || {};
      // 检查媒体类型，只使用图片类型
      let imageUrl = '/placeholder-300x200.png';
      // 检查图片类型，支持常见的图片格式
      const isImageUrl = (url: string) => {
        if (!url) return false;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
      };
      
      if (image.url && (image.type === 'image' || isImageUrl(image.url))) {
        imageUrl = image.url;
      } else if (image.downloadUrl && (image.type === 'image' || isImageUrl(image.downloadUrl))) {
        imageUrl = image.downloadUrl;
      } else if (item.coverImageUrl && isImageUrl(item.coverImageUrl)) {
        imageUrl = item.coverImageUrl;
      }
      
      return {
        id: item.id || Date.now() + Math.random(), // 如果没有ID则生成一个临时ID
        name: item.name || '未命名模型',
        // 改进描述文字处理逻辑
        description: item.description || item.desc || item.content || '暂无描述',
        type: item.type || 'Unknown',
        nsfw: item.nsfw || false,
        tags: Array.isArray(item.tags) ? item.tags : [],
        // 正确映射统计数据字段
        stats: {
          downloadCount: item.stats?.downloadCount || item.stats?.downloadedCount || item.downloadCount || 0,
          favoriteCount: item.stats?.favoriteCount || item.stats?.favouriteCount || item.stats?.heartCount || item.favouriteCount || 0,
          rating: item.stats?.rating || item.stats?.avgRating || item.avgRating || 0
        },
        creator: {
          username: item.creator?.username || '未知作者',
          image: item.creator?.image || '/placeholder-50.png'
        },
        imageUrl: imageUrl,
        downloadUrl: modelVersion.downloadUrl || ''
      }
    })
    
    // 保存到缓存
    pageCache.value[cacheKey] = processedModels;
    models.value = processedModels;
    
    total.value = data.metadata?.totalItems || data.items.length || 0
    console.log(`成功获取 ${models.value.length} 个模型`)

  } catch (error) {
    console.error('获取模型失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    ElMessage.error(`获取模型数据失败: ${errorMessage}，请检查网络连接和API设置`)
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchModels()
}

// 添加一个防抖搜索函数
const debounceSearch = (() => {
  let timeout: NodeJS.Timeout
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      handleSearch()
    }, 500)
  }
})()

// 处理类型筛选
const handleTypeChange = (type: string) => {
  currentPage.value = 1
  selectedType.value = type
  fetchModels()
}

// 处理排序变化
const handleSortChange = () => {
  currentPage.value = 1
  fetchModels()
}

// 处理页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchModels()
}

// 查看模型详情
const viewModelDetails = (model: any) => {
  // 跳转到模型详情页面
  router.push(`/model/${model.id}`)
}

// 下载模型
const downloadModel = async (model: any) => {
  if (!model.downloadUrl) {
    ElMessage.error('未找到下载链接')
    return
  }

  try {
    // 添加到下载队列
    const result = await window.api.invoke('add-to-download-queue', model.id.toString(), model.name, model.downloadUrl)
    
    if (result.success) {
      ElMessage.success('已添加到下载队列')
      // 刷新下载队列
      await fetchDownloadQueue()
    } else {
      ElMessage.error('添加到下载队列失败: ' + result.error)
    }
  } catch (error) {
    console.error('添加到下载队列失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    ElMessage.error('添加到下载队列失败: ' + errorMessage + '，请稍后重试')
  }
}

// 切换菜单
const handleMenuClick = (key: string) => {
  activeMenu.value = key
}

// 创建路由实例
const router = useRouter()

// 页面加载时获取数据
onMounted(() => {
  fetchModels()
  fetchDownloadQueue()
  fetchDownloadHistory()
  loadDownloadSettings()
})
</script>

<template>
  <div class="civitai-layout">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="logo">
        <img src="/placeholder-100.png" alt="Civitai" />
        <span>Civitai Desktop</span>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="nav-menu">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: activeMenu === item.key }"
          @click="handleMenuClick(item.key)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </div>
      </nav>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部栏 -->
      <div class="top-bar">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索模型、Lora、风格..."
            prefix-icon="Search"
            @keyup.enter="handleSearch"
            @input="debounceSearch"
          />
        </div>
        <div class="user-info">
          <el-avatar size="small" src="/placeholder-100.png" />
          <span>用户名</span>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="content">
        <template v-if="activeMenu === 'home'">
          <!-- 筛选区域 -->
          <div class="filter-section mb-6 flex flex-wrap items-center gap-4">
            <el-select v-model="selectedType" placeholder="选择模型类型" @change="handleTypeChange">
              <el-option
                v-for="type in modelTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>

            <el-select v-model="selectedSort" placeholder="排序方式" @change="handleSortChange">
              <el-option
                v-for="option in sortOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            
            <!-- 显示模式切换按钮 -->
            <el-button @click="toggleDisplayMode">
              {{ displayMode === 'detailed' ? '简洁模式' : '详细模式' }}
            </el-button>
          </div>

          <!-- 模型列表 -->
          <div v-loading="loading" class="model-grid">
            <el-card
              v-for="model in models"
              :key="model.id"
              class="model-card"
              :body-style="{ padding: '0' }"
            >
              <div class="relative h-96">
                <img :src="model.imageUrl" :alt="model.name" class="w-full h-full object-contain" />
                
                <!-- 文本和按钮覆盖在图片上 -->
                <div class="absolute bottom-0 left-0 right-0 p-4">
                  <div class="inline-block bg-white bg-opacity-80 p-4 rounded-lg max-w-full">
                    <div class="model-type-tag">
                      {{ model.type }}
                    </div>
                    <div v-if="model.nsfw" class="nsfw-tag">
                      NSFW
                    </div>

                    <h3 class="text-lg font-semibold mb-2 truncate max-w-xs" :title="model.name">
                      {{ model.name }}
                    </h3>
                    
                    <!-- 详细模式显示作者信息 -->
                    <div v-if="displayMode === 'detailed'" class="creator mb-2 flex items-center gap-2">
                      <el-avatar :size="24" :src="model.creator.image" />
                      <span class="text-sm text-gray-600 truncate">{{ model.creator.username }}</span>
                    </div>

                    <!-- 详细模式显示描述 -->
                    <p v-if="displayMode === 'detailed'" class="description text-sm text-gray-500 mb-3 line-clamp-2">
                      {{ model.description }}
                    </p>

                    <!-- 详细模式显示统计数据 -->
                    <div v-if="displayMode === 'detailed'" class="stats grid grid-cols-3 gap-2 mb-3 text-xs text-gray-600">
                      <div>⭐ {{ model.stats.rating.toFixed(1) }}</div>
                      <div>💟 {{ model.stats.favoriteCount }}</div>
                      <div>⬇️ {{ model.stats.downloadCount }}</div>
                    </div>

                    <!-- 详细模式显示标签 -->
                    <div v-if="displayMode === 'detailed'" class="tags mb-3 flex flex-wrap gap-1">
                      <el-tag
                        v-for="tag in model.tags.slice(0, 3)"
                        :key="tag"
                        size="small"
                        class="text-xs"
                      >
                        {{ tag }}
                      </el-tag>
                      <el-tag
                        v-if="model.tags.length > 3"
                        size="small"
                        type="info"
                        class="text-xs"
                      >
                        +{{ model.tags.length - 3 }}
                      </el-tag>
                    </div>

                    <!-- 按钮区域 -->
                    <div class="flex gap-2">
                      <el-button
                        type="primary"
                        :icon="View"
                        @click="viewModelDetails(model)"
                        size="small"
                      >
                        详情
                      </el-button>
                      <el-button
                        type="success"
                        :icon="Download"
                        @click="downloadModel(model)"
                        size="small"
                      >
                        下载
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 分页 -->
          <div class="pagination-section mt-6 flex justify-center">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[12, 20, 40, 60]"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSearch"
              @current-change="handlePageChange"
            />
          </div>
        </template>

        <!-- 下载列表页面 -->
        <template v-if="activeMenu === 'downloads'">
          <div class="downloads-page">
            <!-- 批量下载卡片 -->
            <el-card class="mb-4">
              <template #header>
                <div class="card-header flex justify-between items-center">
                  <h3>批量下载</h3>
                  <el-button type="text" @click="showBatchHelp = !showBatchHelp">
                    {{ showBatchHelp ? '隐藏帮助' : '显示帮助' }}
                  </el-button>
                </div>
              </template>
              
              <!-- 帮助信息 -->
              <el-alert
                v-if="showBatchHelp"
                title="批量下载使用说明"
                type="info"
                :closable="false"
                class="mb-4"
              >
                <ul class="help-list">
                  <li>每行输入一个模型ID，ID为数字格式</li>
                  <li>支持从剪贴板粘贴多个ID</li>
                  <li>系统会自动过滤重复和无效的ID</li>
                  <li>添加后可以在下载队列中管理所有任务</li>
                </ul>
              </el-alert>
              
              <el-form label-width="120px">
                <el-form-item label="模型ID列表">
                  <div class="batch-input-container">
                    <el-input
                      v-model="batchModelIds"
                      type="textarea"
                      :rows="6"
                      placeholder="请输入模型ID，每行一个ID&#10;例如：&#10;12345&#10;67890&#10;13579"
                    />
                    <div class="batch-input-actions">
                      <el-button @click="pasteFromClipboard" size="small" :icon="DocumentCopy">
                        粘贴
                      </el-button>
                      <el-button @click="clearBatchInput" size="small" :icon="Delete">
                        清空
                      </el-button>
                      <el-button @click="validateModelIds" size="small" :icon="Check">
                        验证
                      </el-button>
                    </div>
                  </div>
                  <div class="batch-input-stats">
                    <span>已输入: {{ modelIdCount }} 个ID</span>
                    <span>有效: {{ validModelIdCount }} 个ID</span>
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <div class="batch-actions">
                    <el-button
                      type="primary"
                      @click="batchDownloadModels"
                      :loading="isAddingToQueue"
                      :icon="Plus"
                    >
                      添加到队列
                    </el-button>
                    <el-button
                      v-if="downloadQueue.length > 0"
                      type="success"
                      @click="batchStartDownload"
                      :loading="isStartingDownload"
                      :icon="VideoPlay"
                    >
                      开始全部下载
                    </el-button>
                  </div>
                </el-form-item>
              </el-form>
            </el-card>
            
            <!-- 下载队列卡片 -->
            <el-card>
              <template #header>
                <div class="card-header flex justify-between items-center">
                  <h3>下载队列 ({{ downloadQueue.length }})</h3>
                  <div class="queue-actions">
                    <el-button
                      v-if="downloadQueue.length > 0"
                      size="small"
                      @click="refreshDownloadQueue"
                      :icon="RefreshRight"
                    >
                      刷新
                    </el-button>
                    <el-button
                      v-if="hasActiveDownloads"
                      size="small"
                      type="warning"
                      @click="pauseAllDownloads"
                      :icon="VideoPause"
                    >
                      暂停全部
                    </el-button>
                    <el-button
                      v-if="downloadQueue.length > 0"
                      size="small"
                      type="danger"
                      @click="clearAllDownloads"
                      :icon="Delete"
                    >
                      清空队列
                    </el-button>
                  </div>
                </div>
              </template>
              
              <!-- 队列统计信息 -->
              <div v-if="downloadQueue.length > 0" class="queue-stats mb-4">
                <el-row :gutter="16">
                  <el-col :span="6">
                    <div class="stat-card waiting">
                      <div class="stat-value">{{ waitingCount }}</div>
                      <div class="stat-label">等待中</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-card downloading">
                      <div class="stat-value">{{ downloadingCount }}</div>
                      <div class="stat-label">下载中</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-card paused">
                      <div class="stat-value">{{ pausedCount }}</div>
                      <div class="stat-label">已暂停</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="stat-card progress">
                      <div class="stat-value">{{ overallProgress }}%</div>
                      <div class="stat-label">总进度</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <!-- 下载队列表格 -->
              <div v-if="downloadQueue.length > 0" class="download-table-container">
                <el-table :data="downloadQueue" style="width: 100%" :row-class-name="getRowClassName">
                  <el-table-column prop="id" label="模型ID" width="100" />
                  <el-table-column prop="name" label="模型名称" min-width="200" show-overflow-tooltip />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="scope">
                      <el-tag :type="getDownloadStatusType(scope.row.status)" size="small">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="进度" width="200">
                    <template #default="scope">
                      <div class="progress-container">
                        <el-progress
                          :percentage="scope.row.progress"
                          :status="getProgressStatus(scope.row.status)"
                          :stroke-width="8"
                          :show-text="true"
                          :text-inside="true"
                        />
                        <div v-if="scope.row.status === '下载中'" class="progress-info">
                          <span class="progress-speed">{{ formatSpeed(scope.row.speed) }}</span>
                          <span class="progress-time">{{ formatTime(scope.row.remainingTime) }}</span>
                        </div>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="200">
                    <template #default="scope">
                      <div class="table-actions">
                        <el-button
                          v-if="scope.row.status === '等待中' || scope.row.status === '已暂停'"
                          size="small"
                          type="primary"
                          @click="startDownload(scope.row)"
                          :icon="VideoPlay"
                        >
                          开始
                        </el-button>
                        <el-button
                          v-else-if="scope.row.status === '下载中'"
                          size="small"
                          type="warning"
                          @click="pauseDownload(scope.row)"
                          :icon="VideoPause"
                        >
                          暂停
                        </el-button>
                        <el-button
                          size="small"
                          type="danger"
                          @click="cancelDownload(scope.row)"
                          :icon="Close"
                        >
                          取消
                        </el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              
              <!-- 空状态 -->
              <el-empty
                v-else
                description="下载队列为空"
                :image-size="120"
              >
                <el-button type="primary" @click="activeMenu = 'home'">
                  去发现模型
                </el-button>
              </el-empty>
            </el-card>
          </div>
        </template>
        
        <!-- 下载历史页面 -->
        <template v-if="activeMenu === 'history'">
          <div class="history-page">
            <el-card>
              <template #header>
                <div class="card-header flex justify-between items-center">
                  <h3>下载历史</h3>
                  <el-button
                    type="danger"
                    size="small"
                    @click="clearDownloadHistory"
                    :disabled="downloadHistory.length === 0"
                  >
                    清空历史
                  </el-button>
                </div>
              </template>
              
              <el-table :data="downloadHistory" style="width: 100%">
                <el-table-column prop="id" label="模型ID" width="100" />
                <el-table-column prop="name" label="模型名称" />
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="scope">
                    <el-tag :type="getDownloadStatusType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="completedAt" label="完成时间" width="180" />
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button
                      size="small"
                      @click="viewDownloadResult(scope.row)"
                    >
                      查看结果
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-section mt-4 flex justify-center">
                <el-pagination
                  v-model:current-page="historyPage"
                  v-model:page-size="historyPageSize"
                  :total="historyTotal"
                  layout="total, prev, pager, next"
                  @current-change="handleHistoryPageChange"
                />
              </div>
            </el-card>
          </div>
        </template>

        <!-- 设置页面 -->
        <template v-if="activeMenu === 'settings'">
          <div class="settings-page">
            <el-card class="mb-4">
              <template #header>
                <div class="card-header">
                  <h3>API 设置</h3>
                </div>
              </template>
              
              <el-form label-width="120px">
                <el-form-item label="API Key">
                  <el-input
                    v-model="apiKey"
                    placeholder="请输入您的 Civitai API Key"
                    type="password"
                    show-password
                  >
                    <template #append>
                      <el-tooltip
                        content="获取API Key: 访问 civitai.com，登录后在设置中创建"
                        placement="top"
                      >
                        <el-button :icon="View" link />
                      </el-tooltip>
                    </template>
                  </el-input>
                  <div class="form-help text-xs text-gray-500 mt-1">
                    API Key 用于访问更多功能，例如下载高分辨率图片等
                  </div>
                </el-form-item>

                <el-form-item label="API 地址">
                  <el-input
                    v-model="apiEndpoint"
                    placeholder="请输入 Civitai API 地址"
                  >
                    <template #append>
                      <el-tooltip
                        content="默认: https://civitai.com/api/v1"
                        placement="top"
                      >
                        <el-button
                          @click="apiEndpoint = 'https://civitai.com/api/v1'"
                        >
                          重置
                        </el-button>
                      </el-tooltip>
                    </template>
                  </el-input>
                  <div class="form-help text-xs text-gray-500 mt-1">
                    如果您使用反向代理，可以在这里修改 API 地址
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-button
                    type="primary"
                    @click="saveApiSettings(apiKey, apiEndpoint)"
                  >
                    保存设置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <el-card>
              <template #header>
                <div class="card-header">
                  <h3>下载设置</h3>
                </div>
              </template>
              
              <el-form label-width="120px">
                <el-form-item label="下载目录">
                  <el-input
                    v-model="downloadDirectory"
                    readonly
                    placeholder="请选择下载目录"
                  >
                    <template #append>
                      <el-button @click="selectDownloadDirectory">选择目录</el-button>
                    </template>
                  </el-input>
                  <div class="form-help text-xs text-gray-500 mt-1">
                    选择模型文件的默认下载位置
                  </div>
                </el-form-item>

                <el-form-item label="自动分类">
                  <el-switch />
                  <div class="form-help text-xs text-gray-500 mt-1">
                    开启后会按模型类型自动分类到子文件夹
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <el-button
                    type="primary"
                    @click="saveDownloadSettings"
                  >
                    保存下载设置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
            
            <el-card>
              <template #header>
                <div class="card-header">
                  <h3>网络代理设置</h3>
                </div>
              </template>
              
              <el-form label-width="120px">
                <el-form-item label="代理服务器">
                  <el-input
                    v-model="proxyServer"
                    placeholder="例如: http://127.0.0.1:1080"
                  >
                    <template #append>
                      <el-button @click="testProxyConnection">测试连接</el-button>
                    </template>
                  </el-input>
                  <div class="form-help text-xs text-gray-500 mt-1">
                    支持 HTTP/HTTPS/SOCKS 代理
                  </div>
                </el-form-item>

                <el-form-item label="启用代理">
                  <el-switch v-model="proxyEnabled" />
                  <div class="form-help text-xs text-gray-500 mt-1">
                    开启后所有网络请求将通过代理服务器发送
                  </div>
                </el-form-item>
                
                <el-form-item label="使用系统代理">
                  <el-switch v-model="useSystemProxy" />
                  <div class="form-help text-xs text-gray-500 mt-1">
                    开启后将使用系统默认代理设置
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <el-button
                    type="primary"
                    @click="saveProxySettings"
                  >
                    保存代理设置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.civitai-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f5f7fa;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.sidebar {
  width: 220px;
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  padding: 20px 0;
  display: flex;
  flex-direction: column;

  .logo {
    padding: 0 20px;
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    gap: 10px;

    img {
      width: 32px;
      height: 32px;
    }

    span {
      font-size: 18px;
      font-weight: bold;
    }
  }
}

.nav-menu {
  .menu-item {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: #f5f7fa;
    }

    &.active {
      background-color: #ecf5ff;
      color: #409eff;
    }

    .el-icon {
      font-size: 18px;
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  height: 64px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .search-box {
    width: 400px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  h2 {
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: bold;
  }
}

.category-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;

  .category-card {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;

  .model-card {
    transition: all 0.3s ease;
    overflow: hidden;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .relative {
      position: relative;
    }

    .model-type-tag {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: rgba(0, 0, 0, 0.6);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .nsfw-tag {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(244, 67, 54, 0.8);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .el-card__body {
      padding: 0;
    }
    
    .p-4 {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 0 0 8px 8px;
    }
    
    .relative {
      height: 24rem; /* 384px */
    }

    .creator {
      img {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }
    }

    .description {
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .stats {
      font-size: 12px;
      color: #666;
      
      div {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
}

:deep(.el-pagination) {
  justify-content: center;
  margin-top: 2rem;
}

.filter-section {
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.model-details {
  img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .stats {
    text-align: center;
    background: #f5f7fa;
    padding: 0.5rem;
    border-radius: 4px;
  }
  
  .creator {
    img {
      width: 32px;
      height: 32px;
    }
  }
  
  .tags {
    span {
      font-size: 12px;
    }
  }
}

.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;

  .el-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  .form-help {
    color: #909399;
    font-size: 12px;
    margin-top: 4px;
  }
}

// 下载页面样式
.downloads-page {
  .help-list {
    padding-left: 20px;
    margin: 10px 0;
    
    li {
      margin-bottom: 5px;
      color: #606266;
    }
  }
  
  .batch-input-container {
    position: relative;
    
    .batch-input-actions {
      position: absolute;
      right: 10px;
      bottom: 10px;
      display: flex;
      gap: 5px;
    }
  }
  
  .batch-input-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
  
  .batch-actions {
    display: flex;
    gap: 10px;
  }
  
  .queue-actions {
    display: flex;
    gap: 5px;
  }
  
  .queue-stats {
    .stat-card {
      background: #f5f7fa;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #909399;
      }
      
      &.waiting .stat-value {
        color: #409eff;
      }
      
      &.downloading .stat-value {
        color: #67c23a;
      }
      
      &.paused .stat-value {
        color: #e6a23c;
      }
      
      &.progress .stat-value {
        color: #909399;
      }
    }
  }
  
  .download-table-container {
    .progress-container {
      .progress-info {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-size: 12px;
        color: #909399;
        
        .progress-speed, .progress-time {
          display: inline-block;
        }
      }
    }
    
    .table-actions {
      display: flex;
      gap: 5px;
    }
  }
  
  // 表格行样式
  :deep(.el-table) {
    .waiting-row {
      background-color: #f5f7fa;
    }
    
    .downloading-row {
      background-color: #f0f9ff;
    }
    
    .paused-row {
      background-color: #fdf6ec;
    }
    
    .completed-row {
      background-color: #f0f9ff;
    }
    
    .cancelled-row {
      background-color: #fef0f0;
    }
  }
}
</style>
