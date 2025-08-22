import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ipcMain, dialog } from 'electron'
import { initDownloadIpc } from '../../ipc/downIpc'
import { ModelDownloader } from '../../utils/modelDown'

// 模拟 IPC 处理器存储 - 需要在所有 mock 之前定义以避免提升问题
const ipcHandlers = new Map<string, Function>()

// Mock electron 模块
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
    on: vi.fn()
  },
  dialog: {
    showOpenDialog: vi.fn()
  },
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data')
  }
}))

// Mock the mainWindow import in downIpc.ts
vi.mock('../../index', () => ({
  mainWindow: {
    webContents: {
      send: vi.fn()
    }
  }
}))

// Mock fs 模块
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn()
  }
}))

// Mock ModelDownloader 类
vi.mock('../../utils/modelDown', () => ({
  ModelDownloader: vi.fn().mockImplementation(() => ({
    updateConfig: vi.fn(),
    downloadModel: vi.fn().mockResolvedValue(true),
    resumeDownload: vi.fn().mockResolvedValue(true),
    pauseDownload: vi.fn().mockReturnValue(true),
    cancelDownload: vi.fn().mockReturnValue(true),
    getDownloadTask: vi.fn().mockReturnValue({ id: 'test-task', status: 'downloading' })
  }))
}))

// Mock ipcMain.handle 实现
let mockIpcHandle: any

// 辅助函数：调用 IPC 处理器
const callIpcHandler = async (channel: string, ...args: any[]) => {
  const handler = ipcHandlers.get(channel)
  if (!handler) {
    throw new Error(`No handler found for channel: ${channel}`)
  }
  // 对于 handle 类型的处理器，第一个参数是事件对象
  if (channel !== 'download-ping') {
    return await handler({} as Electron.IpcMainInvokeEvent, ...args)
  } else {
    // 对于 on 类型的处理器，没有返回值
    handler()
    return undefined
  }
}

describe('下载 IPC 处理程序测试', () => {
  beforeEach(() => {
    // 清理所有模拟
    vi.clearAllMocks()
    // 清空 IPC 处理器映射
    ipcHandlers.clear()
    
    // Mock ipcMain.handle 实现
    mockIpcHandle = vi.mocked(ipcMain.handle)
    mockIpcHandle.mockImplementation((channel: string, handler: Function) => {
      ipcHandlers.set(channel, handler);
      return { on: vi.fn() } as any;
    })
    
    // 初始化 IPC 处理程序
    initDownloadIpc()
  })

  afterEach(() => {
    // 清理
    ipcHandlers.clear()
    vi.clearAllMocks()
  })

  describe('download-ping 处理程序', () => {
    it('应该正确处理 download-ping 消息', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // 触发 download-ping 处理程序
      const pingHandler = ipcHandlers.get('download-ping')
      expect(pingHandler).toBeDefined()
      
      if (pingHandler) {
        pingHandler()
        expect(consoleLogSpy).toHaveBeenCalledWith('download-pong')
      }
      
      consoleLogSpy.mockRestore()
    })
  })

  describe('download-model 处理程序', () => {
    it('应该成功下载模型', async () => {
      const result = await callIpcHandler('download-model', 'http://example.com/model.zip', 'model.zip', 'test-task-1')
      
      expect(result).toEqual({ success: true })
      expect(ModelDownloader).toHaveBeenCalled()
    })

    it('应该处理下载失败', async () => {
      // 模拟下载失败
      const mockModelDownloader = {
        updateConfig: vi.fn(),
        downloadModel: vi.fn().mockResolvedValue(false)
      }
      vi.mocked(ModelDownloader).mockImplementation(() => mockModelDownloader as any)
      
      const result = await callIpcHandler('download-model', 'http://example.com/model.zip', 'model.zip', 'test-task-2')
      
      expect(result).toEqual({ success: false, error: 'Failed to start download' })
    })
  })

  describe('resume-download 处理程序', () => {
    it('应该成功恢复下载', async () => {
      const result = await callIpcHandler('resume-download', 'http://example.com/model.zip', 'model.zip', 'test-task-3')
      
      expect(result).toEqual({ success: true })
    })

    it('应该处理恢复下载失败', async () => {
      // 模拟恢复下载失败
      const mockModelDownloader = {
        updateConfig: vi.fn(),
        resumeDownload: vi.fn().mockResolvedValue(false)
      }
      vi.mocked(ModelDownloader).mockImplementation(() => mockModelDownloader as any)
      
      const result = await callIpcHandler('resume-download', 'http://example.com/model.zip', 'model.zip', 'test-task-4')
      
      expect(result).toEqual({ success: false, error: 'Failed to start resume download' })
    })
  })

  describe('pause-download 处理程序', () => {
    it('应该成功暂停下载', async () => {
      const result = await callIpcHandler('pause-download', 'test-task-5')
      
      expect(result).toEqual({ success: true })
    })

    it('应该处理暂停下载失败', async () => {
      // 模拟暂停下载失败
      const mockModelDownloader = {
        updateConfig: vi.fn(),
        pauseDownload: vi.fn().mockReturnValue(false)
      }
      vi.mocked(ModelDownloader).mockImplementation(() => mockModelDownloader as any)
      
      const result = await callIpcHandler('pause-download', 'test-task-6')
      
      expect(result).toEqual({ success: false, error: 'Failed to pause download' })
    })
  })

  describe('cancel-download 处理程序', () => {
    it('应该成功取消下载', async () => {
      const result = await callIpcHandler('cancel-download', 'test-task-7')
      
      expect(result).toEqual({ success: true })
    })

    it('应该处理取消下载失败', async () => {
      // 模拟取消下载失败
      const mockModelDownloader = {
        updateConfig: vi.fn(),
        cancelDownload: vi.fn().mockReturnValue(false)
      }
      vi.mocked(ModelDownloader).mockImplementation(() => mockModelDownloader as any)
      
      const result = await callIpcHandler('cancel-download', 'test-task-8')
      
      expect(result).toEqual({ success: false, error: 'Failed to cancel download' })
    })
  })

  describe('get-download-task 处理程序', () => {
    it('应该成功获取下载任务信息', async () => {
      const result = await callIpcHandler('get-download-task', 'test-task-9')
      
      expect(result).toEqual({ success: true, data: { id: 'test-task', status: 'downloading' } })
    })

    it('应该处理获取下载任务信息失败', async () => {
      // 模拟获取下载任务信息失败
      const mockModelDownloader = {
        updateConfig: vi.fn(),
        getDownloadTask: vi.fn().mockReturnValue(null)
      }
      vi.mocked(ModelDownloader).mockImplementation(() => mockModelDownloader as any)
      
      const result = await callIpcHandler('get-download-task', 'test-task-10')
      
      expect(result).toEqual({ success: false, error: 'Download task not found' })
    })
  })

  describe('select-download-directory 处理程序', () => {
    it('应该成功选择下载目录', async () => {
      // 模拟 dialog.showOpenDialog 的返回值
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/mock/download/directory']
      } as any)
      
      const result = await callIpcHandler('select-download-directory')
      
      expect(result).toEqual({ success: true, data: '/mock/download/directory' })
    })

    it('应该处理用户取消选择', async () => {
      // 模拟用户取消选择
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: []
      } as any)
      
      const result = await callIpcHandler('select-download-directory')
      
      expect(result).toEqual({ success: false, error: 'User cancelled selection' })
    })
  })

  describe('save-download-directory 处理程序', () => {
    it('应该成功保存下载目录设置', async () => {
      const result = await callIpcHandler('save-download-directory', '/new/download/directory')
      
      expect(result).toEqual({ success: true })
    })
  })

  describe('get-download-directory 处理程序', () => {
    it('应该成功获取下载目录设置', async () => {
      const result = await callIpcHandler('get-download-directory')
      
      expect(result).toEqual({ success: true, data: '' })
    })
  })

  describe('update-proxy-settings 处理程序', () => {
    it('应该成功更新代理设置', async () => {
      const proxySettings = {
        server: 'http://127.0.0.1:1080',
        enabled: true,
        useSystemProxy: false
      }
      
      const result = await callIpcHandler('update-proxy-settings', proxySettings)
      
      expect(result).toEqual({ success: true })
    })
  })

  describe('get-proxy-settings 处理程序', () => {
    it('应该成功获取代理设置', async () => {
      const result = await callIpcHandler('get-proxy-settings')
      
      expect(result).toEqual({ success: true, data: { server: undefined, enabled: false, useSystemProxy: false } })
    })
  })
})