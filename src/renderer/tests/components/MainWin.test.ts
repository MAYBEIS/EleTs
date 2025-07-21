import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MainWin from '@renderer/view/App/MainWin.vue'

// Mock IPC
const mockInvoke = vi.fn()
const mockSend = vi.fn()

global.window = {
  ...global.window,
  electron: {
    ipcRenderer: {
      invoke: mockInvoke,
      send: mockSend,
      on: vi.fn()
    }
  }
}

// Mock Button1 组件
vi.mock('@renderer/view/Components/Button1.vue', () => ({
  default: { 
    template: '<button @click="$emit(\'click\')"><slot></slot></button>',
    emits: ['click']
  }
}))

describe('MainWin 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue('1.1')
  })

  it('应该正确渲染基本结构', () => {
    const wrapper = mount(MainWin)
    
    expect(wrapper.find('.main-container').exists()).toBe(true)
    expect(wrapper.find('.app-header').exists()).toBe(true)
    expect(wrapper.find('.main-nav').exists()).toBe(true)
    expect(wrapper.find('.status-bar').exists()).toBe(true)
  })

  it('应该显示应用标题', () => {
    const wrapper = mount(MainWin)
    
    expect(wrapper.text()).toContain('电子测试应用')
  })

  it('应该调用 IPC 获取版本信息', async () => {
    mount(MainWin)
    
    // 等待组件挂载完成
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(mockInvoke).toHaveBeenCalledWith('W-version-1.1')
  })

  it('版本信息应该正确显示', async () => {
    const wrapper = mount(MainWin)
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.v1).toBe('1.1')
    expect(wrapper.text()).toContain('版本: 1.1')
  })

  it('应该有导航按钮', () => {
    const wrapper = mount(MainWin)
    
    const buttons = wrapper.findAllComponents({ name: 'Button1' })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('点击导航按钮应该发送 IPC 消息', async () => {
    const wrapper = mount(MainWin)
    
    // 模拟点击按钮
    wrapper.vm.openPage('TestPage')
    
    expect(mockSend).toHaveBeenCalledWith('navigate-to', 'TestPage')
  })

  it('应该显示当前时间', () => {
    const wrapper = mount(MainWin)
    
    expect(wrapper.text()).toContain('当前时间:')
    expect(wrapper.vm.currentTime).toBeDefined()
  })
})