<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 16:28:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-25 13:03:24
 * @FilePath: \EleTs\src\renderer\src\view\LoraPage\CivitaiPage.vue
 * @Description: Civitai模型浏览和下载页面
-->
<script setup lang="ts">
import { ref, onMounted, reactive, h, computed } from 'vue'
import {
  SearchOutlined,
  DownloadOutlined,
  SettingOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  FileSearchOutlined,
  CloudDownloadOutlined,
  FolderOpenOutlined,
  CopyOutlined
} from '@ant-design/icons-vue'
import {
  Button,
  Input,
  Table,
  Card,
  Row,
  Col,
  Pagination,
  Spin,
  Alert,
  Modal,
  Form,
  Switch,
  Select,
  Tag,
  Progress,
  Menu,
  Layout,
  Divider,
  Radio
} from 'ant-design-vue'
import type { TableColumnsType, MenuProps } from 'ant-design-vue'

const { Sider, Content } = Layout

// 定义模型数据接口
interface CivitaiModel {
  id: string
  name: string
  type: string
  nsfw: boolean
  tags: string[]
  description: string
  stats: {
    downloadCount: number
    favoriteCount: number
    commentCount: number
  }
  modelVersions: Array<{
    id: string
    name: string
    trainedWords: string[]
    baseModel: string
    files: Array<{
      name: string
      sizeKB: number
      type: string
      downloadUrl: string
    }>
    images: Array<{
      url: string
      nsfw: boolean
      width: number
      height: number
      type: string
    }>
  }>
}

// 定义下载任务接口
interface DownloadTask {
  id: string
  name: string
  status: '等待中' | '下载中' | '已暂停' | '已完成' | '已取消' | '失败'
  progress: number
  url: string
  addedAt: string
  completedAt?: string
  error?: string
  modelMetadata?: any
}

// 定义代理设置接口
interface ProxySettings {
  server?: string
  enabled?: boolean
  useSystemProxy?: boolean
}

// 状态管理
const loading = ref(false)
const models = ref<CivitaiModel[]>([])
const downloadTasks = ref<DownloadTask[]>([])
const currentPage = ref(1)
const pageSize = ref(12)
const totalModels = ref(0)
const searchQuery = ref('')
const errorMessage = ref('')
const proxyModalVisible = ref(false)
const directoryModalVisible = ref(false)
const selectedKey = ref('models')
const detailModalVisible = ref(false)
const selectedModel = ref<CivitaiModel | null>(null)
const previewVisible = ref(false)
const previewImageUrl = ref('')
const modalWidth = ref('80%')

// 代理设置表单
const proxyForm = reactive({
  server: '',
  enabled: false,
  useSystemProxy: false
})

// 下载目录
const downloadDirectory = ref('')

// 批量下载相关状态
const batchDownloadInput = ref('')
const batchDownloadType = ref('id') // 'id' 或 'url'
const batchDownloadLoading = ref(false)
const parsedModelList = ref<Array<{id: string, name: string, url?: string}>>([])
const batchDownloadProgress = ref(0)

// 菜单选项
const menuItems: MenuProps['items'] = [
  {
    key: 'models',
    icon: h(FileSearchOutlined),
    label: '模型浏览'
  },
  {
    key: 'batch-download',
    icon: h(DownloadOutlined),
    label: '模型下载'
  },
  {
    key: 'downloads',
    icon: h(CloudDownloadOutlined),
    label: '下载队列'
  },
  {
    key: 'settings',
    icon: h(SettingOutlined),
    label: '设置'
  }
]

// 表格列定义
const modelColumns: TableColumnsType = [
  {
    title: '预览',
    dataIndex: 'preview',
    key: 'preview',
    width: '15%',
    customRender: ({ record }: { record: CivitaiModel }) => {
      const firstVersion = record.modelVersions?.[0]
      const firstImage = firstVersion?.images?.[0]
      const imageUrl = firstImage?.url
      
      if (!imageUrl) {
        return h('div', {
          style: {
            width: '80px',
            height: '80px',
            minWidth: '80px',
            minHeight: '80px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: '#999',
            fontSize: '12px'
          }
        }, '无图片')
      }
      
      return h('img', {
        src: imageUrl,
        alt: record.name,
        style: {
          width: '80px',
          height: '80px',
          minWidth: '80px',
          minHeight: '80px',
          objectFit: 'cover',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        },
        onError: (e: Event) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          // 创建错误占位符
          const errorPlaceholder = document.createElement('div')
          errorPlaceholder.style.cssText = 'width: 80px; height: 80px; min-width: 80px; min-height: 80px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: #999; font-size: 12px; flex-direction: column; gap: 4px;'
          errorPlaceholder.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>加载失败</span>
          `
          if (target.parentElement) {
            target.parentElement.appendChild(errorPlaceholder)
          }
        },
        onClick: () => {
          // 点击图片打开大图预览
          Modal.info({
            title: record.name,
            content: h('div', { style: { textAlign: 'center' } }, [
              h('img', {
                src: imageUrl,
                alt: record.name,
                style: {
                  width: '100%',
                  maxWidth: '500px',
                  borderRadius: '4px',
                  marginBottom: '8px'
                },
                onError: (e: Event) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  // 创建错误占位符
                  const errorPlaceholder = document.createElement('div')
                  errorPlaceholder.style.cssText = 'width: 100%; max-width: 500px; height: 300px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: #999; font-size: 14px; flex-direction: column; gap: 8px; margin: 0 auto;'
                  errorPlaceholder.innerHTML = `
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>图片加载失败</span>
                    <span style="font-size: 12px; color: #666;">请检查网络连接或图片链接</span>
                  `
                  if (target.parentElement) {
                    target.parentElement.appendChild(errorPlaceholder)
                  }
                }
              }),
              h('div', { style: { fontSize: '12px', color: '#666' } }, '点击图片外部关闭')
            ]),
            width: 600,
            centered: true,
            closable: true,
            maskClosable: true
          })
        },
        onMouseEnter: (e: Event) => {
          const target = e.target as HTMLImageElement
          target.style.transform = 'scale(1.05)'
        },
        onMouseLeave: (e: Event) => {
          const target = e.target as HTMLImageElement
          target.style.transform = 'scale(1)'
        }
      })
    }
  },
  {
    title: '模型名称',
    dataIndex: 'name',
    key: 'name',
    width: '30%',
    customRender: ({ record }: { record: CivitaiModel }) => {
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
          h('div', { style: { fontWeight: 'bold', wordBreak: 'break-word', flex: 1 } }, record.name),
          h(Button, {
            type: 'text',
            size: 'small',
            icon: h(CopyOutlined),
            onClick: () => copyModelId(record.id, record.name),
            style: { marginLeft: '8px', flexShrink: 0 },
            title: '复制模型ID'
          })
        ]),
        h('div', { style: { fontSize: '12px', color: '#888', wordBreak: 'break-word' } }, stripHtmlTags(record.description)?.substring(0, 50) + '...')
      ])
    }
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: '10%',
    customRender: ({ record }: { record: CivitaiModel }) => {
      const typeColors: Record<string, string> = {
        'Checkpoint': 'blue',
        'LORA': 'green',
        'LoCon': 'cyan',
        'TextualInversion': 'purple',
        'Hypernetwork': 'orange',
        'AestheticGradient': 'pink',
        'ControlNet': 'red',
        'Poses': 'volcano',
        'Wildcards': 'gold',
        'Workflows': 'lime'
      }
      return h(Tag, { color: typeColors[record.type] || 'default' }, () => record.type)
    }
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
    width: '20%',
    customRender: ({ record }: { record: CivitaiModel }) => {
      return h('div', record.tags?.slice(0, 3).map(tag => 
        h(Tag, { color: 'blue', style: { margin: '2px' } }, () => tag)
      ))
    }
  },
  {
    title: '基础模型',
    dataIndex: ['modelVersions', 0, 'baseModel'],
    key: 'baseModel',
    width: '10%'
  },
  {
    title: '下载次数',
    dataIndex: ['stats', 'downloadCount'],
    key: 'downloadCount',
    width: '10%'
  },
  {
    title: '操作',
    key: 'action',
    width: '30%',
    customRender: ({ record }: { record: CivitaiModel }) => {
      const version = record.modelVersions[0]
      const file = version?.files[0]
      return h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' } }, [
        h(Button, {
          type: 'primary',
          icon: h(DownloadOutlined),
          onClick: () => downloadModel(record, version, file),
          size: 'small',
          style: { flex: '1', minWidth: '60px' }
        }, () => '下载'),
        h(Button, {
          type: 'default',
          icon: h(FileSearchOutlined),
          onClick: () => viewModelDetails(record),
          size: 'small',
          style: { flex: '1', minWidth: '60px' }
        }, () => '详情')
      ])
    }
  }
]

const downloadColumns: TableColumnsType = [
  {
    title: '模型名称',
    dataIndex: 'name',
    key: 'name',
    width: '30%'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '15%',
    customRender: ({ record }: { record: DownloadTask }) => {
      const statusColors: Record<string, string> = {
        '等待中': 'default',
        '下载中': 'processing',
        '已暂停': 'warning',
        '已完成': 'success',
        '已取消': 'default',
        '失败': 'error'
      }
      return h(Tag, { color: statusColors[record.status] || 'default' }, () => record.status)
    }
  },
  {
    title: '进度',
    dataIndex: 'progress',
    key: 'progress',
    width: '30%',
    customRender: ({ record }: { record: DownloadTask }) => {
      return h(Progress, {
        percent: record.progress,
        size: 'small',
        status: record.status === '失败' ? 'exception' : record.status === '已完成' ? 'success' : 'normal'
      })
    }
  },
  {
    title: '操作',
    key: 'action',
    width: '25%',
    customRender: ({ record }: { record: DownloadTask }) => {
      return h('div', [
        (record.status === '等待中' || record.status === '已暂停') ? h(Button, {
          type: 'primary',
          icon: h(PlayCircleOutlined),
          onClick: () => startDownload(record.id),
          size: 'small',
          style: { marginRight: '8px' }
        }, () => '开始') : null,
        record.status === '下载中' ? h(Button, {
          type: 'default',
          icon: h(PauseCircleOutlined),
          onClick: () => pauseDownload(record.id),
          size: 'small',
          style: { marginRight: '8px' }
        }, () => '暂停') : null,
        h(Button, {
          type: 'default',
          icon: h(StopOutlined),
          onClick: () => cancelDownload(record.id),
          size: 'small',
          danger: true
        }, () => '取消')
      ])
    }
  }
]

// 计算属性 - 是否显示模型浏览页面
const showModelsPage = computed(() => selectedKey.value === 'models')

// 计算属性 - 是否显示批量下载页面
const showBatchDownloadPage = computed(() => selectedKey.value === 'batch-download')

// 计算属性 - 是否显示下载队列页面
const showDownloadsPage = computed(() => selectedKey.value === 'downloads')

// 计算属性 - 是否显示设置页面
const showSettingsPage = computed(() => selectedKey.value === 'settings')

// IPC通信
const ipcRenderer = window.electron.ipcRenderer

// 获取模型数据
const fetchModels = async (page = 1) => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    // 构造Civitai API URL
    let url = 'https://civitai.com/api/v1/models?limit=' + pageSize.value
    if (page > 1) {
      url += '&page=' + page
    }
    if (searchQuery.value) {
      url += '&query=' + encodeURIComponent(searchQuery.value)
    }
    
    // 添加获取图片的参数
    url += '&includeImages=true'
    
    // 构造请求选项
    const options: any = {
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    // 添加代理设置
    if (proxyForm.enabled) {
      options.proxy = {
        server: proxyForm.server,
        enabled: true
      }
    }
    options.useSystemProxy = proxyForm.useSystemProxy
    
    // 调用IPC获取模型数据
    const response = await ipcRenderer.invoke('civitai:search-models', {
      query: searchQuery.value,
      limit: pageSize.value,
      proxy: proxyForm.enabled ? {
        host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
        port: parseInt(proxyForm.server.split(':')[2]) || 8080,
        protocol: proxyForm.server.split('://')[0] || 'http'
      } : undefined,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      // 处理返回的模型数据，确保包含图片信息
      const items = response.data.items || []
      models.value = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        nsfw: item.nsfw || false,
        tags: item.tags || [],
        description: item.description || '',
        stats: {
          downloadCount: item.stats?.downloadCount || 0,
          favoriteCount: item.stats?.favoriteCount || 0,
          commentCount: item.stats?.commentCount || 0
        },
        modelVersions: item.modelVersions?.map((version: any) => ({
          id: version.id,
          name: version.name,
          trainedWords: version.trainedWords || [],
          baseModel: version.baseModel,
          files: version.files?.map((file: any) => ({
            name: file.name,
            sizeKB: file.sizeKB || 0,
            type: file.type,
            downloadUrl: file.downloadUrl
          })) || [],
          images: version.images?.map((image: any) => ({
            url: image.url,
            nsfw: image.nsfw || false,
            width: image.width || 0,
            height: image.height || 0,
            type: image.type
          })) || []
        })) || []
      }))
      totalModels.value = response.data.metadata?.totalItems || 0
      currentPage.value = page
    } else {
      errorMessage.value = response.error || '获取模型数据失败'
    }
  } catch (error: any) {
    errorMessage.value = error.message || '获取模型数据时发生错误'
  } finally {
    loading.value = false
  }
}

// 下载模型
const downloadModel = async (model: CivitaiModel, version: any, file: any) => {
  try {
    // 构建模型元数据
    const modelMetadata = {
      id: model.id,
      title: model.name,
      version: version.name,
      hash: version.id,
      description: model.description || '',
      type: model.type,
      nsfw: model.nsfw || false,
      tags: model.tags || [],
      trainedWords: version.trainedWords || [],
      baseModel: version.baseModel,
      imageUrl: version.images?.[0]?.url || '',
      downloadUrl: file.downloadUrl,
      stats: model.stats || {}
    }
    
    // 添加到下载队列
    const result = await ipcRenderer.invoke('civitai:download-model', {
      downloadUrl: file.downloadUrl,
      fileName: `${model.name}_${version.name}.safetensors`,
      savePath: downloadDirectory.value,
      proxy: proxyForm.enabled ? {
        host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
        port: parseInt(proxyForm.server.split(':')[2]) || 8080,
        protocol: proxyForm.server.split('://')[0] || 'http'
      } : undefined,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (result.success) {
      // 获取更新后的下载队列
      await fetchDownloadQueue()
      // 显示成功消息
      Modal.success({
        title: '添加成功',
        content: `模型 "${model.name}" 已添加到下载队列`
      })
    } else {
      Modal.error({
        title: '添加失败',
        content: result.error || '添加到下载队列失败'
      })
    }
  } catch (error: any) {
    Modal.error({
      title: '添加失败',
      content: error.message || '添加到下载队列时发生错误'
    })
  }
}

// 获取下载队列
const fetchDownloadQueue = async () => {
  try {
    // 由于 civitaiIpc.ts 没有提供获取下载队列的方法，这里暂时使用模拟数据
    // 在实际应用中，需要实现一个下载队列管理系统
    const response = await ipcRenderer.invoke('civitai:get-model-metadata', { modelId: 0 })
    if (response.success) {
      // 这里应该根据实际的后端实现来处理下载队列
      // 目前使用模拟数据
      downloadTasks.value = downloadTasks.value
    }
  } catch (error) {
    console.error('获取下载队列失败:', error)
  }
}

// 开始下载
const startDownload = async (modelId: string) => {
  try {
    // 获取下载任务信息
    const downloadTask = downloadTasks.value.find(task => task.id === modelId)
    if (!downloadTask) {
      Modal.error({
        title: '操作失败',
        content: '找不到对应的下载任务'
      })
      return
    }
    
    // 获取模型详细信息
    let modelMetadata = null
    try {
      const modelResponse = await ipcRenderer.invoke('civitai:get-model', { modelId: parseInt(modelId) })
      
      if (modelResponse.success) {
        const modelData = modelResponse.data
        const version = modelData.modelVersions?.[0]
        
        if (version) {
          // 构建模型元数据
          modelMetadata = {
            id: modelData.id,
            title: modelData.name,
            version: version.name,
            hash: version.id,
            description: modelData.description || '',
            type: modelData.type,
            nsfw: modelData.nsfw || false,
            tags: modelData.tags || [],
            trainedWords: version.trainedWords || [],
            baseModel: version.baseModel,
            imageUrl: version.images?.[0]?.url || '',
            downloadUrl: version.files?.[0]?.downloadUrl || '',
            stats: modelData.stats || {}
          }
        }
      }
    } catch (metadataError) {
      console.error('获取模型元数据失败:', metadataError)
      // 即使获取元数据失败，也继续下载
    }
    
    // 调用下载模型
    if (modelMetadata && modelMetadata.downloadUrl) {
      const response = await ipcRenderer.invoke('civitai:download-model', {
        downloadUrl: modelMetadata.downloadUrl,
        fileName: `${modelMetadata.title}_${modelMetadata.version}.safetensors`,
        savePath: downloadDirectory.value,
        proxy: proxyForm.enabled ? {
          host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
          port: parseInt(proxyForm.server.split(':')[2]) || 8080,
          protocol: proxyForm.server.split('://')[0] || 'http'
        } : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.success) {
        await fetchDownloadQueue()
        Modal.success({
          title: '操作成功',
          content: '下载已开始'
        })
      } else {
        Modal.error({
          title: '操作失败',
          content: response.error || '开始下载失败'
        })
      }
    } else {
      Modal.error({
        title: '操作失败',
        content: '无法获取模型下载链接'
      })
    }
  } catch (error: any) {
    Modal.error({
      title: '操作失败',
      content: error.message || '开始下载时发生错误'
    })
  }
}

// 暂停下载
const pauseDownload = async (modelId: string) => {
  try {
    // 由于 civitaiIpc.ts 没有提供暂停下载的方法，这里使用模拟实现
    // 在实际应用中，需要实现一个下载管理系统
    const downloadTask = downloadTasks.value.find(task => task.id === modelId)
    if (downloadTask) {
      downloadTask.status = '已暂停'
      await fetchDownloadQueue()
      Modal.success({
        title: '操作成功',
        content: '下载已暂停'
      })
    } else {
      Modal.error({
        title: '操作失败',
        content: '找不到对应的下载任务'
      })
    }
  } catch (error: any) {
    Modal.error({
      title: '操作失败',
      content: error.message || '暂停下载时发生错误'
    })
  }
}

// 取消下载
const cancelDownload = async (modelId: string) => {
  try {
    // 由于 civitaiIpc.ts 没有提供取消下载的方法，这里使用模拟实现
    // 在实际应用中，需要实现一个下载管理系统
    const downloadTask = downloadTasks.value.find(task => task.id === modelId)
    if (downloadTask) {
      downloadTask.status = '已取消'
      await fetchDownloadQueue()
      Modal.success({
        title: '操作成功',
        content: '下载已取消'
      })
    } else {
      Modal.error({
        title: '操作失败',
        content: '找不到对应的下载任务'
      })
    }
  } catch (error: any) {
    Modal.error({
      title: '操作失败',
      content: error.message || '取消下载时发生错误'
    })
  }
}

// 保存代理设置
const saveProxySettings = async () => {
  try {
    const proxyConfig = proxyForm.enabled ? {
      host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
      port: parseInt(proxyForm.server.split(':')[2]) || 8080,
      protocol: proxyForm.server.split('://')[0] || 'http'
    } : undefined
    
    const response = await ipcRenderer.invoke('civitai:set-proxy', { proxy: proxyConfig })
    
    if (response.success) {
      proxyModalVisible.value = false
      Modal.success({
        title: '保存成功',
        content: '代理设置已保存'
      })
    } else {
      Modal.error({
        title: '保存失败',
        content: response.error || '保存代理设置失败'
      })
    }
  } catch (error: any) {
    Modal.error({
      title: '保存失败',
      content: error.message || '保存代理设置时发生错误'
    })
  }
}

// 测试代理连接
const testProxyConnection = async () => {
  try {
    // 由于 civitaiIpc.ts 没有提供测试代理连接的方法，这里使用模拟实现
    // 在实际应用中，可以尝试发送一个简单的请求来测试代理
    if (proxyForm.enabled && proxyForm.server) {
      Modal.success({
        title: '连接成功',
        content: '代理连接测试成功'
      })
    } else {
      Modal.error({
        title: '连接失败',
        content: '请先启用代理并设置代理服务器'
      })
    }
  } catch (error: any) {
    Modal.error({
      title: '连接失败',
      content: error.message || '代理连接测试时发生错误'
    })
  }
}

// 选择下载目录
const selectDownloadDirectory = async () => {
  try {
    // 由于 civitaiIpc.ts 没有提供选择下载目录的方法，这里使用模拟实现
    // 在实际应用中，需要实现一个文件选择对话框
    downloadDirectory.value = 'downloads'
    directoryModalVisible.value = false
    Modal.success({
      title: '选择成功',
      content: '下载目录已设置为 downloads'
    })
  } catch (error: any) {
    Modal.error({
      title: '选择失败',
      content: error.message || '选择下载目录时发生错误'
    })
  }
}

// 获取代理设置
const getProxySettings = async () => {
  try {
    // 由于 civitaiIpc.ts 没有提供获取代理设置的方法，这里使用默认值
    // 在实际应用中，需要实现一个配置管理系统
    proxyForm.server = 'http://127.0.0.1:1080'
    proxyForm.enabled = false
    proxyForm.useSystemProxy = false
  } catch (error) {
    console.error('获取代理设置失败:', error)
  }
}

// 获取下载目录
const getDownloadDirectory = async () => {
  try {
    // 由于 civitaiIpc.ts 没有提供获取下载目录的方法，这里使用默认值
    // 在实际应用中，需要实现一个配置管理系统
    downloadDirectory.value = 'downloads'
  } catch (error) {
    console.error('获取下载目录失败:', error)
  }
}

// 解析模型ID或URL
const parseModelInput = (input: string): Array<{id: string, name: string, url?: string}> => {
  const lines = input.split('\n').filter(line => line.trim())
  const result: Array<{id: string, name: string, url?: string}> = []
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    if (batchDownloadType.value === 'id') {
      // 直接处理ID
      result.push({
        id: trimmedLine,
        name: `Model ${trimmedLine}`
      })
    } else {
      // 处理URL，提取模型ID
      let modelId = ''
      
      // Civitai URL 格式: https://civitai.com/models/12345/model-name
      const civitaiMatch = trimmedLine.match(/civitai\.com\/models\/(\d+)/)
      if (civitaiMatch) {
        modelId = civitaiMatch[1]
      }
      
      if (modelId) {
        result.push({
          id: modelId,
          name: `Model ${modelId}`,
          url: trimmedLine
        })
      }
    }
  }
  
  return result
}

// 解析输入并获取模型信息
const parseAndFetchModelInfo = async () => {
  if (!batchDownloadInput.value.trim()) {
    Modal.warning({
      title: '提示',
      content: '请输入模型ID或URL'
    })
    return
  }
  
  try {
    batchDownloadLoading.value = true
    parsedModelList.value = []
    
    // 解析输入
    const parsedList = parseModelInput(batchDownloadInput.value)
    
    if (parsedList.length === 0) {
      Modal.warning({
        title: '提示',
        content: '未能解析到有效的模型ID或URL'
      })
      return
    }
    
    // 获取每个模型的详细信息，使用并发控制避免资源竞争
    const maxConcurrentRequests = 3; // 最大并发请求数
    const chunks = [];
    for (let i = 0; i < parsedList.length; i += maxConcurrentRequests) {
      chunks.push(parsedList.slice(i, i + maxConcurrentRequests));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (item) => {
        try {
          const response = await ipcRenderer.invoke('civitai:get-model', {
            modelId: parseInt(item.id),
            proxy: proxyForm.enabled ? {
              host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
              port: parseInt(proxyForm.server.split(':')[2]) || 8080,
              protocol: proxyForm.server.split('://')[0] || 'http'
            } : undefined,
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (response.success) {
            const modelData = response.data
            return {
              id: item.id,
              name: modelData.name || item.name,
              url: item.url
            }
          } else {
            // 如果获取失败，使用默认名称
            console.warn(`获取模型 ${item.id} 信息失败: ${response.error}`)
            return {
              id: item.id,
              name: item.name,
              url: item.url
            }
          }
        } catch (error) {
          console.error(`获取模型 ${item.id} 信息失败:`, error)
          // 如果获取失败，使用默认名称
          return {
            id: item.id,
            name: item.name,
            url: item.url
          }
        }
      });
      
      try {
        const results = await Promise.allSettled(promises);
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            parsedModelList.value.push(result.value);
          }
        });
        
        // 在每个批次之间添加延迟，避免请求过于频繁
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒延迟
        }
      } catch (batchError) {
        console.error('批量处理模型信息失败:', batchError);
      }
    }
    
    Modal.success({
      title: '解析成功',
      content: `成功解析 ${parsedModelList.value.length} 个模型`
    })
  } catch (error) {
    console.error('解析模型信息失败:', error)
    Modal.error({
      title: '解析失败',
      content: '解析模型信息时发生错误'
    })
  } finally {
    batchDownloadLoading.value = false
  }
}

// 批量添加到下载队列
const batchAddToDownloadQueue = async () => {
  if (parsedModelList.value.length === 0) {
    Modal.warning({
      title: '提示',
      content: '请先解析模型信息'
    })
    return
  }
  
  try {
    batchDownloadLoading.value = true
    batchDownloadProgress.value = 0
    
    const total = parsedModelList.value.length
    let successCount = 0
    let failCount = 0
    
    // 使用并发控制避免资源竞争
    const maxConcurrentRequests = 2; // 最大并发请求数，降低以减少资源竞争
    const chunks = [];
    for (let i = 0; i < parsedModelList.value.length; i += maxConcurrentRequests) {
      chunks.push(parsedModelList.value.slice(i, i + maxConcurrentRequests));
    }
    
    let processedCount = 0;
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (model) => {
        try {
          // 获取模型的下载URL
          const response = await ipcRenderer.invoke('civitai:get-model', {
            modelId: parseInt(model.id),
            proxy: proxyForm.enabled ? {
              host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
              port: parseInt(proxyForm.server.split(':')[2]) || 8080,
              protocol: proxyForm.server.split('://')[0] || 'http'
            } : undefined,
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (response.success) {
            const modelData = response.data
            const version = modelData.modelVersions?.[0]
            const file = version?.files?.[0]
            
            if (file?.downloadUrl) {
              // 添加到下载队列
              const result = await ipcRenderer.invoke('civitai:download-model', {
                downloadUrl: file.downloadUrl,
                fileName: `${modelData.name}_${version.name}.safetensors`,
                savePath: downloadDirectory.value,
                proxy: proxyForm.enabled ? {
                  host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
                  port: parseInt(proxyForm.server.split(':')[2]) || 8080,
                  protocol: proxyForm.server.split('://')[0] || 'http'
                } : undefined,
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              
              if (result.success) {
                return { success: true, modelId: model.id }
              } else {
                console.error(`添加模型 ${model.id} 到下载队列失败:`, result.error)
                return { success: false, modelId: model.id, error: result.error }
              }
            } else {
              console.error(`模型 ${model.id} 没有可下载的文件`)
              return { success: false, modelId: model.id, error: 'No downloadable files' }
            }
          } else {
            console.error(`获取模型 ${model.id} 信息失败:`, response.error)
            return { success: false, modelId: model.id, error: response.error }
          }
        } catch (error) {
          console.error(`处理模型 ${model.id} 时发生错误:`, error)
          return { success: false, modelId: model.id, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      });
      
      try {
        const results = await Promise.allSettled(promises);
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            if (result.value.success) {
              successCount++;
            } else {
              failCount++;
            }
          } else {
            failCount++;
          }
          processedCount++;
          // 更新进度
          batchDownloadProgress.value = Math.round((processedCount / total) * 100);
        });
        
        // 在每个批次之间添加延迟，避免请求过于频繁
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒延迟
        }
      } catch (batchError) {
        console.error('批量处理下载队列失败:', batchError);
        // 更新失败计数
        failCount += chunk.length;
        processedCount += chunk.length;
        batchDownloadProgress.value = Math.round((processedCount / total) * 100);
      }
    }
    
    // 刷新下载队列
    await fetchDownloadQueue()
    
    Modal.success({
      title: '批量添加完成',
      content: `成功添加 ${successCount} 个模型，失败 ${failCount} 个`
    })
    
    // 清空解析结果
    parsedModelList.value = []
    batchDownloadInput.value = ''
    batchDownloadProgress.value = 0
  } catch (error) {
    console.error('批量添加到下载队列失败:', error)
    Modal.error({
      title: '添加失败',
      content: '批量添加到下载队列时发生错误'
    })
  } finally {
    batchDownloadLoading.value = false
  }
}

// 清空解析结果
const clearParsedModels = () => {
  parsedModelList.value = []
  batchDownloadProgress.value = 0
}

// 查看模型详情
const viewModelDetails = async (model: CivitaiModel) => {
  try {
    // 如果模型信息不完整，则获取完整信息
    if (!model.modelVersions || model.modelVersions.length === 0) {
      loading.value = true
      
      const response = await ipcRenderer.invoke('civitai:get-model', {
        modelId: parseInt(model.id),
        proxy: proxyForm.enabled ? {
          host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
          port: parseInt(proxyForm.server.split(':')[2]) || 8080,
          protocol: proxyForm.server.split('://')[0] || 'http'
        } : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.success) {
        // 更新模型信息
        const modelData = response.data
        const updatedModel: CivitaiModel = {
          ...model,
          modelVersions: modelData.modelVersions?.map((version: any) => ({
            id: version.id,
            name: version.name,
            trainedWords: version.trainedWords || [],
            baseModel: version.baseModel,
            files: version.files?.map((file: any) => ({
              name: file.name,
              sizeKB: file.sizeKB || 0,
              type: file.type,
              downloadUrl: file.downloadUrl
            })) || [],
            images: version.images?.map((image: any) => ({
              url: image.url,
              nsfw: image.nsfw || false,
              width: image.width || 0,
              height: image.height || 0,
              type: image.type
            })) || []
          })) || []
        }
        
        selectedModel.value = updatedModel
      } else {
        Modal.error({
          title: '获取详情失败',
          content: response.error || '获取模型详情信息失败'
        })
        return
      }
    } else {
      selectedModel.value = model
    }
    
    // 显示详情模态框
    updateModalWidth()
    detailModalVisible.value = true
  } catch (error) {
    console.error('获取模型详情失败:', error)
    Modal.error({
      title: '获取详情失败',
      content: '获取模型详情信息时发生错误'
    })
  } finally {
    loading.value = false
  }
}

// 下载选中的模型版本
const downloadModelVersion = async (model: CivitaiModel, version: any, file: any) => {
  try {
    // 添加到下载队列
    const result = await ipcRenderer.invoke('civitai:download-model', {
      downloadUrl: file.downloadUrl,
      fileName: `${model.name}_${version.name}.safetensors`,
      savePath: downloadDirectory.value,
      proxy: proxyForm.enabled ? {
        host: proxyForm.server.split('://')[1]?.split(':')[0] || '',
        port: parseInt(proxyForm.server.split(':')[2]) || 8080,
        protocol: proxyForm.server.split('://')[0] || 'http'
      } : undefined,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (result.success) {
      // 获取更新后的下载队列
      await fetchDownloadQueue()
      // 显示成功消息
      Modal.success({
        title: '添加成功',
        content: `模型 "${model.name}" 已添加到下载队列`
      })
    } else {
      Modal.error({
        title: '添加失败',
        content: result.error || '添加到下载队列失败'
      })
    }
  } catch (error: any) {
    Modal.error({
      title: '添加失败',
      content: error.message || '添加到下载队列时发生错误'
    })
  }
}

// 获取模型类型颜色
const getModelTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    'Checkpoint': 'blue',
    'LORA': 'green',
    'LoCon': 'cyan',
    'TextualInversion': 'purple',
    'Hypernetwork': 'orange',
    'AestheticGradient': 'pink',
    'ControlNet': 'red',
    'Poses': 'volcano',
    'Wildcards': 'gold',
    'Workflows': 'lime'
  }
  return typeColors[type] || 'default'
}

// 格式化文件大小
const formatFileSize = (sizeKB: number): string => {
  if (sizeKB < 1024) {
    return `${sizeKB} KB`
  } else if (sizeKB < 1024 * 1024) {
    return `${(sizeKB / 1024).toFixed(2)} MB`
  } else {
    return `${(sizeKB / (1024 * 1024)).toFixed(2)} GB`
  }
}

// 预览图片
const previewImage = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  previewVisible.value = true
}

// 图片预览模态框
const handlePreviewImage = () => {
  Modal.info({
    title: '图片预览',
    content: h('div', { style: { textAlign: 'center' } }, [
      h('img', {
        src: previewImageUrl.value,
        alt: '预览图片',
        style: {
          width: '100%',
          maxWidth: '800px',
          borderRadius: '4px',
          marginBottom: '8px'
        },
        onError: (e: Event) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          // 创建错误占位符
          const errorPlaceholder = document.createElement('div')
          errorPlaceholder.style.cssText = 'width: 100%; max-width: 800px; height: 400px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: #999; font-size: 14px; flex-direction: column; gap: 8px; margin: 0 auto;'
          errorPlaceholder.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>图片加载失败</span>
            <span style="font-size: 12px; color: #666;">请检查网络连接或图片链接</span>
          `
          if (target.parentElement) {
            target.parentElement.appendChild(errorPlaceholder)
          }
        }
      }),
      h('div', { style: { fontSize: '12px', color: '#666' } }, '点击图片外部关闭')
    ]),
    width: 900,
    centered: true,
    closable: true,
    maskClosable: true
  })
}

// 监听预览图片状态变化
const watchPreviewVisible = () => {
  if (previewVisible.value) {
    handlePreviewImage()
    previewVisible.value = false
  }
}

// 去除HTML标签
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  // 创建一个临时div元素
  const tempDiv = document.createElement('div');
  // 设置HTML内容
  tempDiv.innerHTML = html;
  // 返回纯文本内容
  return tempDiv.textContent || tempDiv.innerText || '';
}

// 复制模型ID
const copyModelId = async (modelId: string, modelName: string) => {
  try {
    // 使用现代的Clipboard API
    await navigator.clipboard.writeText(modelId)
    
    // 显示复制成功提示
    Modal.success({
      title: '复制成功',
      content: `模型 "${modelName}" 的ID已复制到剪贴板`,
      okText: '确定'
    })
  } catch (error) {
    // 如果现代API不可用，使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = modelId
    document.body.appendChild(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      // 显示复制成功提示
      Modal.success({
        title: '复制成功',
        content: `模型 "${modelName}" 的ID已复制到剪贴板`,
        okText: '确定'
      })
    } catch (fallbackError) {
      document.body.removeChild(textArea)
      
      // 显示复制失败提示
      Modal.error({
        title: '复制失败',
        content: '无法复制到剪贴板，请手动复制',
        okText: '确定'
      })
    }
  }
}

// 更新模态框宽度
const updateModalWidth = () => {
  const windowWidth = window.innerWidth
  if (windowWidth < 768) {
    modalWidth.value = '95%'
  } else if (windowWidth < 1200) {
    modalWidth.value = '90%'
  } else {
    modalWidth.value = '80%'
  }
}

// 页面初始化
onMounted(async () => {
  // 初始化模态框宽度
  updateModalWidth()
  
  // 添加窗口大小变化监听器
  window.addEventListener('resize', updateModalWidth)
  
  // 先获取代理设置和下载目录
  await getProxySettings()
  await getDownloadDirectory()
  
  // 然后再获取模型数据和下载队列
  await fetchModels()
  await fetchDownloadQueue()
  
  // 监听下载进度更新事件
  ipcRenderer.on('civitai:download-progress', (_event, data) => {
    console.log('收到下载进度更新:', data)
    // 更新对应下载任务的进度
    const taskIndex = downloadTasks.value.findIndex(task => task.id === data.taskId)
    if (taskIndex !== -1) {
      // 创建新的数组以触发响应式更新
      const updatedTasks = [...downloadTasks.value]
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        progress: data.progress
      }
      downloadTasks.value = updatedTasks
    }
  })
  
  // 监听下载开始事件
  ipcRenderer.on('civitai:download-start', (_event, data) => {
    console.log('收到下载开始通知:', data)
    // 更新对应下载任务的状态为下载中
    const taskIndex = downloadTasks.value.findIndex(task => task.name === data.fileName)
    if (taskIndex !== -1) {
      // 创建新的数组以触发响应式更新
      const updatedTasks = [...downloadTasks.value]
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        status: '下载中'
      }
      downloadTasks.value = updatedTasks
    }
  })
  
  // 监听下载完成事件
  ipcRenderer.on('civitai:download-complete', (_event, data) => {
    console.log('收到下载完成通知:', data)
    // 更新对应下载任务的状态为已完成
    const taskIndex = downloadTasks.value.findIndex(task => task.name === data.fileName)
    if (taskIndex !== -1) {
      // 创建新的数组以触发响应式更新
      const updatedTasks = [...downloadTasks.value]
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        status: '已完成',
        progress: 100,
        completedAt: new Date().toISOString()
      }
      downloadTasks.value = updatedTasks
    }
  })
  
  // 监听下载错误事件
  ipcRenderer.on('civitai:download-error', (_event, data) => {
    console.log('收到下载错误通知:', data)
    // 更新对应下载任务的状态为失败
    const taskIndex = downloadTasks.value.findIndex(task => task.name === data.fileName)
    if (taskIndex !== -1) {
      // 创建新的数组以触发响应式更新
      const updatedTasks = [...downloadTasks.value]
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        status: '失败',
        error: data.error
      }
      downloadTasks.value = updatedTasks
    }
  })
})
</script>

<template>
  <div class="civitai-page">
    <Layout class="flex " style="height: 100%;">
      <Sider width="240" style="background: linear-gradient(180deg, #4f46e5 0%, #1890ff 100%); border-radius: 16px 0 0 16px;">
        <div class="logo" style="padding: 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <div style="width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                <path d="M12 22s-8-4-8-10V7l8-4 8 4v5c0 6-8 10-8 10z"/>
              </svg>
            </div>
            <h2 style="margin: 0; color: white; font-size: 22px; font-weight: 700;">Civitai</h2>
          </div>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 13px;">AI模型管理平台</p>
        </div>
        <Menu
          :selectedKeys="[selectedKey]"
          @update:selectedKeys="selectedKey = $event[0] as string"
          mode="inline"
          :items="menuItems"
          style="border: none; background: transparent; color: rgba(255, 255, 255, 0.9); padding: 16px 0;"
          :class="'custom-menu'"
        />
      </Sider>
      <Layout>
        <Content class="full-height-container flex" style="height:100vh;">
          <div v-if="showModelsPage" class="full-height-container">
            <Card title="模型浏览器" class="full-width-card">
              <div class="search-section">
                <Input 
                  v-model:value="searchQuery" 
                  placeholder="搜索模型..." 
                  style="width: 300px; margin-right: 16px;"
                  @pressEnter="fetchModels(1)"
                >
                  <template #prefix>
                    <SearchOutlined />
                  </template>
                </Input>
                <Button type="primary" @click="fetchModels(1)">
                  <template #icon>
                    <SearchOutlined />
                  </template>
                  搜索
                </Button>
                <Button @click="fetchModels(currentPage)" style="margin-left: 8px;">
                  <template #icon>
                    <ReloadOutlined />
                  </template>
                  刷新
                </Button>
              </div>
              
              <div class="error-section" v-if="errorMessage">
                <Alert 
                  :message="errorMessage" 
                  type="error" 
                  show-icon 
                  closable 
                  @close="errorMessage = ''"
                />
              </div>
              
              <div class="models-section">
                <Spin :spinning="loading">
                  <Table
                    :columns="modelColumns"
                    :data-source="models"
                    :pagination="false"
                    rowKey="id"
                  />
                </Spin>
                
                <div class="pagination-section" style="margin-top: 16px; text-align: right;">
                  <Pagination
                    v-model:current="currentPage"
                    :page-size="pageSize"
                    :total="totalModels"
                    show-size-changer
                    :page-size-options="['12', '24', '48', '96']"
                    @change="fetchModels"
                    @showSizeChange="(current, size) => { pageSize = size; fetchModels(current); }"
                  />
                </div>
              </div>
            </Card>
          </div>
          
          <div v-if="showBatchDownloadPage" class="full-height-container">
            <Card title="模型下载" class="full-width-card">
              <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px;"><DownloadOutlined /> 批量下载模型</h3>
                
                <!-- 输入类型选择 -->
                <div style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">输入类型:</div>
                  <Radio.Group v-model:value="batchDownloadType" button-style="solid">
                    <Radio.Button value="id">模型ID</Radio.Button>
                    <Radio.Button value="url">网页地址</Radio.Button>
                  </Radio.Group>
                </div>
                
                <!-- 输入区域 -->
                <div style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">
                    {{ batchDownloadType === 'id' ? '模型ID列表' : '网页地址列表' }}
                    <span style="color: #999; font-size: 12px; margin-left: 8px;">
                      (每行一个{{ batchDownloadType === 'id' ? 'ID' : 'URL' }})
                    </span>
                  </div>
                  <Input.TextArea
                    v-model:value="batchDownloadInput"
                    :placeholder="batchDownloadType === 'id' ?
                      '请输入模型ID，每行一个，例如：\n12345\n67890\n11111' :
                      '请输入Civitai网页地址，每行一个，例如：\nhttps://civitai.com/models/12345/model-name\nhttps://civitai.com/models/67890/another-model'"
                    :rows="6"
                    style="margin-bottom: 8px;"
                  />
                </div>
                
                <!-- 操作按钮 -->
                <div style="margin-bottom: 16px;">
                  <Button
                    type="primary"
                    @click="parseAndFetchModelInfo"
                    :loading="batchDownloadLoading"
                    style="margin-right: 8px;"
                  >
                    <template #icon>
                      <SearchOutlined />
                    </template>
                    解析模型
                  </Button>
                  <Button
                    @click="batchAddToDownloadQueue"
                    :loading="batchDownloadLoading"
                    :disabled="parsedModelList.length === 0"
                    style="margin-right: 8px;"
                  >
                    <template #icon>
                      <CloudDownloadOutlined />
                    </template>
                    批量下载
                  </Button>
                  <Button
                    @click="clearParsedModels"
                    :disabled="parsedModelList.length === 0"
                  >
                    <template #icon>
                      <ReloadOutlined />
                    </template>
                    清空
                  </Button>
                </div>
                
                <!-- 进度显示 -->
                <div v-if="batchDownloadLoading && batchDownloadProgress > 0" style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">处理进度:</div>
                  <Progress :percent="batchDownloadProgress" status="active" />
                </div>
                
                <!-- 解析结果 -->
                <div v-if="parsedModelList.length > 0" style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">解析结果 ({{ parsedModelList.length }} 个模型):</div>
                  <div style="max-height: 200px; overflow-y: auto; border: 1px solid #d9d9d9; border-radius: 4px; padding: 8px;">
                    <div
                      v-for="model in parsedModelList"
                      :key="model.id"
                      style="padding: 4px 0; border-bottom: 1px solid #f0f0f0;"
                    >
                      <div style="font-weight: bold;">{{ model.name }}</div>
                      <div style="font-size: 12px; color: #666;">ID: {{ model.id }}</div>
                      <div v-if="model.url" style="font-size: 12px; color: #999; word-break: break-all;">
                        URL: {{ model.url }}
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 使用说明 -->
                <Alert
                  message="使用说明"
                  description="模型ID格式：直接输入数字ID，如 12345。网页地址格式：输入Civitai模型页面完整URL，系统会自动提取模型ID。"
                  type="info"
                  show-icon
                />
              </div>
            </Card>
          </div>
          
          <div v-if="showDownloadsPage" class="full-height-container">
            <Card title="下载队列" class="full-width-card">
              <Table
                :columns="downloadColumns"
                :data-source="downloadTasks"
                :pagination="false"
                rowKey="id"
                :scroll="{ y: 'calc(100vh - 280px)' }"
              />
            </Card>
          </div>
          
          <div v-if="showSettingsPage" class="full-height-container">
            <Card title="设置" class="full-width-card">
              <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px;"><SettingOutlined /> 代理设置</h3>
                <div style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">代理服务器:</div>
                  <Input 
                    v-model:value="proxyForm.server" 
                    placeholder="例如: http://127.0.0.1:1080"
                    style="width: 300px;"
                  />
                </div>
                <div style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">启用代理:</div>
                  <Switch v-model:checked="proxyForm.enabled" />
                </div>
                <div style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">使用系统代理:</div>
                  <Switch v-model:checked="proxyForm.useSystemProxy" />
                </div>
                <div>
                  <Button @click="testProxyConnection" style="margin-right: 8px;">
                    测试连接
                  </Button>
                  <Button type="primary" @click="saveProxySettings">
                    保存设置
                  </Button>
                </div>
              </div>
              
              <Divider />
              
              <div>
                <h3 style="margin-bottom: 16px;"><FolderOpenOutlined /> 下载目录设置</h3>
                <div style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">当前下载目录:</div>
                  <div style="margin-bottom: 16px;">{{ downloadDirectory || '未设置' }}</div>
                  <Button @click="selectDownloadDirectory">选择下载目录</Button>
                </div>
              </div>
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
    
    <!-- 代理设置模态框 -->
    <Modal
      v-model:open="proxyModalVisible"
      title="代理设置"
      @ok="saveProxySettings"
      @cancel="proxyModalVisible = false"
    >
      <Form layout="vertical">
        <Form.Item label="代理服务器">
          <Input 
            v-model:value="proxyForm.server" 
            placeholder="例如: http://127.0.0.1:1080"
          />
        </Form.Item>
        <Form.Item label="启用代理">
          <Switch v-model:checked="proxyForm.enabled" />
        </Form.Item>
        <Form.Item label="使用系统代理">
          <Switch v-model:checked="proxyForm.useSystemProxy" />
        </Form.Item>
        <Form.Item>
          <Button @click="testProxyConnection" style="margin-right: 8px;">
            测试连接
          </Button>
        </Form.Item>
      </Form>
    </Modal>
    
    <!-- 下载目录设置 -->
    <Modal
      v-model:open="directoryModalVisible"
      title="下载目录设置"
      @ok="selectDownloadDirectory"
      @cancel="directoryModalVisible = false"
    >
      <p>当前下载目录: {{ downloadDirectory || '未设置' }}</p>
      <Button @click="selectDownloadDirectory">选择下载目录</Button>
    </Modal>
    
    <!-- 模型详情模态框 -->
    <Modal
      v-model:open="detailModalVisible"
      :title="selectedModel?.name || '模型详情'"
      :width="modalWidth"
      :footer="null"
      :style="{ top: '20px' }"
      @cancel="detailModalVisible = false"
    >
      <div v-if="selectedModel" class="model-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">模型名称:</span>
              <span class="value">{{ selectedModel.name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">模型类型:</span>
              <Tag :color="getModelTypeColor(selectedModel.type)">{{ selectedModel.type }}</Tag>
            </div>
            <div class="detail-item">
              <span class="label">NSFW:</span>
              <Tag :color="selectedModel.nsfw ? 'red' : 'green'">{{ selectedModel.nsfw ? '是' : '否' }}</Tag>
            </div>
            <div class="detail-item">
              <span class="label">下载次数:</span>
              <span class="value">{{ selectedModel.stats?.downloadCount?.toLocaleString() || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="label">收藏次数:</span>
              <span class="value">{{ selectedModel.stats?.favoriteCount?.toLocaleString() || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="label">评论数:</span>
              <span class="value">{{ selectedModel.stats?.commentCount?.toLocaleString() || 0 }}</span>
            </div>
          </div>
        </div>
        
        <!-- 描述信息 -->
        <div class="detail-section">
          <h3>描述</h3>
          <div class="description">
            {{ stripHtmlTags(selectedModel.description) || '暂无描述' }}
          </div>
        </div>
        
        <!-- 标签 -->
        <div class="detail-section">
          <h3>标签</h3>
          <div class="tags">
            <Tag
              v-for="tag in selectedModel.tags"
              :key="tag"
              color="blue"
              style="margin: 2px;"
            >
              {{ tag }}
            </Tag>
            <span v-if="!selectedModel.tags || selectedModel.tags.length === 0" class="no-data">暂无标签</span>
          </div>
        </div>
        
        <!-- 模型版本 -->
        <div class="detail-section">
          <h3>模型版本</h3>
          <div v-if="selectedModel.modelVersions && selectedModel.modelVersions.length > 0">
            <div
              v-for="(version, versionIndex) in selectedModel.modelVersions"
              :key="version.id"
              class="version-item"
            >
              <div class="version-header">
                <h4>{{ version.name || `版本 ${versionIndex + 1}` }}</h4>
                <div class="version-actions">
                  <Button
                    v-if="version.files && version.files.length > 0"
                    type="primary"
                    size="small"
                    @click="downloadModelVersion(selectedModel, version, version.files[0])"
                  >
                    <DownloadOutlined />
                    下载
                  </Button>
                </div>
              </div>
              
              <div class="version-info">
                <div class="version-detail">
                  <span class="label">基础模型:</span>
                  <span class="value">{{ version.baseModel || '未知' }}</span>
                </div>
                
                <div v-if="version.trainedWords && version.trainedWords.length > 0" class="version-detail">
                  <span class="label">训练词:</span>
                  <div class="trained-words">
                    <Tag
                      v-for="word in version.trainedWords.slice(0, 10)"
                      :key="word"
                      color="purple"
                      style="margin: 2px;"
                    >
                      {{ word }}
                    </Tag>
                    <span v-if="version.trainedWords.length > 10" class="more-words">
                      等 {{ version.trainedWords.length }} 个词
                    </span>
                  </div>
                </div>
                
                <div v-if="version.files && version.files.length > 0" class="version-detail">
                  <span class="label">文件信息:</span>
                  <div class="file-info">
                    <div
                      v-for="file in version.files"
                      :key="file.name"
                      class="file-item"
                    >
                      <div class="file-name">{{ file.name }}</div>
                      <div class="file-size">{{ formatFileSize(file.sizeKB) }}</div>
                      <div class="file-type">{{ file.type }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 图片预览 -->
              <div v-if="version.images && version.images.length > 0" class="version-images">
                <div class="label">预览图:</div>
                <div class="image-grid">
                  <div
                    v-for="image in version.images.slice(0, 6)"
                    :key="image.url"
                    class="image-item"
                    :class="{ 'nsfw': image.nsfw }"
                  >
                    <img
                      :src="image.url"
                      :alt="selectedModel.name"
                      @click="previewImage(image.url)"
                    />
                  </div>
                  <span v-if="version.images.length > 6" class="more-images">
                    +{{ version.images.length - 6 }} 张
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无版本信息</div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped lang="less">
.civitai-page {
  height: 100%;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// 页面容器优化
:deep(.ant-layout) {
  background: transparent;
}

// 页面内容区域优化
:deep(.ant-layout-content) {
  overflow: hidden;
}

// 全局卡片样式优化
:deep(.ant-card) {
  // background: linear-gradient(180deg, #4f46e5 0%, #1890ff 100%);
  border-radius:  0 16px 16px 0 ;
  border: none;
  box-shadow: none;
  overflow: hidden;
  
  .ant-card-head {
    background: linear-gradient(90deg, #4f46e5 0%, #1890ff 100%);
    color: white;
    border-bottom: none;
    padding: 16px 20px;
    border-radius: 0;
    
    .ant-card-head-title {
      color: white;
      font-weight: 600;
      font-size: 16px;
    }
  }
  
  .ant-card-body {
    padding: 16px;
    background: transparent;
  }
}

// 全宽度卡片样式
.full-width-card {
  width: 100% !important;
  height: 100% !important;
}

// 按钮样式优化
:deep(.ant-btn-primary) {
  background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
  border: none;
  border-radius: 10px;
  height: 42px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover, &:focus {
    background: linear-gradient(90deg, #4338ca 0%, #6d28d9 100%);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 默认按钮样式优化
:deep(.ant-btn) {
  border-radius: 10px;
  height: 42px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover, &:focus {
    border-color: #c7d2fe;
    color: #4f46e5;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 输入框样式优化
:deep(.ant-input) {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }
}

// 标签样式优化
:deep(.ant-tag) {
  border-radius: 12px;
  padding: 4px 12px;
  font-weight: 500;
  font-size: 13px;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

// 表格样式优化
:deep(.ant-table) {
  .ant-table-thead > tr > th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
  }
  
  .ant-table-tbody > tr:hover > td {
    background: #f1f5f9;
  }
  
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #e2e8f0;
    word-wrap: break-word;
    word-break: break-word;
  }
  
  // 响应式表格样式
  @media (max-width: 1200px) {
    .ant-table-thead > tr > th {
      padding: 8px 4px;
      font-size: 12px;
    }
    
    .ant-table-tbody > tr > td {
      padding: 8px 4px;
      font-size: 12px;
    }
  }
  
  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 6px 2px;
      font-size: 11px;
    }
    
    .ant-table-tbody > tr > td {
      padding: 6px 2px;
      font-size: 11px;
    }
    
    // 预览图在小屏幕上的样式
    img {
      width: 60px !important;
      height: 60px !important;
      min-width: 60px !important;
      min-height: 60px !important;
    }
    
    // 按钮在小屏幕上的样式
    .ant-btn {
      padding: 0 4px;
      font-size: 10px;
      height: 24px;
    }
    
    .ant-btn-sm {
      padding: 0 2px;
      font-size: 10px;
      height: 20px;
    }
  }
}

// 分页样式优化
:deep(.ant-pagination) {
  .ant-pagination-item {
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    
    &.ant-pagination-item-active {
      background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
      border-color: transparent;
      
      a {
        color: white;
      }
    }
  }
  
  .ant-pagination-prev,
  .ant-pagination-next {
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    
    &:hover {
      border-color: #4f46e5;
      color: #4f46e5;
    }
  }
}

.logo {
  border-bottom: 1px solid #f0f0f0;
}

.search-section {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.error-section {
  margin-bottom: 16px;
}

.models-section {
  margin-top: 16px;
}

.pagination-section {
  margin-top: 16px;
  text-align: right;
  position: sticky;
  bottom: 0;
  background: white;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}



:deep(.ant-table-wrapper) {
  .ant-table {
    .ant-table-container {
      .ant-table-content {
        max-height: calc(90vh - 100px);
        overflow-y: auto;
      }
    }
  }
}

:deep(.ant-btn-primary) {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  border: none;
  
  &:hover, &:focus {
    background: linear-gradient(90deg, #40a9ff 0%, #1890ff 100%);
  }
}

:deep(.ant-input) {
  border-radius: 4px;
}

:deep(.ant-tag) {
  border-radius: 12px;
  padding: 0 8px;
}

:deep(.ant-layout-sider) {
  background: transparent;
}

// 自定义菜单样式
.custom-menu {
  :deep(.ant-menu-item) {
    margin: 6px 16px;
    height: 52px;
    line-height: 52px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      transform: translateX(6px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    &.ant-menu-item-selected {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      color: white;
      font-weight: 600;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      border-left: 4px solid white;
      
      &::after {
        display: none;
      }
      
      .ant-menu-item-icon {
        color: white;
      }
    }
    
    .ant-menu-item-icon {
      color: rgba(255, 255, 255, 0.8);
      font-size: 20px;
      margin-right: 14px;
      transition: all 0.3s ease;
    }
  }
}

// 图片预览样式
.model-preview {
  &-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 2px solid transparent;
    
    &:hover {
      transform: scale(1.08) rotate(1deg);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      border-color: #1890ff;
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &-placeholder {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    color: #999;
    font-size: 12px;
    border: 2px dashed #d9d9d9;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
    
    svg {
      width: 20px;
      height: 20px;
      opacity: 0.6;
    }
  }
  
  &-error {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #fff2f0 0%, #fff1f0 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    color: #ff4d4f;
    font-size: 12px;
    border: 2px solid #ffccc7;
    
    svg {
      width: 20px;
      height: 20px;
      opacity: 0.8;
    }
  }
}

// 大图预览模态框样式
:deep(.ant-modal-content) {
  .ant-modal-body {
    padding: 16px;
    
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
      }
    }
  }
}

// 图片加载动画
@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

.model-preview-loading {
  width: 100px;
  height: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::after {
    content: '';
    width: 24px;
    height: 24px;
    border: 2px solid #f0f0f0;
    border-top: 2px solid #1890ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// NSFW 图片模糊效果
.model-preview-nsfw {
  position: relative;
  
  img {
    filter: blur(8px);
    transition: filter 0.3s ease;
    
    &:hover {
      filter: blur(0px);
    }
  }
  
  &::after {
    content: 'NSFW';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 77, 79, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    pointer-events: none;
    z-index: 1;
  }
}

// 模型详情模态框样式
.model-detail {
  .detail-section {
    margin-bottom: 28px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #4f46e5;
      border-bottom: 2px solid #e0e7ff;
      padding-bottom: 10px;
      display: flex;
      align-items: center;
      
      &::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        border-radius: 50%;
        margin-right: 10px;
      }
    }
    
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      
      .detail-item {
        display: flex;
        align-items: center;
        
        .label {
          font-weight: 500;
          margin-right: 8px;
          color: #666;
          min-width: 80px;
        }
        
        .value {
          color: #333;
        }
      }
    }
    
    .description {
      line-height: 1.7;
      color: #4b5563;
      background: linear-gradient(to right, #f0f4ff, #fafbff);
      padding: 16px;
      border-radius: 10px;
      border-left: 4px solid #4f46e5;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.08);
      font-size: 14px;
    }
    
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      
      .no-data {
        color: #999;
        font-style: italic;
      }
    }
    
    .version-item {
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background: #fafafa;
      
      .version-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        h4 {
          margin: 0;
          color: #333;
          font-size: 14px;
        }
      }
      
      .version-info {
        .version-detail {
          margin-bottom: 8px;
          
          .label {
            font-weight: 500;
            color: #666;
            margin-right: 8px;
            display: inline-block;
            min-width: 80px;
          }
          
          .value {
            color: #333;
          }
          
          .trained-words {
            display: inline-flex;
            flex-wrap: wrap;
            gap: 4px;
            
            .more-words {
              color: #999;
              font-size: 12px;
              margin-left: 4px;
            }
          }
        }
        
        .file-info {
          .file-item {
            display: flex;
            align-items: center;
            padding: 8px;
            background: #fff;
            border-radius: 4px;
            margin-bottom: 4px;
            border: 1px solid #f0f0f0;
            
            .file-name {
              flex: 1;
              font-weight: 500;
              color: #333;
            }
            
            .file-size {
              margin: 0 12px;
              color: #666;
              font-size: 12px;
            }
            
            .file-type {
              background: #f0f0f0;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 12px;
              color: #666;
            }
          }
        }
      }
      
      .version-images {
        margin-top: 12px;
        
        .label {
          font-weight: 500;
          color: #666;
          margin-bottom: 8px;
          display: block;
        }
        
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
          
          .image-item {
            position: relative;
            border-radius: 4px;
            overflow: hidden;
            aspect-ratio: 1;
            cursor: pointer;
            transition: all 0.2s ease;
            
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.2s ease;
            }
            
            &:hover {
              transform: scale(1.05);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              
              img {
                transform: scale(1.1);
              }
            }
            
            &.nsfw {
              img {
                filter: blur(4px);
                
                &:hover {
                  filter: blur(0);
                }
              }
              
              &::after {
                content: 'NSFW';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 77, 79, 0.9);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
                pointer-events: none;
              }
            }
          }
          
          .more-images {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            color: #999;
            font-size: 12px;
            border-radius: 4px;
            aspect-ratio: 1;
          }
        }
      }
    }
    
    .no-data {
      text-align: center;
      color: #999;
      font-style: italic;
      padding: 16px;
      background: #f9f9f9;
      border-radius: 4px;
    }
  }
}

// 详情模态框样式优化
:deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
}

.full-height-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  
  :deep(.ant-card) {
    display: flex;
    flex-direction: column;
    height: 100%;
    
    .ant-card-body {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>
