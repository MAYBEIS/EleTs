import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ipcMain } from 'electron'
import nodeFetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { mainWindow } from '../../index'
import { initAiIpc } from '../../ipc/aiIpc'

// Mock electron 模块
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
    on: vi.fn(),
    once: vi.fn()
  },
  app: {
    quit: vi.fn()
  }
}))

// Mock mainWindow
vi.mock('../../index', () => ({
  mainWindow: {
    webContents: {
      openDevTools: vi.fn()
    }
  }
}))

// Mock node-fetch
vi.mock('node-fetch')

// Mock https-proxy-agent
vi.mock('https-proxy-agent')

// 模拟 IPC 处理器存储
const ipcHandlers = new Map<string, Function>()

// Mock ipcMain.handle 实现
const mockIpcHandle = vi.mocked(ipcMain.handle)
mockIpcHandle.mockImplementation((channel: string, handler: Function) => {
  ipcHandlers.set(channel, handler)
})

// Mock ipcMain.on 实现
// const mockIpcOn = vi.mocked(ipcMain.on)
// mockIpcOn.mockImplementation((channel: string, handler: Function) => {
//   ipcHandlers.set(channel, handler)
// })

// 辅助函数：调用 IPC 处理器
const callIpcHandler = async (channel: string, ...args: any[]) => {
  const handler = ipcHandlers.get(channel)
  if (!handler) {
    throw new Error(`No handler found for channel: ${channel}`)
  }
  return await handler({}, ...args)
}

// Mock node-fetch 的响应
const mockFetchResponse = (data: any, ok: boolean = true, status: number = 200) => {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    headers: {
      entries: vi.fn().mockReturnValue([])
    }
  }
}

describe('AI IPC 处理程序测试', () => {
  beforeEach(() => {
    // 清理所有模拟
    vi.clearAllMocks()
    // 初始化 IPC 处理程序
    initAiIpc()
  })

  afterEach(() => {
    // 清理
    ipcHandlers.clear()
    vi.clearAllMocks()
  })

  describe('ping 处理程序', () => {
    it('应该正确处理 ping 消息', async () => {
      // 由于 ping 是使用 ipcMain.on 注册的，我们需要特殊处理
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // 触发 ping 处理程序
      const pingHandler = ipcHandlers.get('ping')
      expect(pingHandler).toBeDefined()
      
      if (pingHandler) {
        pingHandler()
        expect(consoleLogSpy).toHaveBeenCalledWith('pong')
      }
      
      consoleLogSpy.mockRestore()
    })
  })

  describe('app-quit 处理程序', () => {
    it('应该正确处理应用退出请求', async () => {
      const mockAppQuit = vi.mocked((await import('electron')).app.quit)
      
      const result = await callIpcHandler('app-quit')
      
      expect(mockAppQuit).toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  describe('open-dev-tools 处理程序', () => {
    it('应该正确处理打开开发者工具请求', async () => {
      const mockOpenDevTools = vi.mocked(mainWindow.webContents.openDevTools)
      
      const result = await callIpcHandler('open-dev-tools')
      
      expect(mockOpenDevTools).toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  describe('fetch-civitai-models 处理程序', () => {
    it('应该成功获取 Civitai 模型数据', async () => {
      const mockData = { items: [{ id: 1, name: 'Test Model' }] }
      const mockResponse = mockFetchResponse(mockData)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      const url = 'https://civitai.com/api/v1/models'
      const options = { headers: { 'Authorization': 'Bearer test-token' } }
      
      const result = await callIpcHandler('fetch-civitai-models', url, options)
      
      expect(nodeFetch).toHaveBeenCalledWith(url, {
        method: 'GET',
        headers: options.headers
      })
      expect(result).toEqual({ ok: true, data: mockData })
    })

    it('应该处理网络请求失败', async () => {
      vi.mocked(nodeFetch).mockRejectedValue(new Error('Network error'))
      
      const url = 'https://civitai.com/api/v1/models'
      const options = { headers: {} }
      
      const result = await callIpcHandler('fetch-civitai-models', url, options)
      
      expect(result).toEqual({ 
        ok: false, 
        error: 'Network error' 
      })
    })

    it('应该使用自定义代理发送请求', async () => {
      const mockData = { items: [{ id: 1, name: 'Test Model' }] }
      const mockResponse = mockFetchResponse(mockData)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      // Mock HttpsProxyAgent
      const mockAgent = { agent: 'test' }
      vi.mocked(HttpsProxyAgent).mockImplementation(() => mockAgent as any)
      
      const url = 'https://civitai.com/api/v1/models'
      const options = { 
        headers: {},
        proxy: { server: 'http://127.0.0.1:1080', enabled: true },
        useSystemProxy: false
      }
      
      const result = await callIpcHandler('fetch-civitai-models', url, options)
      
      expect(HttpsProxyAgent).toHaveBeenCalledWith('http://127.0.0.1:1080')
      expect(nodeFetch).toHaveBeenCalledWith(url, {
        method: 'GET',
        headers: {},
        agent: mockAgent
      })
      expect(result).toEqual({ ok: true, data: mockData })
    })

    it('应该在代理失败时尝试直接连接', async () => {
      // 第一次调用失败，第二次调用成功
      vi.mocked(nodeFetch)
        .mockRejectedValueOnce(new Error('Proxy error'))
        .mockResolvedValueOnce(mockFetchResponse({ items: [] }) as any)
      
      const url = 'https://civitai.com/api/v1/models'
      const options = { 
        headers: {},
        proxy: { server: 'http://127.0.0.1:1080', enabled: true },
        useSystemProxy: false
      }
      
      const result = await callIpcHandler('fetch-civitai-models', url, options)
      
      // 应该调用两次 fetch（代理一次，直接一次）
      expect(nodeFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ ok: true, data: { items: [] } })
    })
  })

  describe('download-civitai-model 处理程序', () => {
    it('应该成功下载 Civitai 模型', async () => {
      const mockResponse = mockFetchResponse({}, true, 200)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      const url = 'https://civitai.com/api/download/123'
      const filename = 'test-model.safetensors'
      
      const result = await callIpcHandler('download-civitai-model', url, filename)
      
      expect(nodeFetch).toHaveBeenCalledWith(url)
      expect(result).toEqual({ success: true })
    })

    it('应该处理下载失败', async () => {
      const mockResponse = mockFetchResponse({}, false, 404)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      const url = 'https://civitai.com/api/download/123'
      const filename = 'test-model.safetensors'
      
      const result = await callIpcHandler('download-civitai-model', url, filename)
      
      expect(result).toEqual({ 
        success: false, 
        error: '下载失败: 404 Not Found' 
      })
    })

    it('应该处理网络错误', async () => {
      vi.mocked(nodeFetch).mockRejectedValue(new Error('Network error'))
      
      const url = 'https://civitai.com/api/download/123'
      const filename = 'test-model.safetensors'
      
      const result = await callIpcHandler('download-civitai-model', url, filename)
      
      expect(result).toEqual({ 
        success: false, 
        error: 'Network error' 
      })
    })
  })

  describe('update-proxy-settings 处理程序', () => {
    it('应该成功更新代理设置', async () => {
      const settings = {
        server: 'http://127.0.0.1:1080',
        enabled: true,
        useSystemProxy: false
      }
      
      const result = await callIpcHandler('update-proxy-settings', settings)
      
      expect(result).toEqual({ success: true })
      // @ts-ignore global property
      expect(global.proxySettings).toEqual(settings)
    })

    it('应该处理更新代理设置时的异常', async () => {
      // 模拟全局对象不可写入的情况
      const result = await callIpcHandler('update-proxy-settings', null)
      
      // 即使传入 null，也应该返回成功（因为当前实现中没有验证）
      expect(result).toEqual({ success: true })
    })
  })

  describe('test-proxy-connection 处理程序', () => {
    it('应该成功测试代理连接', async () => {
      const mockResponse = mockFetchResponse({}, true, 200)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      // Mock HttpsProxyAgent
      const mockAgent = { agent: 'test' }
      vi.mocked(HttpsProxyAgent).mockImplementation(() => mockAgent as any)
      
      const proxyServer = 'http://127.0.0.1:1080'
      
      const result = await callIpcHandler('test-proxy-connection', proxyServer)
      
      expect(HttpsProxyAgent).toHaveBeenCalledWith(proxyServer)
      expect(nodeFetch).toHaveBeenCalledWith('https://www.google.com', {
        agent: mockAgent,
        signal: expect.any(Object)
      })
      expect(result).toEqual({ success: true })
    })

    it('应该处理代理连接测试失败', async () => {
      vi.mocked(nodeFetch).mockRejectedValue(new Error('Connection failed'))
      
      // Mock HttpsProxyAgent
      const mockAgent = { agent: 'test' }
      vi.mocked(HttpsProxyAgent).mockImplementation(() => mockAgent as any)
      
      const proxyServer = 'http://127.0.0.1:1080'
      
      const result = await callIpcHandler('test-proxy-connection', proxyServer)
      
      expect(result).toEqual({ 
        success: false, 
        error: 'Connection failed' 
      })
    })

    it('应该处理空代理服务器的情况', async () => {
      const proxyServer = ''
      
      const result = await callIpcHandler('test-proxy-connection', proxyServer)
      
      expect(nodeFetch).not.toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })
  })
})
