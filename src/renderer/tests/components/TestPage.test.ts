import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TestPage from '@renderer/view/TestPage/TestPage.vue'

// Mock 子组件
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