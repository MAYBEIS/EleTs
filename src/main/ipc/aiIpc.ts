/**
 * AI IPC 处理程序
 * 处理所有与 AI 相关的 IPC 通信
 */

import { promises as fs, existsSync } from 'fs'
import * as path from 'path'

import { mainWindow } from '..'
import { ipcMain, app, net } from 'electron'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import { ModelDownloader, ProxySettings } from '../utils/modelDown'

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

// 获取配置文件路径
function getConfigPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'config.json')
}

// 加载配置
async function loadConfig(): Promise<any> {
  try {
    const configPath = getConfigPath()
    if (existsSync(configPath)) {
      const data = await fs.readFile(configPath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Load config failed:', error)
  }
  return {}
}

// 保存配置
async function saveConfig(config: any): Promise<void> {
  try {
    const configPath = getConfigPath()
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')
  } catch (error) {
    console.error('Save config failed:', error)
  }
}

/**
 * 初始化 AI IPC 处理程序
 * 注册所有 AI 相关的 IPC 监听器
 */

// 全局代理设置
let globalProxySettings: {
  server?: string;
  enabled?: boolean;
  useSystemProxy?: boolean;
} = {};

// 下载队列管理
let downloadQueue: Array<{
  id: string;
  name: string;
  status: '等待中' | '下载中' | '已暂停' | '已完成' | '已取消' | '失败';
  progress: number;
  url: string;
  addedAt: string;
  completedAt?: string;
  error?: string;
}> = [];

// 下载历史记录
let downloadHistory: Array<{
  id: string;
  name: string;
  status: '已完成' | '已取消' | '失败';
  progress: number;
  url: string;
  addedAt: string;
  completedAt: string;
  error?: string;
}> = [];
// 下载目录设置
let downloadDirectory: string = '';

// 创建ModelDownloader实例
let modelDownloader: ModelDownloader | null = null;

// 创建默认的浏览器请求头
const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
};

export function initAiIpc() {
  // ==================== IPC 通信处理 ====================
  
  // 在初始化时加载配置并创建ModelDownloader
  loadConfig().then(config => {
    if (config.downloadDirectory) {
      downloadDirectory = config.downloadDirectory;
      console.log('Load download directory setting:', downloadDirectory);
    }
    if (config.proxySettings) {
      globalProxySettings = config.proxySettings;
      console.log('Load proxy settings:', globalProxySettings);
    }
    
    // 初始化ModelDownloader
    const proxySettings: ProxySettings = {
      server: globalProxySettings?.server,
      enabled: globalProxySettings?.enabled,
      useSystemProxy: globalProxySettings?.useSystemProxy
    };
    
    modelDownloader = new ModelDownloader({
      downloadDirectory: downloadDirectory,
      proxySettings: proxySettings
    });
    
    console.log('ModelDownloader initialized with config:', {
      downloadDirectory,
      proxySettings
    });
  }).catch(error => {
    console.error('Failed to load config during initAiIpc:', error);
    // 即使配置加载失败，也要初始化ModelDownloader
    const proxySettings: ProxySettings = {
      server: globalProxySettings?.server,
      enabled: globalProxySettings?.enabled,
      useSystemProxy: globalProxySettings?.useSystemProxy
    };
    
    modelDownloader = new ModelDownloader({
      downloadDirectory: downloadDirectory,
      proxySettings: proxySettings
    });
  });

  /**
   * IPC 测试通信
   * 简单的 ping-pong 测试，用于验证主进程和渲染进程间的通信
   */
  ipcMain.on('ping', () => console.log('pong'))

  /**
   * 处理应用程序退出请求
   * 渲染进程可以通过此 IPC 调用来退出应用程序
   */
  ipcMain.handle('app-quit', async () => {
    app.quit()
  })

  /**
   * 处理打开开发者工具的请求
   * 渲染进程可以通过此 IPC 调用来打开开发者工具
   */
  ipcMain.handle('open-dev-tools', async () => {
    mainWindow.webContents.openDevTools()
  })


  /**
   * 处理 Civitai 模型数据获取请求
   * 渲染进程可以通过此 IPC 调用来获取 Civitai 模型数据
   */
  ipcMain.handle('fetch-civitai-models', async (_event, url, options) => {
    try {
      console.log('Start fetching Civitai model data');
      console.log('Request URL:', url);
      console.log('Request options:', JSON.stringify(options, null, 2));
      
      // 获取代理设置
      const { proxy, useSystemProxy } = options;
      delete options.proxy; // 从选项中移除代理设置，避免传递给 fetch
      delete options.useSystemProxy; // 从选项中移除系统代理设置
      
      // 合并请求头
      const headers = { ...defaultHeaders, ...options.headers };
      
      // 如果启用了系统代理，则使用系统代理
      if (useSystemProxy) {
        console.log('Using system proxy');
        // Electron的net模块会自动使用系统代理设置
        const request = net.request({
          url: url,
          method: 'GET',
          headers: headers
        });
        
        const response = await new Promise<{ statusCode: number, headers: any, data: string }>((resolve, reject) => {
          request.on('response', (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                data: data
              });
            });
          });
          request.on('error', (error) => {
            reject(error);
          });
          request.end();
        });
        
        console.log('System proxy request response status:', response.statusCode);
        
        // 解析JSON数据
        let data;
        try {
          data = JSON.parse(response.data);
        } catch (parseError) {
          console.error('Parse response data failed:', parseError);
          throw new Error('Response data is not valid JSON format');
        }
        
        return { ok: response.statusCode >= 200 && response.statusCode < 300, data };
      }
      // 如果启用了自定义代理，则配置代理
      // 处理两种情况：
      // 1. proxy是一个包含server和enabled属性的对象
      // 2. proxy是一个字符串（代理服务器地址）
      else if ((proxy && proxy.server && proxy.enabled) || (typeof proxy === 'string' && proxy.length > 0)) {
        console.log('Using custom proxy:', typeof proxy === 'string' ? proxy : proxy.server);
        try {
          // 使用代理发送请求
          // 获取代理服务器地址
          const proxyServer = typeof proxy === 'string' ? proxy : proxy.server;
          let agent;
          if (proxyServer.startsWith('https://')) {
            agent = new HttpsProxyAgent(proxyServer);
          } else {
            agent = new HttpProxyAgent(proxyServer);
          }
          
          // 创建一个AbortController用于超时控制
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.log('Proxy request timeout after 30 seconds');
          }, 30000); // 增加到30秒超时
          
          // 使用node-fetch通过代理发送请求
          const nodeFetch = (await import('node-fetch')).default;
          let response;
          try {
            response = await retryRequest(async () => {
              // 为每次重试创建新的AbortController
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => {
                retryController.abort();
                console.log('Proxy request timeout after 30 seconds');
              }, 30000);
              
              try {
                const result = await nodeFetch(url, {
                  method: 'GET',
                  headers: headers,
                  agent: agent,
                  signal: retryController.signal
                });
                clearTimeout(retryTimeoutId);
                return result;
              } catch (fetchError) {
                clearTimeout(retryTimeoutId);
                // 检查是否是AbortError
                if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
                  console.warn('Proxy request was aborted:', fetchError.message);
                  throw new Error('Proxy request timeout or aborted');
                }
                throw fetchError;
              }
            }, 3, 2000); // 最多重试3次，初始延迟2秒
          } catch (fetchError) {
            throw fetchError;
          } finally {
            clearTimeout(timeoutId);
          }
          
          console.log('Proxy request response status:', response.status);
          
          // 获取响应数据
          const data = await response.json();
          return { ok: response.ok, data };
        } catch (agentError) {
          console.error('Use proxy failed:', agentError);
          return { ok: false, error: agentError instanceof Error ? agentError.message : 'Proxy connection failed' };
        }
      }
      
      // 直接连接（无代理或代理失败时）
      console.log('Sending direct request...');
      try {
        // 创建一个AbortController用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log('Direct request timeout after 30 seconds');
        }, 30000); // 增加到30秒超时
        
        // 使用node-fetch直接发送请求
        const nodeFetch = (await import('node-fetch')).default;
        let response;
        try {
          response = await retryRequest(async () => {
            // 为每次重试创建新的AbortController
            const retryController = new AbortController();
            const retryTimeoutId = setTimeout(() => {
              retryController.abort();
              console.log('Direct request timeout after 30 seconds');
            }, 30000);
            
            try {
              const result = await nodeFetch(url, {
                method: 'GET',
                headers: headers,
                signal: retryController.signal
              });
              clearTimeout(retryTimeoutId);
              return result;
            } catch (fetchError) {
              clearTimeout(retryTimeoutId);
              // 检查是否是AbortError
              if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
                console.warn('Direct request was aborted:', fetchError.message);
                throw new Error('Direct request timeout or aborted');
              }
              throw fetchError;
            }
          }, 3, 2000); // 最多重试3次，初始延迟2秒
        } catch (fetchError) {
          throw fetchError;
        } finally {
          clearTimeout(timeoutId);
        }
        
        console.log('Direct request response status:', response.status);
        
        // 获取响应数据
        const data = await response.json();
        return { ok: response.ok, data };
      } catch (error) {
        console.error('Direct request failed:', error);
        return { ok: false, error: error instanceof Error ? error.message : 'Direct connection failed' };
      }
    } catch (error) {
      console.error('Fetch Civitai model data failed:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  })

  /**
   * 处理 Civitai 模型下载请求
   * 渲染进程可以通过此 IPC 调用来下载 Civitai 模型
   */
  ipcMain.handle('download-civitai-model', async (_event, url, filename) => {
    try {
      console.log('Start downloading model:', url, filename)
      
      // 检查ModelDownloader是否已初始化
      if (!modelDownloader) {
        throw new Error('ModelDownloader not initialized');
      }
      
      // 更新代理设置
      const proxySettings: ProxySettings = {
        server: globalProxySettings?.server,
        enabled: globalProxySettings?.enabled,
        useSystemProxy: globalProxySettings?.useSystemProxy
      };
      
      modelDownloader.updateConfig({
        downloadDirectory: downloadDirectory,
        proxySettings: proxySettings
      });
      
      // 生成唯一的任务ID
      const taskId = `download_${Date.now()}`;
      
      // 执行下载
      const success = await modelDownloader.downloadModel(
        taskId,
        url,
        filename,
        // 进度回调
        (progress, downloadedSize, totalSize) => {
          console.log(`Download progress: ${progress}% (${downloadedSize}/${totalSize})`);
          // 可以通过IPC发送进度更新到渲染进程
          if (mainWindow) {
            mainWindow.webContents.send('download-progress', {
              taskId,
              progress,
              downloadedSize,
              totalSize
            });
          }
        },
        // 完成回调
        (success, filePath, error) => {
          console.log('Download completed:', { success, filePath, error });
          // 可以通过IPC发送完成通知到渲染进程
          if (mainWindow) {
            mainWindow.webContents.send('download-completed', {
              taskId,
              success,
              filePath,
              error
            });
          }
        }
      );
      
      if (success) {
        console.log('Model download started successfully:', filename);
        return { success: true };
      } else {
        throw new Error('Failed to start download');
      }
    } catch (error) {
      console.error('Download Civitai model failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  /**
   * 更新代理设置
   * 渲染进程可以通过此 IPC 调用来更新代理设置
   */
  ipcMain.handle('update-proxy-settings', async (_event, settings) => {
    try {
      console.log('Update proxy settings:', settings)
      // Save proxy settings to global variable
      globalProxySettings = settings;
      // 保存到配置文件
      const config = await loadConfig()
      config.proxySettings = settings
      await saveConfig(config)
      console.log('Proxy settings updated successfully');
      return { success: true }
    } catch (error) {
      console.error('Update proxy settings failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  /**
   * 获取代理设置
   * 渲染进程可以通过此 IPC 调用来获取代理设置
   */
  ipcMain.handle('get-proxy-settings', async () => {
    try {
      // 从配置文件加载
      const config = await loadConfig()
      if (config.proxySettings) {
        globalProxySettings = config.proxySettings
      }
      console.log('Get proxy settings:', globalProxySettings);
      return { success: true, data: globalProxySettings };
    } catch (error) {
      console.error('Get proxy settings failed:', error);
      // 即使加载失败，也返回当前内存中的设置
      return { success: true, data: globalProxySettings };
    }
  })

  /**
   * 测试代理连接
   * 渲染进程可以通过此 IPC 调用来测试代理连接
   */
  ipcMain.handle('test-proxy-connection', async (_event, proxyServer) => {
    try {
      console.log('Test proxy connection:', proxyServer)
      
      // 如果提供了代理服务器，则测试自定义代理
      if (proxyServer) {
        try {
          // 使用代理发送请求
          let agent;
          if (proxyServer.startsWith('https://')) {
            agent = new HttpsProxyAgent(proxyServer);
          } else {
            agent = new HttpProxyAgent(proxyServer);
          }
          
          // 创建一个AbortController用于超时控制
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.log('Proxy test request timeout after 15 seconds');
          }, 15000); // 增加到15秒超时
          
          // 使用node-fetch通过代理发送请求
          const nodeFetch = (await import('node-fetch')).default;
          let response;
          try {
            response = await retryRequest(async () => {
              // 为每次重试创建新的AbortController
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => {
                retryController.abort();
                console.log('Proxy test request timeout after 15 seconds');
              }, 15000);
              
              try {
                const result = await nodeFetch('https://www.google.com', {
                  method: 'GET',
                  headers: defaultHeaders,
                  agent: agent,
                  signal: retryController.signal
                });
                clearTimeout(retryTimeoutId);
                return result;
              } catch (fetchError) {
                clearTimeout(retryTimeoutId);
                // 检查是否是AbortError
                if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
                  console.warn('Proxy test request was aborted:', fetchError.message);
                  throw new Error('Proxy test request timeout or aborted');
                }
                throw fetchError;
              }
            }, 2, 1000); // 最多重试2次，初始延迟1秒
          } catch (fetchError) {
            throw fetchError;
          } finally {
            clearTimeout(timeoutId);
          }
          
          console.log('Custom proxy test response status:', response.status);
          return { success: response.ok };
        } catch (testError) {
          console.error('Custom proxy test failed:', testError);
          return { success: false, error: testError instanceof Error ? testError.message : 'Connection failed' };
        }
      }
      // 如果没有提供代理服务器，则测试系统代理
      else {
        // 获取全局代理设置
        const { useSystemProxy } = globalProxySettings;
        
        if (useSystemProxy) {
          try {
            console.log('Test system proxy connection');
            
            const request = net.request({
              url: 'https://www.google.com',
              method: 'GET',
              headers: defaultHeaders
            });
            
            const response = await new Promise<{ statusCode: number }>((resolve, reject) => {
              request.on('response', (res) => {
                resolve({
                  statusCode: res.statusCode
                });
              });
              request.on('error', (error) => {
                reject(error);
              });
              request.end();
            });
            
            console.log('System proxy test response status:', response.statusCode);
            return { success: response.statusCode >= 200 && response.statusCode < 300 };
          } catch (testError) {
            console.error('System proxy test failed:', testError);
            return { success: false, error: testError instanceof Error ? testError.message : 'Connection failed' };
          }
        } else {
          // No proxy enabled, simulate test success
          console.log('No proxy enabled, simulate test success');
          return { success: true };
        }
      }
    } catch (error) {
      console.error('Test proxy connection failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
  
  /**
   * 获取下载队列
   * 渲染进程可以通过此 IPC 调用来获取当前下载队列
   */
  ipcMain.handle('get-download-queue', async () => {
    try {
      console.log('Get download queue, current queue length:', downloadQueue.length);
      return { success: true, data: downloadQueue };
    } catch (error) {
      console.error('Get download queue failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 添加到下载队列
   * 渲染进程可以通过此 IPC 调用来添加模型到下载队列
   */
  ipcMain.handle('add-to-download-queue', async (_event, modelId: string, modelName: string, downloadUrl: string) => {
    try {
      console.log('Add model to download queue:', { modelId, modelName, downloadUrl });
      
      // 检查是否已在队列中
      const existingIndex = downloadQueue.findIndex(item => item.id === modelId);
      if (existingIndex !== -1) {
        console.log('Model already in download queue');
        return { success: false, error: 'Model already in download queue' };
      }

      // 添加到队列
      const downloadItem = {
        id: modelId,
        name: modelName,
        url: downloadUrl,
        status: '等待中' as const,
        progress: 0,
        addedAt: new Date().toISOString()
      };

      downloadQueue.push(downloadItem);
      console.log('Successfully added to download queue, current queue length:', downloadQueue.length);
      
      return { success: true, data: downloadItem };
    } catch (error) {
      console.error('Add to download queue failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 批量添加到下载队列
   * 渲染进程可以通过此 IPC 调用来批量添加模型到下载队列
   */
  ipcMain.handle('batch-add-to-download-queue', async (_event, modelIds: string[]) => {
    try {
      console.log('Batch add models to download queue:', modelIds);
      
      const addedItems = [];
      const failedItems = [];

      for (const modelId of modelIds) {
        // 检查是否已在队列中
        const existingIndex = downloadQueue.findIndex(item => item.id === modelId);
        if (existingIndex !== -1) {
          failedItems.push({ id: modelId, reason: 'Already in download queue' });
          continue;
        }

        // 添加到队列
        const downloadItem = {
          id: modelId,
          name: `Model ${modelId}`,
          url: '', // 批量添加时暂时没有URL，需要后续获取
          status: '等待中' as const,
          progress: 0,
          addedAt: new Date().toISOString()
        };

        downloadQueue.push(downloadItem);
        addedItems.push(downloadItem);
      }

      console.log(`Batch add completed: Success ${addedItems.length}, Failed ${failedItems.length}`);
      
      // 通知UI更新队列
      if (mainWindow) {
        mainWindow.webContents.send('download-queue-updated', {
          queue: downloadQueue,
          added: addedItems,
          failed: failedItems
        });
      }
      
      return {
        success: true,
        data: {
          added: addedItems,
          failed: failedItems,
          totalQueue: downloadQueue.length
        }
      };
    } catch (error) {
      console.error('Batch add to download queue failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 开始下载
   * 渲染进程可以通过此 IPC 调用来开始下载指定模型
   */
  ipcMain.handle('start-download', async (_event, modelId: string) => {
    try {
      console.log('Start downloading model:', modelId);
      
      const downloadItem = downloadQueue.find(item => item.id === modelId);
      if (!downloadItem) {
        return { success: false, error: 'Download item not found' };
      }

      if (downloadItem.status !== '等待中' && downloadItem.status !== '已暂停') {
        return { success: false, error: 'Can only start waiting or paused downloads' };
      }

      // 更新状态
      downloadItem.status = '下载中';
      
      // 通知UI下载状态已更新
      if (mainWindow) {
        mainWindow.webContents.send('download-status-changed', {
          taskId: modelId,
          status: '下载中',
          item: downloadItem
        });
      }
      
      // 检查ModelDownloader是否已初始化
      if (!modelDownloader) {
        throw new Error('ModelDownloader not initialized');
      }
      
      // 更新代理设置
      const proxySettings: ProxySettings = {
        server: globalProxySettings?.server,
        enabled: globalProxySettings?.enabled,
        useSystemProxy: globalProxySettings?.useSystemProxy
      };
      
      modelDownloader.updateConfig({
        downloadDirectory: downloadDirectory,
        proxySettings: proxySettings
      });
      
      // 执行真实下载
      const success = await modelDownloader.downloadModel(
        modelId,
        downloadItem.url,
        downloadItem.name,
        // 进度回调
        (progress, downloadedSize, totalSize) => {
          console.log(`Download progress: ${progress}% (${downloadedSize}/${totalSize})`);
          // 更新下载项进度
          const item = downloadQueue.find(item => item.id === modelId);
          if (item) {
            item.progress = progress;
          }
          // 通过IPC发送进度更新到渲染进程
          if (mainWindow) {
            mainWindow.webContents.send('download-progress', {
              taskId: modelId,
              progress,
              downloadedSize,
              totalSize
            });
          }
        },
        // 完成回调
        (success, filePath, error) => {
          console.log('Download completed:', { success, filePath, error });
          // 更新下载项状态
          const item = downloadQueue.find(item => item.id === modelId);
          if (item) {
            if (success) {
              item.status = '已完成';
              item.progress = 100;
              item.completedAt = new Date().toISOString();
              
              // 从队列中移除并添加到历史记录
              const index = downloadQueue.findIndex(item => item.id === modelId);
              if (index !== -1) {
                downloadQueue.splice(index, 1);
                downloadHistory.unshift({ ...item, status: '已完成' as const, completedAt: item.completedAt! });
              }
            } else {
              item.status = '失败';
              item.error = error;
            }
          }
          
          // 通过IPC发送完成通知到渲染进程
          if (mainWindow) {
            mainWindow.webContents.send('download-completed', {
              taskId: modelId,
              success,
              filePath,
              error
            });
            
            // 通知UI队列已更新
            mainWindow.webContents.send('download-queue-updated', {
              queue: downloadQueue,
              completed: success ? [item] : [],
              failed: success ? [] : [item]
            });
          }
        }
      );
      
      if (!success) {
        throw new Error('Failed to start download');
      }
      
      return { success: true, data: downloadItem };
    } catch (error) {
      console.error('Start download failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 暂停下载
   * 渲染进程可以通过此 IPC 调用来暂停指定模型的下载
   */
  ipcMain.handle('pause-download', async (_event, modelId: string) => {
    try {
      console.log('Pause download model:', modelId);
      
      const downloadItem = downloadQueue.find(item => item.id === modelId);
      if (!downloadItem) {
        return { success: false, error: 'Download item not found' };
      }

      if (downloadItem.status !== '下载中') {
        return { success: false, error: 'Can only pause downloading items' };
      }

      // 更新状态
      downloadItem.status = '已暂停';
      
      // 通知UI下载状态已更新
      if (mainWindow) {
        mainWindow.webContents.send('download-status-changed', {
          taskId: modelId,
          status: '已暂停',
          item: downloadItem
        });
      }
      
      return { success: true, data: downloadItem };
    } catch (error) {
      console.error('Pause download failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 取消下载
   * 渲染进程可以通过此 IPC 调用来取消指定模型的下载
   */
  ipcMain.handle('cancel-download', async (_event, modelId: string) => {
    try {
      console.log('Cancel download model:', modelId);
      
      const downloadIndex = downloadQueue.findIndex(item => item.id === modelId);
      if (downloadIndex === -1) {
        return { success: false, error: 'Download item not found' };
      }

      const downloadItem = downloadQueue[downloadIndex];
      
      // 如果ModelDownloader已初始化，先尝试取消实际的下载任务
      if (modelDownloader) {
        try {
          const cancelResult = modelDownloader.cancelDownload(modelId);
          console.log('ModelDownloader cancel result:', cancelResult);
        } catch (cancelError) {
          console.error('ModelDownloader cancel failed:', cancelError);
          // 即使取消失败，我们仍然要从队列中移除该项
        }
      }
      
      // 从队列中移除
      downloadQueue.splice(downloadIndex, 1);
      
      // 添加到历史记录
      const historyItem = {
        ...downloadItem,
        status: '已取消',
        completedAt: new Date().toISOString()
      };
      downloadHistory.unshift(historyItem as any);
      
      // 通知UI下载已取消
      if (mainWindow) {
        mainWindow.webContents.send('download-cancelled', {
          taskId: modelId,
          item: downloadItem,
          historyItem: historyItem
        });
        
        // 通知UI队列已更新
        mainWindow.webContents.send('download-queue-updated', {
          queue: downloadQueue,
          removed: [downloadItem]
        });
      }
      
      return { success: true, data: downloadItem };
    } catch (error) {
      console.error('Cancel download failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 批量开始下载
   * 渲染进程可以通过此 IPC 调用来批量开始下载多个模型
   */
  ipcMain.handle('batch-start-download', async (_event, modelIds: string[]) => {
    try {
      console.log('Batch start download models:', modelIds);
      
      const results = [];
      const successCount = { value: 0 };
      const failCount = { value: 0 };
      
      // 检查ModelDownloader是否已初始化
      if (!modelDownloader) {
        throw new Error('ModelDownloader not initialized');
      }
      
      // 更新代理设置
      const proxySettings: ProxySettings = {
        server: globalProxySettings?.server,
        enabled: globalProxySettings?.enabled,
        useSystemProxy: globalProxySettings?.useSystemProxy
      };
      
      modelDownloader.updateConfig({
        downloadDirectory: downloadDirectory,
        proxySettings: proxySettings
      });
      
      // 使用Promise.allSettled来并行处理所有下载
      const promises = modelIds.map(async (modelId) => {
        try {
          const downloadItem = downloadQueue.find(item => item.id === modelId);
          if (!downloadItem) {
            failCount.value++;
            results.push({ id: modelId, success: false, error: 'Download item not found' });
            return;
          }

          if (downloadItem.status !== '等待中' && downloadItem.status !== '已暂停') {
            failCount.value++;
            results.push({ id: modelId, success: false, error: 'Can only start waiting or paused downloads' });
            return;
          }

          // 更新状态
          downloadItem.status = '下载中';
          
          // 通知UI下载状态已更新
          if (mainWindow) {
            mainWindow.webContents.send('download-status-changed', {
              taskId: modelId,
              status: '下载中',
              item: downloadItem
            });
          }
          
          // 执行真实下载
          const success = await modelDownloader.downloadModel(
            modelId,
            downloadItem.url,
            downloadItem.name,
            // 进度回调
            (progress, downloadedSize, totalSize) => {
              console.log(`Download progress: ${progress}% (${downloadedSize}/${totalSize})`);
              // 更新下载项进度
              const item = downloadQueue.find(item => item.id === modelId);
              if (item) {
                item.progress = progress;
              }
              // 通过IPC发送进度更新到渲染进程
              if (mainWindow) {
                mainWindow.webContents.send('download-progress', {
                  taskId: modelId,
                  progress,
                  downloadedSize,
                  totalSize
                });
              }
            },
            // 完成回调
            (success, filePath, error) => {
              console.log('Download completed:', { success, filePath, error });
              // 更新下载项状态
              const item = downloadQueue.find(item => item.id === modelId);
              if (item) {
                if (success) {
                  item.status = '已完成';
                  item.progress = 100;
                  item.completedAt = new Date().toISOString();
                  
                  // 从队列中移除并添加到历史记录
                  const index = downloadQueue.findIndex(item => item.id === modelId);
                  if (index !== -1) {
                    downloadQueue.splice(index, 1);
                    downloadHistory.unshift({ ...item, status: '已完成' as const, completedAt: item.completedAt! });
                  }
                } else {
                  item.status = '失败';
                  item.error = error;
                }
              }
              
              // 通过IPC发送完成通知到渲染进程
              if (mainWindow) {
                mainWindow.webContents.send('download-completed', {
                  taskId: modelId,
                  success,
                  filePath,
                  error
                });
                
                // 通知UI队列已更新
                mainWindow.webContents.send('download-queue-updated', {
                  queue: downloadQueue,
                  completed: success ? [item] : [],
                  failed: success ? [] : [item]
                });
              }
            }
          );
          
          if (success) {
            successCount.value++;
            results.push({ id: modelId, success: true, data: downloadItem });
          } else {
            failCount.value++;
            results.push({ id: modelId, success: false, error: 'Failed to start download' });
          }
        } catch (error) {
          failCount.value++;
          results.push({
            id: modelId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
      
      await Promise.allSettled(promises);
      
      // 通知UI批量操作完成
      if (mainWindow) {
        mainWindow.webContents.send('batch-start-download-completed', {
          results,
          successCount: successCount.value,
          failCount: failCount.value
        });
      }
      
      console.log(`Batch start download completed: Success ${successCount.value}, Failed ${failCount.value}`);
      
      return {
        success: true,
        data: {
          results,
          successCount: successCount.value,
          failCount: failCount.value
        }
      };
    } catch (error) {
      console.error('Batch start download failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 获取下载历史
   * 渲染进程可以通过此 IPC 调用来获取下载历史记录
   */
  ipcMain.handle('get-download-history', async (_event, page: number = 1, pageSize: number = 10) => {
    try {
      console.log('Get download history:', { page, pageSize });
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedHistory = downloadHistory.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          items: paginatedHistory,
          total: downloadHistory.length,
          page,
          pageSize,
          totalPages: Math.ceil(downloadHistory.length / pageSize)
        }
      };
    } catch (error) {
      console.error('Get download history failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 清空下载历史
   * 渲染进程可以通过此 IPC 调用来清空下载历史记录
   */
  ipcMain.handle('clear-download-history', async () => {
    try {
      console.log('Clear download history');
      
      const clearedCount = downloadHistory.length;
      downloadHistory = [];
      
      return { success: true, data: { clearedCount } };
    } catch (error) {
      console.error('Clear download history failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 选择下载目录
   * 渲染进程可以通过此 IPC 调用来选择下载目录
   */
  ipcMain.handle('select-download-directory', async () => {
    try {
      const { dialog } = await import('electron');
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Download Directory',
        message: 'Please select download directory'
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        downloadDirectory = selectedPath;
        // 保存到配置文件
        const config = await loadConfig()
        config.downloadDirectory = selectedPath
        await saveConfig(config)
        console.log('Select download directory:', selectedPath);
        return { success: true, data: selectedPath };
      } else {
        return { success: false, error: 'User cancelled selection' };
      }
    } catch (error) {
      console.error('Select download directory failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 保存下载目录设置
   * 渲染进程可以通过此 IPC 调用来保存下载目录设置
   */
  ipcMain.handle('save-download-directory', async (_event, directory: string) => {
    try {
      downloadDirectory = directory;
      // 保存到配置文件
      const config = await loadConfig()
      config.downloadDirectory = directory
      await saveConfig(config)
      console.log('Save download directory setting:', directory);
      return { success: true };
    } catch (error) {
      console.error('Save download directory setting failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 获取下载目录设置
   * 渲染进程可以通过此 IPC 调用来获取下载目录设置
   */
  ipcMain.handle('get-download-directory', async () => {
    try {
      // 从配置文件加载
      const config = await loadConfig()
      if (config.downloadDirectory) {
        downloadDirectory = config.downloadDirectory
      }
      console.log('Get download directory setting:', downloadDirectory);
      return { success: true, data: downloadDirectory };
    } catch (error) {
      console.error('Get download directory setting failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}

// 在初始化时加载配置
loadConfig().then(config => {
  if (config.downloadDirectory) {
    downloadDirectory = config.downloadDirectory
    console.log('Load download directory setting:', downloadDirectory)
  }
  if (config.proxySettings) {
    globalProxySettings = config.proxySettings
    console.log('Load proxy settings:', globalProxySettings)
  }
}).catch(error => {
  console.error('Load config failed during initialization:', error)
})

console.log('AI IPC handler initialization completed')

/**
 * 模拟下载过程
 * 在实际应用中，这里应该实现真实的文件下载逻辑
 */
function simulateDownload(downloadItem: any) {
  console.log('Start simulate download:', downloadItem.name);
  
  // 模拟下载参数
  const totalSize = Math.floor(Math.random() * 900000) + 100000; // 100KB-1MB随机大小
  let downloadedSize = 0;
  const speed = Math.floor(Math.random() * 5000) + 2000; // 2-7KB/s随机速度
  
  // 降低下载时间到3秒内完成，每100ms更新一次进度
  const downloadInterval = setInterval(() => {
    if (downloadItem.status !== '下载中') {
      clearInterval(downloadInterval);
      return;
    }

    // 更新下载大小
    const increment = Math.floor(speed * 0.1); // 100ms内的下载量
    downloadedSize = Math.min(downloadedSize + increment, totalSize);
    
    // 计算进度百分比
    downloadItem.progress = Math.round((downloadedSize / totalSize) * 100);
    
    if (downloadItem.progress >= 100) {
      downloadItem.progress = 100;
      downloadItem.status = '已完成';
      downloadItem.completedAt = new Date().toISOString();
      
      // 从队列中移除并添加到历史记录
      const index = downloadQueue.findIndex(item => item.id === downloadItem.id);
      if (index !== -1) {
        downloadQueue.splice(index, 1);
        downloadHistory.unshift({ ...downloadItem } as any);
      }
      
      console.log('Download completed:', downloadItem.name);
      clearInterval(downloadInterval);
      
      // 发送下载完成通知到UI
      if (mainWindow) {
        mainWindow.webContents.send('download-completed', {
          taskId: downloadItem.id,
          success: true,
          filePath: downloadItem.name,
          progress: 100,
          downloadedSize: totalSize,
          totalSize: totalSize
        });
        
        // 通知UI队列已更新
        mainWindow.webContents.send('download-queue-updated', {
          queue: downloadQueue,
          completed: [downloadItem]
        });
      }
    } else {
      // 周期性同步下载进度到UI
      if (mainWindow) {
        mainWindow.webContents.send('download-progress', {
          taskId: downloadItem.id,
          progress: downloadItem.progress,
          downloadedSize: downloadedSize,
          totalSize: totalSize,
          speed: speed,
          remainingTime: Math.round((totalSize - downloadedSize) / speed * 1000) // 剩余时间(毫秒)
        });
      }
    }
  }, 100); // 每100ms更新一次进度
}
