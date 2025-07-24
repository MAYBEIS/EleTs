/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 13:03:54
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-25 00:19:49
 * @FilePath: \EleTs\src\renderer\tests\setup.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { vi } from 'vitest'
import 'fake-indexeddb/auto'

// 设置 IndexedDB 模拟
global.indexedDB = require('fake-indexeddb')
global.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')

// Mock Electron APIs
global.window = Object.assign(global.window || {}, {
  electron: {
    ipcRenderer: {
      invoke: vi.fn(),
      send: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn()
    }
  }
})

// 使用字符串匹配而不是正则表达式来避免 id.replace 错误
vi.mock('*.css', () => ({}))
vi.mock('*.less', () => ({}))
vi.mock('*.scss', () => ({}))
vi.mock('*.sass', () => ({}))

// Vue 组件 mock - 使用字符串匹配
vi.mock('*.vue', () => ({
  default: {
    name: 'MockedComponent',
    render: () => null
  }
}))

// Mock console 但保持基本功能
const originalConsole = global.console
global.console = {
  ...originalConsole,
  log: vi.fn(),
  error: originalConsole.error, // 保留错误输出用于调试
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}




