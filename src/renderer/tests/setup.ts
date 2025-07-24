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

// Mock Vue 组件 - 全局处理 .vue 文件
vi.mock(/\.vue$/, () => ({
  default: {
    name: 'MockedComponent',
    template: '<div>Mocked Component</div>',
    props: {},
    data: () => ({}),
    methods: {}
  }
}))

// Mock Vue Router
vi.mock('vue-router', () => ({
  createRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  })),
  createWebHistory: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn()
  })),
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
    path: '/'
  }))
}))

// Mock Naive UI 组件
vi.mock('naive-ui', () => ({
  NTabs: { template: '<div class="n-tabs"><slot></slot></div>' },
  NTabPane: { template: '<div class="n-tab-pane"><slot></slot></div>' },
  NButton: { template: '<button><slot></slot></button>' },
  NCard: { template: '<div class="n-card"><slot></slot></div>' }
}))

// Mock console
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

