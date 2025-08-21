import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ipcMain } from 'electron'
import nodeFetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import { initCivitaiIpc } from '../../ipc/civitaiIpc'

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
  },
  net: {
    request: vi.fn()
  }
}))

// Mock node-fetch
vi.mock('node-fetch')

// Mock https-proxy-agent
vi.mock('https-proxy-agent')

// Mock http-proxy-agent
vi.mock('http-proxy-agent')

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

describe('Civitai IPC 处理程序测试', () => {
  beforeEach(() => {
    // 清理所有模拟
    vi.clearAllMocks()
    // 初始化 IPC 处理程序
    initCivitaiIpc()
  })

  afterEach(() => {
    // 清理
    ipcHandlers.clear()
    vi.clearAllMocks()
  })

  describe('civitai-ping 处理程序', () => {
    it('应该正确处理 ping 消息', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // 触发 ping 处理程序
      const pingHandler = ipcHandlers.get('civitai-ping')
      expect(pingHandler).toBeDefined()
      
      if (pingHandler) {
        pingHandler()
        expect(consoleLogSpy).toHaveBeenCalledWith('[Civitai IPC] pong')
      }
      
      consoleLogSpy.mockRestore()
    })
  })

  describe('civitai-app-quit 处理程序', () => {
    it('应该正确处理应用退出请求', async () => {
      const mockAppQuit = vi.mocked((await import('electron')).app.quit)
      
      const result = await callIpcHandler('civitai-app-quit')
      
      expect(mockAppQuit).toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  describe('civitai-open-dev-tools 处理程序', () => {
    it('应该正确处理打开开发者工具请求', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = await callIpcHandler('civitai-open-dev-tools')
      
      expect(consoleLogSpy).toHaveBeenCalledWith('[Civitai IPC] 收到打开开发者工具请求')
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Civitai IPC] 警告：当前实现未实际打开开发者工具，需要在主进程中获取 mainWindow 对象')
      expect(result).toBeUndefined()
      
      consoleLogSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('fetch-civitai-homepage-models 处理程序', () => {
    it('应该成功获取 Civitai 主页模型数据', async () => {
      const mockData = { items: [{ id: 1, name: 'Test Model' }] }
      const mockResponse = mockFetchResponse(mockData)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      const options = { headers: { 'Authorization': 'Bearer test-token' } }
      
      const result = await callIpcHandler('fetch-civitai-homepage-models', options)
      
      expect(nodeFetch).toHaveBeenCalledWith('https://civitai.com/api/v1/models?sort=Most+Downloaded&period=AllTime', {
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        }),
        signal: expect.any(Object)
      })
      expect(result).toEqual({ ok: true, data: mockData })
    })

    it('应该处理网络请求失败', async () => {
      vi.mocked(nodeFetch).mockRejectedValue(new Error('Network error'))
      
      const options = { headers: {} }
      
      const result = await callIpcHandler('fetch-civitai-homepage-models', options)
      
      expect(result).toEqual({ 
        ok: false, 
        error: 'Network error' 
      })
    })

    it('应该使用自定义 HTTPS 代理发送请求', async () => {
      const mockData = { items: [{ id: 1, name: 'Test Model' }] }
      const mockResponse = mockFetchResponse(mockData)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      // Mock HttpsProxyAgent
      const mockAgent = { agent: 'test' }
      vi.mocked(HttpsProxyAgent).mockImplementation(() => mockAgent as any)
      
      const options = { 
        headers: {},
        proxy: { server: 'https://127.0.0.1:1080', enabled: true },
        useSystemProxy: false
      }
      
      const result = await callIpcHandler('fetch-civitai-homepage-models', options)
      
      expect(HttpsProxyAgent).toHaveBeenCalledWith('https://127.0.0.1:1080')
      expect(nodeFetch).toHaveBeenCalledWith('https://civitai.com/api/v1/models?sort=Most+Downloaded&period=AllTime', {
        method: 'GET',
        headers: expect.any(Object),
        agent: mockAgent,
        signal: expect.any(Object)
      })
      expect(result).toEqual({ ok: true, data: mockData })
    })

    it('应该使用自定义 HTTP 代理发送请求', async () => {
      const mockData = { items: [{ id: 1, name: 'Test Model' }] }
      const mockResponse = mockFetchResponse(mockData)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      // Mock HttpProxyAgent
      const mockAgent = { agent: 'test' }
      vi.mocked(HttpProxyAgent).mockImplementation(() => mockAgent as any)
      
      const options = { 
        headers: {},
        proxy: { server: 'http://127.0.0.1:1080', enabled: true },
        useSystemProxy: false
      }
      
      const result = await callIpcHandler('fetch-civitai-homepage-models', options)
      
      expect(HttpProxyAgent).toHaveBeenCalledWith('http://127.0.0.1:1080')
      expect(nodeFetch).toHaveBeenCalledWith('https://civitai.com/api/v1/models?sort=Most+Downloaded&period=AllTime', {
        method: 'GET',
        headers: expect.any(Object),
        agent: mockAgent,
        signal: expect.any(Object)
      })
      expect(result).toEqual({ ok: true, data: mockData })
    })

    it('应该在代理失败时尝试直接连接', async () => {
      // 第一次调用失败，第二次调用成功
      vi.mocked(nodeFetch)
        .mockRejectedValueOnce(new Error('Proxy error'))
        .mockResolvedValueOnce(mockFetchResponse({ items: [] }) as any)
      
      const options = { 
        headers: {},
        proxy: { server: 'http://127.0.0.1:1080', enabled: true },
        useSystemProxy: false
      }
      
      const result = await callIpcHandler('fetch-civitai-homepage-models', options)
      
      // 应该调用两次 fetch（代理一次，直接一次）
      expect(nodeFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ ok: true, data: { items: [] } })
    })
  })

  describe('update-civitai-proxy-settings 处理程序', () => {
    it('应该成功更新代理设置', async () => {
      const settings = {
        server: 'http://127.0.0.1:1080',
        enabled: true,
        useSystemProxy: false
      }
      
      const result = await callIpcHandler('update-civitai-proxy-settings', settings)
      
      expect(result).toEqual({ success: true })
    })

    it('应该处理更新代理设置时的异常', async () => {
      // 模拟全局对象不可写入的情况
      const result = await callIpcHandler('update-civitai-proxy-settings', null)
      
      // 即使传入 null，也应该返回成功（因为当前实现中没有验证）
      expect(result).toEqual({ success: true })
    })
  })

  describe('test-civitai-proxy-connection 处理程序', () => {
    it('应该成功测试 HTTPS 代理连接', async () => {
      const mockResponse = mockFetchResponse({}, true, 200)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      // Mock HttpsProxyAgent
      const mockAgent = { agent: 'test' }
      vi.mocked(HttpsProxyAgent).mockImplementation(() => mockAgent as any)
      
      const proxyServer = 'https://127.0.0.1:1080'
      
      const result = await callIpcHandler('test-civitai-proxy-connection', proxyServer)
      
      expect(HttpsProxyAgent).toHaveBeenCalledWith(proxyServer)
      expect(nodeFetch).toHaveBeenCalledWith('https://www.google.com', {
        method: 'GET',
        headers: expect.any(Object),
        agent: mockAgent,
        signal: expect.any(Object)
      })
      expect(result).toEqual({ success: true })
    })

    it('应该成功测试 HTTP 代理连接', async () => {
      const mockResponse = mockFetchResponse({}, true, 200)
      vi.mocked(nodeFetch).mockResolvedValue(mockResponse as any)
      
      // Mock HttpProxyAgent
      const mockAgent = { agent: 'test' }
      vi.mocked(HttpProxyAgent).mockImplementation(() => mockAgent as any)
      
      const proxyServer = 'http://127.0.0.1:1080'
      
      const result = await callIpcHandler('test-civitai-proxy-connection', proxyServer)
      
      expect(HttpProxyAgent).toHaveBeenCalledWith(proxyServer)
      expect(nodeFetch).toHaveBeenCalledWith('https://www.google.com', {
        method: 'GET',
        headers: expect.any(Object),
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
      
      const proxyServer = 'https://127.0.0.1:1080'
      
      const result = await callIpcHandler('test-civitai-proxy-connection', proxyServer)
      
      expect(result).toEqual({ 
        success: false, 
        error: 'Connection failed' 
      })
    })

    it('应该处理空代理服务器的情况', async () => {
      const proxyServer = ''
      
      const result = await callIpcHandler('test-civitai-proxy-connection', proxyServer)
      
      expect(nodeFetch).not.toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })
  })
})