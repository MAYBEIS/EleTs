import { describe, it, expect, vi } from 'vitest'
import { useAppStore, useUserStore } from '@renderer/store'

describe('Store 使用测试', () => {
  it('应该能创建 AppStore', () => {
    const appStore = useAppStore()
    
    expect(appStore.isLoading).toBe(false)
    expect(appStore.currentPage).toBe('index')
    expect(appStore.theme).toBe('light')
  })

  it('应该能创建 UserStore', () => {
    const userStore = useUserStore()
    
    expect(userStore.isLoggedIn).toBe(false)
    expect(userStore.userInfo).toBeNull()
  })

  it('AppStore 方法应该正常工作', () => {
    const appStore = useAppStore()
    
    appStore.setLoading(true)
    expect(appStore.isLoading).toBe(true)
    
    appStore.toggleTheme()
    expect(appStore.theme).toBe('dark')
    expect(appStore.isDarkMode).toBe(true)
  })

  it('UserStore 方法应该正常工作', () => {
    const userStore = useUserStore()
    
    const testUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    }
    
    userStore.setUser(testUser)
    expect(userStore.isLoggedIn).toBe(true)
    expect(userStore.userInfo).toEqual(testUser)
    
    userStore.logout()
    expect(userStore.isLoggedIn).toBe(false)
    expect(userStore.userInfo).toBeNull()
  })
})