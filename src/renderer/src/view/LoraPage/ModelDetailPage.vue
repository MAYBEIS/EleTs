<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download, ArrowLeft } from '@element-plus/icons-vue'

// 获取路由和路由器实例
const route = useRoute()
const router = useRouter()

// 模型数据
const model = ref<any>(null)
const loading = ref(false)

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取模型详情
const fetchModelDetails = async (modelId: string) => {
  loading.value = true
  try {
    // 这里应该调用获取模型详情的API
    // 暂时使用模拟数据
    model.value = {
      id: modelId,
      name: '示例模型名称',
      description: '这是一个示例模型的详细描述。该模型用于演示如何展示模型的详细信息，包括描述、统计数据、创作者信息等。',
      type: 'LORA',
      nsfw: false,
      tags: ['tag1', 'tag2', 'tag3', 'example', 'demo'],
      stats: {
        downloadCount: 12345,
        favoriteCount: 987,
        rating: 4.8
      },
      creator: {
        username: '示例创作者',
        image: '/placeholder-50.png'
      },
      imageUrl: '/placeholder-300x200.png',
      downloadUrl: '#'
    }
    console.log('获取模型详情成功:', model.value)
  } catch (error) {
    console.error('获取模型详情失败:', error)
    ElMessage.error('获取模型详情失败')
  } finally {
    loading.value = false
  }
}

// 下载模型
const downloadModel = async () => {
  if (!model.value?.downloadUrl) {
    ElMessage.error('未找到下载链接')
    return
  }

  try {
    // 这里应该调用下载模型的API
    ElMessage.success('模型下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 页面加载时获取数据
onMounted(() => {
  const modelId = route.params.id as string
  if (modelId) {
    fetchModelDetails(modelId)
  } else {
    ElMessage.error('未找到模型ID')
    goBack()
  }
})
</script>

<template>
  <div class="model-detail-layout">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <el-button :icon="ArrowLeft" @click="goBack" circle />
      <h2 class="title">模型详情</h2>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div v-loading="loading" class="model-detail">
        <template v-if="model">
          <!-- 模型图片 -->
          <div class="model-image">
            <img :src="model.imageUrl" :alt="model.name" />
          </div>

          <!-- 模型信息 -->
          <div class="model-info">
            <h1 class="model-name">{{ model.name }}</h1>
            
            <!-- 模型类型和NSFW标签 -->
            <div class="model-tags">
              <el-tag type="primary">{{ model.type }}</el-tag>
              <el-tag v-if="model.nsfw" type="danger">NSFW</el-tag>
            </div>

            <!-- 模型描述 -->
            <div class="model-description">
              <h3>描述</h3>
              <p>{{ model.description }}</p>
            </div>

            <!-- 统计数据 -->
            <div class="model-stats">
              <h3>统计数据</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">评分</span>
                  <span class="stat-value">{{ model.stats.rating.toFixed(1) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">下载</span>
                  <span class="stat-value">{{ model.stats.downloadCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">收藏</span>
                  <span class="stat-value">{{ model.stats.favoriteCount }}</span>
                </div>
              </div>
            </div>

            <!-- 创作者信息 -->
            <div class="model-creator">
              <h3>创作者</h3>
              <div class="creator-info">
                <el-avatar :src="model.creator.image" />
                <span class="creator-name">{{ model.creator.username }}</span>
              </div>
            </div>

            <!-- 标签 -->
            <div class="model-tags-list">
              <h3>标签</h3>
              <div class="tags">
                <el-tag v-for="tag in model.tags" :key="tag" class="tag">
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <!-- 下载按钮 -->
            <div class="download-section">
              <el-button type="primary" :icon="Download" @click="downloadModel" size="large">
                下载模型
              </el-button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.model-detail-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.top-bar {
  height: 64px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 15px;

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: bold;
  }
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  .model-detail {
    max-width: 1200px;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .model-image {
      width: 100%;
      height: 400px;
      background-color: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .model-info {
      padding: 30px;

      .model-name {
        margin: 0 0 20px 0;
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }

      .model-tags {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
      }

      .model-description {
        margin-bottom: 30px;

        h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #666;
        }
      }

      .model-stats {
        margin-bottom: 30px;

        h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 20px;

          .stat-item {
            text-align: center;
            padding: 15px;
            background-color: #f5f7fa;
            border-radius: 6px;

            .stat-label {
              display: block;
              font-size: 14px;
              color: #999;
              margin-bottom: 5px;
            }

            .stat-value {
              display: block;
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
          }
        }
      }

      .model-creator {
        margin-bottom: 30px;

        h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .creator-info {
          display: flex;
          align-items: center;
          gap: 10px;

          .creator-name {
            font-size: 16px;
            font-weight: 500;
            color: #333;
          }
        }
      }

      .model-tags-list {
        margin-bottom: 30px;

        h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;

          .tag {
            margin: 0;
          }
        }
      }

      .download-section {
        text-align: center;
        padding: 20px 0;

        .el-button {
          padding: 12px 30px;
        }
      }
    }
  }
}
</style>