import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain, IpcMainInvokeEvent, WebContents } from 'electron';
import {
  CivitaiIpcHandler,
  CivitaiIpcRequest,
  CivitaiIpcResponse,
  CivitaiIpcEvents,
  registerCivitaiIpcHandlers,
  removeCivitaiIpcHandlers
} from '../../ipc/civitaiIpc';
import { CivitaiClient, CivitaiModel, CivitaiModelVersion, ProxyConfig, BrowserHeaders, DownloadResult } from '../../utils/coreCivitai';
import log from 'electron-log';

// Mock 模块
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn()
  },
  IpcMainInvokeEvent: vi.fn()
}));

vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    transports: {
      console: {
        format: '[{level}] {y}-{m}-{d} {h}:{i}:{s}.{ms} > {text}'
      },
      file: {
        format: '[{level}] {y}-{m}-{d} {h}:{i}:{s}.{ms} > {text}'
      }
    }
  }
}));

// Mock CivitaiClient
vi.mock('../../utils/coreCivitai', () => {
  const mockCivitaiClient = {
    getModel: vi.fn(),
    getModelVersion: vi.fn(),
    searchModels: vi.fn(),
    downloadModel: vi.fn(),
    downloadModelFiles: vi.fn(),
    getModelMetadata: vi.fn(),
    saveModelMetadataToFile: vi.fn(),
    setProxy: vi.fn(),
    setHeaders: vi.fn()
  };

  return {
    CivitaiClient: vi.fn().mockImplementation(() => mockCivitaiClient),
    mockCivitaiClient
  };
});

// Mock WebContents
const mockWebContents = {
  send: vi.fn()
} as unknown as WebContents;

// Mock IpcMainInvokeEvent
const mockEvent = {} as IpcMainInvokeEvent;

// 测试数据
const mockModel: CivitaiModel = {
  id: 12345,
  name: 'Test Model',
  description: 'A test model',
  type: 'Checkpoint',
  creator: {
    username: 'testuser',
    image: 'https://example.com/image.jpg'
  },
  tags: ['test', 'model'],
  modelVersions: [],
  stats: {
    downloadCount: 100,
    favoriteCount: 50,
    commentCount: 10,
    rating: 4.5
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-02T00:00:00Z'
};

const mockModelVersion: CivitaiModelVersion = {
  id: 67890,
  modelId: 12345,
  name: 'v1.0',
  description: 'Version 1.0',
  baseModel: 'SD 1.5',
  files: [],
  downloadUrl: 'https://example.com/download',
  images: [],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-02T00:00:00Z'
};

const mockDownloadResult: DownloadResult = {
  success: true,
  filePath: '/path/to/file',
  fileName: 'test-file.safetensors',
  fileSize: 1024 * 1024 * 100 // 100MB
};

const mockProxyConfig: ProxyConfig = {
  host: 'proxy.example.com',
  port: 8080,
  protocol: 'http'
};

const mockHeaders: Partial<BrowserHeaders> = {
  'User-Agent': 'Test User Agent',
  'Accept': 'application/json'
};

describe('CivitaiIpcHandler', () => {
  let handler: CivitaiIpcHandler;
  let mockCivitaiClient: any;

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 创建新的处理器实例
    handler = new CivitaiIpcHandler(mockWebContents);
    
    // 获取 mock 的 CivitaiClient 实例
    mockCivitaiClient = (CivitaiClient as any).mock.results[0].value;
  });

  describe('getModel', () => {
    it('应该成功获取模型信息', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345 };
      mockCivitaiClient.getModel.mockResolvedValue(mockModel);

      // 执行测试
      const result = await handler.getModel(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockModel);
      expect(result.message).toBe('Successfully retrieved model information');
      expect(mockCivitaiClient.getModel).toHaveBeenCalledWith(12345);
      expect(log.info).toHaveBeenCalledWith('IPC request to get model info, model ID: 12345');
    });

    it('应该在 modelId 为空时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};

      // 执行测试
      const result = await handler.getModel(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get model information: Model ID cannot be empty');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to get model information: Model ID cannot be empty',
        expect.any(Error)
      );
    });

    it('应该在获取模型失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345 };
      const error = new Error('Network error');
      mockCivitaiClient.getModel.mockRejectedValue(error);

      // 执行测试
      const result = await handler.getModel(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get model information: Network error');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to get model information: Network error',
        error
      );
    });
  });

  describe('getModelVersion', () => {
    it('应该成功获取模型版本信息', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345, versionId: 67890 };
      mockCivitaiClient.getModelVersion.mockResolvedValue(mockModelVersion);

      // 执行测试
      const result = await handler.getModelVersion(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockModelVersion);
      expect(result.message).toBe('Successfully retrieved model version information');
      expect(mockCivitaiClient.getModelVersion).toHaveBeenCalledWith(12345, 67890);
      expect(log.info).toHaveBeenCalledWith('IPC request to get model version info, model ID: 12345, version ID: 67890');
    });

    it('应该在 modelId 或 versionId 为空时返回错误', async () => {
      // 准备测试数据
      const request1: CivitaiIpcRequest = { modelId: 12345 };
      const request2: CivitaiIpcRequest = { versionId: 67890 };
      const request3: CivitaiIpcRequest = {};

      // 执行测试
      const result1 = await handler.getModelVersion(mockEvent, request1);
      const result2 = await handler.getModelVersion(mockEvent, request2);
      const result3 = await handler.getModelVersion(mockEvent, request3);

      // 验证结果
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Failed to get model version information: Model ID and version ID cannot be empty');
      
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Failed to get model version information: Model ID and version ID cannot be empty');
      
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('Failed to get model version information: Model ID and version ID cannot be empty');
    });

    it('应该在获取模型版本失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345, versionId: 67890 };
      const error = new Error('Network error');
      mockCivitaiClient.getModelVersion.mockRejectedValue(error);

      // 执行测试
      const result = await handler.getModelVersion(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get model version information: Network error');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to get model version information: Network error',
        error
      );
    });
  });

  describe('searchModels', () => {
    it('应该成功搜索模型', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { query: 'test', limit: 10 };
      mockCivitaiClient.searchModels.mockResolvedValue([mockModel]);

      // 执行测试
      const result = await handler.searchModels(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockModel]);
      expect(result.message).toBe('Successfully found 1 models');
      expect(mockCivitaiClient.searchModels).toHaveBeenCalledWith('test', 10);
      expect(log.info).toHaveBeenCalledWith('IPC request to search models, query: test, limit: 10');
    });

    it('应该在 query 为空时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};

      // 执行测试
      const result = await handler.searchModels(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to search models: Search query cannot be empty');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to search models: Search query cannot be empty',
        expect.any(Error)
      );
    });

    it('应该使用默认 limit 值', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { query: 'test' };
      mockCivitaiClient.searchModels.mockResolvedValue([mockModel]);

      // 执行测试
      const result = await handler.searchModels(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(mockCivitaiClient.searchModels).toHaveBeenCalledWith('test', 20);
      expect(log.info).toHaveBeenCalledWith('IPC request to search models, query: test, limit: 20');
    });

    it('应该在搜索模型失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { query: 'test', limit: 10 };
      const error = new Error('Network error');
      mockCivitaiClient.searchModels.mockRejectedValue(error);

      // 执行测试
      const result = await handler.searchModels(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to search models: Network error');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to search models: Network error',
        error
      );
    });
  });

  describe('downloadModel', () => {
    it('应该成功下载模型文件', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {
        downloadUrl: 'https://example.com/download',
        fileName: 'test-file.safetensors',
        savePath: '/path/to/save',
        overwrite: true
      };
      mockCivitaiClient.downloadModel.mockResolvedValue(mockDownloadResult);

      // 执行测试
      const result = await handler.downloadModel(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDownloadResult);
      expect(result.message).toBe('Download successful');
      expect(mockCivitaiClient.downloadModel).toHaveBeenCalledWith(
        'https://example.com/download',
        'test-file.safetensors',
        expect.objectContaining({
          proxy: undefined,
          headers: undefined,
          savePath: '/path/to/save',
          overwrite: true,
          onProgress: expect.any(Function),
          onDownloadStart: expect.any(Function),
          onDownloadComplete: expect.any(Function),
          onError: expect.any(Function)
        })
      );
      expect(log.info).toHaveBeenCalledWith('IPC request to download model file, URL: https://example.com/download, filename: test-file.safetensors');
    });

    it('应该在 downloadUrl 或 fileName 为空时返回错误', async () => {
      // 准备测试数据
      const request1: CivitaiIpcRequest = { downloadUrl: 'https://example.com/download' };
      const request2: CivitaiIpcRequest = { fileName: 'test-file.safetensors' };
      const request3: CivitaiIpcRequest = {};

      // 执行测试
      const result1 = await handler.downloadModel(mockEvent, request1);
      const result2 = await handler.downloadModel(mockEvent, request2);
      const result3 = await handler.downloadModel(mockEvent, request3);

      // 验证结果
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Failed to download model file: Download URL and filename cannot be empty');
      
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Failed to download model file: Download URL and filename cannot be empty');
      
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('Failed to download model file: Download URL and filename cannot be empty');
    });

    it('应该在下载失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {
        downloadUrl: 'https://example.com/download',
        fileName: 'test-file.safetensors'
      };
      const error = new Error('Network error');
      mockCivitaiClient.downloadModel.mockRejectedValue(error);

      // 执行测试
      const result = await handler.downloadModel(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to download model file: Network error');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to download model file: Network error',
        error
      );
    });

    it('应该在下载结果为失败时返回正确的消息', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {
        downloadUrl: 'https://example.com/download',
        fileName: 'test-file.safetensors'
      };
      const failedResult: DownloadResult = {
        success: false,
        error: 'File not found'
      };
      mockCivitaiClient.downloadModel.mockResolvedValue(failedResult);

      // 执行测试
      const result = await handler.downloadModel(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual(failedResult);
      expect(result.message).toBe('Download failed');
    });
  });

  describe('downloadModelFiles', () => {
    it('应该成功下载模型所有文件', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {
        modelId: 12345,
        versionId: 67890,
        savePath: '/path/to/save',
        overwrite: true
      };
      const mockResults: DownloadResult[] = [mockDownloadResult];
      mockCivitaiClient.downloadModelFiles.mockResolvedValue(mockResults);

      // 执行测试
      const result = await handler.downloadModelFiles(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
      expect(result.message).toBe('Download completed, success: 1/1');
      expect(mockCivitaiClient.downloadModelFiles).toHaveBeenCalledWith(
        12345,
        67890,
        expect.objectContaining({
          proxy: undefined,
          headers: undefined,
          savePath: '/path/to/save',
          overwrite: true,
          onProgress: expect.any(Function),
          onDownloadStart: expect.any(Function),
          onDownloadComplete: expect.any(Function),
          onError: expect.any(Function)
        })
      );
      expect(log.info).toHaveBeenCalledWith('IPC request to download all model files, model ID: 12345, version ID: 67890');
    });

    it('应该在 modelId 为空时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { versionId: 67890 };

      // 执行测试
      const result = await handler.downloadModelFiles(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to download all model files: Model ID cannot be empty');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to download all model files: Model ID cannot be empty',
        expect.any(Error)
      );
    });

    it('应该在下载失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345 };
      const error = new Error('Network error');
      mockCivitaiClient.downloadModelFiles.mockRejectedValue(error);

      // 执行测试
      const result = await handler.downloadModelFiles(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to download all model files: Network error');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to download all model files: Network error',
        error
      );
    });

    it('应该正确计算成功下载的文件数量', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345 };
      const mockResults: DownloadResult[] = [
        { success: true, filePath: '/path/to/file1', fileName: 'file1.safetensors' },
        { success: false, error: 'Download failed' },
        { success: true, filePath: '/path/to/file3', fileName: 'file3.safetensors' }
      ];
      mockCivitaiClient.downloadModelFiles.mockResolvedValue(mockResults);

      // 执行测试
      const result = await handler.downloadModelFiles(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
      expect(result.message).toBe('Download completed, success: 2/3');
    });
  });

  describe('getModelMetadata', () => {
    it('应该成功获取模型附加信息', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345 };
      const mockMetadata = { id: 12345, name: 'Test Model' };
      mockCivitaiClient.getModelMetadata.mockResolvedValue(mockMetadata);

      // 执行测试
      const result = await handler.getModelMetadata(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMetadata);
      expect(result.message).toBe('Successfully retrieved model metadata');
      expect(mockCivitaiClient.getModelMetadata).toHaveBeenCalledWith(12345);
      expect(log.info).toHaveBeenCalledWith('IPC request to get model metadata, model ID: 12345');
    });

    it('应该在 modelId 为空时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};

      // 执行测试
      const result = await handler.getModelMetadata(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get model metadata: Model ID cannot be empty');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to get model metadata: Model ID cannot be empty',
        expect.any(Error)
      );
    });

    it('应该在获取模型附加信息失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345 };
      const error = new Error('Network error');
      mockCivitaiClient.getModelMetadata.mockRejectedValue(error);

      // 执行测试
      const result = await handler.getModelMetadata(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get model metadata: Network error');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to get model metadata: Network error',
        error
      );
    });
  });

  describe('saveModelMetadataToFile', () => {
    it('应该成功保存模型附加信息到文件', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {
        modelId: 12345,
        savePath: '/path/to/save'
      };
      const mockFilePath = '/path/to/save/Test_Model_12345.json';
      mockCivitaiClient.saveModelMetadataToFile.mockResolvedValue(mockFilePath);

      // 执行测试
      const result = await handler.saveModelMetadataToFile(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockFilePath);
      expect(result.message).toBe('Successfully saved model metadata to file');
      expect(mockCivitaiClient.saveModelMetadataToFile).toHaveBeenCalledWith(12345, '/path/to/save');
      expect(log.info).toHaveBeenCalledWith('IPC request to save model metadata to file, model ID: 12345');
    });

    it('应该在 modelId 为空时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { savePath: '/path/to/save' };

      // 执行测试
      const result = await handler.saveModelMetadataToFile(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save model metadata to file: Model ID cannot be empty');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to save model metadata to file: Model ID cannot be empty',
        expect.any(Error)
      );
    });

    it('应该在保存模型附加信息失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { modelId: 12345 };
      const error = new Error('File system error');
      mockCivitaiClient.saveModelMetadataToFile.mockRejectedValue(error);

      // 执行测试
      const result = await handler.saveModelMetadataToFile(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save model metadata to file: File system error');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to save model metadata to file: File system error',
        error
      );
    });
  });

  describe('setProxy', () => {
    it('应该成功设置代理', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { proxy: mockProxyConfig };

      // 执行测试
      const result = await handler.setProxy(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully set proxy');
      expect(mockCivitaiClient.setProxy).toHaveBeenCalledWith(mockProxyConfig);
      expect(log.info).toHaveBeenCalledWith('IPC request to set proxy, host: proxy.example.com, port: 8080');
    });

    it('应该在 proxy 为空时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};

      // 执行测试
      const result = await handler.setProxy(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to set proxy: Proxy configuration cannot be empty');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to set proxy: Proxy configuration cannot be empty',
        expect.any(Error)
      );
    });

    it('应该在设置代理失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { proxy: mockProxyConfig };
      const error = new Error('Invalid proxy configuration');
      mockCivitaiClient.setProxy.mockImplementation(() => {
        throw error;
      });

      // 执行测试
      const result = await handler.setProxy(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to set proxy: Invalid proxy configuration');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to set proxy: Invalid proxy configuration',
        error
      );
    });
  });

  describe('setHeaders', () => {
    it('应该成功设置请求头', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { headers: mockHeaders };

      // 执行测试
      const result = await handler.setHeaders(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully set headers');
      expect(mockCivitaiClient.setHeaders).toHaveBeenCalledWith(mockHeaders);
      expect(log.info).toHaveBeenCalledWith('IPC request to set headers');
    });

    it('应该在 headers 为空时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};

      // 执行测试
      const result = await handler.setHeaders(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to set headers: Header configuration cannot be empty');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to set headers: Header configuration cannot be empty',
        expect.any(Error)
      );
    });

    it('应该在设置请求头失败时返回错误', async () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = { headers: mockHeaders };
      const error = new Error('Invalid headers configuration');
      mockCivitaiClient.setHeaders.mockImplementation(() => {
        throw error;
      });

      // 执行测试
      const result = await handler.setHeaders(mockEvent, request);

      // 验证结果
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to set headers: Invalid headers configuration');
      expect(log.error).toHaveBeenCalledWith(
        'Failed to set headers: Invalid headers configuration',
        error
      );
    });
  });

  describe('sendNotification', () => {
    it('应该发送通知到渲染进程', () => {
      // 执行测试
      (handler as any).sendNotification('test-event', { data: 'test' });

      // 验证结果
      expect(mockWebContents.send).toHaveBeenCalledWith('test-event', { data: 'test' });
    });
  });

  describe('createDownloadOptions', () => {
    it('应该创建正确的下载选项', () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {
        proxy: mockProxyConfig,
        headers: mockHeaders,
        savePath: '/path/to/save',
        overwrite: true
      };

      // 执行测试
      const options = (handler as any).createDownloadOptions(request);

      // 验证结果
      expect(options).toEqual(expect.objectContaining({
        proxy: mockProxyConfig,
        headers: mockHeaders,
        savePath: '/path/to/save',
        overwrite: true,
        onProgress: expect.any(Function),
        onDownloadStart: expect.any(Function),
        onDownloadComplete: expect.any(Function),
        onError: expect.any(Function)
      }));
    });

    it('应该使用默认值创建下载选项', () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};

      // 执行测试
      const options = (handler as any).createDownloadOptions(request);

      // 验证结果
      expect(options).toEqual(expect.objectContaining({
        proxy: undefined,
        headers: undefined,
        savePath: undefined,
        overwrite: undefined,
        onProgress: expect.any(Function),
        onDownloadStart: expect.any(Function),
        onDownloadComplete: expect.any(Function),
        onError: expect.any(Function)
      }));
    });

    it('应该正确发送下载进度通知', () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};
      const options = (handler as any).createDownloadOptions(request);

      // 执行测试
      options.onProgress(50);

      // 验证结果
      expect(mockWebContents.send).toHaveBeenCalledWith(CivitaiIpcEvents.DOWNLOAD_PROGRESS, { progress: 50 });
    });

    it('应该正确发送下载开始通知', () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};
      const options = (handler as any).createDownloadOptions(request);

      // 执行测试
      options.onDownloadStart('test-file.safetensors');

      // 验证结果
      expect(mockWebContents.send).toHaveBeenCalledWith(CivitaiIpcEvents.DOWNLOAD_START, { fileName: 'test-file.safetensors' });
    });

    it('应该正确发送下载完成通知', () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};
      const options = (handler as any).createDownloadOptions(request);

      // 执行测试
      options.onDownloadComplete('/path/to/file');

      // 验证结果
      expect(mockWebContents.send).toHaveBeenCalledWith(CivitaiIpcEvents.DOWNLOAD_COMPLETE, { filePath: '/path/to/file' });
    });

    it('应该正确发送下载错误通知', () => {
      // 准备测试数据
      const request: CivitaiIpcRequest = {};
      const options = (handler as any).createDownloadOptions(request);
      const error = new Error('Download failed');

      // 执行测试
      options.onError(error);

      // 验证结果
      expect(mockWebContents.send).toHaveBeenCalledWith(CivitaiIpcEvents.DOWNLOAD_ERROR, {
        error: 'Download failed'
      });
    });
  });
});

describe('IPC Handler Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerCivitaiIpcHandlers', () => {
    it('应该注册所有 IPC 处理器', () => {
      // 执行测试
      registerCivitaiIpcHandlers(mockWebContents);

      // 验证结果
      expect(ipcMain.handle).toHaveBeenCalledTimes(9);
      
      // 验证所有处理器都被注册
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.GET_MODEL, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.GET_MODEL_VERSION, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.SEARCH_MODELS, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.DOWNLOAD_MODEL, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.DOWNLOAD_MODEL_FILES, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.GET_MODEL_METADATA, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.SAVE_MODEL_METADATA_TO_FILE, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.SET_PROXY, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(CivitaiIpcEvents.SET_HEADERS, expect.any(Function));
      
      expect(log.info).toHaveBeenCalledWith('Civitai IPC handlers registered successfully  完成');
    });
  });

  describe('removeCivitaiIpcHandlers', () => {
    it('应该移除所有 IPC 处理器', () => {
      // 执行测试
      removeCivitaiIpcHandlers();

      // 验证结果
      expect(ipcMain.removeHandler).toHaveBeenCalledTimes(9);
      
      // 验证所有处理器都被移除
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.GET_MODEL);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.GET_MODEL_VERSION);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.SEARCH_MODELS);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.DOWNLOAD_MODEL);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.DOWNLOAD_MODEL_FILES);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.GET_MODEL_METADATA);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.SAVE_MODEL_METADATA_TO_FILE);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.SET_PROXY);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(CivitaiIpcEvents.SET_HEADERS);
      
      expect(log.info).toHaveBeenCalledWith('Civitai IPC handlers removed successfully');
    });
  });
});