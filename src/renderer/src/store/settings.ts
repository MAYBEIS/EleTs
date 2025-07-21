import { defineStore } from 'pinia'
import { ref } from 'vue'

interface AppSettings {
  language: 'zh-CN' | 'en-US'
  autoSave: boolean
  notifications: boolean
  windowSize: {
    width: number
    height: number
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const settings = ref<AppSettings>({
    language: 'zh-CN',
    autoSave: true,
    notifications: true,
    windowSize: {
      width: 1200,
      height: 800
    }
  })
  
  // 方法
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
  }
  
  const resetSettings = () => {
    settings.value = {
      language: 'zh-CN',
      autoSave: true,
      notifications: true,
      windowSize: {
        width: 1200,
        height: 800
      }
    }
  }
  
  // 持久化到本地存储
  const saveToStorage = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings.value))
  }
  
  const loadFromStorage = () => {
    const stored = localStorage.getItem('app-settings')
    if (stored) {
      settings.value = JSON.parse(stored)
    }
  }
  
  return {
    // 状态
    settings,
    // 方法
    updateSettings,
    resetSettings,
    saveToStorage,
    loadFromStorage
  }
})