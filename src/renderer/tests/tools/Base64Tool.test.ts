import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Base64Tool from '../../src/view/HomePage/tools/Base64Tool.vue'

// Mock 图标组件
vi.mock('@heroicons/vue/24/outline', () => ({
  ArrowLeftIcon: { name: 'ArrowLeftIcon', template: '<div>ArrowLeftIcon</div>' },
  KeyIcon: { name: 'KeyIcon', template: '<div>KeyIcon</div>' },
  ArrowsRightLeftIcon: { name: 'ArrowsRightLeftIcon', template: '<div>ArrowsRightLeftIcon</div>' },
  DocumentTextIcon: { name: 'DocumentTextIcon', template: '<div>DocumentTextIcon</div>' },
  DocumentIcon: { name: 'DocumentIcon', template: '<div>DocumentIcon</div>' },
  ClipboardIcon: { name: 'ClipboardIcon', template: '<div>ClipboardIcon</div>' },
  FolderOpenIcon: { name: 'FolderOpenIcon', template: '<div>FolderOpenIcon</div>' }
}))

// Mock 剪贴板 API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve(''))
  }
})

// Mock 文件 API
global.File = class MockFile {
  constructor(public content: string[], public name: string, public options: any = {}) {}
  get size() { return this.content.join('').length }
  get type() { return this.options.type || 'text/plain' }
}

global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  
  readAsDataURL(file: File) {
    setTimeout(() => {
      // 模拟文件读取结果
      const content = (file as any).content.join('')
      this.result = `data:${file.type};base64,${btoa(content)}`
      if (this.onload) {
        this.onload({ target: { result: this.result } })
      }
    }, 0)
  }
}

describe('Base64Tool 组件测试', () => {
  let wrapper: any

  beforeEach(() => {
    // 清除所有 mock
    vi.clearAllMocks()
    
    // 挂载组件
    wrapper = mount(Base64Tool, {
      global: {
        stubs: {
          // 存根图标组件
          ArrowLeftIcon: true,
          KeyIcon: true,
          ArrowsRightLeftIcon: true,
          DocumentTextIcon: true,
          DocumentIcon: true,
          ClipboardIcon: true,
          FolderOpenIcon: true
        }
      }
    })
  })

  describe('组件初始化', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('h1').text()).toContain('Base64 编码转换')
    })

    it('应该默认显示文本模式', () => {
      expect(wrapper.vm.mode).toBe('text')
      expect(wrapper.find('[data-testid="text-mode"]').exists()).toBe(true)
    })

    it('应该初始化空的文本内容', () => {
      expect(wrapper.vm.originalText).toBe('')
      expect(wrapper.vm.encodedText).toBe('')
    })
  })

  describe('模式切换功能', () => {
    it('应该能切换到文件模式', async () => {
      const fileButton = wrapper.find('button:contains("文件模式")')
      await fileButton.trigger('click')
      
      expect(wrapper.vm.mode).toBe('file')
    })

    it('应该能从文件模式切换回文本模式', async () => {
      wrapper.vm.mode = 'file'
      await wrapper.vm.$nextTick()
      
      const textButton = wrapper.find('button:contains("文本模式")')
      await textButton.trigger('click')
      
      expect(wrapper.vm.mode).toBe('text')
    })
  })

  describe('文本编码功能', () => {
    it('应该正确编码简单文本', async () => {
      const testText = 'Hello World'
      const expectedEncoded = btoa(testText)
      
      await wrapper.setData({ originalText: testText })
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })

    it('应该正确编码中文文本', async () => {
      const testText = '你好世界'
      const expectedEncoded = btoa(unescape(encodeURIComponent(testText)))
      
      await wrapper.setData({ originalText: testText })
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })

    it('应该正确编码特殊字符', async () => {
      const testText = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const expectedEncoded = btoa(testText)
      
      await wrapper.setData({ originalText: testText })
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })

    it('应该处理空文本', async () => {
      await wrapper.setData({ originalText: '' })
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe('')
    })
  })

  describe('文本解码功能', () => {
    it('应该正确解码简单Base64', async () => {
      const testText = 'Hello World'
      const encodedText = btoa(testText)
      
      await wrapper.setData({ encodedText })
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(testText)
    })

    it('应该正确解码中文Base64', async () => {
      const testText = '你好世界'
      const encodedText = btoa(unescape(encodeURIComponent(testText)))
      
      await wrapper.setData({ encodedText })
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(testText)
    })

    it('应该处理无效的Base64字符串', async () => {
      const invalidBase64 = 'invalid-base64!'
      
      await wrapper.setData({ encodedText: invalidBase64 })
      wrapper.vm.decodeText()
      
      // 应该保持原始文本不变或清空
      expect(wrapper.vm.originalText).toBe('')
    })

    it('应该处理空的Base64字符串', async () => {
      await wrapper.setData({ encodedText: '' })
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe('')
    })
  })

  describe('工具操作功能', () => {
    it('应该能清空所有内容', async () => {
      // 设置一些内容
      await wrapper.setData({
        originalText: 'test content',
        encodedText: 'dGVzdCBjb250ZW50'
      })
      
      // 点击清空按钮
      const clearButton = wrapper.find('button:contains("清空")')
      await clearButton.trigger('click')
      
      expect(wrapper.vm.originalText).toBe('')
      expect(wrapper.vm.encodedText).toBe('')
    })

    it('应该能交换内容', async () => {
      const originalText = 'Hello'
      const encodedText = 'SGVsbG8='
      
      await wrapper.setData({ originalText, encodedText })
      
      // 点击交换按钮
      const swapButton = wrapper.find('button:contains("交换")')
      await swapButton.trigger('click')
      
      expect(wrapper.vm.originalText).toBe(encodedText)
      expect(wrapper.vm.encodedText).toBe(originalText)
    })
  })

  describe('剪贴板功能', () => {
    it('应该能复制原始文本到剪贴板', async () => {
      const testText = 'Hello World'
      await wrapper.setData({ originalText: testText })
      
      await wrapper.vm.copyToClipboard(testText)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText)
    })

    it('应该能复制编码文本到剪贴板', async () => {
      const encodedText = 'SGVsbG8gV29ybGQ='
      await wrapper.setData({ encodedText })
      
      await wrapper.vm.copyToClipboard(encodedText)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(encodedText)
    })

    it('应该能从剪贴板粘贴内容', async () => {
      const clipboardText = 'Pasted content'
      vi.mocked(navigator.clipboard.readText).mockResolvedValue(clipboardText)
      
      await wrapper.vm.pasteFromClipboard()
      
      expect(navigator.clipboard.readText).toHaveBeenCalled()
      expect(wrapper.vm.originalText).toBe(clipboardText)
    })
  })

  describe('文件处理功能', () => {
    it('应该能处理文本文件', async () => {
      const fileContent = 'File content'
      const mockFile = new File([fileContent], 'test.txt', { type: 'text/plain' })
      
      await wrapper.vm.handleFileSelect(mockFile)
      
      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(wrapper.vm.selectedFile).toBe(mockFile)
      expect(wrapper.vm.fileBase64).toContain(btoa(fileContent))
    })

    it('应该能处理图片文件', async () => {
      const fileContent = 'fake-image-data'
      const mockFile = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
      
      await wrapper.vm.handleFileSelect(mockFile)
      
      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(wrapper.vm.selectedFile).toBe(mockFile)
      expect(wrapper.vm.fileBase64).toContain('data:image/jpeg;base64,')
    })

    it('应该拒绝过大的文件', async () => {
      // 创建一个超过10MB的模拟文件
      const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
      const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' })
      Object.defineProperty(mockFile, 'size', { value: 11 * 1024 * 1024 })
      
      await wrapper.vm.handleFileSelect(mockFile)
      
      expect(wrapper.vm.selectedFile).toBeNull()
      expect(wrapper.vm.fileBase64).toBe('')
    })
  })

  describe('事件发射', () => {
    it('应该发射back事件', async () => {
      const backButton = wrapper.find('button:contains("返回")')
      await backButton.trigger('click')
      
      expect(wrapper.emitted('back')).toBeTruthy()
      expect(wrapper.emitted('back')).toHaveLength(1)
    })
  })

  describe('响应式数据', () => {
    it('应该正确计算字符数', async () => {
      const testText = 'Hello'
      await wrapper.setData({ originalText: testText })
      
      expect(wrapper.find('.text-sm:contains("5 字符")').exists()).toBe(true)
    })

    it('应该在输入时自动编码', async () => {
      const textarea = wrapper.find('textarea[placeholder*="请输入要编码的文本"]')
      await textarea.setValue('Test')
      await textarea.trigger('input')
      
      expect(wrapper.vm.encodedText).toBe(btoa('Test'))
    })

    it('应该在输入编码时自动解码', async () => {
      const encodedTextarea = wrapper.find('textarea[placeholder*="输入Base64编码"]')
      const testEncoded = btoa('Decoded')
      
      await encodedTextarea.setValue(testEncoded)
      await encodedTextarea.trigger('input')
      
      expect(wrapper.vm.originalText).toBe('Decoded')
    })
  })
})