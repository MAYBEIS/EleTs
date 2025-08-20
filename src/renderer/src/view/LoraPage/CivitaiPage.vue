<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  HomeFilled, 
  Search, 
  Star, 
  Clock,
  Setting,
  Download,
  View
} from '@element-plus/icons-vue'

// 导航菜单相关
const activeMenu = ref('home')
const menuItems = [
  { key: 'home', icon: HomeFilled, label: '主页' },
  { key: 'search', icon: Search, label: '搜索' },
  { key: 'favorites', icon: Star, label: '喜欢' },
  { key: 'history', icon: Clock, label: '历史' },
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

// 保存 API 设置
const saveApiSettings = (key: string, endpoint: string) => {
  apiKey.value = key
  apiEndpoint.value = endpoint
  localStorage.setItem('civitai_api_key', key)
  localStorage.setItem('civitai_api_endpoint', endpoint)
  ElMessage.success('API设置已保存')
  setTimeout(() => {
    fetchModels() // 重新加载数据
  }, 500) // 延迟500ms执行，确保设置已保存
}

// 保存代理设置
const saveProxySettings = () => {
  localStorage.setItem('proxy_server', proxyServer.value)
  localStorage.setItem('proxy_enabled', proxyEnabled.value.toString())
  localStorage.setItem('use_system_proxy', useSystemProxy.value.toString())
  ElMessage.success('代理设置已保存')
  
  // 通知主进程更新代理设置
  window.api.updateProxySettings({
    server: proxyServer.value,
    enabled: proxyEnabled.value,
    useSystemProxy: useSystemProxy.value
  })
  
  // 重新加载数据
  setTimeout(() => {
    fetchModels()
  }, 500) // 延迟500ms执行，确保设置已保存
}

// 测试代理连接
const testProxyConnection = async () => {
  if (!proxyServer.value) {
    ElMessage.warning('请先输入代理服务器地址')
    return
  }
  
  try {
    ElMessage.info('正在测试代理连接...')
    const result = await window.api.testProxyConnection(proxyServer.value)
    if (result.success) {
      ElMessage.success('代理连接测试成功')
    } else {
      ElMessage.error('代理连接测试失败: ' + (result.error || '连接失败'))
    }
  } catch (error) {
    ElMessage.error('代理连接测试失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 获取模型列表
const fetchModels = async () => {
  loading.value = true
  try {
    // 构建请求参数
    const params = new URLSearchParams({
      limit: pageSize.value.toString(),
      page: currentPage.value.toString(),
      sort: selectedSort.value,
      query: searchQuery.value,
      ...(selectedType.value && { type: selectedType.value })
    })

    // 构建请求头
    const headers: HeadersInit = {}
    if (apiKey.value) {
      headers['Authorization'] = `Bearer ${apiKey.value}`
    }

    // 重新使用 Electron 的 IPC 调用来发送请求
    // 由于CSP限制，直接使用fetch在Electron中可能无法正常工作
    const response = await window.api.fetchCivitaiModels(
      `${apiEndpoint.value}/models?${params}`,
      { 
        headers,
        proxy: proxyEnabled.value ? proxyServer.value : undefined,
        useSystemProxy: useSystemProxy.value
      }
    )
    
    if (!response.ok) {
      throw new Error('获取模型数据失败')
    }

    const data = response.data
    models.value = data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '暂无描述',
      type: item.type,
      nsfw: item.nsfw,
      tags: item.tags || [],
      stats: {
        downloadCount: item.stats?.downloadCount || 0,
        favoriteCount: item.stats?.favoriteCount || 0,
        rating: item.stats?.rating || 0
      },
      creator: {
        username: item.creator?.username || '未知作者',
        image: item.creator?.image || '/placeholder-50.png'
      },
      imageUrl: item.modelVersions?.[0]?.images?.[0]?.url || '/placeholder-300x200.png',
      downloadUrl: item.modelVersions?.[0]?.downloadUrl
    }))
    
    total.value = data.metadata?.totalItems || 0

  } catch (error) {
    console.error('获取模型失败:', error)
    ElMessage.error('获取模型数据失败，请稍后重试')
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
  ElMessageBox.alert(
    `
    <div class="model-details">
      <img src="${model.imageUrl}" class="w-full h-48 object-cover mb-4">
      <h3 class="text-lg font-bold mb-2">${model.name}</h3>
      <p class="text-sm text-gray-600 mb-4">${model.description}</p>
      <div class="stats grid grid-cols-3 gap-4 mb-4">
        <div>下载: ${model.stats.downloadCount}</div>
        <div>喜欢: ${model.stats.favoriteCount}</div>
        <div>评分: ${model.stats.rating.toFixed(1)}</div>
      </div>
      <div class="creator flex items-center gap-2 mb-4">
        <img src="${model.creator.image}" class="w-8 h-8 rounded-full">
        <span>${model.creator.username}</span>
      </div>
      <div class="tags flex flex-wrap gap-2">
        ${model.tags.map((tag: string) => `<span class="px-2 py-1 bg-gray-100 rounded">${tag}</span>`).join('')}
      </div>
    </div>
    `,
    '模型详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 下载模型
const downloadModel = async (model: any) => {
  if (!model.downloadUrl) {
    ElMessage.error('未找到下载链接')
    return
  }

  // 重新使用 Electron 的 IPC 调用来处理下载
  try {
    const result = await window.api.downloadCivitaiModel(
      model.downloadUrl,
      model.name
    )
    
    if (result.success) {
      ElMessage.success('模型下载成功')
    } else {
      ElMessage.error('下载失败: ' + result.error)
    }
  } catch (error) {
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 切换菜单
const handleMenuClick = (key: string) => {
  activeMenu.value = key
}

// 页面加载时获取数据
onMounted(() => {
  fetchModels()
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
          </div>

          <!-- 模型列表 -->
          <div v-loading="loading" class="model-grid">
            <el-card
              v-for="model in models"
              :key="model.id"
              class="model-card"
              :body-style="{ padding: '0' }"
            >
              <div class="relative">
                <img :src="model.imageUrl" :alt="model.name" class="w-full h-48 object-cover" />
                <div class="model-type-tag">
                  {{ model.type }}
                </div>
                <div v-if="model.nsfw" class="nsfw-tag">
                  NSFW
                </div>
              </div>

              <div class="p-4">
                <h3 class="text-lg font-semibold mb-2 truncate" :title="model.name">
                  {{ model.name }}
                </h3>
                
                <div class="creator mb-2 flex items-center gap-2">
                  <el-avatar :size="24" :src="model.creator.image" />
                  <span class="text-sm text-gray-600">{{ model.creator.username }}</span>
                </div>

                <p class="description text-sm text-gray-500 mb-3 line-clamp-2">
                  {{ model.description }}
                </p>

                <div class="stats grid grid-cols-3 gap-2 mb-3 text-xs text-gray-600">
                  <div>⭐ {{ model.stats.rating.toFixed(1) }}</div>
                  <div>💟 {{ model.stats.favoriteCount }}</div>
                  <div>⬇️ {{ model.stats.downloadCount }}</div>
                </div>

                <div class="tags mb-3 flex flex-wrap gap-1">
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

                <div class="flex gap-2">
                  <el-button
                    type="primary"
                    :icon="View"
                    @click="viewModelDetails(model)"
                  >
                    详情
                  </el-button>
                  <el-button
                    type="success"
                    :icon="Download"
                    @click="downloadModel(model)"
                  >
                    下载
                  </el-button>
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
                    readonly
                    placeholder="请选择下载目录"
                  >
                    <template #append>
                      <el-button>选择目录</el-button>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="自动分类">
                  <el-switch />
                  <div class="form-help text-xs text-gray-500 mt-1">
                    开启后会按模型类型自动分类到子文件夹
                  </div>
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
  background-color: #f5f7fa;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  .model-card {
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
      height: 200px;
      object-fit: cover;
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
</style>
