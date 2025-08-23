/**
 * C站模型下载工具
 * 提供模型下载、进度跟踪、暂停、恢复、取消等功能
 */

import { net } from 'electron';
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
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 如果是AbortError且不是最后一次尝试，则等待后重试
      if ((lastError.name === 'AbortError' || lastError.message.includes('aborted')) && attempt < maxRetries) {
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
    filePath: string;
    fileStream: fs.WriteStream | null;
    downloadedSize: number;
    totalSize: number;
    progressCallback: ProgressCallback | null;
    completionCallback: CompletionCallback | null;
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
    completionCallback?: CompletionCallback
  ): Promise<boolean> {
    try {
      console.log(`开始下载模型: ${filename} from ${url}`);
      
      // 确保下载目录存在
      const dirCheck = await this.ensureDownloadDirectory();
      if (!dirCheck.success) {
        throw new Error(dirCheck.error || 'Failed to create download directory');
      }
      
      // 处理文件名冲突
      const uniqueFilename = await this.generateUniqueFilename(filename);
      const filePath = path.join(this.config.downloadDirectory, uniqueFilename);
      
      // 检查文件系统权限
      const permissionCheck = await this.checkFilePermissions(filePath);
      if (!permissionCheck.success) {
        throw new Error(permissionCheck.error || 'Insufficient file permissions');
      }
      
      // 创建文件写入流
      const fileStream = createWriteStream(filePath);
      
      // 保存下载信息
      this.activeDownloads.set(taskId, {
        request: null,
        filePath,
        fileStream,
        downloadedSize: 0,
        totalSize: 0,
        progressCallback: progressCallback || null,
        completionCallback: completionCallback || null
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

      const { proxySettings } = this.config;
      
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
      // 如果启用了自定义代理
      else if (proxySettings.enabled && proxySettings.server) {
        console.log('使用自定义代理下载模型:', proxySettings.server);
        // 使用node-fetch配合代理代理
        return await this.downloadWithProxy(taskId, url);
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
      
      // 监听响应
      request.on('response', (response: any) => {
        console.log('收到响应:', response.statusCode);
        
        // 检查响应状态
        if (response.statusCode < 200 || response.statusCode >= 300) {
          this.handleDownloadError(taskId, `HTTP ${response.statusCode}`);
          return;
        }
        
        // 获取文件总大小
        const contentLength = response.headers['content-length'];
        const totalSize = contentLength ? parseInt(contentLength[0], 10) : 0;
        
        // 更新下载信息
        const downloadInfo = this.activeDownloads.get(taskId);
        if (downloadInfo) {
          downloadInfo.totalSize = totalSize;
        }
        
        // 监听数据接收
        response.on('data', (chunk: Buffer) => {
          const downloadInfo = this.activeDownloads.get(taskId);
          if (downloadInfo && downloadInfo.fileStream) {
            // 写入文件
            downloadInfo.fileStream.write(chunk);
            
            // 更新已下载大小
            downloadInfo.downloadedSize += chunk.length;
            
            // 计算进度
            let progress = 0;
            if (totalSize > 0) {
              progress = Math.round((downloadInfo.downloadedSize / totalSize) * 100);
            }
            
            // 调用进度回调
            if (downloadInfo.progressCallback) {
              downloadInfo.progressCallback(progress, downloadInfo.downloadedSize, totalSize);
            }
          }
        });
        
        // 监听下载完成
        response.on('end', () => {
          const downloadInfo = this.activeDownloads.get(taskId);
          if (downloadInfo && downloadInfo.fileStream) {
            // 关闭文件流
            downloadInfo.fileStream.end();
            
            // 调用完成回调
            if (downloadInfo.completionCallback) {
              downloadInfo.completionCallback(true, downloadInfo.filePath);
            }
            
            // 从活动下载中移除
            this.activeDownloads.delete(taskId);
            
            console.log('模型下载完成:', downloadInfo.filePath);
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
        // 如果还有重试次数，尝试重试
        if (retryCount > 0) {
          console.log(`下载失败，剩余重试次数: ${retryCount}`);
          setTimeout(() => {
            this.executeDownload(taskId, url, retryCount - 1);
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
      
      // 创建一个AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('Proxy download request timeout after 60 seconds');
      }, 60000); // 60秒超时
      
      // 发起请求
      let response;
      try {
        response = await retryRequest(async () => {
          // 为每次重试创建新的AbortController
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => {
            retryController.abort();
            console.log('Proxy download request timeout after 60 seconds');
          }, 60000);
          
          try {
            const result = await nodeFetch(url, {
              method: 'GET',
              agent: agent,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              signal: retryController.signal
            });
            clearTimeout(retryTimeoutId);
            return result;
          } catch (fetchError) {
            clearTimeout(retryTimeoutId);
            // 检查是否是AbortError
            if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
              console.warn('Proxy download request was aborted:', fetchError.message);
              throw new Error('Proxy download request timeout or aborted');
            }
            throw fetchError;
          }
        }, 2, 3000); // 最多重试2次，初始延迟3秒
      } catch (fetchError) {
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 获取文件总大小
      const totalSize = parseInt(response.headers.get('content-length') || '0', 10);
      
      // 更新下载信息
      const updatedDownloadInfo = this.activeDownloads.get(taskId);
      if (updatedDownloadInfo) {
        updatedDownloadInfo.totalSize = totalSize;
      }
      
      // 创建文件写入流
      const fileStream = createWriteStream(downloadInfo.filePath);
      
      // 创建进度跟踪流
      const progressStream = new ProgressTransformStream(taskId, this);
      
      // 使用pipeline处理流
      await pipelineAsync(
        response.body,
        progressStream,
        fileStream
      );
      
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
    completionCallback?: CompletionCallback
  ): Promise<boolean> {
    try {
      console.log(`恢复下载模型: ${filename} from ${url}`);
      
      // 确保下载目录存在
      const dirCheck = await this.ensureDownloadDirectory();
      if (!dirCheck.success) {
        throw new Error(dirCheck.error || 'Failed to create download directory');
      }
      
      // 处理文件名冲突
      const uniqueFilename = await this.generateUniqueFilename(filename);
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
        filePath,
        fileStream,
        downloadedSize,
        totalSize: 0, // 总大小将在请求时获取
        progressCallback: progressCallback || null,
        completionCallback: completionCallback || null
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

      const { proxySettings } = this.config;
      
      // 根据代理设置创建请求
      let request: any;
      
      // 设置请求头，支持断点续传
      const headers: any = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      
      // 如果有已下载的部分，设置Range头
      if (rangeStart > 0) {
        headers['Range'] = `bytes=${rangeStart}-`;
      }
      
      // 如果启用了系统代理
      if (proxySettings.useSystemProxy) {
        console.log('使用系统代理恢复下载模型');
        request = net.request({
          url: url,
          method: 'GET',
          headers: headers
        });
      }
      // 如果启用了自定义代理
      else if (proxySettings.enabled && proxySettings.server) {
        console.log('使用自定义代理恢复下载模型:', proxySettings.server);
        // 使用node-fetch配合代理代理
        return await this.resumeDownloadWithProxy(taskId, url, rangeStart);
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
      
      // 监听响应
      request.on('response', (response: any) => {
        console.log('收到恢复下载响应:', response.statusCode);
        
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
          totalSize = parseInt(response.headers['content-length'][0], 10);
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
        const downloadInfo = this.activeDownloads.get(taskId);
        if (downloadInfo) {
          downloadInfo.totalSize = totalSize;
        }
        
        // 监听数据接收
        response.on('data', (chunk: Buffer) => {
          const downloadInfo = this.activeDownloads.get(taskId);
          if (downloadInfo && downloadInfo.fileStream) {
            // 写入文件
            downloadInfo.fileStream.write(chunk);
            
            // 更新已下载大小
            downloadInfo.downloadedSize += chunk.length;
            
            // 计算进度
            let progress = 0;
            if (totalSize > 0) {
              progress = Math.round((downloadInfo.downloadedSize / totalSize) * 100);
            }
            
            // 调用进度回调
            if (downloadInfo.progressCallback) {
              downloadInfo.progressCallback(progress, downloadInfo.downloadedSize, totalSize);
            }
          }
        });
        
        // 监听下载完成
        response.on('end', () => {
          const downloadInfo = this.activeDownloads.get(taskId);
          if (downloadInfo && downloadInfo.fileStream) {
            // 关闭文件流
            downloadInfo.fileStream.end();
            
            // 调用完成回调
            if (downloadInfo.completionCallback) {
              downloadInfo.completionCallback(true, downloadInfo.filePath);
            }
            
            // 从活动下载中移除
            this.activeDownloads.delete(taskId);
            
            console.log('模型恢复下载完成:', downloadInfo.filePath);
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
        // 如果还有重试次数，尝试重试
        if (retryCount > 0) {
          console.log(`恢复下载失败，剩余重试次数: ${retryCount}`);
          setTimeout(() => {
            this.executeResumeDownload(taskId, url, rangeStart, retryCount - 1);
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
      
      // 创建一个AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('Proxy resume download request timeout after 60 seconds');
      }, 60000); // 60秒超时
      
      // 发起请求
      let response;
      try {
        response = await retryRequest(async () => {
          // 为每次重试创建新的AbortController
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => {
            retryController.abort();
            console.log('Proxy resume download request timeout after 60 seconds');
          }, 60000);
          
          try {
            const result = await nodeFetch(url, {
              method: 'GET',
              agent: agent,
              headers: headers,
              signal: retryController.signal
            });
            clearTimeout(retryTimeoutId);
            return result;
          } catch (fetchError) {
            clearTimeout(retryTimeoutId);
            // 检查是否是AbortError
            if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
              console.warn('Proxy resume download request was aborted:', fetchError.message);
              throw new Error('Proxy resume download request timeout or aborted');
            }
            throw fetchError;
          }
        }, 2, 3000); // 最多重试2次，初始延迟3秒
      } catch (fetchError) {
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
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
      if (response.headers.get('content-length')) {
        totalSize = parseInt(response.headers.get('content-length') || '0', 10);
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
      const updatedDownloadInfo = this.activeDownloads.get(taskId);
      if (updatedDownloadInfo) {
        updatedDownloadInfo.totalSize = totalSize;
      }
      
      // 创建文件写入流
      const fileStream = createWriteStream(downloadInfo.filePath, { flags: 'a' });
      
      // 创建进度跟踪流
      const progressStream = new ProgressTransformStream(taskId, this);
      
      // 使用pipeline处理流
      await pipelineAsync(
        response.body,
        progressStream,
        fileStream
      );
      
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
      
      // 取消请求
      if (downloadInfo.request) {
        try {
          downloadInfo.request.cancel();
        } catch (cancelError) {
          console.error('取消请求失败:', cancelError);
        }
      }
      
      // 关闭并删除文件
      if (downloadInfo.fileStream) {
        try {
          downloadInfo.fileStream.destroy();
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
  private handleDownloadCompletion(taskId: string): void {
    const downloadInfo = this.activeDownloads.get(taskId);
    if (downloadInfo) {
      // 调用完成回调
      if (downloadInfo.completionCallback) {
        downloadInfo.completionCallback(true, downloadInfo.filePath);
      }
      
      // 从活动下载中移除
      this.activeDownloads.delete(taskId);
      
      console.log('模型下载完成:', downloadInfo.filePath);
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
    // 由于我们缺少一些信息，暂时返回一个基本的对象
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
      addedAt: new Date().toISOString()
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

      // 检查目录是否存在
      if (!fs.existsSync(this.config.downloadDirectory)) {
        // 创建目录（包括父目录）
        await fs.promises.mkdir(this.config.downloadDirectory, { recursive: true });
        console.log('创建下载目录:', this.config.downloadDirectory);
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
      // 检查目录权限
      const dirPath = path.dirname(filePath);
      await fs.promises.access(dirPath, fs.constants.W_OK);
      
      // 如果文件已存在，检查文件权限
      if (fs.existsSync(filePath)) {
        await fs.promises.access(filePath, fs.constants.W_OK);
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
    const filePath = path.join(this.config.downloadDirectory, filename);
    
    // 如果文件不存在，直接返回原文件名
    if (!fs.existsSync(filePath)) {
      return filename;
    }
    
    // 如果文件已存在，生成带序号的文件名
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    let counter = 1;
    let uniqueFilename = filename;
    
    while (fs.existsSync(path.join(this.config.downloadDirectory, uniqueFilename))) {
      uniqueFilename = `${name} (${counter})${ext}`;
      counter++;
    }
    
    return uniqueFilename;
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
    this.downloadedBytes += chunk.length;
    
    // 获取下载信息
    const downloadInfo = (this.downloader as any).activeDownloads.get(this.taskId);
    if (downloadInfo) {
      downloadInfo.downloadedSize = this.downloadedBytes;
      
      // 计算进度
      let progress = 0;
      if (downloadInfo.totalSize > 0) {
        progress = Math.round((this.downloadedBytes / downloadInfo.totalSize) * 100);
      }
      
      // 更新进度
      downloadInfo.progress = progress;
      
      // 调用进度回调
      if (downloadInfo.progressCallback) {
        downloadInfo.progressCallback(progress, this.downloadedBytes, downloadInfo.totalSize);
      }
    }
    
    callback(null, chunk);
  }
}