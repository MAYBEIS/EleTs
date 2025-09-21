/*
 * @Description: Maybe编写
 */
import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

// 获取浏览器语言或从本地存储获取
const getDefaultLocale = (): string => {
  const stored = localStorage.getItem('app-locale')
  if (stored) return stored
  
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.includes('zh')) return 'zh-CN'
  return 'en-US'
}

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

export const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages,
  globalInjection: true // 全局注入 $t
})

// 切换语言的工具函数
export const setLocale = (locale: 'zh-CN' | 'en-US') => {
  i18n.global.locale.value = locale
  localStorage.setItem('app-locale', locale)
  document.documentElement.lang = locale
}

// 获取当前语言
export const getLocale = () => i18n.global.locale.value

// 获取支持的语言列表
export const getAvailableLocales = () => Object.keys(messages)
