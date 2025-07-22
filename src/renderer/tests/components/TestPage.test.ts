/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 13:04:49
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-22 18:12:34
 * @FilePath: \EleTs\src\renderer\tests\components\TestPage.test.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TestPage from '@renderer/view/TestPage/TestPage.vue'

// Mock 子组件 - 模拟 TestPage 组件中使用的子组件，避免测试时加载真实组件
vi.mock('@renderer/view/Components/Button1.vue', () => ({
  default: { template: '<button><slot></slot></button>' }
}))

vi.mock('@renderer/view/Components/Card1.vue', () => ({
  default: { template: '<div class="card1">Card1</div>' }
}))

vi.mock('@renderer/view/Components/Card2.vue', () => ({
  default: { template: '<div class="card2">Card2</div>' }
}))

describe('TestPage 组件测试', () => {
  it('应该正确渲染基本结构', () => {
    const wrapper = mount(TestPage)
    
    // 检查是否有标签页容器
    expect(wrapper.find('.n-tabs').exists()).toBe(true)
    
    // 检查是否有标签页内容
    expect(wrapper.text()).toContain('选项卡 1')
    expect(wrapper.text()).toContain('选项卡 2')
  })

  it('初始状态应该是第一个标签页', () => {
    const wrapper = mount(TestPage)
    
    expect(wrapper.vm.activeTab).toBe('tab1')
  })

  it('应该能切换标签页', async () => {
    const wrapper = mount(TestPage)
    
    // 模拟标签页切换
    await wrapper.vm.handleTabChange('tab2')
    
    expect(wrapper.vm.activeTab).toBe('tab2')
  })

  it('changeTab 方法应该正常工作', async () => {
    const wrapper = mount(TestPage)
    
    wrapper.vm.changeTab('tab3')
    
    expect(wrapper.vm.activeTab).toBe('tab3')
  })
})
