import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Agent } from 'http';
import { app } from 'electron';
import log from 'electron-log';

// 设置日志输出编码为GBK，确保中文正确显示
log.transports.console.format = '[{level}] {y}-{m}-{d} {h}:{i}:{s}.{ms} > {text}';
log.transports.file.format = '[{level}] {y}-{m}-{d} {h}:{i}:{s}.{ms} > {text}';
if (process.platform === 'win32') {
  log.transports.console.useStyles = false; // 禁用样式以避免编码问题
}

/**
 * Civitai 模型信息接口
 */
export interface CivitaiModel {
  id: number;
  name: string;
  description: string;
  type: string;
  creator: {
    username: string;
    image: string;
  };
  tags: string[];
  modelVersions: CivitaiModelVersion[];
  stats: {
    downloadCount: number;
    favoriteCount: number;
    commentCount: number;
    rating: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Civitai 模型版本信息接口
 */
export interface CivitaiModelVersion {
  id: number;
  modelId: number;
  name: string;
  description: string;
  baseModel: string;
  files: CivitaiModelFile[];
  downloadUrl: string;
  images: CivitaiModelImage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Civitai 模型文件信息接口
 */
export interface CivitaiModelFile {
  id: number;
  sizeKB: number;
  name: string;
  type: string;
  metadata: {
    format: string;
    fp: string;
    size: string;
  };
  downloadUrl: string;
}

/**
 * Civitai 模型图片信息接口
 */
export interface CivitaiModelImage {
  id: number;
  url: string;
  nsfw: boolean;
  width: number;
  height: number;
  hash: string;
  type: string;
}

/**
 * 代理配置接口
 */
export interface ProxyConfig {
  host: string;
  port: number;
  protocol?: 'http' | 'https';
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * 浏览器头配置接口
 */
export interface BrowserHeaders {
  'User-Agent': string;
  'Accept': string;
  'Accept-Language': string;
  'Accept-Encoding': string;
  'Connection': string;
  'Referer'?: string;
  'Cookie'?: string;
  [key: string]: string;
}

/**
 * 下载选项接口
 */
export interface DownloadOptions {
  proxy?: ProxyConfig;
  headers?: BrowserHeaders;
  savePath?: string;
  overwrite?: boolean;
  onProgress?: (progress: number) => void;
  onDownloadStart?: (fileName: string) => void;
  onDownloadComplete?: (filePath: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 下载结果接口
 */
export interface DownloadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  modelInfo?: CivitaiModel;
  error?: string;
}

/**
 * Civitai API 客户端类
 */
export class CivitaiClient {
  private axiosInstance: AxiosInstance;
  private defaultHeaders: BrowserHeaders;
  private proxyAgent?: Agent;
  private baseUrl: string = 'https://civitai.com/api/v1';

  constructor(options?: {
    proxy?: ProxyConfig;
    headers?: Partial<BrowserHeaders>;
  }) {
    // 设置默认浏览器头
    this.defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://civitai.com/',
      ...options?.headers
    };

    // 创建 Axios 实例
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: this.defaultHeaders,
      httpsAgent: this.proxyAgent,
      timeout: 30000,
    });

    // 配置代理
    if (options?.proxy) {
      this.setProxy(options.proxy);
    }
  }

  /**
   * 设置代理
   * @param proxy 代理配置
   */
  public setProxy(proxy: ProxyConfig): void {
    const proxyUrl = `${proxy.protocol || 'http'}://${proxy.host}:${proxy.port}`;
    this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    if (this.axiosInstance) {
      this.axiosInstance.defaults.httpsAgent = this.proxyAgent;
    }
  }

  /**
   * 设置请求头
   * @param headers 请求头
   */
  public setHeaders(headers: Partial<BrowserHeaders>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    if (this.axiosInstance) {
      this.axiosInstance.defaults.headers.common = { ...this.defaultHeaders };
    }
  }

  /**
   * 获取模型信息
   * @param modelId 模型ID
   * @returns 模型信息
   */
  public async getModel(modelId: number): Promise<CivitaiModel> {
    try {
      if (!this.axiosInstance) {
        throw new Error('Axios instance is not initialized');
      }
      
      log.info(`正在获取模型信息，模型ID: ${modelId}`);
      const response: AxiosResponse<CivitaiModel> = await this.axiosInstance.get(`/models/${modelId}`);
      log.info(`成功获取模型信息: ${response.data.name}`);
      return response.data;
    } catch (error) {
      const errorMessage = `获取模型信息失败: ${error.message}`;
      log.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 获取模型版本信息
   * @param modelId 模型ID
   * @param versionId 版本ID
   * @returns 模型版本信息
   */
  public async getModelVersion(modelId: number, versionId: number): Promise<CivitaiModelVersion> {
    try {
      if (!this.axiosInstance) {
        throw new Error('Axios instance is not initialized');
      }
      
      log.info(`正在获取模型版本信息，模型ID: ${modelId}，版本ID: ${versionId}`);
      const response: AxiosResponse<CivitaiModelVersion> = await this.axiosInstance.get(`/models/${modelId}/model-versions/${versionId}`);
      log.info(`成功获取模型版本信息: ${response.data.name}`);
      return response.data;
    } catch (error) {
      const errorMessage = `获取模型版本信息失败: ${error.message}`;
      log.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 搜索模型
   * @param query 搜索查询
   * @param limit 限制数量
   * @returns 模型列表
   */
  public async searchModels(query: string, limit: number = 20): Promise<CivitaiModel[]> {
    try {
      if (!this.axiosInstance) {
        throw new Error('Axios instance is not initialized');
      }
      
      log.info(`正在搜索模型，查询: ${query}，限制数量: ${limit}`);
      const response: AxiosResponse<CivitaiModel[]> = await this.axiosInstance.get('/models', {
        params: {
          query,
          limit,
          nsfw: true
        }
      });
      log.info(`成功搜索到 ${response.data.length} 个模型`);
      return response.data;
    } catch (error) {
      const errorMessage = `搜索模型失败: ${error.message}`;
      log.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 下载模型文件
   * @param downloadUrl 下载URL
   * @param fileName 文件名
   * @param options 下载选项
   * @returns 下载结果
   */
  public async downloadModel(
    downloadUrl: string,
    fileName: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      // 设置保存路径
      const savePath = options.savePath || join(app.getPath('downloads'), 'civitai-models');
      
      // 确保目录存在
      if (!existsSync(savePath)) {
        mkdirSync(savePath, { recursive: true });
      }

      const filePath = join(savePath, fileName);
      
      // 检查文件是否已存在
      if (existsSync(filePath) && !options.overwrite) {
        return {
          success: false,
          error: '文件已存在',
          filePath,
          fileName
        };
      }

      log.info(`开始下载文件: ${fileName}，URL: ${downloadUrl}`);
      
      // 通知下载开始
      if (options.onDownloadStart) {
        options.onDownloadStart(fileName);
      }

      // 创建 Axios 实例用于下载
      const downloadAxios = axios.create({
        headers: options.headers || this.defaultHeaders,
        httpsAgent: options.proxy ? new HttpsProxyAgent(`${options.proxy.protocol || 'http'}://${options.proxy.host}:${options.proxy.port}`) : this.proxyAgent,
        responseType: 'stream',
        timeout: 60000,
      });

      // 发起下载请求
      const response = await downloadAxios.get(downloadUrl);
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      log.info(`文件大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      // 创建写入流
      const writer = createWriteStream(filePath);
      let downloadedSize = 0;

      // 监听数据流
      response.data.on('data', (chunk: Buffer) => {
        downloadedSize += chunk.length;
        if (options.onProgress && totalSize > 0) {
          const progress = Math.round((downloadedSize / totalSize) * 100);
          options.onProgress(progress);
        }
      });

      // 完成下载
      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      log.info(`文件下载完成: ${fileName}，保存路径: ${filePath}`);
      
      // 通知下载完成
      if (options.onDownloadComplete) {
        options.onDownloadComplete(filePath);
      }

      return {
        success: true,
        filePath,
        fileName,
        fileSize: downloadedSize
      };
    } catch (error) {
      const errorMessage = `下载文件失败: ${error.message}`;
      log.error(errorMessage, error);
      
      // 通知错误
      if (options.onError) {
        options.onError(error);
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 下载模型及其所有文件
   * @param modelId 模型ID
   * @param versionId 版本ID (可选，不提供则下载最新版本)
   * @param options 下载选项
   * @returns 下载结果数组
   */
  public async downloadModelFiles(
    modelId: number,
    versionId?: number,
    options: DownloadOptions = {}
  ): Promise<DownloadResult[]> {
    try {
      log.info(`开始下载模型文件，模型ID: ${modelId}，版本ID: ${versionId || '最新版本'}`);
      
      // 获取模型信息
      const model = await this.getModel(modelId);
      
      // 确定要下载的版本
      let targetVersion: CivitaiModelVersion;
      if (versionId) {
        targetVersion = await this.getModelVersion(modelId, versionId);
      } else {
        // 使用最新版本
        targetVersion = model.modelVersions[0];
      }

      log.info(`目标版本: ${targetVersion.name}，包含 ${targetVersion.files.length} 个文件`);

      // 下载所有文件
      const downloadResults: DownloadResult[] = [];
      
      for (const file of targetVersion.files) {
        log.info(`准备下载文件: ${file.name} (${(file.sizeKB / 1024).toFixed(2)} MB)`);
        
        const result = await this.downloadModel(
          file.downloadUrl,
          file.name,
          {
            ...options,
            onProgress: (progress) => {
              if (options.onProgress) {
                options.onProgress(progress);
              }
            },
            onDownloadStart: (fileName) => {
              if (options.onDownloadStart) {
                options.onDownloadStart(fileName);
              }
            },
            onDownloadComplete: (filePath) => {
              if (options.onDownloadComplete) {
                options.onDownloadComplete(filePath);
              }
            },
            onError: (error) => {
              if (options.onError) {
                options.onError(error);
              }
            }
          }
        );
        
        downloadResults.push({
          ...result,
          modelInfo: model
        });
      }

      const successCount = downloadResults.filter(r => r.success).length;
      log.info(`模型文件下载完成，成功: ${successCount}/${targetVersion.files.length}`);
      
      return downloadResults;
    } catch (error) {
      const errorMessage = `下载模型文件失败: ${error.message}`;
      log.error(errorMessage, error);
      
      if (options.onError) {
        options.onError(error);
      }

      return [{
        success: false,
        error: errorMessage
      }];
    }
  }

  /**
   * 获取模型附加信息
   * @param modelId 模型ID
   * @returns 模型附加信息
   */
  public async getModelMetadata(modelId: number): Promise<any> {
    try {
      log.info(`正在获取模型附加信息，模型ID: ${modelId}`);
      const model = await this.getModel(modelId);
      
      // 提取并整理模型附加信息
      const metadata = {
        id: model.id,
        name: model.name,
        description: model.description,
        type: model.type,
        creator: model.creator,
        tags: model.tags,
        stats: model.stats,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        versions: model.modelVersions.map(version => ({
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

      log.info(`成功获取模型附加信息: ${model.name}`);
      return metadata;
    } catch (error) {
      const errorMessage = `获取模型附加信息失败: ${error.message}`;
      log.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 保存模型附加信息到JSON文件
   * @param modelId 模型ID
   * @param savePath 保存路径
   * @returns 保存的文件路径
   */
  public async saveModelMetadataToFile(
    modelId: number,
    savePath?: string
  ): Promise<string> {
    try {
      log.info(`正在保存模型附加信息到文件，模型ID: ${modelId}`);
      const metadata = await this.getModelMetadata(modelId);
      
      // 设置保存路径
      let targetPath: string;
      if (savePath) {
        targetPath = savePath;
      } else {
        const downloadsPath = app.getPath('downloads');
        if (!downloadsPath) {
          throw new Error('无法获取下载目录路径');
        }
        targetPath = join(downloadsPath, 'civitai-models', 'metadata');
      }
      
      // 确保目录存在
      if (!existsSync(targetPath)) {
        mkdirSync(targetPath, { recursive: true });
        log.info(`创建目录: ${targetPath}`);
      }

      const fileName = `${metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}_${metadata.id}.json`;
      const filePath = join(targetPath, fileName);

      // 保存到文件
      writeFileSync(filePath, JSON.stringify(metadata, null, 2));
      log.info(`模型附加信息已保存到: ${filePath}`);

      return filePath;
    } catch (error) {
      const errorMessage = `保存模型附加信息失败: ${error.message}`;
      log.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }
}

/**
 * 创建 Civitai 客户端实例
 * @param options 配置选项
 * @returns CivitaiClient 实例
 */
export function createCivitaiClient(options?: {
  proxy?: ProxyConfig;
  headers?: Partial<BrowserHeaders>;
}): CivitaiClient {
  return new CivitaiClient(options);
}

/**
 * 默认 Civitai 客户端实例
 */
export const defaultCivitaiClient = createCivitaiClient();