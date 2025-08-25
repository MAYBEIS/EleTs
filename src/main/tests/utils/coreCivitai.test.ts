/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-25 13:11:50
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-25 21:28:24
 * @FilePath: \EleTs\src\main\tests\utils\coreCivitai.test.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import log from 'electron-log';

// 导入要测试的模块
import {
  CivitaiClient,
  CivitaiModel,
  CivitaiModelVersion,
  ProxyConfig,
  BrowserHeaders,
  DownloadResult,
  createCivitaiClient,
  defaultCivitaiClient
} from '../../../main/utils/coreCivitai';

// Mock 模块
vi.mock('axios');
vi.mock('https-proxy-agent');
vi.mock('fs');
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/downloads')
  }
}));
vi.mock('electron-log');

// Mock axios 实例
const mockAxiosInstance = {
  get: vi.fn(),
  defaults: {
    headers: {
      common: {}
    },
    httpsAgent: null
  }
};

// 确保 mockAxiosInstance.defaults.headers.common 可以被修改
Object.defineProperty(mockAxiosInstance.defaults.headers, 'common', {
  writable: true,
  value: {}
});

// Mock axios.create
vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

// 重置 mockAxiosInstance.get
beforeEach(() => {
  mockAxiosInstance.get.mockReset();
});

// Mock HttpsProxyAgent
const mockProxyAgent = {};
vi.mocked(HttpsProxyAgent).mockReturnValue(mockProxyAgent as any);

// Mock fs 模块
vi.mocked(existsSync).mockReturnValue(false);
vi.mocked(mkdirSync).mockImplementation(() => undefined);
vi.mocked(writeFileSync).mockImplementation(() => undefined);

// Mock electron-log
vi.mocked(log.info).mockImplementation(() => undefined);
vi.mocked(log.error).mockImplementation(() => undefined);

// 创建符合业务数据的测试数据
const createMockCivitaiModel = (overrides?: Partial<CivitaiModel>): CivitaiModel => ({
  id: 12345,
  name: 'Anime Style Character LoRA',
  description: 'A high-quality LoRA model for generating anime-style characters with detailed features and consistent style.',
  type: 'LORA',
  creator: {
    username: 'anime_artist',
    image: 'https://image.civitai.com/user/12345/avatar.jpg'
  },
  tags: ['anime', 'character', 'style', 'detailed', 'consistent'],
  modelVersions: [
    {
      id: 67890,
      modelId: 12345,
      name: 'v1.0',
      description: 'Initial release with base anime style',
      baseModel: 'SD 1.5',
      files: [
        {
          id: 11111,
          sizeKB: 102400,
          name: 'anime_style_v1.safetensors',
          type: 'Model',
          metadata: {
            format: 'SafeTensor',
            fp: 'fp16',
            size: 'pruned'
          },
          downloadUrl: 'https://civitai.com/api/download/models/12345'
        }
      ],
      downloadUrl: 'https://civitai.com/api/download/models/12345',
      images: [
        {
          id: 22222,
          url: 'https://image.civitai.com/12345/sample1.jpg',
          nsfw: false,
          width: 512,
          height: 768,
          hash: 'ABC123',
          type: 'image/jpeg'
        }
      ],
      createdAt: '2023-06-15T10:30:00Z',
      updatedAt: '2023-06-15T10:30:00Z'
    }
  ],
  stats: {
    downloadCount: 15420,
    favoriteCount: 3250,
    commentCount: 128,
    rating: 4.8
  },
  createdAt: '2023-06-15T10:30:00Z',
  updatedAt: '2023-06-20T14:45:00Z',
  ...overrides
});

const createMockCivitaiModelVersion = (overrides?: Partial<CivitaiModelVersion>): CivitaiModelVersion => ({
  id: 67890,
  modelId: 12345,
  name: 'v1.0',
  description: 'Initial release with base anime style',
  baseModel: 'SD 1.5',
  files: [
    {
      id: 11111,
      sizeKB: 102400,
      name: 'anime_style_v1.safetensors',
      type: 'Model',
      metadata: {
        format: 'SafeTensor',
        fp: 'fp16',
        size: 'pruned'
      },
      downloadUrl: 'https://civitai.com/api/download/models/12345'
    }
  ],
  downloadUrl: 'https://civitai.com/api/download/models/12345',
  images: [
    {
      id: 22222,
      url: 'https://image.civitai.com/12345/sample1.jpg',
      nsfw: false,
      width: 512,
      height: 768,
      hash: 'ABC123',
      type: 'image/jpeg'
    }
  ],
  createdAt: '2023-06-15T10:30:00Z',
  updatedAt: '2023-06-15T10:30:00Z',
  ...overrides
});

const createMockProxyConfig = (overrides?: Partial<ProxyConfig>): ProxyConfig => ({
  host: '127.0.0.1',
  port: 7890,
  protocol: 'http',
  auth: {
    username: '',
    password: ''
  },
  ...overrides
});

const createMockBrowserHeaders = (overrides?: Partial<BrowserHeaders>): BrowserHeaders => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://civitai.com/',
  ...overrides
});

describe('CivitaiClient', () => {
  let civitaiClient: CivitaiClient;
  let mockResponse: any;

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 创建新的客户端实例
    civitaiClient = new CivitaiClient();
    
    // 设置默认的 mock 响应
    mockResponse = {
      data: createMockCivitaiModel(),
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('构造函数', () => {
    it('应该创建默认的 CivitaiClient 实例', () => {
      expect(civitaiClient).toBeInstanceOf(CivitaiClient);
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://civitai.com/api/v1',
        headers: expect.objectContaining({
          'User-Agent': expect.any(String),
          'Accept': expect.any(String),
          'Accept-Language': expect.any(String),
          'Accept-Encoding': expect.any(String),
          'Connection': expect.any(String),
          'Referer': 'https://civitai.com/'
        }),
        httpsAgent: undefined,
        timeout: 30000
      });
    });

    it('应该使用提供的代理配置创建 CivitaiClient 实例', () => {
      const proxyConfig = createMockProxyConfig();
      const client = new CivitaiClient({ proxy: proxyConfig });
      
      expect(HttpsProxyAgent).toHaveBeenCalledWith('http://127.0.0.1:7890');
      expect(client).toBeInstanceOf(CivitaiClient);
    });

    it('应该使用提供的请求头配置创建 CivitaiClient 实例', () => {
      const customHeaders = { 'User-Agent': 'Custom User Agent' };
      const client = new CivitaiClient({ headers: customHeaders });
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://civitai.com/api/v1',
        headers: expect.objectContaining({
          'User-Agent': 'Custom User Agent'
        }),
        httpsAgent: undefined,
        timeout: 30000
      });
      expect(client).toBeInstanceOf(CivitaiClient);
    });
  });

  describe('setProxy', () => {
    it('应该正确设置代理', () => {
      const proxyConfig = createMockProxyConfig();
      civitaiClient.setProxy(proxyConfig);
      
      expect(HttpsProxyAgent).toHaveBeenCalledWith('http://127.0.0.1:7890');
      expect(mockAxiosInstance.defaults.httpsAgent).toBe(mockProxyAgent);
    });

    it('应该使用默认协议 http', () => {
      const proxyConfig = { host: '127.0.0.1', port: 7890 };
      civitaiClient.setProxy(proxyConfig);
      
      expect(HttpsProxyAgent).toHaveBeenCalledWith('http://127.0.0.1:7890');
    });
  });

  describe('setHeaders', () => {
    it('应该正确设置请求头', () => {
      const customHeaders = { 'User-Agent': 'Custom User Agent' };
      civitaiClient.setHeaders(customHeaders);
      
      // 检查 defaultHeaders 是否正确更新
      expect(mockAxiosInstance.defaults.headers.common).toEqual(
        expect.objectContaining({
          'User-Agent': 'Custom User Agent'
        })
      );
    });
  });

  describe('getModel', () => {
    it('应该成功获取模型信息', async () => {
      const modelId = 257749;
      const mockModel = createMockCivitaiModel({ id: modelId });
      mockAxiosInstance.get.mockResolvedValue({
        data: mockModel,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });

      const result = await civitaiClient.getModel(modelId);
      expect(result).toEqual(mockModel);
      expect(log.info).toHaveBeenCalledWith(`正在获取模型信息，模型ID: ${modelId}`);
      expect(log.info).toHaveBeenCalledWith(`成功获取模型信息: ${mockModel.name}`);
    });

    it('应该处理获取模型信息失败的情况', async () => {
      const modelId = 257749;
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);
      
      await expect(civitaiClient.getModel(modelId)).rejects.toThrow('获取模型信息失败: Network error');
      expect(log.error).toHaveBeenCalledWith('获取模型信息失败: Network error', error);
    });
  });

  describe('getModelVersion', () => {
    it('应该成功获取模型版本信息', async () => {
      const modelId = 12345;
      const versionId = 67890;
      mockResponse.data = createMockCivitaiModelVersion();
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await civitaiClient.getModelVersion(modelId, versionId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/models/${modelId}/model-versions/${versionId}`);
      expect(result).toEqual(mockResponse.data);
      expect(log.info).toHaveBeenCalledWith(`正在获取模型版本信息，模型ID: ${modelId}，版本ID: ${versionId}`);
      expect(log.info).toHaveBeenCalledWith(`成功获取模型版本信息: ${mockResponse.data.name}`);
    });

    it('应该处理获取模型版本信息失败的情况', async () => {
      const modelId = 12345;
      const versionId = 67890;
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);
      
      await expect(civitaiClient.getModelVersion(modelId, versionId)).rejects.toThrow('获取模型版本信息失败: Network error');
      expect(log.error).toHaveBeenCalledWith('获取模型版本信息失败: Network error', error);
    });
  });

  describe('searchModels', () => {
    it('应该成功搜索模型', async () => {
      const query = 'anime';
      const limit = 10;
      const mockModels = [createMockCivitaiModel(), createMockCivitaiModel({ id: 12346, name: 'Another Anime Model' })];
      mockResponse.data = mockModels;
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await civitaiClient.searchModels(query, limit);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/models', {
        params: {
          query,
          limit,
          nsfw: true
        }
      });
      expect(result).toEqual(mockModels);
      expect(log.info).toHaveBeenCalledWith(`正在搜索模型，查询: ${query}，限制数量: ${limit}`);
      expect(log.info).toHaveBeenCalledWith(`成功搜索到 ${mockModels.length} 个模型`);
    });

    it('应该使用默认的 limit 值', async () => {
      const query = 'anime';
      const mockModels = [createMockCivitaiModel()];
      mockResponse.data = mockModels;
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      await civitaiClient.searchModels(query);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/models', {
        params: {
          query,
          limit: 20,
          nsfw: true
        }
      });
    });

    it('应该处理搜索模型失败的情况', async () => {
      const query = 'anime';
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);
      
      await expect(civitaiClient.searchModels(query)).rejects.toThrow('搜索模型失败: Network error');
      expect(log.error).toHaveBeenCalledWith('搜索模型失败: Network error', error);
    });
  });

  describe('downloadModel', () => {
    let mockDownloadResponse: any;
    let mockWriter: any;

    beforeEach(() => {
      mockDownloadResponse = {
        data: {
          on: vi.fn(),
          pipe: vi.fn()
        },
        headers: {
          'content-length': '1024000'
        }
      };
      
      mockWriter = {
        on: vi.fn()
      };
      
      vi.mocked(createWriteStream).mockReturnValue(mockWriter);
      vi.mocked(existsSync).mockReturnValue(false);
    });

    it('应该成功下载模型文件', async () => {
      const downloadUrl = 'https://civitai.com/api/download/models/12345';
      const fileName = 'anime_style_v1.safetensors';
      const mockDownloadAxios = { get: vi.fn().mockResolvedValue(mockDownloadResponse) };
      vi.mocked(axios.create).mockReturnValueOnce(mockDownloadAxios as any);
      
      const onProgress = vi.fn();
      const onDownloadStart = vi.fn();
      const onDownloadComplete = vi.fn();
      
      // 模拟数据流事件
      let dataCallback: any;
      mockDownloadResponse.data.on.mockImplementation((event: string, callback: any) => {
        if (event === 'data') dataCallback = callback;
      });
      
      // 模拟写入流完成
      mockWriter.on.mockImplementation((event: string, callback: any) => {
        if (event === 'finish') setTimeout(callback, 0);
      });
      
      const result = await civitaiClient.downloadModel(downloadUrl, fileName, {
        onProgress,
        onDownloadStart,
        onDownloadComplete
      });
      
      expect(onDownloadStart).toHaveBeenCalledWith(fileName);
      expect(createWriteStream).toHaveBeenCalledWith(expect.stringContaining(fileName));
      expect(mockDownloadResponse.data.pipe).toHaveBeenCalledWith(mockWriter);
      
      // 模拟数据接收
      if (dataCallback) {
        dataCallback(Buffer.from('test data'));
      }
      
      expect(onProgress).toHaveBeenCalledWith(0);
      expect(onDownloadComplete).toHaveBeenCalledWith(expect.stringContaining(fileName));
      
      expect(result).toEqual({
        success: true,
        filePath: expect.stringContaining(fileName),
        fileName,
        fileSize: expect.any(Number)
      });
    });

    it('应该处理文件已存在的情况', async () => {
      const downloadUrl = 'https://civitai.com/api/download/models/12345';
      const fileName = 'anime_style_v1.safetensors';
      vi.mocked(existsSync).mockReturnValue(true);
      
      const result = await civitaiClient.downloadModel(downloadUrl, fileName);
      
      expect(result).toEqual({
        success: false,
        error: '文件已存在',
        filePath: expect.stringContaining(fileName),
        fileName
      });
    });

    it('应该处理下载失败的情况', async () => {
      const downloadUrl = 'https://civitai.com/api/download/models/12345';
      const fileName = 'anime_style_v1.safetensors';
      const error = new Error('Download failed');
      const mockDownloadAxios = { get: vi.fn().mockRejectedValue(error) };
      vi.mocked(axios.create).mockReturnValueOnce(mockDownloadAxios as any);
      
      const onError = vi.fn();
      
      const result = await civitaiClient.downloadModel(downloadUrl, fileName, { onError });
      
      expect(onError).toHaveBeenCalledWith(error);
      expect(result).toEqual({
        success: false,
        error: '下载文件失败: Download failed'
      });
    });

    it('应该使用自定义保存路径', async () => {
      const downloadUrl = 'https://civitai.com/api/download/models/12345';
      const fileName = 'anime_style_v1.safetensors';
      const customSavePath = '/custom/path';
      const mockDownloadAxios = { get: vi.fn().mockResolvedValue(mockDownloadResponse) };
      vi.mocked(axios.create).mockReturnValueOnce(mockDownloadAxios as any);
      
      mockWriter.on.mockImplementation((event: string, callback: any) => {
        if (event === 'finish') setTimeout(callback, 0);
      });
      
      await civitaiClient.downloadModel(downloadUrl, fileName, { savePath: customSavePath });
      
      expect(createWriteStream).toHaveBeenCalledWith(join(customSavePath, fileName));
    });
  });

  describe('downloadModelFiles', () => {
    it('应该成功下载模型的所有文件', async () => {
      const modelId = 12345;
      const versionId = 67890;
      const mockModel = createMockCivitaiModel();
      const mockVersion = createMockCivitaiModelVersion();
      
      // Mock getModel
      vi.spyOn(civitaiClient, 'getModel').mockResolvedValue(mockModel);
      
      // Mock getModelVersion
      vi.spyOn(civitaiClient, 'getModelVersion').mockResolvedValue(mockVersion);
      
      // Mock downloadModel
      const mockDownloadResult: DownloadResult = {
        success: true,
        filePath: '/mock/path/anime_style_v1.safetensors',
        fileName: 'anime_style_v1.safetensors',
        fileSize: 1024000
      };
      vi.spyOn(civitaiClient, 'downloadModel').mockResolvedValue(mockDownloadResult);
      
      const result = await civitaiClient.downloadModelFiles(modelId, versionId);
      
      expect(civitaiClient.getModel).toHaveBeenCalledWith(modelId);
      expect(civitaiClient.getModelVersion).toHaveBeenCalledWith(modelId, versionId);
      expect(civitaiClient.downloadModel).toHaveBeenCalledWith(
        mockVersion.files[0].downloadUrl,
        mockVersion.files[0].name,
        expect.any(Object)
      );
      
      expect(result).toEqual([{
        ...mockDownloadResult,
        modelInfo: mockModel
      }]);
    });

    it('应该下载最新版本当未指定版本ID时', async () => {
      const modelId = 12345;
      const mockModel = createMockCivitaiModel();
      
      // Mock getModel
      vi.spyOn(civitaiClient, 'getModel').mockResolvedValue(mockModel);
      
      // Mock downloadModel
      const mockDownloadResult: DownloadResult = {
        success: true,
        filePath: '/mock/path/anime_style_v1.safetensors',
        fileName: 'anime_style_v1.safetensors',
        fileSize: 1024000
      };
      vi.spyOn(civitaiClient, 'downloadModel').mockResolvedValue(mockDownloadResult);
      
      await civitaiClient.downloadModelFiles(modelId);
      
      expect(civitaiClient.getModel).toHaveBeenCalledWith(modelId);
      expect(civitaiClient.downloadModel).toHaveBeenCalledWith(
        mockModel.modelVersions[0].files[0].downloadUrl,
        mockModel.modelVersions[0].files[0].name,
        expect.any(Object)
      );
    });

    it('应该处理下载模型文件失败的情况', async () => {
      const modelId = 12345;
      const error = new Error('Failed to get model');
      
      // Mock getModel
      vi.spyOn(civitaiClient, 'getModel').mockRejectedValue(error);
      
      const onError = vi.fn();
      
      const result = await civitaiClient.downloadModelFiles(modelId, undefined, { onError });
      
      expect(onError).toHaveBeenCalledWith(error);
      expect(result).toEqual([{
        success: false,
        error: '下载模型文件失败: Failed to get model'
      }]);
    });
  });

  describe('getModelMetadata', () => {
    it('应该成功获取模型附加信息', async () => {
      const modelId = 12345;
      const mockModel = createMockCivitaiModel();
      
      // Mock getModel
      vi.spyOn(civitaiClient, 'getModel').mockResolvedValue(mockModel);
      
      const result = await civitaiClient.getModelMetadata(modelId);
      
      expect(civitaiClient.getModel).toHaveBeenCalledWith(modelId);
      
      expect(result).toEqual({
        id: mockModel.id,
        name: mockModel.name,
        description: mockModel.description,
        type: mockModel.type,
        creator: mockModel.creator,
        tags: mockModel.tags,
        stats: mockModel.stats,
        createdAt: mockModel.createdAt,
        updatedAt: mockModel.updatedAt,
        versions: mockModel.modelVersions.map(version => ({
          id: version.id,
          name: version.name,
          description: version.description,
          baseModel: version.baseModel,
          files: version.files.map(file => ({
            id: file.id,
            name: file.name,
            sizeKB: file.sizeKB,
            type: file.type,
            metadata: file.metadata
          })),
          images: version.images.map(image => ({
            id: image.id,
            url: image.url,
            nsfw: image.nsfw,
            width: image.width,
            height: image.height,
            type: image.type
          }))
        }))
      });
    });

    it('应该处理获取模型附加信息失败的情况', async () => {
      const modelId = 12345;
      const error = new Error('Failed to get model');
      
      // Mock getModel
      vi.spyOn(civitaiClient, 'getModel').mockRejectedValue(error);
      
      await expect(civitaiClient.getModelMetadata(modelId)).rejects.toThrow('获取模型附加信息失败: Failed to get model');
    });
  });

  describe('saveModelMetadataToFile', () => {
    it('应该成功保存模型附加信息到文件', async () => {
      const modelId = 12345;
      const mockModel = createMockCivitaiModel();
      const mockMetadata = {
        id: mockModel.id,
        name: mockModel.name,
        description: mockModel.description,
        type: mockModel.type,
        creator: mockModel.creator,
        tags: mockModel.tags,
        stats: mockModel.stats,
        createdAt: mockModel.createdAt,
        updatedAt: mockModel.updatedAt,
        versions: mockModel.modelVersions.map(version => ({
          id: version.id,
          name: version.name,
          description: version.description,
          baseModel: version.baseModel,
          files: version.files.map(file => ({
            id: file.id,
            name: file.name,
            sizeKB: file.sizeKB,
            type: file.type,
            metadata: file.metadata
          })),
          images: version.images.map(image => ({
            id: image.id,
            url: image.url,
            nsfw: image.nsfw,
            width: image.width,
            height: image.height,
            type: image.type
          }))
        }))
      };
      
      // Mock getModelMetadata
      vi.spyOn(civitaiClient, 'getModelMetadata').mockResolvedValue(mockMetadata);
      
      const result = await civitaiClient.saveModelMetadataToFile(modelId);
      
      expect(civitaiClient.getModelMetadata).toHaveBeenCalledWith(modelId);
      expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining('metadata'), { recursive: true });
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('Anime_Style_Character_LoRA_12345.json'),
        JSON.stringify(mockMetadata, null, 2)
      );
      
      expect(result).toContain('Anime_Style_Character_LoRA_12345.json');
    });

    it('应该使用自定义保存路径', async () => {
      const modelId = 12345;
      const customSavePath = '/custom/path';
      const mockMetadata = { 
        id: 12345, 
        name: 'Test Model', 
        description: 'Test Description',
        type: 'LORA',
        creator: { username: 'testuser', image: 'test.jpg' },
        tags: ['test'],
        stats: { downloadCount: 0, favoriteCount: 0, commentCount: 0, rating: 0 },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        versions: []
      };
      
      // Mock getModelMetadata
      vi.spyOn(civitaiClient, 'getModelMetadata').mockResolvedValue(mockMetadata);
      
      await civitaiClient.saveModelMetadataToFile(modelId, customSavePath);
      
      expect(mkdirSync).toHaveBeenCalledWith(customSavePath, { recursive: true });
    });

    it('应该处理保存模型附加信息失败的情况', async () => {
      const modelId = 12345;
      const error = new Error('Failed to get metadata');
      
      // Mock getModelMetadata
      vi.spyOn(civitaiClient, 'getModelMetadata').mockRejectedValue(error);
      
      await expect(civitaiClient.saveModelMetadataToFile(modelId)).rejects.toThrow('保存模型附加信息失败: Failed to get metadata');
    });
  });
});

describe('createCivitaiClient', () => {
  it('应该创建 CivitaiClient 实例', () => {
    const client = createCivitaiClient();
    
    expect(client).toBeInstanceOf(CivitaiClient);
  });

  it('应该使用提供的选项创建 CivitaiClient 实例', () => {
    const proxyConfig = createMockProxyConfig();
    const headers = createMockBrowserHeaders();
    
    const client = createCivitaiClient({ proxy: proxyConfig, headers });
    
    expect(client).toBeInstanceOf(CivitaiClient);
    expect(HttpsProxyAgent).toHaveBeenCalledWith('http://127.0.0.1:7890');
  });
});

describe('defaultCivitaiClient', () => {
  it('应该提供默认的 CivitaiClient 实例', () => {
    expect(defaultCivitaiClient).toBeInstanceOf(CivitaiClient);
  });
});

