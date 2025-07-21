/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 10:58:03
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-21 11:09:04
 * @FilePath: \EleTs\src\renderer\src\store\settings.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setLocale } from '@/locales'

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
    
    // 如果更新了语言设置，同时更新 i18n
    if (newSettings.language) {
      setLocale(newSettings.language)
    }
  }
  
  const changeLanguage = (language: 'zh-CN' | 'en-US') => {
    settings.value.language = language
    setLocale(language)
    saveToStorage()
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
      const parsedSettings = JSON.parse(stored)
      settings.value = parsedSettings
      // 恢复语言设置
      setLocale(parsedSettings.language || 'zh-CN')
    }
  }
  
  return {
    // 状态
    settings,
    // 方法
    updateSettings,
    changeLanguage,
    resetSettings,
    saveToStorage,
    loadFromStorage
  }
})
