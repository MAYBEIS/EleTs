<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 16:28:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-22 19:54:45
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
  FolderOpenOutlined
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
  Divider
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

// 代理设置表单
const proxyForm = reactive({
  server: '',
  enabled: false,
  useSystemProxy: false
})

// 下载目录
const downloadDirectory = ref('')

// 菜单选项
const menuItems: MenuProps['items'] = [
  {
    key: 'models',
    icon: h(FileSearchOutlined),
    label: '模型浏览'
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
    title: '模型名称',
    dataIndex: 'name',
    key: 'name',
    width: '25%',
    customRender: ({ record }: { record: CivitaiModel }) => {
      return h('div', [
        h('div', { style: { fontWeight: 'bold' } }, record.name),
        h('div', { style: { fontSize: '12px', color: '#888', marginTop: '4px' } }, record.description?.substring(0, 50) + '...')
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
    width: '25%',
    customRender: ({ record }: { record: CivitaiModel }) => {
      const version = record.modelVersions[0]
      const file = version?.files[0]
      return h('div', [
        h(Button, {
          type: 'primary',
          icon: h(DownloadOutlined),
          onClick: () => downloadModel(record, version, file),
          size: 'small'
        }, () => '下载'),
        h(Button, {
          type: 'default',
          style: { marginLeft: '8px' },
          size: 'small'
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
    const response = await ipcRenderer.invoke('fetch-civitai-models', url, options)
    
    if (response.ok) {
      models.value = response.data.items || []
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
    // 添加到下载队列
    const result = await ipcRenderer.invoke('add-to-download-queue', model.id, model.name, file.downloadUrl)
    
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
    const response = await ipcRenderer.invoke('get-download-queue')
    if (response.success) {
      downloadTasks.value = response.data
    }
  } catch (error) {
    console.error('获取下载队列失败:', error)
  }
}

// 开始下载
const startDownload = async (modelId: string) => {
  try {
    const response = await ipcRenderer.invoke('start-download', modelId)
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
    const response = await ipcRenderer.invoke('pause-download', modelId)
    if (response.success) {
      await fetchDownloadQueue()
      Modal.success({
        title: '操作成功',
        content: '下载已暂停'
      })
    } else {
      Modal.error({
        title: '操作失败',
        content: response.error || '暂停下载失败'
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
    const response = await ipcRenderer.invoke('cancel-download', modelId)
    if (response.success) {
      await fetchDownloadQueue()
      Modal.success({
        title: '操作成功',
        content: '下载已取消'
      })
    } else {
      Modal.error({
        title: '操作失败',
        content: response.error || '取消下载失败'
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
    const settings: ProxySettings = {
      server: proxyForm.server,
      enabled: proxyForm.enabled,
      useSystemProxy: proxyForm.useSystemProxy
    }
    
    const response = await ipcRenderer.invoke('update-proxy-settings', settings)
    
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
    const response = await ipcRenderer.invoke('test-proxy-connection', proxyForm.server)
    
    if (response.success) {
      Modal.success({
        title: '连接成功',
        content: '代理连接测试成功'
      })
    } else {
      Modal.error({
        title: '连接失败',
        content: response.error || '代理连接测试失败'
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
    const response = await ipcRenderer.invoke('select-download-directory')
    
    if (response.success) {
      downloadDirectory.value = response.data
      directoryModalVisible.value = false
      Modal.success({
        title: '选择成功',
        content: '下载目录已设置'
      })
    } else {
      Modal.error({
        title: '选择失败',
        content: response.error || '选择下载目录失败'
      })
    }
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
    const response = await ipcRenderer.invoke('get-proxy-settings')
    if (response.success) {
      const settings = response.data
      if (settings) {
        proxyForm.server = settings.server || ''
        proxyForm.enabled = settings.enabled || false
        proxyForm.useSystemProxy = settings.useSystemProxy || false
      }
    }
  } catch (error) {
    console.error('获取代理设置失败:', error)
  }
}

// 获取下载目录
const getDownloadDirectory = async () => {
  try {
    const response = await ipcRenderer.invoke('get-download-directory')
    if (response.success) {
      downloadDirectory.value = response.data
    }
  } catch (error) {
    console.error('获取下载目录失败:', error)
  }
}

// 页面初始化
onMounted(async () => {
  await fetchModels()
  await fetchDownloadQueue()
  await getDownloadDirectory()
  await getProxySettings()
})
</script>

<template>
  <div class="civitai-page">
    <Layout style="height: 100%;">
      <Sider width="200" style="background: #fff; border-right: 1px solid #f0f0f0;">
        <div class="logo">
          <h2 style="padding: 16px; text-align: center; margin: 0; color: #1890ff;">Civitai</h2>
        </div>
        <Menu
          :selectedKeys="[selectedKey]"
          @update:selectedKeys="selectedKey = $event[0] as string"
          mode="inline"
          :items="menuItems"
          style="border: none;"
        />
      </Sider>
      <Layout>
        <Content style="padding: 16px; overflow: auto;">
          <div v-if="showModelsPage">
            <Card title="模型浏览器" style="width: 100%;">
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
                    :scroll="{ y: 400 }"
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
          
          <div v-if="showDownloadsPage">
            <Card title="下载队列" style="width: 100%;">
              <Table 
                :columns="downloadColumns" 
                :data-source="downloadTasks" 
                :pagination="false" 
                rowKey="id"
                :scroll="{ y: 500 }"
              />
            </Card>
          </div>
          
          <div v-if="showSettingsPage">
            <Card title="设置" style="width: 100%;">
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
  </div>
</template>

<style scoped lang="less">
.civitai-page {
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf9 100%);
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
}

:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .ant-card-head {
    background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
    color: white;
    border-radius: 8px 8px 0 0;
    
    .ant-card-head-title {
      color: white;
    }
  }
}

:deep(.ant-table-wrapper) {
  .ant-table {
    .ant-table-container {
      .ant-table-content {
        max-height: 400px;
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
  background: #fff;
}

:deep(.ant-menu) {
  border-right: none;
  
  .ant-menu-item {
    margin: 0;
    height: 48px;
    line-height: 48px;
    
    &.ant-menu-item-selected {
      background: linear-gradient(90deg, #e6f7ff 0%, #b3e0ff 100%);
      border-right: 3px solid #1890ff;
    }
  }
}
</style>
