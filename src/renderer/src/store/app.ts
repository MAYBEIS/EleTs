import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const isLoading = ref(false)
  const currentPage = ref('index')
  const sidebarCollapsed = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  
  // 计算属性
  const isDarkMode = computed(() => theme.value === 'dark')
  
  // 方法
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }
  
  const setCurrentPage = (page: string) => {
    currentPage.value = page
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  
  return {
    // 状态
    isLoading,
    currentPage,
    sidebarCollapsed,
    theme,
    // 计算属性
    isDarkMode,
    // 方法
    setLoading,
    setCurrentPage,
    toggleSidebar,
    toggleTheme
  }
})