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
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
          
          // 使用node-fetch通过代理发送请求
          const nodeFetch = (await import('node-fetch')).default;
          const response = await nodeFetch(url, {
            method: 'GET',
            headers: headers,
            agent: agent,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
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
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        // 使用node-fetch直接发送请求
        const nodeFetch = (await import('node-fetch')).default;
        const response = await nodeFetch(url, {
          method: 'GET',
          headers: headers,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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
      
      // 获取全局代理设置
      const { server, enabled, useSystemProxy } = globalProxySettings;
      
      // 如果启用了系统代理，则直接连接（让系统自动处理代理）
      if (useSystemProxy) {
        console.log('Using system proxy to download model');
        const request = net.request({
          url: url,
          method: 'GET',
          headers: defaultHeaders
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
        
        if (response.statusCode < 200 || response.statusCode >= 300) {
          throw new Error(`Download failed: ${response.statusCode} ${response.data}`);
        }
        // 这里可以添加实际的文件保存逻辑
        // 例如：将响应内容保存到文件系统
        console.log('Model download completed:', filename);
        return { success: true };
      }
      // 如果启用了自定义代理，则配置代理
      else if (enabled && server) {
        console.log('Using custom proxy to download model:', server);
        try {
          // 使用代理发送请求
          let agent;
          if (server.startsWith('https://')) {
            agent = new HttpsProxyAgent(server);
          } else {
            agent = new HttpProxyAgent(server);
          }
          
          // 创建一个AbortController用于超时控制
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
          
          // 使用node-fetch通过代理发送请求
          const nodeFetch = (await import('node-fetch')).default;
          const response = await nodeFetch(url, {
            method: 'GET',
            headers: defaultHeaders,
            agent: agent,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
          }
          // 这里可以添加实际的文件保存逻辑
          // 例如：将响应内容保存到文件系统
          console.log('Model download completed:', filename);
          return { success: true };
        } catch (agentError) {
          console.error('Use proxy failed:', agentError);
          throw agentError;
        }
      }
      // 直接连接（无代理）
      else {
        console.log('Direct download model');
        try {
          // 创建一个AbortController用于超时控制
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
          
          // 使用node-fetch直接发送请求
          const nodeFetch = (await import('node-fetch')).default;
          const response = await nodeFetch(url, {
            method: 'GET',
            headers: defaultHeaders,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
          }
          // 这里可以添加实际的文件保存逻辑
          // 例如：将响应内容保存到文件系统
          console.log('Model download completed:', filename);
          return { success: true };
        } catch (error) {
          console.error('Direct request failed:', error);
          throw error;
        }
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
      console.log('Proxy settings updated successfully');
      return { success: true }
    } catch (error) {
      console.error('Update proxy settings failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
          
          // 使用node-fetch通过代理发送请求
          const nodeFetch = (await import('node-fetch')).default;
          const response = await nodeFetch('https://www.google.com', {
            method: 'GET',
            headers: defaultHeaders,
            agent: agent,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
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
      
      // 模拟下载过程（实际应用中应该实现真实的下载逻辑）
      simulateDownload(downloadItem);
      
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
      
      // 从队列中移除
      downloadQueue.splice(downloadIndex, 1);
      
      // 添加到历史记录
      downloadHistory.unshift({
        ...downloadItem,
        status: '已取消',
        completedAt: new Date().toISOString()
      });
      
      return { success: true, data: downloadItem };
    } catch (error) {
      console.error('Cancel download failed:', error);
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
  
  const downloadInterval = setInterval(() => {
    if (downloadItem.status !== '下载中') {
      clearInterval(downloadInterval);
      return;
    }

    // 更新进度
    downloadItem.progress += Math.random() * 15;
    
    if (downloadItem.progress >= 100) {
      downloadItem.progress = 100;
      downloadItem.status = '已完成';
      downloadItem.completedAt = new Date().toISOString();
      
      // 从队列中移除并添加到历史记录
      const index = downloadQueue.findIndex(item => item.id === downloadItem.id);
      if (index !== -1) {
        downloadQueue.splice(index, 1);
        downloadHistory.unshift({ ...downloadItem });
      }
      
      console.log('Download completed:', downloadItem.name);
      clearInterval(downloadInterval);
    }
  }, 1000);
}
