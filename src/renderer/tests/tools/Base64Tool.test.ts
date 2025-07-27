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
  FolderOpenIcon: { name: 'FolderOpenIcon', template: '<div>FolderOpenIcon</div>' },
  InformationCircleIcon: { name: 'InformationCircleIcon', template: '<div>InformationCircleIcon</div>' }
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
} as any

global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  
  readAsDataURL(file: File) {
    setTimeout(() => {
      const content = (file as any).content.join('')
      this.result = `data:${file.type};base64,${btoa(content)}`
      if (this.onload) {
        this.onload({ target: { result: this.result } })
      }
    }, 0)
  }
} as any

describe('Base64Tool 组件测试', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    wrapper = mount(Base64Tool, {
      global: {
        stubs: {
          ArrowLeftIcon: true,
          KeyIcon: true,
          ArrowsRightLeftIcon: true,
          DocumentTextIcon: true,
          DocumentIcon: true,
          ClipboardIcon: true,
          FolderOpenIcon: true,
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

  describe('文本编码功能', () => {
    it('应该正确编码简单文本', async () => {
      const testText = 'Hello World'
      const expectedEncoded = btoa(testText)
      
      // 直接修改 ref 的 value
      wrapper.vm.originalText = testText
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe(expectedEncoded)
    })

    it('应该处理空文本', async () => {
      wrapper.vm.originalText = ''
      wrapper.vm.encodeText()
      
      expect(wrapper.vm.encodedText).toBe('')
    })
  })

  describe('文本解码功能', () => {
    it('应该正确解码简单Base64', async () => {
      const testText = 'Hello World'
      const encodedText = btoa(testText)
      
      wrapper.vm.encodedText = encodedText
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe(testText)
    })

    it('应该处理空的Base64字符串', async () => {
      wrapper.vm.encodedText = ''
      wrapper.vm.decodeText()
      
      expect(wrapper.vm.originalText).toBe('')
    })
  })

  describe('工具操作功能', () => {
    it('应该能清空所有内容', async () => {
      // 先设置一些内容
      wrapper.vm.originalText = 'test content'
      wrapper.vm.encodedText = 'dGVzdCBjb250ZW50'
      
      wrapper.vm.clearAll()
      
      expect(wrapper.vm.originalText).toBe('')
      expect(wrapper.vm.encodedText).toBe('')
    })

    it('应该能交换内容', async () => {
      const originalText = 'Hello'
      const encodedText = 'SGVsbG8='
      
      wrapper.vm.originalText = originalText
      wrapper.vm.encodedText = encodedText
      
      wrapper.vm.swapContent()
      
      expect(wrapper.vm.originalText).toBe(encodedText)
      expect(wrapper.vm.encodedText).toBe(originalText)
    })
  })

  describe('文件处理功能', () => {
    it('应该能处理文本文件', async () => {
      const fileContent = 'File content'
      const mockFile = new File([fileContent], 'test.txt', { type: 'text/plain' })
      
      wrapper.vm.processFile(mockFile)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(wrapper.vm.fileInfo).toEqual({
        name: 'test.txt',
        size: fileContent.length,
        type: 'text/plain'
      })
    })

    it('应该拒绝过大的文件', () => {
      // 创建一个超过10MB的真实模拟文件
      const largeContent = 'x'.repeat(1024) // 1KB 内容
      const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' })
      
      // 重写 size 属性为超过 10MB
      Object.defineProperty(mockFile, 'size', {
        value: 11 * 1024 * 1024, // 11MB
        writable: false,
        configurable: true
      })
      
      // 确保初始状态为 null
      wrapper.vm.fileInfo = null
      
      wrapper.vm.processFile(mockFile)
      
      // 由于文件过大，fileInfo 应该保持为 null
      expect(wrapper.vm.fileInfo).toBeNull()
    })

    it('应该能处理正常大小的文件', () => {
      // 创建一个小于10MB的文件
      const normalContent = 'Normal file content'
      const mockFile = new File([normalContent], 'normal.txt', { type: 'text/plain' })
      
      // 设置一个正常的文件大小
      Object.defineProperty(mockFile, 'size', {
        value: 1024, // 1KB
        writable: false,
        configurable: true
      })
      
      wrapper.vm.processFile(mockFile)
      
      // 文件应该被正常处理
      expect(wrapper.vm.fileInfo).not.toBeNull()
      expect(wrapper.vm.fileInfo.name).toBe('normal.txt')
      expect(wrapper.vm.fileInfo.size).toBe(1024)
    })
  })
})



