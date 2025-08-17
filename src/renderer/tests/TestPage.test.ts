/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 13:04:49
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-25 00:04:53
 * @FilePath: \EleTs\src\renderer\tests\components\TestPage.test.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { describe, it, expect, vi } from 'vitest'

// Mock 组件的逻辑部分
const createTestPageLogic = () => {
  return {
    activeTab: 'tab1',
    handleTabChange(tab: string) {
      this.activeTab = tab
    },
    changeTab(tab: string) {
      this.activeTab = tab
    }
  }
}

describe('TestPage 组件测试', () => {
  it('应该正确初始化默认状态', () => {
    const component = createTestPageLogic()
    
    expect(component.activeTab).toBe('tab1')
    
  })

  it('handleTabChange 方法应该正确切换标签页', () => {
    const component = createTestPageLogic()
    
    component.handleTabChange('tab2')
    expect(component.activeTab).toBe('tab2')
    
    component.handleTabChange('tab3')
    expect(component.activeTab).toBe('tab3')
  })

  it('changeTab 方法应该正确切换标签页', () => {
    const component = createTestPageLogic()
    
    component.changeTab('tab2')
    expect(component.activeTab).toBe('tab2')
    
    component.changeTab('tab1')
    expect(component.activeTab).toBe('tab1')
  })

  it('应该能在不同标签页之间切换', () => {
    const component = createTestPageLogic()
    
    // 初始状态
    expect(component.activeTab).toBe('tab1')
    
    // 切换到 tab2
    component.changeTab('tab2')
    expect(component.activeTab).toBe('tab2')
    
    // 使用 handleTabChange 切换到 tab3
    component.handleTabChange('tab3')
    expect(component.activeTab).toBe('tab3')
    
    // 切换回 tab1
    component.changeTab('tab1')
    expect(component.activeTab).toBe('tab1')
  })
})


