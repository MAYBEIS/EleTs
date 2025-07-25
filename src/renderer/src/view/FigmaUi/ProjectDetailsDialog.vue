<template>
  <div v-if="open && project" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-card max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg border shadow-lg mx-4">
      <div class="p-6 border-b">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold">{{ project.name }}</h2>
            <p class="text-sm text-muted-foreground mt-2">
              {{ project.description || "暂无项目描述" }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="$emit('edit', project)"
              class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              编辑
            </button>
            <button
              @click="showDeleteConfirm = true"
              class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-destructive"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="border-b border-border">
          <nav class="-mb-px flex space-x-8">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              ]"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <div class="mt-6">
          <!-- 项目概览 -->
          <div v-if="activeTab === 'overview'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-card border rounded-lg p-4">
                <div class="flex items-center space-x-2">
                  <div :class="`w-3 h-3 rounded-full ${getStatusColor(project.status)}`" />
                  <div>
                    <p class="text-sm text-muted-foreground">状态</p>
                    <div class="flex items-center gap-1">
                      <component :is="getStatusIcon(project.status)" class="h-4 w-4" />
                      <span class="font-medium">{{ project.status }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-card border rounded-lg p-4">
                <div class="flex items-center space-x-2">
                  <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <div>
                    <p class="text-sm text-muted-foreground">团队</p>
                    <p class="font-medium">{{ project.team }}</p>
                  </div>
                </div>
              </div>

              <div class="bg-card border rounded-lg p-4">
                <div class="flex items-center space-x-2">
                  <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <div>
                    <p class="text-sm text-muted-foreground">优先级</p>
                    <span :class="`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(project.priority)}`">
                      {{ project.priority }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="bg-card border rounded-lg p-4">
                <div class="flex items-center space-x-2">
                  <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p class="text-sm text-muted-foreground">进度</p>
                    <p class="font-medium">{{ project.progress }}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-card border rounded-lg">
              <div class="p-4 border-b">
                <h3 class="font-semibold">项目进度</h3>
              </div>
              <div class="p-4">
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span>完成进度</span>
                    <span>{{ project.progress }}%</span>
                  </div>
                  <div class="w-full bg-secondary rounded-full h-3">
                    <div 
                      class="bg-primary h-3 rounded-full transition-all duration-300" 
                      :style="{ width: `${project.progress}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="project.tags && project.tags.length > 0" class="bg-card border rounded-lg">
              <div class="p-4 border-b">
                <h3 class="font-semibold">项目标签</h3>
              </div>
              <div class="p-4">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in project.tags"
                    :key="tag"
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 进度管理 -->
          <div v-if="activeTab === 'progress'" class="space-y-4">
            <div class="bg-card border rounded-lg">
              <div class="p-4 border-b">
                <h3 class="font-semibold">进度管理</h3>
                <p class="text-sm text-muted-foreground">更新项目的完成进度</p>
              </div>
              <div class="p-4 space-y-4">
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span>当前进度</span>
                    <span>{{ project.progress }}%</span>
                  </div>
                  <div class="w-full bg-secondary rounded-full h-3">
                    <div 
                      class="bg-primary h-3 rounded-full transition-all duration-300" 
                      :style="{ width: `${project.progress}%` }"
                    />
                  </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    v-for="value in [25, 50, 75, 100]"
                    :key="value"
                    @click="updateProgress(value)"
                    :class="[
                      'px-3 py-2 text-sm font-medium rounded-md',
                      project.progress === value 
                        ? 'bg-primary text-primary-foreground' 
                        : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    ]"
                  >
                    {{ value }}%
                  </button>
                </div>
              </div>
            </div>

            <!-- 里程碑 -->
            <div class="bg-card border rounded-lg">
              <div class="p-4 border-b">
                <h3 class="font-semibold">里程碑</h3>
              </div>
              <div class="p-4">
                <div class="space-y-4">
                  <div
                    v-for="(milestone, index) in milestones"
                    :key="index"
                    class="flex items-center space-x-3"
                  >
                    <div :class="`w-3 h-3 rounded-full ${project.progress >= milestone.threshold ? 'bg-green-500' : 'bg-gray-300'}`" />
                    <div class="flex-1">
                      <p class="font-medium">{{ milestone.title }}</p>
                      <p class="text-sm text-muted-foreground">{{ milestone.description }}</p>
                    </div>
                    <span :class="`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      project.progress >= milestone.threshold 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`">
                      {{ project.progress >= milestone.threshold ? "已完成" : "待完成" }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 详细信息 -->
          <div v-if="activeTab === 'details'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-card border rounded-lg">
                <div class="p-4 border-b">
                  <h3 class="font-semibold">时间安排</h3>
                </div>
                <div class="p-4 space-y-3">
                  <div class="flex items-center space-x-2">
                    <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p class="text-sm text-muted-foreground">开始日期</p>
                      <p class="font-medium">{{ project.startDate || "未设置" }}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p class="text-sm text-muted-foreground">结束日期</p>
                      <p class="font-medium">{{ project.endDate || "未设置" }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-card border rounded-lg">
                <div class="p-4 border-b">
                  <h3 class="font-semibold">项目信息</h3>
                </div>
                <div class="p-4 space-y-3">
                  <div>
                    <p class="text-sm text-muted-foreground">项目ID</p>
                    <p class="font-medium font-mono text-sm">{{ project.id }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-muted-foreground">创建时间</p>
                    <p class="font-medium">{{ formatDate(project.id) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="project.description" class="bg-card border rounded-lg">
              <div class="p-4 border-b">
                <h3 class="font-semibold">项目描述</h3>
              </div>
              <div class="p-4">
                <p class="text-sm leading-6">{{ project.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 p-6 border-t">
        <button
          @click="$emit('close')"
          class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
        <h3 class="font-medium mb-2">确认删除项目</h3>
        <p class="text-sm text-muted-foreground mb-4">
          确定要删除项目 "{{ project.name }}" 吗？此操作不可撤销。
        </p>
        <div class="flex justify-end gap-2">
          <button
            @click="showDeleteConfirm = false"
            class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            取消
          </button>
          <button
            @click="handleDelete"
            class="inline-flex items-center justify-center rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ProjectData } from './NewProjectDialog.vue'

interface Props {
  open: boolean
  project: ProjectData | null
}

interface Emits {
  (e: 'close'): void
  (e: 'edit', project: ProjectData): void
  (e: 'delete', projectId: string): void
  (e: 'updateProgress', projectId: string, progress: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('overview')
const showDeleteConfirm = ref(false)

const tabs = [
  { id: 'overview', label: '项目概览' },
  { id: 'progress', label: '进度管理' },
  { id: 'details', label: '详细信息' }
]

const milestones = [
  { threshold: 25, title: '项目启动', description: '完成项目规划和团队组建' },
  { threshold: 50, title: '开发阶段', description: '核心功能开发完成' },
  { threshold: 75, title: '测试阶段', description: '功能测试和优化完成' },
  { threshold: 100, title: '项目交付', description: '项目正式上线发布' }
]

const handleDelete = () => {
  if (props.project) {
    emit('delete', props.project.id)
    showDeleteConfirm.value = false
  }
}

const updateProgress = (progress: number) => {
  if (props.project) {
    emit('updateProgress', props.project.id, progress)
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "活跃": return "bg-green-500"
    case "开发中": return "bg-blue-500"
    case "测试": return "bg-yellow-500"
    case "已完成": return "bg-gray-500"
    case "暂停": return "bg-red-500"
    default: return "bg-gray-400"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "紧急": return "text-red-600 bg-red-50 border-red-200"
    case "高": return "text-orange-600 bg-orange-50 border-orange-200"
    case "中": return "text-yellow-600 bg-yellow-50 border-yellow-200"
    case "低": return "text-green-600 bg-green-50 border-green-200"
    default: return "text-gray-600 bg-gray-50 border-gray-200"
  }
}

const getStatusIcon = (status: string) => {
  // 返回简单的div，因为Vue中组件图标需要特殊处理
  return 'div'
}

const formatDate = (timestamp: string) => {
  return new Date(parseInt(timestamp)).toLocaleDateString('zh-CN')
}
</script>