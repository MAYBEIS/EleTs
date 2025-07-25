<template>
  <div v-if="open" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-card max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg border shadow-lg mx-4">
      <div class="p-6 border-b">
        <h2 class="text-lg font-semibold">新建项目</h2>
        <p class="text-sm text-muted-foreground mt-1">
          创建一个新的项目，填写项目的基本信息和配置。
        </p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="name" class="text-sm font-medium">项目名称 *</label>
            <input
              id="name"
              v-model="formData.name"
              class="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              placeholder="输入项目名称"
              required
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">负责团队 *</label>
            <select
              v-model="formData.team"
              class="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              required
            >
              <option value="">选择负责团队</option>
              <option v-for="team in teams" :key="team" :value="team">
                {{ team }}
              </option>
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <label for="description" class="text-sm font-medium">项目描述</label>
          <textarea
            id="description"
            v-model="formData.description"
            class="flex min-h-[80px] w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
            placeholder="详细描述项目内容和目标"
            rows="3"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">项目状态</label>
            <select
              v-model="formData.status"
              class="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
            >
              <option v-for="status in statuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">优先级</label>
            <select
              v-model="formData.priority"
              class="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
            >
              <option v-for="priority in priorities" :key="priority" :value="priority">
                {{ priority }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">开始日期</label>
            <input
              v-model="startDate"
              type="date"
              class="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">结束日期</label>
            <input
              v-model="endDate"
              type="date"
              class="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              :min="startDate"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">项目标签</label>
          <div class="flex gap-2">
            <input
              v-model="newTag"
              class="flex h-10 flex-1 rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              placeholder="添加标签"
              @keypress.enter.prevent="addTag"
            />
            <button
              type="button"
              @click="addTag"
              class="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div v-if="formData.tags.length > 0" class="flex flex-wrap gap-2 mt-2">
            <span
              v-for="tag in formData.tags"
              :key="tag"
              class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground gap-1"
            >
              {{ tag }}
              <button
                type="button"
                @click="removeTag(tag)"
                class="ml-1 h-3 w-3"
              >
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="!formData.name || !formData.team"
            class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建项目
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

export interface ProjectData {
  id: string
  name: string
  description: string
  team: string
  status: string
  priority: string
  startDate: string | undefined
  endDate: string | undefined
  tags: string[]
  progress: number
}

interface Props {
  open: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', projectData: ProjectData): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const teams = [
  "前端团队",
  "后端团队", 
  "移动团队",
  "架构团队",
  "设计团队",
  "测试团队"
]

const statuses = [
  "计划中",
  "开发中", 
  "测试",
  "活跃",
  "已完成",
  "暂停"
]

const priorities = [
  "低",
  "中",
  "高",
  "紧急"
]

const formData = reactive({
  name: "",
  description: "",
  team: "",
  status: "计划中",
  priority: "中",
  tags: [] as string[],
  progress: 0
})

const newTag = ref("")
const startDate = ref("")
const endDate = ref("")

const handleSubmit = () => {
  if (!formData.name || !formData.team) {
    return
  }

  const projectData: ProjectData = {
    id: Date.now().toString(),
    name: formData.name,
    description: formData.description,
    team: formData.team,
    status: formData.status,
    priority: formData.priority,
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
    tags: [...formData.tags],
    progress: formData.progress
  }

  emit('submit', projectData)
  
  // 重置表单
  Object.assign(formData, {
    name: "",
    description: "",
    team: "",
    status: "计划中",
    priority: "中",
    tags: [],
    progress: 0
  })
  startDate.value = ""
  endDate.value = ""
  newTag.value = ""
}

const addTag = () => {
  if (newTag.value.trim() && !formData.tags.includes(newTag.value.trim())) {
    formData.tags.push(newTag.value.trim())
    newTag.value = ""
  }
}

const removeTag = (tagToRemove: string) => {
  const index = formData.tags.indexOf(tagToRemove)
  if (index > -1) {
    formData.tags.splice(index, 1)
  }
}
</script>