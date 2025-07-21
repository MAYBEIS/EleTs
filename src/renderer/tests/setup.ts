import { vi } from 'vitest'
import 'fake-indexeddb/auto'

// Mock Electron APIs
global.window = Object.assign(global.window, {
  electron: {
    ipcRenderer: {
      invoke: vi.fn(),
      send: vi.fn(),
      on: vi.fn()
    }
  }
})

// Mock console 避免测试时的日志输出
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}