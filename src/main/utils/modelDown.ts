/**
 * C站模型下载工具
 * 提供模型下载、进度跟踪、暂停、恢复、取消等功能
 */

import { net, app } from 'electron';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline, Transform } from 'stream';
import { promisify } from 'util';
import { createWriteStream } from 'fs';

// 重试函数
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  abortController?: AbortController
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 检查是否已取消
      if (abortController && abortController.signal.aborted) {
        throw new Error('Request aborted before retry');
      }
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 如果是AbortError或已取消，则不再重试
      if (lastError.name === 'AbortError' ||
          lastError.message.includes('aborted') ||
          (abortController && abortController.signal.aborted)) {
        console.warn('Request was aborted, not retrying');
        throw lastError;
      }
      
      // 如果不是最后一次尝试，则等待后重试
      if (attempt < maxRetries) {
        console.warn(`Request attempt ${attempt} failed, retrying in ${delayMs}ms...`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // 指数退避
        delayMs *= 2;
      } else {
        throw lastError;
      }
    }
  }
  
  throw lastError!;
}

// 将pipeline转换为Promise版本
const pipelineAsync = promisify(pipeline);

// 下载任务状态枚举
export enum DownloadStatus {
  WAITING = '等待中',
  DOWNLOADING = '下载中',
  PAUSED = '已暂停',
  COMPLETED = '已完成',
  CANCELLED = '已取消',
  FAILED = '失败'
}

// 下载任务接口
export interface DownloadTask {
  id: string;
  name: string;
  url: string;
  status: DownloadStatus;
  progress: number;
  downloadedSize: number;
  totalSize: number;
  filePath: string;
  addedAt: string;
  completedAt?: string;
  error?: string;
  // 模型元数据，用于生成附加文件
  modelMetadata?: {
    title: string;
    description: string;
    version: string;
    hash: string;
    triggerWords: string[];
    type: string;
    usageTips: string;
    imageUrl?: string;
  };
}

// 代理设置接口
export interface ProxySettings {
  server?: string;
  enabled?: boolean;
  useSystemProxy?: boolean;
}

// 下载器配置接口
export interface DownloaderConfig {
  downloadDirectory: string;
  proxySettings: ProxySettings;
}

// 下载进度回调函数
export type ProgressCallback = (progress: number, downloadedSize: number, totalSize: number) => void;

// 下载完成回调函数
export type CompletionCallback = (success: boolean, filePath?: string, error?: string) => void;

/**
 * C站模型下载器类
 */
export class ModelDownloader {
  private config: DownloaderConfig;
  private activeDownloads: Map<string, {
    request: any;
    abortController?: AbortController;
    isCancelled: boolean;
    isDestroyed: boolean;
    filePath: string;
    fileStream: fs.WriteStream | null;
    downloadedSize: number;
    totalSize: number;
    progressCallback: ProgressCallback | null;
    completionCallback: CompletionCallback | null;
    modelMetadata?: any;
  }> = new Map();

  constructor(config: DownloaderConfig) {
    this.config = config;
  }

  /**
   * 更新下载器配置
   * @param config 新的配置
   */
  updateConfig(config: DownloaderConfig): void {
    this.config = config;
  }

  /**
   * 保存模型元数据到metaData文件夹
   * @param modelMetadata 模型元数据
   * @returns Promise<string> 生成的文件名
   */
  private async saveModelMetadata(modelMetadata: any): Promise<string> {
    try {
      // 确保元数据文件夹存在
      const metaDataDir = path.join(app.getPath('userData'), 'Temp', 'metaData');
      if (!fs.existsSync(metaDataDir)) {
        fs.mkdirSync(metaDataDir, { recursive: true });
      }

      // 生成文件名（按照automa.js的命名规则）
      const name1 = `${modelMetadata.title}--${modelMetadata.version}--${modelMetadata.hash}`;
      const filename = this.convertToValidFilename(name1);
      // 注意：automa.js中元数据文件名不包含类型前缀，直接使用filename
      const baseFilename = filename;

      // 1. 保存JSON文件
      const jsonData = {
        "description": modelMetadata.type + (modelMetadata.triggerWords ? " {" + modelMetadata.triggerWords.join(',') + "}" : "") + "\n" + (modelMetadata.currentUrl || ''),
        "activation text": modelMetadata.triggerWords ? " {" + modelMetadata.triggerWords.join(',') + "}" : "",
        "notes": modelMetadata.description
      };

      const jsonContent = JSON.stringify(jsonData, null, 2);
      const jsonFilePath = path.join(metaDataDir, `${baseFilename}.json`);
      fs.writeFileSync(jsonFilePath, jsonContent, 'utf8');

      // 2. 保存TXT文件
      const txtContent = `${modelMetadata.title}\n\nC站网址：\n${modelMetadata.currentUrl || ''}\n模型ID:\n${modelMetadata.hash}\nVersion:\n${modelMetadata.version}\n使用TIP：${modelMetadata.usageTips || ''}\n触发词：\n${modelMetadata.triggerWords ? modelMetadata.triggerWords.join(', ') : ''}\n版本号：${modelMetadata.version}\n\n\n${modelMetadata.description}`;
      const txtFilePath = path.join(metaDataDir, `${baseFilename}.txt`);
      fs.writeFileSync(txtFilePath, txtContent, 'utf8');

      // 3. 下载图片文件（如果有）
      if (modelMetadata.imageUrl) {
        try {
          const imagePath = path.join(metaDataDir, `${baseFilename}.png`);
          
          // 使用Electron的net模块下载图片
          const request = net.request({
            url: modelMetadata.imageUrl,
            method: 'GET'
          });
          
          request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          
          const fileStream = createWriteStream(imagePath);
          
          request.on('response', (response: any) => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
              fileStream.destroy();
              console.error('下载图片失败:', response.statusCode);
              return;
            }
            
            response.on('data', (chunk: Buffer) => {
              fileStream.write(chunk);
            });
            
            response.on('end', () => {
              fileStream.end();
              console.log('图片下载完成:', imagePath);
            });
            
            response.on('error', (error: Error) => {
              console.error('下载图片响应错误:', error);
              fileStream.destroy();
            });
          });
          
          request.on('error', (error: Error) => {
            console.error('下载图片请求错误:', error);
            fileStream.destroy();
          });
          
          request.end();
        } catch (imageError) {
          console.error('下载图片文件失败:', imageError);
        }
      }

      console.log('元数据保存完成:', baseFilename);
      return baseFilename;
    } catch (error) {
      console.error('保存元数据失败:', error);
      throw error;
    }
  }

  /**
   * 下载模型文件
   * @param taskId 任务ID
   * @param url 下载URL
   * @param filename 文件名
   * @param progressCallback 进度回调函数
   * @param completionCallback 完成回调函数
   * @returns Promise<boolean> 下载是否成功启动
   */
  async downloadModel(
    taskId: string,
    url: string,
    filename: string,
    progressCallback?: ProgressCallback,
    completionCallback?: CompletionCallback,
    modelMetadata?: any
  ): Promise<boolean> {
    try {
      console.log(`开始下载模型: ${filename} from ${url}`);
      
      // 确保下载目录存在
      const dirCheck = await this.ensureDownloadDirectory();
      if (!dirCheck.success) {
        throw new Error(dirCheck.error || 'Failed to create download directory');
      }
      
      // 如果有模型元数据，则直接使用统一命名格式（参考automa.js的命名逻辑）
      let finalFilename = filename;
      if (modelMetadata) {
        // 使用Title + "--" + Version + "--" + Hash的格式
        const name1 = `${modelMetadata.title}--${modelMetadata.version}--${modelMetadata.hash}`;
        const validName = this.convertToValidFilename(name1);
        // 确保模型文件使用.safetensors扩展名
        finalFilename = validName + '.safetensors';
        console.log('使用命名规范重命名模型文件:', finalFilename);
      } else {
        // 如果没有模型元数据，确保文件有.safetensors扩展名
        if (!finalFilename.endsWith('.safetensors')) {
          finalFilename = finalFilename + '.safetensors';
          console.log('添加.safetensors扩展名:', finalFilename);
        }
      }
      
      // 处理文件名冲突
      const uniqueFilename = await this.generateUniqueFilename(finalFilename);
      const filePath = path.join(this.config.downloadDirectory, uniqueFilename);
      
      // 检查文件系统权限
      const permissionCheck = await this.checkFilePermissions(filePath);
      if (!permissionCheck.success) {
        throw new Error(permissionCheck.error || 'Insufficient file permissions');
      }
      
      // 如果有模型元数据，首先保存元数据到metaData文件夹
      if (modelMetadata) {
        try {
          console.log('开始保存模型元数据到metaData文件夹...');
          const metadataFilename = await this.saveModelMetadata(modelMetadata);
          console.log('模型元数据保存完成:', metadataFilename);
        } catch (metadataError) {
          console.error('保存模型元数据失败:', metadataError);
          // 即使元数据保存失败，也继续下载模型
        }
      }
      
      // 如果有模型元数据，在开始下载前生成附加文件（在模型文件所在目录）
      if (modelMetadata) {
        try {
          // 创建一个临时的下载任务对象用于生成元数据文件
          const tempTask: DownloadTask = {
            id: taskId,
            name: uniqueFilename,
            url: url,
            status: DownloadStatus.WAITING,
            progress: 0,
            downloadedSize: 0,
            totalSize: 0,
            filePath: filePath,
            addedAt: new Date().toISOString(),
            modelMetadata: modelMetadata
          };
          
          // 生成附加文件（在模型文件所在目录）
          await this.generateAdditionalFiles(tempTask, filePath);
          console.log('附加文件生成完成');
        } catch (metadataError) {
          console.error('生成附加文件失败:', metadataError);
          // 即使附加文件生成失败，也继续下载模型
        }
      }
      
      // 创建文件写入流
      const fileStream = createWriteStream(filePath);
      
      // 保存下载信息
      this.activeDownloads.set(taskId, {
        request: null,
        isCancelled: false,
        isDestroyed: false,
        filePath,
        fileStream,
        downloadedSize: 0,
        totalSize: 0,
        progressCallback: progressCallback || null,
        completionCallback: completionCallback || null,
        modelMetadata: modelMetadata || null
      });
      
      // 发起下载请求
      const success = await this.performDownload(taskId, url);
      return success;
    } catch (error) {
      console.error('启动下载失败:', error);
      this.handleDownloadError(taskId, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * 执行实际的下载操作
   * @param taskId 任务ID
   * @param url 下载URL
   * @returns Promise<boolean> 下载是否成功启动
   */
  private async performDownload(taskId: string, url: string): Promise<boolean> {
    try {
      const downloadInfo = this.activeDownloads.get(taskId);
      if (!downloadInfo) {
        throw new Error('Download task not found');
      }

      // 设置超时控制
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Download timeout')), 30000); // 30秒超时
      });

      // 实际下载操作
      const downloadPromise = this.executeDownload(taskId, url);

      // 使用Promise.race实现超时控制
      return await Promise.race([downloadPromise, timeoutPromise]);
    } catch (error) {
      console.error('执行下载失败:', error);
      this.handleDownloadError(taskId, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * 执行实际的下载操作（带重试机制）
   * @param taskId 任务ID
   * @param url 下载URL
   * @param retryCount 重试次数
   * @returns Promise<boolean> 下载是否成功启动
   */
  private async executeDownload(taskId: string, url: string, retryCount: number = 3): Promise<boolean> {
    try {
      const downloadInfo = this.activeDownloads.get(taskId);
      if (!downloadInfo) {
        throw new Error('Download task not found');
      }

      // 检查是否已取消或已销毁
      if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
        console.log('下载已取消或已销毁，不执行下载');
        return false;
      }

      const { proxySettings } = this.config;
      
      // 如果启用了自定义代理
      if (proxySettings.enabled && proxySettings.server) {
        console.log('使用自定义代理下载模型:', proxySettings.server);
        // 使用node-fetch配合代理代理
        return await this.downloadWithProxy(taskId, url);
      }
      
      // 对于系统代理和直接连接，使用AbortController增强取消功能
      const controller = new AbortController();
      
      // 保存AbortController以便取消下载
      downloadInfo.abortController = controller;
      
      // 根据代理设置创建请求
      let request: any;
      
      // 如果启用了系统代理
      if (proxySettings.useSystemProxy) {
        console.log('使用系统代理下载模型');
        request = net.request({
          url: url,
          method: 'GET'
        });
      }
      // 直接连接（无代理）
      else {
        console.log('直接下载模型');
        request = net.request({
          url: url,
          method: 'GET'
        });
      }
      
      // 设置请求头
      request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // 监听AbortController信号 - 在发送请求之前设置
      controller.signal.addEventListener('abort', () => {
        console.log('下载请求被AbortController取消');
        try {
          // 强制中断请求和响应
          if (request) {
            if (request.destroy) {
              request.destroy();
            } else if (request.abort) {
              request.abort();
            } else if (request.cancel) {
              request.cancel();
            }
          }
          
          // 立即关闭文件流
          const currentDownloadInfo = this.activeDownloads.get(taskId);
          if (currentDownloadInfo && currentDownloadInfo.fileStream) {
            try {
              currentDownloadInfo.fileStream.destroy();
            } catch (streamError) {
              console.error('关闭文件流失败:', streamError);
            }
          }
        } catch (error) {
          console.error('取消下载时发生错误:', error);
        }
      });
      
      // 监听响应
      request.on('response', (response: any) => {
        console.log('收到响应:', response.statusCode);
        
        // 检查是否已取消或已销毁
        const currentDownloadInfo = this.activeDownloads.get(taskId);
        if (!currentDownloadInfo || currentDownloadInfo.isCancelled || currentDownloadInfo.isDestroyed) {
          console.log('下载已取消或已销毁，停止处理响应');
          try {
            response.destroy();
            request.destroy();
          } catch (error) {
            console.error('销毁响应和请求时出错:', error);
          }
          return;
        }
        
        // 检查响应状态
        if (response.statusCode < 200 || response.statusCode >= 300) {
          this.handleDownloadError(taskId, `HTTP ${response.statusCode}`);
          return;
        }
        
        // 获取文件总大小
        const contentLength = response.headers['content-length'];
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
        
        // 更新下载信息
        if (currentDownloadInfo) {
          currentDownloadInfo.totalSize = totalSize;
        }
        
        // 监听数据接收
        response.on('data', (chunk: Buffer) => {
          const downloadInfo = this.activeDownloads.get(taskId);
          if (downloadInfo && downloadInfo.fileStream) {
            // 检查是否已取消或已销毁
            if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
              console.log('下载已取消或已销毁，停止写入数据');
              try {
                response.destroy();
                request.destroy();
                downloadInfo.fileStream.destroy();
              } catch (error) {
                console.error('销毁响应、请求和文件流时出错:', error);
              }
              return;
            }
            
            // 写入文件
            try {
              downloadInfo.fileStream.write(chunk);
            } catch (writeError) {
              console.error('写入文件失败:', writeError);
              try {
                response.destroy();
                request.destroy();
                downloadInfo.fileStream.destroy();
              } catch (error) {
                console.error('销毁响应、请求和文件流时出错:', error);
              }
              this.handleDownloadError(taskId, 'Failed to write to file');
              return;
            }
            
            // 更新已下载大小
            downloadInfo.downloadedSize += chunk.length;
            
            // 计算进度
            let progress = 0;
            if (totalSize > 0 && downloadInfo.downloadedSize <= totalSize) {
              progress = Math.round((downloadInfo.downloadedSize / totalSize) * 100);
              // 确保进度不超过100%
              progress = Math.min(progress, 100);
            }
            
            // 调用进度回调
            if (downloadInfo.progressCallback) {
              try {
                downloadInfo.progressCallback(progress, downloadInfo.downloadedSize, totalSize);
              } catch (callbackError) {
                console.error('进度回调失败:', callbackError);
              }
            }
          }
        });
        
        // 监听下载完成
        response.on('end', () => {
          const downloadInfo = this.activeDownloads.get(taskId);
          if (downloadInfo && downloadInfo.fileStream) {
            // 检查是否已取消或已销毁
            if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
              console.log('下载已取消或已销毁，不处理完成事件');
              try {
                response.destroy();
                request.destroy();
                downloadInfo.fileStream.destroy();
              } catch (error) {
                console.error('销毁响应、请求和文件流时出错:', error);
              }
              return;
            }
            
            // 关闭文件流
            try {
              downloadInfo.fileStream.end();
            } catch (endError) {
              console.error('关闭文件流失败:', endError);
              this.handleDownloadError(taskId, 'Failed to close file stream');
              return;
            }
            
            // 调用下载完成处理
            this.handleDownloadCompletion(taskId);
          }
        });
        
        // 监听错误
        response.on('error', (error: Error) => {
          console.error('下载响应错误:', error);
          this.handleDownloadError(taskId, error.message);
        });
      });
      
      // 监听请求错误
      request.on('error', (error: Error) => {
        console.error('下载请求错误:', error);
        
        // 检查是否已取消或已销毁
        const downloadInfo = this.activeDownloads.get(taskId);
        if (downloadInfo && (downloadInfo.isCancelled || downloadInfo.isDestroyed)) {
          console.log('下载已取消或已销毁，不进行重试');
          return;
        }
        
        // 如果还有重试次数，尝试重试
        if (retryCount > 0) {
          console.log(`下载失败，剩余重试次数: ${retryCount}`);
          setTimeout(() => {
            // 再次检查是否已取消或已销毁
            const currentDownloadInfo = this.activeDownloads.get(taskId);
            if (currentDownloadInfo && !currentDownloadInfo.isCancelled && !currentDownloadInfo.isDestroyed) {
              this.executeDownload(taskId, url, retryCount - 1);
            }
          }, 1000); // 1秒后重试
        } else {
          this.handleDownloadError(taskId, error.message);
        }
      });
      
      // 保存请求对象
      downloadInfo.request = request;
      
      // 发送请求
      request.end();
      
      return true;
    } catch (error) {
      console.error('执行下载失败:', error);
      this.handleDownloadError(taskId, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * 使用代理下载模型
   * @param taskId 任务ID
   * @param url 下载URL
   * @returns Promise<boolean> 下载是否成功启动
   */
  private async downloadWithProxy(taskId: string, url: string): Promise<boolean> {
    try {
      const downloadInfo = this.activeDownloads.get(taskId);
      if (!downloadInfo) {
        throw new Error('Download task not found');
      }

      // 检查是否已取消或已销毁
      if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
        console.log('下载已取消或已销毁，不执行代理下载');
        return false;
      }

      const { proxySettings } = this.config;
      if (!proxySettings.server) {
        throw new Error('Proxy server not configured');
      }

      // 动态导入node-fetch
      const nodeFetch = (await import('node-fetch')).default;
      
      // 创建代理代理
      let agent;
      if (proxySettings.server.startsWith('https://')) {
        agent = new HttpsProxyAgent(proxySettings.server);
      } else {
        agent = new HttpProxyAgent(proxySettings.server);
      }
      
      // 创建一个AbortController用于超时控制和取消下载
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('Proxy download request timeout after 60 seconds');
      }, 60000); // 60秒超时
      
      // 保存AbortController以便取消下载
      const existingDownloadInfo = this.activeDownloads.get(taskId);
      if (existingDownloadInfo) {
        existingDownloadInfo.abortController = controller;
      }
      
      // 发起请求
      let response;
      try {
        response = await retryRequest(async () => {
          // 检查是否已取消或已销毁
          const currentDownloadInfo = this.activeDownloads.get(taskId);
          if (currentDownloadInfo && (currentDownloadInfo.isCancelled || currentDownloadInfo.isDestroyed)) {
            throw new Error('Download cancelled or destroyed');
          }
          
          // 使用主AbortController而不是创建新的
          const result = await nodeFetch(url, {
            method: 'GET',
            agent: agent,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: controller.signal
          });
          return result;
        }, 2, 3000, controller); // 最多重试2次，初始延迟3秒，传递主AbortController
      } catch (fetchError) {
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
      
      // 再次检查是否已取消或已销毁
      const currentDownloadInfo = this.activeDownloads.get(taskId);
      if (currentDownloadInfo && (currentDownloadInfo.isCancelled || currentDownloadInfo.isDestroyed)) {
        console.log('下载已取消或已销毁，停止处理代理下载响应');
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 获取文件总大小
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      // 更新下载信息
      if (currentDownloadInfo) {
        currentDownloadInfo.totalSize = totalSize;
      }
      
      // 创建文件写入流
      const fileStream = createWriteStream(downloadInfo.filePath);
      
      // 创建进度跟踪流
      const progressStream = new ProgressTransformStream(taskId, this);
      
      // 使用pipeline处理流，但添加取消检查
      try {
        await pipelineAsync(
          response.body,
          progressStream,
          fileStream
        );
      } catch (pipelineError) {
        // 检查是否是因为取消而导致的错误
        const currentDownloadInfo = this.activeDownloads.get(taskId);
        if (currentDownloadInfo && (currentDownloadInfo.isCancelled || currentDownloadInfo.isDestroyed)) {
          console.log('下载已取消或已销毁，停止处理代理下载流');
          return false;
        }
        throw pipelineError;
      }
      
      // 再次检查是否已取消或已销毁
      const finalDownloadInfo = this.activeDownloads.get(taskId);
      if (finalDownloadInfo && (finalDownloadInfo.isCancelled || finalDownloadInfo.isDestroyed)) {
        console.log('下载已取消或已销毁，不处理代理下载完成');
        return false;
      }
      
      // 下载完成处理
      this.handleDownloadCompletion(taskId);
      return true;
    } catch (error) {
      console.error('代理下载失败:', error);
      this.handleDownloadError(taskId, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * 暂停下载
   * @param taskId 任务ID
   * @returns boolean 是否成功暂停
   */
  pauseDownload(taskId: string): boolean {
    try {
      const downloadInfo = this.activeDownloads.get(taskId);
      if (!downloadInfo) {
        console.log('下载任务不存在:', taskId);
        return false;
      }
      
      // 取消请求
      if (downloadInfo.request) {
        downloadInfo.request.cancel();
      }
      
      // 关闭文件流
      if (downloadInfo.fileStream) {
        downloadInfo.fileStream.close();
      }
      
      console.log('下载已暂停:', taskId);
      return true;
    } catch (error) {
      console.error('暂停下载失败:', error);
      return false;
    }
  }

  /**
   * 恢复下载
   * @param taskId 任务ID
   * @param url 下载URL
   * @param filename 文件名
   * @param progressCallback 进度回调函数
   * @param completionCallback 完成回调函数
   * @returns Promise<boolean> 是否成功恢复
   */
  async resumeDownload(
    taskId: string,
    url: string,
    filename: string,
    progressCallback?: ProgressCallback,
    completionCallback?: CompletionCallback,
    modelMetadata?: any
  ): Promise<boolean> {
    try {
      console.log(`恢复下载模型: ${filename} from ${url}`);
      
      // 确保下载目录存在
      const dirCheck = await this.ensureDownloadDirectory();
      if (!dirCheck.success) {
        throw new Error(dirCheck.error || 'Failed to create download directory');
      }
      
      // 如果有模型元数据，则直接使用统一命名格式（参考automa.js的命名逻辑）
      let finalFilename = filename;
      if (modelMetadata) {
        // 使用Title + "--" + Version + "--" + Hash的格式
        const name1 = `${modelMetadata.title}--${modelMetadata.version}--${modelMetadata.hash}`;
        const validName = this.convertToValidFilename(name1);
        // 确保模型文件使用.safetensors扩展名
        finalFilename = validName + '.safetensors';
        console.log('使用命名规范重命名恢复下载的模型文件:', finalFilename);
      } else {
        // 如果没有模型元数据，确保文件有.safetensors扩展名
        if (!finalFilename.endsWith('.safetensors')) {
          finalFilename = finalFilename + '.safetensors';
          console.log('添加.safetensors扩展名:', finalFilename);
        }
      }
      
      // 处理文件名冲突
      const uniqueFilename = await this.generateUniqueFilename(finalFilename);
      const filePath = path.join(this.config.downloadDirectory, uniqueFilename);
      
      // 检查文件系统权限
      const permissionCheck = await this.checkFilePermissions(filePath);
      if (!permissionCheck.success) {
        throw new Error(permissionCheck.error || 'Insufficient file permissions');
      }
      
      // 检查是否存在部分下载的文件
      let downloadedSize = 0;
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        downloadedSize = stats.size;
      }
      
      // 创建文件写入流，使用追加模式
      const fileStream = fs.createWriteStream(filePath, { flags: 'a' });
      
      // 保存下载信息
      this.activeDownloads.set(taskId, {
        request: null,
        isCancelled: false,
        isDestroyed: false,
        filePath,
        fileStream,
        downloadedSize,
        totalSize: 0, // 总大小将在请求时获取
        progressCallback: progressCallback || null,
        completionCallback: completionCallback || null,
        modelMetadata: modelMetadata || null
      });
      
      // 发起下载请求，支持断点续传
      const success = await this.performResumeDownload(taskId, url, downloadedSize);
      return success;
    } catch (error) {
      console.error('恢复下载失败:', error);
      this.handleDownloadError(taskId, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * 执行恢复下载操作（支持断点续传）
   * @param taskId 任务ID
   * @param url 下载URL
   * @param rangeStart 断点开始位置
   * @returns Promise<boolean> 下载是否成功启动
   */
  private async performResumeDownload(taskId: string, url: string, rangeStart: number): Promise<boolean> {
    try {
      const downloadInfo = this.activeDownloads.get(taskId);
      if (!downloadInfo) {
        throw new Error('Download task not found');
      }

      // 设置超时控制
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Resume download timeout')), 30000); // 30秒超时
      });

      // 实际恢复下载操作
      const downloadPromise = this.executeResumeDownload(taskId, url, rangeStart);

      // 使用Promise.race实现超时控制
      return await Promise.race([downloadPromise, timeoutPromise]);
    } catch (error) {
      console.error('执行恢复下载失败:', error);
      this.handleDownloadError(taskId, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * 执行实际的恢复下载操作（带重试机制）
   * @param taskId 任务ID
   * @param url 下载URL
   * @param rangeStart 断点开始位置
   * @param retryCount 重试次数
   * @returns Promise<boolean> 下载是否成功启动
   */
  private async executeResumeDownload(taskId: string, url: string, rangeStart: number, retryCount: number = 3): Promise<boolean> {
    try {
      const downloadInfo = this.activeDownloads.get(taskId);
      if (!downloadInfo) {
        throw new Error('Download task not found');
      }

      // 检查是否已取消或已销毁
      if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
        console.log('下载已取消或已销毁，不执行恢复下载');
        return false;
      }

      const { proxySettings } = this.config;
      
      // 如果启用了自定义代理
      if (proxySettings.enabled && proxySettings.server) {
        console.log('使用自定义代理恢复下载模型:', proxySettings.server);
        // 使用node-fetch配合代理代理
        return await this.resumeDownloadWithProxy(taskId, url, rangeStart);
      }
      
      // 对于系统代理和直接连接，使用AbortController增强取消功能
      const controller = new AbortController();
      
      // 保存AbortController以便取消下载
      downloadInfo.abortController = controller;
      
      // 设置请求头，支持断点续传
      const headers: any = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      
      // 如果有已下载的部分，设置Range头
      if (rangeStart > 0) {
        headers['Range'] = `bytes=${rangeStart}-`;
      }
      
      // 根据代理设置创建请求
      let request: any;
      
      // 如果启用了系统代理
      if (proxySettings.useSystemProxy) {
        console.log('使用系统代理恢复下载模型');
        request = net.request({
          url: url,
          method: 'GET',
          headers: headers
        });
      }
      // 直接连接（无代理）
      else {
        console.log('直接恢复下载模型');
        request = net.request({
          url: url,
          method: 'GET',
          headers: headers
        });
      }
      
      // 监听AbortController信号 - 在发送请求之前设置
      controller.signal.addEventListener('abort', () => {
        console.log('恢复下载请求被AbortController取消');
        try {
          // 强制中断请求和响应
          if (request) {
            if (request.destroy) {
              request.destroy();
            } else if (request.abort) {
              request.abort();
            } else if (request.cancel) {
              request.cancel();
            }
          }
          
          // 立即关闭文件流
          const currentDownloadInfo = this.activeDownloads.get(taskId);
          if (currentDownloadInfo && currentDownloadInfo.fileStream) {
            try {
              currentDownloadInfo.fileStream.destroy();
            } catch (streamError) {
              console.error('关闭文件流失败:', streamError);
            }
          }
        } catch (error) {
          console.error('取消恢复下载时发生错误:', error);
        }
      });
      
      // 监听响应
      request.on('response', (response: any) => {
        console.log('收到恢复下载响应:', response.statusCode);
        
        // 检查是否已取消或已销毁
        const currentDownloadInfo = this.activeDownloads.get(taskId);
        if (!currentDownloadInfo || currentDownloadInfo.isCancelled || currentDownloadInfo.isDestroyed) {
          console.log('下载已取消或已销毁，停止处理恢复下载响应');
          try {
            response.destroy();
            request.destroy();
          } catch (error) {
            console.error('销毁响应和请求时出错:', error);
          }
          return;
        }
        
        // 检查响应状态
        if (response.statusCode < 200 || response.statusCode >= 300) {
          // 特殊处理断点续传的情况
          if (response.statusCode === 206 || response.statusCode === 416) {
            // 206是断点续传成功的状态码
            // 416是范围请求无法满足，可能文件已完整下载
            if (response.statusCode === 416) {
              console.log('文件可能已完整下载');
              this.handleDownloadCompletion(taskId);
              return;
            }
          } else {
            this.handleDownloadError(taskId, `HTTP ${response.statusCode}`);
            return;
          }
        }
        
        // 获取文件总大小
        let totalSize = 0;
        if (response.headers['content-length']) {
          totalSize = parseInt(response.headers['content-length'], 10);
        }
        if (response.headers['content-range']) {
          // 从Content-Range头获取总大小，格式如"bytes 100-200/1000"
          const contentRange = response.headers['content-range'][0];
          const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
          if (match) {
            totalSize = parseInt(match[1], 10);
          }
        }
        
        // 更新下载信息
        if (currentDownloadInfo) {
          currentDownloadInfo.totalSize = totalSize;
        }
        
        // 监听数据接收
        response.on('data', (chunk: Buffer) => {
          const downloadInfo = this.activeDownloads.get(taskId);
          if (downloadInfo && downloadInfo.fileStream) {
            // 检查是否已取消或已销毁
            if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
              console.log('下载已取消或已销毁，停止写入恢复下载数据');
              try {
                response.destroy();
                request.destroy();
                downloadInfo.fileStream.destroy();
              } catch (error) {
                console.error('销毁响应、请求和文件流时出错:', error);
              }
              return;
            }
            
            // 写入文件
            try {
              downloadInfo.fileStream.write(chunk);
            } catch (writeError) {
              console.error('写入文件失败:', writeError);
              try {
                response.destroy();
                request.destroy();
                downloadInfo.fileStream.destroy();
              } catch (error) {
                console.error('销毁响应、请求和文件流时出错:', error);
              }
              this.handleDownloadError(taskId, 'Failed to write to file');
              return;
            }
            
            // 更新已下载大小
            downloadInfo.downloadedSize += chunk.length;
            
            // 计算进度
            let progress = 0;
            if (totalSize > 0 && downloadInfo.downloadedSize <= totalSize) {
              progress = Math.round((downloadInfo.downloadedSize / totalSize) * 100);
              // 确保进度不超过100%
              progress = Math.min(progress, 100);
            }
            
            // 调用进度回调
            if (downloadInfo.progressCallback) {
              try {
                downloadInfo.progressCallback(progress, downloadInfo.downloadedSize, totalSize);
              } catch (callbackError) {
                console.error('进度回调失败:', callbackError);
              }
            }
          }
        });
        
        // 监听下载完成
        response.on('end', () => {
          const downloadInfo = this.activeDownloads.get(taskId);
          if (downloadInfo && downloadInfo.fileStream) {
            // 检查是否已取消或已销毁
            if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
              console.log('下载已取消或已销毁，不处理恢复下载完成事件');
              try {
                response.destroy();
                request.destroy();
                downloadInfo.fileStream.destroy();
              } catch (error) {
                console.error('销毁响应、请求和文件流时出错:', error);
              }
              return;
            }
            
            // 关闭文件流
            try {
              downloadInfo.fileStream.end();
            } catch (endError) {
              console.error('关闭文件流失败:', endError);
              this.handleDownloadError(taskId, 'Failed to close file stream');
              return;
            }
            
            // 调用下载完成处理
            this.handleDownloadCompletion(taskId);
          }
        });
        
        // 监听错误
        response.on('error', (error: Error) => {
          console.error('恢复下载响应错误:', error);
          this.handleDownloadError(taskId, error.message);
        });
      });
      
      // 监听请求错误
      request.on('error', (error: Error) => {
        console.error('恢复下载请求错误:', error);
        
        // 检查是否已取消或已销毁
        const downloadInfo = this.activeDownloads.get(taskId);
        if (downloadInfo && (downloadInfo.isCancelled || downloadInfo.isDestroyed)) {
          console.log('下载已取消或已销毁，不进行恢复下载重试');
          return;
        }
        
        // 如果还有重试次数，尝试重试
        if (retryCount > 0) {
          console.log(`恢复下载失败，剩余重试次数: ${retryCount}`);
          setTimeout(() => {
            // 再次检查是否已取消或已销毁
            const currentDownloadInfo = this.activeDownloads.get(taskId);
            if (currentDownloadInfo && !currentDownloadInfo.isCancelled && !currentDownloadInfo.isDestroyed) {
              this.executeResumeDownload(taskId, url, rangeStart, retryCount - 1);
            }
          }, 1000); // 1秒后重试
        } else {
          this.handleDownloadError(taskId, error.message);
        }
      });
      
      // 保存请求对象
      downloadInfo.request = request;
      
      // 发送请求
      request.end();
      
      return true;
    } catch (error) {
      console.error('执行恢复下载失败:', error);
      this.handleDownloadError(taskId, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * 使用代理恢复下载模型
   * @param taskId 任务ID
   * @param url 下载URL
   * @param rangeStart 断点开始位置
   * @returns Promise<boolean> 下载是否成功启动
   */
  private async resumeDownloadWithProxy(taskId: string, url: string, rangeStart: number): Promise<boolean> {
    try {
      const downloadInfo = this.activeDownloads.get(taskId);
      if (!downloadInfo) {
        throw new Error('Download task not found');
      }

      // 检查是否已取消或已销毁
      if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
        console.log('下载已取消或已销毁，不执行代理恢复下载');
        return false;
      }

      const { proxySettings } = this.config;
      if (!proxySettings.server) {
        throw new Error('Proxy server not configured');
      }

      // 动态导入node-fetch
      const nodeFetch = (await import('node-fetch')).default;
      
      // 创建代理代理
      let agent;
      if (proxySettings.server.startsWith('https://')) {
        agent = new HttpsProxyAgent(proxySettings.server);
      } else {
        agent = new HttpProxyAgent(proxySettings.server);
      }
      
      // 设置请求头，支持断点续传
      const headers: any = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      
      // 如果有已下载的部分，设置Range头
      if (rangeStart > 0) {
        headers['Range'] = `bytes=${rangeStart}-`;
      }
      
      // 创建一个AbortController用于超时控制和取消下载
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('Proxy resume download request timeout after 60 seconds');
      }, 60000); // 60秒超时
      
      // 保存AbortController以便取消下载
      const existingDownloadInfo = this.activeDownloads.get(taskId);
      if (existingDownloadInfo) {
        existingDownloadInfo.abortController = controller;
      }
      
      // 发起请求
      let response;
      try {
        response = await retryRequest(async () => {
          // 检查是否已取消或已销毁
          const currentDownloadInfo = this.activeDownloads.get(taskId);
          if (currentDownloadInfo && (currentDownloadInfo.isCancelled || currentDownloadInfo.isDestroyed)) {
            throw new Error('Download cancelled or destroyed');
          }
          
          // 使用主AbortController而不是创建新的
          const result = await nodeFetch(url, {
            method: 'GET',
            agent: agent,
            headers: headers,
            signal: controller.signal
          });
          return result;
        }, 2, 3000, controller); // 最多重试2次，初始延迟3秒，传递主AbortController
      } catch (fetchError) {
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
      
      // 再次检查是否已取消或已销毁
      const currentDownloadInfo = this.activeDownloads.get(taskId);
      if (currentDownloadInfo && (currentDownloadInfo.isCancelled || currentDownloadInfo.isDestroyed)) {
        console.log('下载已取消或已销毁，停止处理代理恢复下载响应');
        return false;
      }
      
      if (!response.ok && response.status !== 206 && response.status !== 416) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 特殊处理断点续传的情况
      if (response.status === 416) {
        console.log('文件可能已完整下载');
        this.handleDownloadCompletion(taskId);
        return true;
      }
      
      // 获取文件总大小
      let totalSize = 0;
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        totalSize = parseInt(contentLength, 10);
      }
      if (response.headers.get('content-range')) {
        // 从Content-Range头获取总大小
        const contentRange = response.headers.get('content-range');
        if (contentRange) {
          const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
          if (match) {
            totalSize = parseInt(match[1], 10);
          }
        }
      }
      
      // 更新下载信息
      if (currentDownloadInfo) {
        currentDownloadInfo.totalSize = totalSize;
      }
      
      // 创建文件写入流
      const fileStream = createWriteStream(downloadInfo.filePath, { flags: 'a' });
      
      // 创建进度跟踪流
      const progressStream = new ProgressTransformStream(taskId, this);
      
      // 使用pipeline处理流，但添加取消检查
      try {
        await pipelineAsync(
          response.body,
          progressStream,
          fileStream
        );
      } catch (pipelineError) {
        // 检查是否是因为取消而导致的错误
        const currentDownloadInfo = this.activeDownloads.get(taskId);
        if (currentDownloadInfo && (currentDownloadInfo.isCancelled || currentDownloadInfo.isDestroyed)) {
          console.log('下载已取消或已销毁，停止处理代理恢复下载流');
          return false;
        }
        throw pipelineError;
      }
      
      // 再次检查是否已取消或已销毁
      const finalDownloadInfo = this.activeDownloads.get(taskId);
      if (finalDownloadInfo && (finalDownloadInfo.isCancelled || finalDownloadInfo.isDestroyed)) {
        console.log('下载已取消或已销毁，不处理代理恢复下载完成');
        return false;
      }
      
      // 下载完成处理
      this.handleDownloadCompletion(taskId);
      return true;
    } catch (error) {
      console.error('代理恢复下载失败:', error);
      this.handleDownloadError(taskId, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * 取消下载
   * @param taskId 任务ID
   * @returns boolean 是否成功取消
   */
  cancelDownload(taskId: string): boolean {
    try {
      const downloadInfo = this.activeDownloads.get(taskId);
      if (!downloadInfo) {
        console.log('下载任务不存在:', taskId);
        return false;
      }
      
      // 首先标记为已取消，这将阻止所有后续操作
      downloadInfo.isCancelled = true;
      console.log('标记下载任务为已取消:', taskId);
      
      // 立即标记为已销毁，确保所有操作都会停止
      downloadInfo.isDestroyed = true;
      console.log('标记下载任务为已销毁:', taskId);
      
      // 取消请求 - 处理不同类型的请求对象
      if (downloadInfo.abortController) {
        try {
          // 优先使用AbortController取消代理下载
          downloadInfo.abortController.abort();
          console.log('使用AbortController取消下载:', taskId);
        } catch (abortError) {
          console.error('AbortController取消失败:', abortError);
        }
      }
      
      if (downloadInfo.request) {
        try {
          // 检查是否是标准的Electron请求对象
          if (downloadInfo.request.cancel) {
            downloadInfo.request.cancel();
            console.log('使用request.cancel()取消下载:', taskId);
          }
          // 检查是否是AbortController（用于代理下载）
          else if (downloadInfo.request.abort) {
            downloadInfo.request.abort();
            console.log('使用request.abort()取消下载:', taskId);
          }
          // 检查是否是AbortController实例
          else if (downloadInfo.request.signal && downloadInfo.request.abort) {
            downloadInfo.request.abort();
            console.log('使用signal.abort()取消下载:', taskId);
          }
          // 如果有destroy方法，也调用它
          else if (downloadInfo.request.destroy) {
            downloadInfo.request.destroy();
            console.log('使用request.destroy()取消下载:', taskId);
          }
        } catch (cancelError) {
          console.error('取消请求失败:', cancelError);
        }
      }
      
      // 关闭并删除文件
      if (downloadInfo.fileStream) {
        try {
          // 确保文件流被销毁
          if (typeof downloadInfo.fileStream.destroy === 'function') {
            downloadInfo.fileStream.destroy();
          } else if (typeof downloadInfo.fileStream.close === 'function') {
            downloadInfo.fileStream.close();
          }
        } catch (streamError) {
          console.error('关闭文件流失败:', streamError);
        }
        
        // 删除部分下载的文件
        if (fs.existsSync(downloadInfo.filePath)) {
          try {
            fs.unlinkSync(downloadInfo.filePath);
          } catch (unlinkError) {
            console.error('删除文件失败:', unlinkError);
          }
        }
      }
      
      // 从活动下载中移除
      this.activeDownloads.delete(taskId);
      
      console.log('下载已取消:', taskId);
      return true;
    } catch (error) {
      console.error('取消下载失败:', error);
      return false;
    }
  }

  /**
   * 处理下载完成
   * @param taskId 任务ID
   */
  private async handleDownloadCompletion(taskId: string): Promise<void> {
    const downloadInfo = this.activeDownloads.get(taskId);
    if (downloadInfo) {
      try {
        // 先标记模型文件下载完成，但不立即调用完成回调
        console.log('模型文件下载完成，开始生成附加文件:', downloadInfo.filePath);
        
        // 获取下载任务信息
        const task = this.getDownloadTask(taskId);
        if (task && task.modelMetadata) {
          // 生成附加文件
          await this.generateAdditionalFiles(task, downloadInfo.filePath);
        }
        
        // 所有操作完成后，才调用完成回调
        if (downloadInfo.completionCallback) {
          downloadInfo.completionCallback(true, downloadInfo.filePath);
        }
        
        console.log('模型下载及附加文件生成完成:', downloadInfo.filePath);
      } catch (error) {
        console.error('处理下载完成时出错:', error);
        
        // 即使生成附加文件失败，也调用完成回调
        if (downloadInfo.completionCallback) {
          downloadInfo.completionCallback(true, downloadInfo.filePath);
        }
      } finally {
        // 从活动下载中移除
        this.activeDownloads.delete(taskId);
      }
    }
  }

  /**
   * 处理下载错误
   * @param taskId 任务ID
   * @param errorMessage 错误信息
   */
  private handleDownloadError(taskId: string, errorMessage: string): void {
    const downloadInfo = this.activeDownloads.get(taskId);
    if (downloadInfo) {
      try {
        // 关闭文件流
        if (downloadInfo.fileStream) {
          downloadInfo.fileStream.destroy();
        }
        
        // 删除部分下载的文件
        if (fs.existsSync(downloadInfo.filePath)) {
          try {
            fs.unlinkSync(downloadInfo.filePath);
          } catch (unlinkError) {
            console.error('删除部分下载文件失败:', unlinkError);
          }
        }
      } catch (cleanupError) {
        console.error('清理下载资源失败:', cleanupError);
      }
      
      // 调用完成回调
      if (downloadInfo.completionCallback) {
        downloadInfo.completionCallback(false, undefined, errorMessage);
      }
      
      // 从活动下载中移除
      this.activeDownloads.delete(taskId);
    }
    
    console.error(`下载失败 (${taskId}):`, errorMessage);
  }

  /**
   * 获取下载任务信息
   * @param taskId 任务ID
   * @returns DownloadTask | undefined 下载任务信息
   */
  getDownloadTask(taskId: string): DownloadTask | undefined {
    const downloadInfo = this.activeDownloads.get(taskId);
    if (!downloadInfo) {
      return undefined;
    }
    
    // 这里需要根据实际需求构建DownloadTask对象
    // 返回包含所有必要信息的对象
    return {
      id: taskId,
      name: path.basename(downloadInfo.filePath),
      url: '', // URL信息需要额外保存
      status: DownloadStatus.DOWNLOADING, // 状态需要根据实际情况确定
      progress: downloadInfo.totalSize > 0
        ? Math.round((downloadInfo.downloadedSize / downloadInfo.totalSize) * 100)
        : 0,
      downloadedSize: downloadInfo.downloadedSize,
      totalSize: downloadInfo.totalSize,
      filePath: downloadInfo.filePath,
      addedAt: new Date().toISOString(),
      modelMetadata: downloadInfo.modelMetadata
    };
  }

  /**
   * 确保下载目录存在
   * @returns Promise<{ success: boolean; error?: string }> 操作结果
   */
  private async ensureDownloadDirectory(): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查下载目录配置
      if (!this.config.downloadDirectory) {
        return { success: false, error: 'Download directory not configured' };
      }

      // 规范化路径，处理Unicode字符
      const normalizedPath = path.normalize(this.config.downloadDirectory);
      
      // 检查目录是否存在
      if (!fs.existsSync(normalizedPath)) {
        try {
          // 创建目录（包括父目录）
          await fs.promises.mkdir(normalizedPath, { recursive: true });
          console.log('创建下载目录:', normalizedPath);
        } catch (mkdirError) {
          console.error('创建下载目录失败:', mkdirError);
          return { success: false, error: mkdirError instanceof Error ? mkdirError.message : 'Failed to create directory' };
        }
      }

      // 验证目录是否可写
      try {
        const testFile = path.join(normalizedPath, '.write_test');
        await fs.promises.writeFile(testFile, 'test');
        await fs.promises.unlink(testFile);
      } catch (writeError) {
        console.error('下载目录不可写:', writeError);
        return { success: false, error: 'Download directory is not writable' };
      }

      return { success: true };
    } catch (error) {
      console.error('创建下载目录失败:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 检查文件权限
   * @param filePath 文件路径
   * @returns Promise<{ success: boolean; error?: string }> 操作结果
   */
  private async checkFilePermissions(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 规范化路径，处理Unicode字符
      const normalizedPath = path.normalize(filePath);
      const dirPath = path.dirname(normalizedPath);
      
      // 检查目录是否存在
      if (!fs.existsSync(dirPath)) {
        return { success: false, error: 'Directory does not exist' };
      }
      
      // 检查目录权限
      await fs.promises.access(dirPath, fs.constants.W_OK);
      
      // 如果文件已存在，检查文件权限
      if (fs.existsSync(normalizedPath)) {
        await fs.promises.access(normalizedPath, fs.constants.W_OK);
      }
      
      return { success: true };
    } catch (error) {
      console.error('文件权限检查失败:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Permission denied' };
    }
  }

  /**
   * 生成唯一的文件名（处理文件名冲突）
   * @param filename 原始文件名
   * @returns Promise<string> 唯一的文件名
   */
  private async generateUniqueFilename(filename: string): Promise<string> {
    // 规范化下载目录路径，处理Unicode字符
    const normalizedDir = path.normalize(this.config.downloadDirectory);
    const filePath = path.join(normalizedDir, filename);
    
    // 如果文件不存在，直接返回原文件名
    if (!fs.existsSync(filePath)) {
      return filename;
    }
    
    // 如果文件已存在，生成带序号的文件名
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    let counter = 1;
    let uniqueFilename = filename;
    
    while (fs.existsSync(path.join(normalizedDir, uniqueFilename))) {
      uniqueFilename = `${name} (${counter})${ext}`;
      counter++;
    }
    
    return uniqueFilename;
  }

  /**
   * 生成附加文件（txt、json、md和图像文件）
   * @param task 下载任务
   * @param modelFilePath 模型文件路径
   */
  private async generateAdditionalFiles(task: DownloadTask, modelFilePath: string): Promise<void> {
    if (!task.modelMetadata) {
      console.log('没有模型元数据，跳过生成附加文件');
      return;
    }

    try {
      const { modelMetadata } = task;
      const modelDir = path.dirname(modelFilePath);
      const modelBaseName = path.basename(modelFilePath, '.safetensors');
      
      // 使用与automa.js相同的命名逻辑
      // 如果有模型元数据，则重新生成文件名，确保附加文件与模型文件命名一致
      let filename = modelBaseName;
      if (modelMetadata) {
        // 使用Title + "--" + Version + "--" + Hash的格式
        const name1 = `${modelMetadata.title}--${modelMetadata.version}--${modelMetadata.hash}`;
        filename = this.convertToValidFilename(name1);
        console.log('使用命名规范重命名附加文件:', filename);
      }
      
      // 1. 生成TXT文件
      await this.generateTxtFile(modelDir, filename, modelMetadata);
      
      // 2. 生成JSON文件
      await this.generateJsonFile(modelDir, filename, modelMetadata);
      
      // 3. 生成MD文件
      await this.generateMdFile(modelDir, filename, modelMetadata);
      
      // 4. 下载图像文件
      if (modelMetadata.imageUrl) {
        await this.downloadImageFile(modelDir, filename, modelMetadata.imageUrl);
      }
      
      console.log('所有附加文件生成完成');
    } catch (error) {
      console.error('生成附加文件时出错:', error);
      throw error;
    }
  }

  /**
   * 生成TXT文件
   * @param dir 目录路径
   * @param filename 文件名
   * @param metadata 模型元数据
   */
  private async generateTxtFile(dir: string, filename: string, metadata: any): Promise<void> {
    try {
      // 使用与automa.js相同的内容格式
      const txtContent = `${metadata.title}\n\nC站网址：\n${metadata.currentUrl || ''}\n模型ID:\n${metadata.hash}\nVersion:\n${metadata.version}\n使用TIP：${metadata.usageTips || ''}\n触发词：\n${metadata.triggerWords.join(', ')}\n版本号：${metadata.version}\n\n\n${metadata.description}`;
      
      const txtFilePath = path.join(dir, `${filename}.txt`);
      await fs.promises.writeFile(txtFilePath, txtContent, 'utf8');
      
      console.log('TXT文件生成完成:', txtFilePath);
    } catch (error) {
      console.error('生成TXT文件失败:', error);
      throw error;
    }
  }

  /**
   * 生成JSON文件
   * @param dir 目录路径
   * @param filename 文件名
   * @param metadata 模型元数据
   */
  private async generateJsonFile(dir: string, filename: string, metadata: any): Promise<void> {
    try {
      // 使用与automa.js相同的内容格式
      let triggerWordsString = "";
      if (metadata.triggerWords && Array.isArray(metadata.triggerWords) && metadata.triggerWords.length > 0) {
        triggerWordsString = " {" + metadata.triggerWords.join(',') + "}";
      }
      
      const jsonData = {
        "description": metadata.type + triggerWordsString + "\n" + (metadata.currentUrl || ''),
        "activation text": triggerWordsString,
        "notes": metadata.description
      };
      
      const jsonContent = JSON.stringify(jsonData, null, 2);
      const jsonFilePath = path.join(dir, `${filename}.json`);
      
      await fs.promises.writeFile(jsonFilePath, jsonContent, 'utf8');
      
      console.log('JSON文件生成完成:', jsonFilePath);
    } catch (error) {
      console.error('生成JSON文件失败:', error);
      throw error;
    }
  }

  /**
   * 生成MD文件
   * @param dir 目录路径
   * @param filename 文件名
   * @param metadata 模型元数据
   */
  private async generateMdFile(dir: string, filename: string, metadata: any): Promise<void> {
    try {
      const mdContent = `# ${metadata.title}

## 基本信息
- **模型名称**: ${metadata.title}
- **模型类型**: ${metadata.type}
- **模型版本**: ${metadata.version}
- **模型ID**: ${metadata.hash}
- **C站网址**: ${metadata.currentUrl || ''}

## 使用说明
${metadata.usageTips || '暂无使用说明'}

## 触发词
${metadata.triggerWords.map((word: string) => `- ${word}`).join('\n')}

## 模型描述
${metadata.description}

---
*此文件由Civitai模型下载工具自动生成*
`;
      
      const mdFilePath = path.join(dir, `${filename}.md`);
      await fs.promises.writeFile(mdFilePath, mdContent, 'utf8');
      
      console.log('MD文件生成完成:', mdFilePath);
    } catch (error) {
      console.error('生成MD文件失败:', error);
      throw error;
    }
  }

  /**
   * 下载图像文件
   * @param dir 目录路径
   * @param filename 文件名
   * @param imageUrl 图像URL
   */
  private async downloadImageFile(dir: string, filename: string, imageUrl: string): Promise<void> {
    try {
      // 获取图像文件扩展名
      const urlObj = new URL(imageUrl);
      const urlPath = urlObj.pathname;
      const ext = path.extname(urlPath) || '.jpg'; // 默认使用jpg扩展名
      
      const imagePath = path.join(dir, `${filename}${ext}`);
      
      // 检查文件是否已存在
      if (fs.existsSync(imagePath)) {
        console.log('图像文件已存在，跳过下载:', imagePath);
        return;
      }
      
      // 下载图像
      const { proxySettings } = this.config;
      
      // 根据代理设置创建请求
      let request: any;
      
      // 如果启用了系统代理
      if (proxySettings.useSystemProxy) {
        console.log('使用系统代理下载图像');
        request = net.request({
          url: imageUrl,
          method: 'GET'
        });
      }
      // 如果启用了自定义代理
      else if (proxySettings.enabled && proxySettings.server) {
        console.log('使用自定义代理下载图像:', proxySettings.server);
        // 使用node-fetch配合代理代理
        const nodeFetch = (await import('node-fetch')).default;
        
        let agent;
        if (proxySettings.server.startsWith('https://')) {
          agent = new HttpsProxyAgent(proxySettings.server);
        } else {
          agent = new HttpProxyAgent(proxySettings.server);
        }
        
        const response = await nodeFetch(imageUrl, {
          method: 'GET',
          agent: agent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // 将图像数据写入文件
        const buffer = await response.buffer();
        await fs.promises.writeFile(imagePath, buffer);
        
        console.log('图像文件下载完成:', imagePath);
        return;
      }
      // 直接连接（无代理）
      else {
        console.log('直接下载图像');
        request = net.request({
          url: imageUrl,
          method: 'GET'
        });
      }
      
      // 设置请求头
      request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // 创建文件写入流
      const fileStream = createWriteStream(imagePath);
      
      // 监听响应
      request.on('response', (response: any) => {
        // 检查响应状态
        if (response.statusCode < 200 || response.statusCode >= 300) {
          fileStream.destroy();
          throw new Error(`HTTP ${response.statusCode}`);
        }
        
        // 监听数据接收
        response.on('data', (chunk: Buffer) => {
          fileStream.write(chunk);
        });
        
        // 监听下载完成
        response.on('end', () => {
          fileStream.end();
          console.log('图像文件下载完成:', imagePath);
        });
        
        // 监听错误
        response.on('error', (error: Error) => {
          console.error('下载图像响应错误:', error);
          fileStream.destroy();
          fs.unlink(imagePath, () => {}); // 删除不完整的文件
        });
      });
      
      // 监听请求错误
      request.on('error', (error: Error) => {
        console.error('下载图像请求错误:', error);
        fileStream.destroy();
        fs.unlink(imagePath, () => {}); // 删除不完整的文件
      });
      
      // 发送请求
      request.end();
    } catch (error) {
      console.error('下载图像文件失败:', error);
      throw error;
    }
  }

  /**
   * 将文本转换为有效的文件名
   * @param text 原始文本
   * @returns 有效的文件名
   */
  private convertToValidFilename(text: string): string {
    // 确保文本是字符串类型
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    // 先去除空格
    let result = text.replace(/\s+/g, '');
    
    // 替换非法文件名字符为下划线
    // Windows 文件名不允许包含 \ / : * ? " < > |
    result = result.replace(/[\\/:*?"<>|]+/g, '_');
    
    // 移除控制字符和不可见字符
    result = result.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // 确保文件名不以点开头或结尾
    result = result.replace(/^\.+|\.+$/g, '');
    
    // 确保文件名不为空
    if (result.length === 0) {
      result = 'unnamed_file';
    }
    
    return result;
  }
}

/**
 * 进度转换流，用于跟踪下载进度
 */
class ProgressTransformStream extends Transform {
  private taskId: string;
  private downloader: ModelDownloader;
  private downloadedBytes: number = 0;

  constructor(taskId: string, downloader: ModelDownloader) {
    super();
    this.taskId = taskId;
    this.downloader = downloader;
  }

  _transform(chunk: Buffer, encoding: string, callback: Function) {
    // 获取下载信息
    const downloadInfo = (this.downloader as any).activeDownloads.get(this.taskId);
    
    // 检查是否已取消或已销毁
    if (!downloadInfo || downloadInfo.isCancelled || downloadInfo.isDestroyed) {
      console.log('下载已取消或已销毁，停止处理数据流');
      // 立即停止处理数据流
      this.destroy();
      callback(new Error('Download cancelled or destroyed'));
      return;
    }
    
    this.downloadedBytes += chunk.length;
    
    if (downloadInfo) {
      // 再次检查是否已取消或已销毁
      if (downloadInfo.isCancelled || downloadInfo.isDestroyed) {
        console.log('下载已取消或已销毁，停止处理数据流');
        this.destroy();
        callback(new Error('Download cancelled or destroyed'));
        return;
      }
      
      downloadInfo.downloadedSize = this.downloadedBytes;
      
      // 计算进度
      let progress = 0;
      if (downloadInfo.totalSize > 0 && this.downloadedBytes <= downloadInfo.totalSize) {
        progress = Math.round((this.downloadedBytes / downloadInfo.totalSize) * 100);
        // 确保进度不超过100%
        progress = Math.min(progress, 100);
      }
      
      // 更新进度
      downloadInfo.progress = progress;
      
      // 调用进度回调
      if (downloadInfo.progressCallback) {
        try {
          downloadInfo.progressCallback(progress, this.downloadedBytes, downloadInfo.totalSize);
        } catch (callbackError) {
          console.error('进度回调失败:', callbackError);
        }
      }
    }
    
    callback(null, chunk);
  }
  
  _flush(callback: Function) {
    // 在流结束时检查是否已取消或已销毁
    const downloadInfo = (this.downloader as any).activeDownloads.get(this.taskId);
    if (!downloadInfo || downloadInfo.isCancelled || downloadInfo.isDestroyed) {
      console.log('下载已取消或已销毁，停止处理数据流');
      callback(new Error('Download cancelled or destroyed'));
      return;
    }
    callback();
  }
}
