import { describe, it, expect } from 'vitest'

describe('基础测试', () => {
  it('应该能运行基本测试', () => {
    expect(1 + 1).toBe(2)
  })

  it('应该能测试字符串', () => {
    expect('hello').toBe('hello')
  })

  it('应该能测试对象', () => {
    const obj = { name: 'test', value: 42 }
    expect(obj.name).toBe('test')
    expect(obj.value).toBe(42)
  })
})