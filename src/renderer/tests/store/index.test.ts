import { describe, it, expect } from 'vitest'
import { useAppStore, useUserStore } from '@renderer/store'

describe('Store Index 导出测试', () => {
  it('应该正确导出 useAppStore', () => {
    expect(useAppStore).toBeDefined()
    expect(typeof useAppStore).toBe('function')
  })

  it('应该正确导出 useUserStore', () => {
    expect(useUserStore).toBeDefined()
    expect(typeof useUserStore).toBe('function')
  })

  it('导出的 store 应该能正常创建实例', () => {
    const appStore = useAppStore()
    const userStore = useUserStore()
    
    expect(appStore).toBeDefined()
    expect(userStore).toBeDefined()
  })

  it('多次调用应该返回相同的 store 实例', () => {
    const appStore1 = useAppStore()
    const appStore2 = useAppStore()
    const userStore1 = useUserStore()
    const userStore2 = useUserStore()
    
    expect(appStore1).toBe(appStore2)
    expect(userStore1).toBe(userStore2)
  })
})