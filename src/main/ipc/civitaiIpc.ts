import { ipcMain, IpcMainInvokeEvent, WebContents } from 'electron';
import {
  CivitaiClient,
  CivitaiModel,
  CivitaiModelVersion,
  ProxyConfig,
  BrowserHeaders,
  DownloadOptions,
  DownloadResult
} from '../utils/coreCivitai';
import log from 'electron-log';

// 设置日志输出编码为GBK，确保中文正确显示
log.transports.console.format = '[{level}] {y}-{m}-{d} {h}:{i}:{s}.{ms} > {text}';
log.transports.file.format = '[{level}] {y}-{m}-{d} {h}:{i}:{s}.{ms} > {text}';
if (process.platform === 'win32') {
  log.transports.console.useStyles = false; // 禁用样式以避免编码问题
}

/**
 * IPC 请求参数接口
 */
export interface CivitaiIpcRequest {
  modelId?: number;
  versionId?: number;
  query?: string;
  limit?: number;
  proxy?: ProxyConfig;
  headers?: Partial<BrowserHeaders>;
  downloadUrl?: string;
  fileName?: string;
  savePath?: string;
  overwrite?: boolean;
}

/**
 * IPC 响应接口
 */
export interface CivitaiIpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * IPC 事件名称
 */
export const CivitaiIpcEvents = {
  // 模型查询相关
  GET_MODEL: 'civitai:get-model',
  GET_MODEL_VERSION: 'civitai:get-model-version',
  SEARCH_MODELS: 'civitai:search-models',
  
  // 模型下载相关
  DOWNLOAD_MODEL: 'civitai:download-model',
  DOWNLOAD_MODEL_FILES: 'civitai:download-model-files',
  
  // 模型附加信息相关
  GET_MODEL_METADATA: 'civitai:get-model-metadata',
  SAVE_MODEL_METADATA_TO_FILE: 'civitai:save-model-metadata-to-file',
  
  // 配置相关
  SET_PROXY: 'civitai:set-proxy',
  SET_HEADERS: 'civitai:set-headers',
  
  // 下载进度通知
  DOWNLOAD_PROGRESS: 'civitai:download-progress',
  DOWNLOAD_START: 'civitai:download-start',
  DOWNLOAD_COMPLETE: 'civitai:download-complete',
  DOWNLOAD_ERROR: 'civitai:download-error'
} as const;

/**
 * Civitai IPC 处理器类
 */
export class CivitaiIpcHandler {
  private client: CivitaiClient;
  private webContents: WebContents;

  constructor(webContents: WebContents) {
    this.client = new CivitaiClient();
    this.webContents = webContents;
  }

  /**
   * 发送进度通知到渲染进程
   * @param event 事件名称
   * @param data 数据
   */
  private sendNotification(event: string, data: any): void {
    this.webContents.send(event, data);
  }

  /**
   * 创建下载选项
   * @param request IPC 请求
   * @returns 下载选项
   */
  private createDownloadOptions(request: CivitaiIpcRequest): DownloadOptions {
    return {
      proxy: request.proxy,
      headers: request.headers as BrowserHeaders,
      savePath: request.savePath,
      overwrite: request.overwrite,
      onProgress: (progress: number) => {
        this.sendNotification(CivitaiIpcEvents.DOWNLOAD_PROGRESS, { progress });
      },
      onDownloadStart: (fileName: string) => {
        this.sendNotification(CivitaiIpcEvents.DOWNLOAD_START, { fileName });
      },
      onDownloadComplete: (filePath: string) => {
        this.sendNotification(CivitaiIpcEvents.DOWNLOAD_COMPLETE, { filePath });
      },
      onError: (error: Error) => {
        this.sendNotification(CivitaiIpcEvents.DOWNLOAD_ERROR, {
          error: error.message
        });
      }
    };
  }

  /**
   * 获取模型信息
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async getModel(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<CivitaiModel>> {
    try {
      if (!request.modelId) {
        throw new Error('Model ID cannot be empty');
      }

      log.info(`IPC request to get model info, model ID: ${request.modelId}`);
      const model = await this.client.getModel(request.modelId);
      
      return {
        success: true,
        data: model,
        message: 'Successfully retrieved model information'
      };
    } catch (error) {
      const errorMessage = `Failed to get model information: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 获取模型版本信息
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async getModelVersion(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<CivitaiModelVersion>> {
    try {
      if (!request.modelId || !request.versionId) {
        throw new Error('Model ID and version ID cannot be empty');
      }

      log.info(`IPC request to get model version info, model ID: ${request.modelId}, version ID: ${request.versionId}`);
      const version = await this.client.getModelVersion(request.modelId, request.versionId);
      
      return {
        success: true,
        data: version,
        message: 'Successfully retrieved model version information'
      };
    } catch (error) {
      const errorMessage = `Failed to get model version information: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 搜索模型
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async searchModels(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<CivitaiModel[]>> {
    try {
      if (!request.query) {
        throw new Error('Search query cannot be empty');
      }

      log.info(`IPC request to search models, query: ${request.query}, limit: ${request.limit || 20}`);
      const models = await this.client.searchModels(request.query, request.limit || 20);
      
      return {
        success: true,
        data: models,
        message: `Successfully found ${models.length} models`
      };
    } catch (error) {
      const errorMessage = `Failed to search models: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 下载模型文件
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async downloadModel(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<DownloadResult>> {
    try {
      if (!request.downloadUrl || !request.fileName) {
        throw new Error('Download URL and filename cannot be empty');
      }

      log.info(`IPC request to download model file, URL: ${request.downloadUrl}, filename: ${request.fileName}`);
      
      const options = this.createDownloadOptions(request);
      const result = await this.client.downloadModel(
        request.downloadUrl,
        request.fileName,
        options
      );
      
      return {
        success: true,
        data: result,
        message: result.success ? 'Download successful' : 'Download failed'
      };
    } catch (error) {
      const errorMessage = `Failed to download model file: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 下载模型所有文件
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async downloadModelFiles(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<DownloadResult[]>> {
    try {
      if (!request.modelId) {
        throw new Error('Model ID cannot be empty');
      }

      log.info(`IPC request to download all model files, model ID: ${request.modelId}, version ID: ${request.versionId || 'latest'}`);
      
      const options = this.createDownloadOptions(request);
      const results = await this.client.downloadModelFiles(
        request.modelId,
        request.versionId,
        options
      );
      
      const successCount = results.filter(r => r.success).length;
      return {
        success: true,
        data: results,
        message: `Download completed, success: ${successCount}/${results.length}`
      };
    } catch (error) {
      const errorMessage = `Failed to download all model files: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 获取模型附加信息
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async getModelMetadata(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<any>> {
    try {
      if (!request.modelId) {
        throw new Error('Model ID cannot be empty');
      }

      log.info(`IPC request to get model metadata, model ID: ${request.modelId}`);
      const metadata = await this.client.getModelMetadata(request.modelId);
      
      return {
        success: true,
        data: metadata,
        message: 'Successfully retrieved model metadata'
      };
    } catch (error) {
      const errorMessage = `Failed to get model metadata: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 保存模型附加信息到文件
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async saveModelMetadataToFile(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<string>> {
    try {
      if (!request.modelId) {
        throw new Error('Model ID cannot be empty');
      }

      log.info(`IPC request to save model metadata to file, model ID: ${request.modelId}`);
      const filePath = await this.client.saveModelMetadataToFile(
        request.modelId,
        request.savePath
      );
      
      return {
        success: true,
        data: filePath,
        message: 'Successfully saved model metadata to file'
      };
    } catch (error) {
      const errorMessage = `Failed to save model metadata to file: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 设置代理
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async setProxy(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<void>> {
    try {
      if (!request.proxy) {
        throw new Error('Proxy configuration cannot be empty');
      }

      log.info(`IPC request to set proxy, host: ${request.proxy.host}, port: ${request.proxy.port}`);
      this.client.setProxy(request.proxy);
      
      return {
        success: true,
        message: 'Successfully set proxy'
      };
    } catch (error) {
      const errorMessage = `Failed to set proxy: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 设置请求头
   * @param event IPC 事件
   * @param request 请求参数
   * @returns 响应
   */
  public async setHeaders(
    event: IpcMainInvokeEvent,
    request: CivitaiIpcRequest
  ): Promise<CivitaiIpcResponse<void>> {
    try {
      if (!request.headers) {
        throw new Error('Header configuration cannot be empty');
      }

      log.info('IPC request to set headers');
      this.client.setHeaders(request.headers);
      
      return {
        success: true,
        message: 'Successfully set headers'
      };
    } catch (error) {
      const errorMessage = `Failed to set headers: ${error.message}`;
      log.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

/**
 * 注册 Civitai IPC 处理器
 * @param webContents WebContents 实例
 */
export function registerCivitaiIpcHandlers(webContents: WebContents): void {
  const handler = new CivitaiIpcHandler(webContents);

  // 模型查询相关
  ipcMain.handle(CivitaiIpcEvents.GET_MODEL, handler.getModel.bind(handler));
  ipcMain.handle(CivitaiIpcEvents.GET_MODEL_VERSION, handler.getModelVersion.bind(handler));
  ipcMain.handle(CivitaiIpcEvents.SEARCH_MODELS, handler.searchModels.bind(handler));
  
  // 模型下载相关
  ipcMain.handle(CivitaiIpcEvents.DOWNLOAD_MODEL, handler.downloadModel.bind(handler));
  ipcMain.handle(CivitaiIpcEvents.DOWNLOAD_MODEL_FILES, handler.downloadModelFiles.bind(handler));
  
  // 模型附加信息相关
  ipcMain.handle(CivitaiIpcEvents.GET_MODEL_METADATA, handler.getModelMetadata.bind(handler));
  ipcMain.handle(CivitaiIpcEvents.SAVE_MODEL_METADATA_TO_FILE, handler.saveModelMetadataToFile.bind(handler));
  
  // 配置相关
  ipcMain.handle(CivitaiIpcEvents.SET_PROXY, handler.setProxy.bind(handler));
  ipcMain.handle(CivitaiIpcEvents.SET_HEADERS, handler.setHeaders.bind(handler));

  log.info('Civitai IPC handlers registered successfully  完成');
}

/**
 * 移除 Civitai IPC 处理器
 */
export function removeCivitaiIpcHandlers(): void {
  // 模型查询相关
  ipcMain.removeHandler(CivitaiIpcEvents.GET_MODEL);
  ipcMain.removeHandler(CivitaiIpcEvents.GET_MODEL_VERSION);
  ipcMain.removeHandler(CivitaiIpcEvents.SEARCH_MODELS);
  
  // 模型下载相关
  ipcMain.removeHandler(CivitaiIpcEvents.DOWNLOAD_MODEL);
  ipcMain.removeHandler(CivitaiIpcEvents.DOWNLOAD_MODEL_FILES);
  
  // 模型附加信息相关
  ipcMain.removeHandler(CivitaiIpcEvents.GET_MODEL_METADATA);
  ipcMain.removeHandler(CivitaiIpcEvents.SAVE_MODEL_METADATA_TO_FILE);
  
  // 配置相关
  ipcMain.removeHandler(CivitaiIpcEvents.SET_PROXY);
  ipcMain.removeHandler(CivitaiIpcEvents.SET_HEADERS);

  log.info('Civitai IPC handlers removed successfully');
}