<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2>项目管理</h2>
        <p class="text-muted-foreground">管理您的所有项目和团队协作</p>
      </div>
      <button
        @click="showNewProjectDialog = true"
        class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        新建项目
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border rounded-lg p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ projects.length }}</div>
          <p class="text-sm text-muted-foreground">总项目数</p>
        </div>
      </div>
      <div class="bg-card border rounded-lg p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">
            {{ projects.filter(p => p.status === "活跃").length }}
          </div>
          <p class="text-sm text-muted-foreground">活跃项目</p>
        </div>
      </div>
      <div class="bg-card border rounded-lg p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600">
            {{ projects.filter(p => p.status === "开发中").length }}
          </div>
          <p class="text-sm text-muted-foreground">开发中</p>
        </div>
      </div>
      <div class="bg-card border rounded-lg p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">
            {{ Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) }}%
          </div>
          <p class="text-sm text-muted-foreground">平均进度</p>
        </div>
      </div>
    </div>
    
    <div class="grid gap-4">
      <div
        v-for="(project, index) in projects"
        :key="project.id"
        class="transition-all duration-300"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <div :class="`bg-card border rounded-lg hover:shadow-lg transition-all border-l-4 ${getPriorityColor(project.priority)}`">
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="space-y-3 flex-1">
                <div class="flex items-center justify-between">
                  <h3 class="font-medium">{{ project.name }}</h3>
                  <div class="flex items-center gap-2">
                    <span :class="`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusVariant(project.status)}`">
                      {{ project.status }}
                    </span>
                    <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                      {{ project.priority }}优先级
                    </span>
                  </div>
                </div>
                
                <p class="text-sm text-muted-foreground line-clamp-2">
                  {{ project.description }}
                </p>
                
                <div class="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{{ project.team }}</span>
                  <span>{{ project.progress }}% 完成</span>
                </div>
                
                <div class="w-full bg-secondary rounded-full h-2">
                  <div 
                    class="bg-primary h-2 rounded-full transition-all duration-300" 
                    :style="{ width: `${project.progress}%` }"
                  />
                </div>
                
                <div v-if="project.tags && project.tags.length > 0" class="flex flex-wrap gap-1 pt-2">
                  <span
                    v-for="tag in project.tags.slice(0, 3)"
                    :key="tag"
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="project.tags.length > 3"
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground"
                  >
                    +{{ project.tags.length - 3 }}
                  </span>
                </div>
              </div>
              
              <div class="ml-4 flex flex-col gap-2">
                <button
                  @click="handleViewProject(project)"
                  class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  查看
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NewProjectDialog
      :open="showNewProjectDialog"
      @close="showNewProjectDialog = false"
      @submit="handleCreateProject"
    />

    <ProjectDetailsDialog
      :open="showProjectDetails"
      :project="selectedProject"
      @close="showProjectDetails = false"
      @edit="handleEditProject"
      @delete="handleDeleteProject"
      @updateProgress="handleUpdateProgress"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import NewProjectDialog, { type ProjectData } from './NewProjectDialog.vue'
import ProjectDetailsDialog from './ProjectDetailsDialog.vue'

const projects = reactive<ProjectData[]>([
  { 
    id: "1", 
    name: "电商平台", 
    description: "构建一个现代化的电商平台，支持多商户和移动端",
    status: "活跃", 
    progress: 85, 
    team: "前端团队",
    priority: "高",
    tags: ["电商", "React", "移动端"],
    startDate: "2024-01-01",
    endDate: "2024-06-30"
  },
  { 
    id: "2", 
    name: "数据可视化", 
    description: "开发企业级数据可视化仪表板系统",
    status: "开发中", 
    progress: 60, 
    team: "后端团队",
    priority: "中",
    tags: ["数据", "可视化", "企业级"],
    startDate: "2024-02-15",
    endDate: "2024-07-15"
  },
  { 
    id: "3", 
    name: "移动端应用", 
    description: "跨平台移动应用开发项目",
    status: "测试", 
    progress: 95, 
    team: "移动团队",
    priority: "紧急",
    tags: ["移动端", "React Native", "跨平台"],
    startDate: "2024-01-01",
    endDate: "2024-04-30"
  },
  { 
    id: "4", 
    name: "API 服务", 
    description: "微服务架构的后端API开发",
    status: "计划中", 
    progress: 20, 
    team: "架构团队",
    priority: "低",
    tags: ["API", "微服务", "后端"],
    startDate: "2024-03-01",
    endDate: "2024-09-30"
  },
])

const showNewProjectDialog = ref(false)
const showProjectDetails = ref(false)
const selectedProject = ref<ProjectData | null>(null)

const handleCreateProject = (projectData: ProjectData) => {
  projects.push(projectData)
  showNewProjectDialog.value = false
}

const handleViewProject = (project: ProjectData) => {
  selectedProject.value = project
  showProjectDetails.value = true
}

const handleEditProject = (project: ProjectData) => {
  // TODO: 实现编辑功能
  showProjectDetails.value = false
  showNewProjectDialog.value = true
}

const handleDeleteProject = (projectId: string) => {
  const index = projects.findIndex(p => p.id === projectId)
  if (index > -1) {
    projects.splice(index, 1)
  }
  showProjectDetails.value = false
}

const handleUpdateProgress = (projectId: string, progress: number) => {
  const project = projects.find(p => p.id === projectId)
  if (project) {
    project.progress = progress
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "活跃": return "bg-green-100 text-green-800 border-green-200"
    case "开发中": return "bg-blue-100 text-blue-800 border-blue-200"
    case "测试": return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "已完成": return "bg-gray-100 text-gray-800 border-gray-200"
    case "暂停": return "bg-red-100 text-red-800 border-red-200"
    default: return "bg-secondary text-secondary-foreground"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "紧急": return "border-l-red-500"
    case "高": return "border-l-orange-500"
    case "中": return "border-l-yellow-500"
    case "低": return "border-l-green-500"
    default: return "border-l-gray-500"
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>