import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HashGeneratorTool from '../../src/view/HomePage/tools/HashGeneratorTool.vue'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('test text')
  }
})

describe('HashGeneratorTool', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(HashGeneratorTool, {
      global: {
        stubs: {
          // Stub the heroicons components
          ArrowLeftIcon: true,
          ShieldCheckIcon: true,
          ClipboardIcon: true,
          InformationCircleIcon: true
        }
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.find('h1').text()).toContain('哈希生成')
    expect(wrapper.find('p').text()).toContain('生成MD5、SHA1、SHA256等哈希值')
  })

  it('generates MD5 hash correctly', async () => {
    const input = wrapper.find('textarea[placeholder="请输入要生成哈希的文本..."]')
    await input.setValue('hello world')
    
    // 等待计算完成
    await wrapper.vm.$nextTick()
    
    const result = wrapper.find('textarea[readonly]').element.value
    expect(result).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3') // MD5 of "hello world"
  })

  it('generates SHA1 hash correctly', async () => {
    const input = wrapper.find('textarea[placeholder="请输入要生成哈希的文本..."]')
    await input.setValue('hello world')
    
    // 选择SHA1算法
    const sha1Button = wrapper.findAll('button').find(button => button.text().includes('SHA1'))
    await sha1Button.trigger('click')
    
    // 等待计算完成
    await wrapper.vm.$nextTick()
    
    const result = wrapper.find('textarea[readonly]').element.value
    expect(result).toBe('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed') // SHA1 of "hello world"
  })

  it('generates SHA256 hash correctly', async () => {
    const input = wrapper.find('textarea[placeholder="请输入要生成哈希的文本..."]')
    await input.setValue('hello world')
    
    // 选择SHA256算法
    const sha256Button = wrapper.findAll('button').find(button => button.text().includes('SHA256'))
    await sha256Button.trigger('click')
    
    // 等待计算完成
    await wrapper.vm.$nextTick()
    
    const result = wrapper.find('textarea[readonly]').element.value
    expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9') // SHA256 of "hello world"
  })

  it('clears all content when clear button is clicked', async () => {
    // 先输入一些文本
    const input = wrapper.find('textarea[placeholder="请输入要生成哈希的文本..."]')
    await input.setValue('test text')
    
    // 输入批量文本
    const batchInput = wrapper.find('textarea[placeholder="每行输入一个文本..."]')
    await batchInput.setValue('line1\nline2')
    
    // 点击清空按钮
    const clearButton = wrapper.find('button.px-4.py-2.text-sm.font-medium.text-gray-700')
    await clearButton.trigger('click')
    
    // 检查是否清空
    expect(wrapper.find('textarea[placeholder="请输入要生成哈希的文本..."]').element.value).toBe('')
    expect(wrapper.find('textarea[readonly]').element.value).toBe('')
    expect(wrapper.find('textarea[placeholder="每行输入一个文本..."]').element.value).toBe('')
  })

  it('counts characters correctly', async () => {
    const input = wrapper.find('textarea[placeholder="请输入要生成哈希的文本..."]')
    await input.setValue('hello')
    
    const charCount = wrapper.find('span.text-sm.text-gray-500').text()
    expect(charCount).toContain('5')
  })

  it('pastes from clipboard', async () => {
    const pasteButton = wrapper.find('button[title="从剪贴板粘贴"]')
    await pasteButton.trigger('click')
    
    // 检查是否调用了clipboard.readText
    expect(navigator.clipboard.readText).toHaveBeenCalled()
    
    // 检查输入框是否有内容
    const input = wrapper.find('textarea[placeholder="请输入要生成哈希的文本..."]')
    expect(input.element.value).toBe('test text')
  })

  it('copies to clipboard', async () => {
    // 先生成一个哈希
    const input = wrapper.find('textarea[placeholder="请输入要生成哈希的文本..."]')
    await input.setValue('hello')
    
    // 等待计算完成
    await wrapper.vm.$nextTick()
    
    // 点击复制按钮
    const copyButton = wrapper.find('button[title="复制"]')
    await copyButton.trigger('click')
    
    // 检查是否调用了clipboard.writeText
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('5eb63bbbe01eeed093cb22bb8f5acdc3')
  })

  it('handles batch hash generation', async () => {
    // 输入批量文本
    const batchInput = wrapper.find('textarea[placeholder="每行输入一个文本..."]')
    await batchInput.setValue('hello\nworld')
    
    // 点击生成批量哈希按钮
    const generateButton = wrapper.find('button.px-4.py-2.text-sm.font-medium.rounded-lg')
    await generateButton.trigger('click')
    
    // 检查是否生成了结果
    const tableRows = wrapper.findAll('tbody tr')
    expect(tableRows.length).toBe(2)
  })

  it('validates batch input limit', async () => {
    // 创建超过100行的输入
    const lines = Array(101).fill('test').join('\n')
    const batchInput = wrapper.find('textarea[placeholder="每行输入一个文本..."]')
    await batchInput.setValue(lines)
    
    // 检查按钮是否被禁用
    const generateButton = wrapper.find('button.px-4.py-2.text-sm.font-medium.rounded-lg')
    expect(generateButton.attributes('disabled')).toBeDefined()
  })
})