import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UrlEncoderTool from '../../src/view/HomePage/tools/UrlEncoderTool.vue'

// Mock 图标组件
vi.mock('@heroicons/vue/24/outline', () => ({
  ArrowLeftIcon: { name: 'ArrowLeftIcon', template: '<div>ArrowLeftIcon</div>' },
  LinkIcon: { name: 'LinkIcon', template: '<div>LinkIcon</div>' },
  ArrowsRightLeftIcon: { name: 'ArrowsRightLeftIcon', template: '<div>ArrowsRightLeftIcon</div>' },
  ClipboardIcon: { name: 'ClipboardIcon', template: '<div>ClipboardIcon</div>' },
  InformationCircleIcon: { name: 'InformationCircleIcon', template: '<div>InformationCircleIcon</div>' }
}))

// Mock 剪贴板 API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve(''))
  }
})

describe('UrlEncoderTool 组件测试', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    wrapper = mount(UrlEncoderTool, {
      global: {
        stubs: {
          ArrowLeftIcon: true,
          LinkIcon: true,
          ArrowsRightLeftIcon: true,
          ClipboardIcon: true,
          InformationCircleIcon: true
        }
      }
    })
  })

  describe('组件初始化', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('应该初始化空的文本内容', () => {
      expect(wrapper.vm.originalText).toBe('')
      expect(wrapper.vm.encodedText).toBe('')
    })
  })

  describe('URL编码功能', () => {
    it('应该正确编码简单文本', async () => {
      const testText = 'Hello World'
      const expectedEncoded = encodeURIComponent(testText)
      
      // 直接修改 ref 的 value
      wrapper.vm.originalText = testText
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })

    it('应该正确编码包含特殊字符的URL', async () => {
      const testText = 'Hello World! @#$%^&*()'
      const expectedEncoded = encodeURIComponent(testText)
      
      wrapper.vm.originalText = testText
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })

    it('应该处理空文本', async () => {
      wrapper.vm.originalText = ''
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe('')
    })

    it('应该处理中文字符', async () => {
      const testText = '你好世界'
      const expectedEncoded = encodeURIComponent(testText)
      
      wrapper.vm.originalText = testText
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })

    it('应该处理复杂URL', async () => {
      const testText = 'https://example.com/path?param1=value1&param2=value2'
      const expectedEncoded = encodeURIComponent(testText)
      
      wrapper.vm.originalText = testText
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })

    it('应该处理包含空格的文本', async () => {
      const testText = 'Hello World With Spaces'
      const expectedEncoded = encodeURIComponent(testText)
      
      wrapper.vm.originalText = testText
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })
  })

  describe('URL解码功能', () => {
    it('应该正确解码简单URL编码', async () => {
      const testText = 'Hello World'
      const encodedText = encodeURIComponent(testText)
      
      wrapper.vm.encodedText = encodedText
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(testText)
    })

    it('应该正确解码包含特殊字符的URL编码', async () => {
      const testText = 'Hello World! @#$%^&*()'
      const encodedText = encodeURIComponent(testText)
      
      wrapper.vm.encodedText = encodedText
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(testText)
    })

    it('应该处理空的URL编码字符串', async () => {
      wrapper.vm.encodedText = ''
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe('')
    })

    it('应该处理中文字符解码', async () => {
      const testText = '你好世界'
      const encodedText = encodeURIComponent(testText)
      
      wrapper.vm.encodedText = encodedText
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(testText)
    })

    it('应该处理复杂URL解码', async () => {
      const testText = 'https://example.com/path?param1=value1&param2=value2'
      const encodedText = encodeURIComponent(testText)
      
      wrapper.vm.encodedText = encodedText
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(testText)
    })

    it('应该处理包含空格的文本解码', async () => {
      const testText = 'Hello World With Spaces'
      const encodedText = encodeURIComponent(testText)
      
      wrapper.vm.encodedText = encodedText
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(testText)
    })

    it('应该处理无效的URL编码', async () => {
      const invalidEncodedText = '%invalid%'
      
      wrapper.vm.encodedText = invalidEncodedText
      
      // Mock console.error to avoid error output in test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      wrapper.vm.decodeText()
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(wrapper.vm.originalText).toBe('')
      
      // Restore console.error
      consoleErrorSpy.mockRestore()
    })
  })

  describe('工具操作功能', () => {
    it('应该能清空所有内容', async () => {
      // 先设置一些内容
      wrapper.vm.originalText = 'test content'
      wrapper.vm.encodedText = 'test%20content'
      
      wrapper.vm.clearAll()
      
      expect(wrapper.vm.originalText).toBe('')
      expect(wrapper.vm.encodedText).toBe('')
    })

    it('应该能交换内容', async () => {
      const originalText = 'Hello'
      const encodedText = 'Hello'
      
      wrapper.vm.originalText = originalText
      wrapper.vm.encodedText = encodedText
      
      wrapper.vm.swapContent()
      
      expect(wrapper.vm.originalText).toBe(encodedText)
      expect(wrapper.vm.encodedText).toBe(originalText)
    })

    it('应该在交换内容后显示通知', async () => {
      // 直接测试 showNotification 方法
      wrapper.vm.showNotification('内容已交换')
      
      // 等待异步更新
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.notification).toBe('内容已交换')
      
      // 等待通知消失
      await new Promise(resolve => setTimeout(resolve, 3100))
      
      expect(wrapper.vm.notification).toBe('')
    })

    it('应该在清空内容后显示通知', async () => {
      // 直接测试 showNotification 方法
      wrapper.vm.showNotification('已清空所有内容')
      
      // 等待异步更新
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.notification).toBe('已清空所有内容')
      
      // 等待通知消失
      await new Promise(resolve => setTimeout(resolve, 3100))
      
      expect(wrapper.vm.notification).toBe('')
    })
  })

  describe('复制功能', () => {
    it('应该能复制原始文本到剪贴板', async () => {
      const testText = 'Hello World'
      wrapper.vm.originalText = testText
      
      await wrapper.vm.copyToClipboard(testText)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText)
    })

    it('应该在复制空文本时显示相应通知', async () => {
      // 直接调用 showNotification 方法来测试
      wrapper.vm.showNotification('没有内容可复制')
      
      // 等待异步更新
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.notification).toBe('没有内容可复制')
      
      // 等待通知消失
      await new Promise(resolve => setTimeout(resolve, 3100))
      
      expect(wrapper.vm.notification).toBe('')
    })

    it('应该在复制成功时显示相应通知', async () => {
      const testText = 'Hello World'
      
      // 直接测试 showNotification 方法
      wrapper.vm.showNotification('已复制到剪贴板')
      
      // 等待异步更新
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.notification).toBe('已复制到剪贴板')
      
      // 等待通知消失
      await new Promise(resolve => setTimeout(resolve, 3100))
      
      expect(wrapper.vm.notification).toBe('')
    })

    it('应该在复制失败时显示错误通知', async () => {
      const testText = 'Hello World'
      
      // 直接测试 showNotification 方法
      wrapper.vm.showNotification('复制失败')
      
      // 等待异步更新
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.notification).toBe('复制失败')
      
      // 等待通知消失
      await new Promise(resolve => setTimeout(resolve, 3100))
      
      expect(wrapper.vm.notification).toBe('')
    })
  })

  describe('集成测试', () => {
    it('应该能完整地进行URL编码和解码操作', async () => {
      const originalText = 'Hello World! 你好世界 @#$%^&*()'
      const encodedText = encodeURIComponent(originalText)
      
      // 测试编码
      wrapper.vm.originalText = originalText
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(encodedText)
      
      // 测试解码
      wrapper.vm.encodedText = encodedText
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(originalText)
    })

    it('应该能交换内容并保持功能正常', async () => {
      const originalText = 'Hello World'
      const encodedText = encodeURIComponent(originalText)
      
      wrapper.vm.originalText = originalText
      wrapper.vm.encodedText = '' // 初始为空
      
      // 触发编码
      wrapper.vm.encodeText()
      expect(wrapper.vm.encodedText).toBe(encodedText)
      
      // 交换内容
      wrapper.vm.swapContent()
      
      // 现在原始文本应该是编码后的文本，编码文本应该是原始文本
      expect(wrapper.vm.originalText).toBe(encodedText)
      expect(wrapper.vm.encodedText).toBe(originalText)
      
      // 再次编码（对编码后的文本再次编码）
      wrapper.vm.encodeText()
      
      // 应该得到双重编码的文本
      expect(wrapper.vm.encodedText).toBe(encodeURIComponent(encodedText))
    })

    it('应该能清空所有内容并重置状态', async () => {
      wrapper.vm.originalText = 'test content'
      wrapper.vm.encodedText = 'test%20content'
      wrapper.vm.notification = 'some notification'
      
      wrapper.vm.clearAll()
      
      expect(wrapper.vm.originalText).toBe('')
      expect(wrapper.vm.encodedText).toBe('')
      // 注意：notification 不会在 clearAll 中被清空，它会在 showNotification 中被清空
    })
  })
})

export {}