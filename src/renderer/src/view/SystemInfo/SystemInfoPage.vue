<template>
  <div class="system-info-page p-6 h-full overflow-auto">
    <n-grid cols="1 s:2 m:2 l:3" responsive="screen" :x-gap="16" :y-gap="16">
      <!-- CPU 信息卡片 -->
      <n-grid-item>
        <n-card title="CPU 信息" class="h-full">
          <n-space vertical>
            <n-statistic label="处理器" :value="systemInfo.cpu.model" />
            <n-statistic label="核心数" :value="systemInfo.cpu.cores" />
            <n-statistic label="使用率" :value="systemInfo.cpu.usage" suffix="%" />
          </n-space>
        </n-card>
      </n-grid-item>

      <!-- 内存信息卡片 -->
      <n-grid-item>
        <n-card title="内存信息" class="h-full">
          <n-space vertical>
            <n-statistic label="总内存" :value="systemInfo.memory.total" suffix="GB" />
            <n-statistic label="已使用" :value="systemInfo.memory.used" suffix="GB" />
            <n-statistic label="使用率" :value="systemInfo.memory.usage" suffix="%" />
            <n-progress 
              type="line" 
              :percentage="systemInfo.memory.usage" 
              :color="systemInfo.memory.usage > 80 ? '#f56565' : '#48bb78'"
            />
          </n-space>
        </n-card>
      </n-grid-item>

      <!-- 磁盘信息卡片 -->
      <n-grid-item>
        <n-card title="磁盘信息" class="h-full">
          <n-space vertical>
            <n-statistic label="总容量" :value="systemInfo.disk.total" suffix="GB" />
            <n-statistic label="已使用" :value="systemInfo.disk.used" suffix="GB" />
            <n-statistic label="使用率" :value="systemInfo.disk.usage" suffix="%" />
            <n-progress 
              type="line" 
              :percentage="systemInfo.disk.usage"
              :color="systemInfo.disk.usage > 90 ? '#f56565' : '#48bb78'"
            />
          </n-space>
        </n-card>
      </n-grid-item>

      <!-- 网络信息卡片 -->
      <n-grid-item>
        <n-card title="网络信息" class="h-full">
          <n-space vertical>
            <n-statistic label="IP 地址" :value="networkInfo.ip" />
            <n-statistic label="网络状态" :value="networkInfo.status" />
            <n-statistic label="下载速度" :value="networkInfo.downloadSpeed" suffix="MB/s" />
            <n-statistic label="上传速度" :value="networkInfo.uploadSpeed" suffix="MB/s" />
          </n-space>
        </n-card>
      </n-grid-item>

      <!-- 系统信息卡片 -->
      <n-grid-item>
        <n-card title="系统信息" class="h-full">
          <n-space vertical>
            <n-statistic label="操作系统" :value="systemInfo.os.platform" />
            <n-statistic label="系统版本" :value="systemInfo.os.version" />
            <n-statistic label="运行时间" :value="systemInfo.os.uptime" suffix="小时" />
          </n-space>
        </n-card>
      </n-grid-item>

      <!-- GPU 信息卡片 -->
      <n-grid-item>
        <n-card title="显卡信息" class="h-full">
          <n-space vertical>
            <n-statistic label="显卡型号" :value="systemInfo.gpu.model" />
            <n-statistic label="显存" :value="systemInfo.gpu.memory" suffix="GB" />
            <n-statistic label="使用率" :value="systemInfo.gpu.usage" suffix="%" />
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 刷新按钮 -->
    <div class="mt-6 text-center">
      <n-button type="primary" @click="refreshSystemInfo" :loading="loading">
        刷新系统信息
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  NCard, 
  NGrid, 
  NGridItem, 
  NStatistic, 
  NSpace, 
  NProgress, 
  NButton 
} from 'naive-ui'

// 系统信息数据结构
const systemInfo = ref({
  cpu: {
    model: 'Intel Core i7-12700K',
    cores: 12,
    usage: 45
  },
  memory: {
    total: 32,
    used: 16.5,
    usage: 52
  },
  disk: {
    total: 1000,
    used: 650,
    usage: 65
  },
  os: {
    platform: 'Windows 11',
    version: '22H2',
    uptime: 72
  },
  gpu: {
    model: 'NVIDIA RTX 4070',
    memory: 12,
    usage: 35
  }
})

// 网络信息数据结构
const networkInfo = ref({
  ip: '192.168.1.100',
  status: '已连接',
  downloadSpeed: 125.6,
  uploadSpeed: 45.2
})

const loading = ref(false)

// 刷新系统信息
const refreshSystemInfo = async () => {
  loading.value = true
  try {
    // 模拟获取系统信息的延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 这里可以调用实际的系统信息获取 API
    // 目前使用模拟数据
    systemInfo.value.cpu.usage = Math.floor(Math.random() * 100)
    systemInfo.value.memory.usage = Math.floor(Math.random() * 100)
    systemInfo.value.disk.usage = Math.floor(Math.random() * 100)
    systemInfo.value.gpu.usage = Math.floor(Math.random() * 100)
    
    networkInfo.value.downloadSpeed = Math.floor(Math.random() * 200)
    networkInfo.value.uploadSpeed = Math.floor(Math.random() * 100)
    
    console.log('系统信息已刷新')
  } catch (error) {
    console.error('刷新系统信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取系统信息
onMounted(() => {
  refreshSystemInfo()
})
</script>

<style scoped>
.system-info-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.n-card {
  transition: transform 0.2s ease-in-out;
}

.n-card:hover {
  transform: translateY(-2px);
}
</style>