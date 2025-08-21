/**
 * AI IPC 处理程序
 * 处理所有与 AI 相关的 IPC 通信
 */

import { mainWindow } from '..'
import { ipcMain, app, net } from 'electron'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'

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
      console.log('开始获取 Civitai 模型数据');
      console.log('请求 URL:', url);
      console.log('请求选项:', JSON.stringify(options, null, 2));
      
      // 获取代理设置
      const { proxy, useSystemProxy } = options;
      delete options.proxy; // 从选项中移除代理设置，避免传递给 fetch
      delete options.useSystemProxy; // 从选项中移除系统代理设置
      
      // 合并请求头
      const headers = { ...defaultHeaders, ...options.headers };
      
      // 如果启用了系统代理，则使用系统代理
      if (useSystemProxy) {
        console.log('使用系统代理');
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
        
        console.log('系统代理请求响应状态:', response.statusCode);
        
        // 解析JSON数据
        let data;
        try {
          data = JSON.parse(response.data);
        } catch (parseError) {
          console.error('解析响应数据失败:', parseError);
          throw new Error('响应数据不是有效的JSON格式');
        }
        
        return { ok: response.statusCode >= 200 && response.statusCode < 300, data };
      }
      // 如果启用了自定义代理，则配置代理
      // 处理两种情况：
      // 1. proxy是一个包含server和enabled属性的对象
      // 2. proxy是一个字符串（代理服务器地址）
      else if ((proxy && proxy.server && proxy.enabled) || (typeof proxy === 'string' && proxy.length > 0)) {
        console.log('使用自定义代理:', typeof proxy === 'string' ? proxy : proxy.server);
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
          
          console.log('代理请求响应状态:', response.status);
          
          // 获取响应数据
          const data = await response.json();
          return { ok: response.ok, data };
        } catch (agentError) {
          console.error('使用代理失败:', agentError);
          return { ok: false, error: agentError instanceof Error ? agentError.message : '代理连接失败' };
        }
      }
      
      // 直接连接（无代理或代理失败时）
      console.log('发送直接请求...');
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
        
        console.log('直接请求响应状态:', response.status);
        
        // 获取响应数据
        const data = await response.json();
        return { ok: response.ok, data };
      } catch (error) {
        console.error('直接请求失败:', error);
        return { ok: false, error: error instanceof Error ? error.message : '直接连接失败' };
      }
    } catch (error) {
      console.error('获取 Civitai 模型数据失败:', error);
      return { ok: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  })

  /**
   * 处理 Civitai 模型下载请求
   * 渲染进程可以通过此 IPC 调用来下载 Civitai 模型
   */
  ipcMain.handle('download-civitai-model', async (_event, url, filename) => {
    try {
      console.log('开始下载模型:', url, filename)
      
      // 获取全局代理设置
      const { server, enabled, useSystemProxy } = globalProxySettings;
      
      // 如果启用了系统代理，则直接连接（让系统自动处理代理）
      if (useSystemProxy) {
        console.log('使用系统代理下载模型');
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
          throw new Error(`下载失败: ${response.statusCode} ${response.data}`);
        }
        // 这里可以添加实际的文件保存逻辑
        // 例如：将响应内容保存到文件系统
        console.log('模型下载完成:', filename);
        return { success: true };
      }
      // 如果启用了自定义代理，则配置代理
      else if (enabled && server) {
        console.log('使用自定义代理下载模型:', server);
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
            throw new Error(`下载失败: ${response.status} ${response.statusText}`);
          }
          // 这里可以添加实际的文件保存逻辑
          // 例如：将响应内容保存到文件系统
          console.log('模型下载完成:', filename);
          return { success: true };
        } catch (agentError) {
          console.error('使用代理失败:', agentError);
          throw agentError;
        }
      }
      // 直接连接（无代理）
      else {
        console.log('直接下载模型');
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
            throw new Error(`下载失败: ${response.status} ${response.statusText}`);
          }
          // 这里可以添加实际的文件保存逻辑
          // 例如：将响应内容保存到文件系统
          console.log('模型下载完成:', filename);
          return { success: true };
        } catch (error) {
          console.error('直接请求失败:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('下载 Civitai 模型失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  /**
   * 更新代理设置
   * 渲染进程可以通过此 IPC 调用来更新代理设置
   */
  ipcMain.handle('update-proxy-settings', async (_event, settings) => {
    try {
      console.log('更新代理设置:', settings)
      // 保存代理设置到全局变量
      globalProxySettings = settings;
      console.log('代理设置更新成功');
      return { success: true }
    } catch (error) {
      console.error('更新代理设置失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  /**
   * 测试代理连接
   * 渲染进程可以通过此 IPC 调用来测试代理连接
   */
  ipcMain.handle('test-proxy-connection', async (_event, proxyServer) => {
    try {
      console.log('测试代理连接:', proxyServer)
      
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
          
          console.log('自定义代理测试响应状态:', response.status);
          return { success: response.ok };
        } catch (testError) {
          console.error('自定义代理测试失败:', testError);
          return { success: false, error: testError instanceof Error ? testError.message : '连接失败' };
        }
      }
      // 如果没有提供代理服务器，则测试系统代理
      else {
        // 获取全局代理设置
        const { useSystemProxy } = globalProxySettings;
        
        if (useSystemProxy) {
          try {
            console.log('测试系统代理连接');
            
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
            
            console.log('系统代理测试响应状态:', response.statusCode);
            return { success: response.statusCode >= 200 && response.statusCode < 300 };
          } catch (testError) {
            console.error('系统代理测试失败:', testError);
            return { success: false, error: testError instanceof Error ? testError.message : '连接失败' };
          }
        } else {
          // 没有启用任何代理，模拟测试成功
          console.log('未启用代理，模拟测试成功');
          return { success: true };
        }
      }
    } catch (error) {
      console.error('测试代理连接失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })
  
  /**
   * 获取下载队列
   * 渲染进程可以通过此 IPC 调用来获取当前下载队列
   */
  ipcMain.handle('get-download-queue', async () => {
    try {
      console.log('获取下载队列，当前队列长度:', downloadQueue.length);
      return { success: true, data: downloadQueue };
    } catch (error) {
      console.error('获取下载队列失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 添加到下载队列
   * 渲染进程可以通过此 IPC 调用来添加模型到下载队列
   */
  ipcMain.handle('add-to-download-queue', async (_event, modelId: string, modelName: string, downloadUrl: string) => {
    try {
      console.log('添加模型到下载队列:', { modelId, modelName, downloadUrl });
      
      // 检查是否已在队列中
      const existingIndex = downloadQueue.findIndex(item => item.id === modelId);
      if (existingIndex !== -1) {
        console.log('模型已在下载队列中');
        return { success: false, error: '模型已在下载队列中' };
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
      console.log('成功添加到下载队列，当前队列长度:', downloadQueue.length);
      
      return { success: true, data: downloadItem };
    } catch (error) {
      console.error('添加到下载队列失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 批量添加到下载队列
   * 渲染进程可以通过此 IPC 调用来批量添加模型到下载队列
   */
  ipcMain.handle('batch-add-to-download-queue', async (_event, modelIds: string[]) => {
    try {
      console.log('批量添加模型到下载队列:', modelIds);
      
      const addedItems = [];
      const failedItems = [];

      for (const modelId of modelIds) {
        // 检查是否已在队列中
        const existingIndex = downloadQueue.findIndex(item => item.id === modelId);
        if (existingIndex !== -1) {
          failedItems.push({ id: modelId, reason: '已在下载队列中' });
          continue;
        }

        // 添加到队列
        const downloadItem = {
          id: modelId,
          name: `模型 ${modelId}`,
          url: '', // 批量添加时暂时没有URL，需要后续获取
          status: '等待中' as const,
          progress: 0,
          addedAt: new Date().toISOString()
        };

        downloadQueue.push(downloadItem);
        addedItems.push(downloadItem);
      }

      console.log(`批量添加完成: 成功 ${addedItems.length} 个，失败 ${failedItems.length} 个`);
      
      return {
        success: true,
        data: {
          added: addedItems,
          failed: failedItems,
          totalQueue: downloadQueue.length
        }
      };
    } catch (error) {
      console.error('批量添加到下载队列失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 开始下载
   * 渲染进程可以通过此 IPC 调用来开始下载指定模型
   */
  ipcMain.handle('start-download', async (_event, modelId: string) => {
    try {
      console.log('开始下载模型:', modelId);
      
      const downloadItem = downloadQueue.find(item => item.id === modelId);
      if (!downloadItem) {
        return { success: false, error: '未找到指定的下载项' };
      }

      if (downloadItem.status !== '等待中' && downloadItem.status !== '已暂停') {
        return { success: false, error: '只能开始等待中或已暂停的下载' };
      }

      // 更新状态
      downloadItem.status = '下载中';
      
      // 模拟下载过程（实际应用中应该实现真实的下载逻辑）
      simulateDownload(downloadItem);
      
      return { success: true, data: downloadItem };
    } catch (error) {
      console.error('开始下载失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 暂停下载
   * 渲染进程可以通过此 IPC 调用来暂停指定模型的下载
   */
  ipcMain.handle('pause-download', async (_event, modelId: string) => {
    try {
      console.log('暂停下载模型:', modelId);
      
      const downloadItem = downloadQueue.find(item => item.id === modelId);
      if (!downloadItem) {
        return { success: false, error: '未找到指定的下载项' };
      }

      if (downloadItem.status !== '下载中') {
        return { success: false, error: '只能暂停正在下载的项目' };
      }

      // 更新状态
      downloadItem.status = '已暂停';
      
      return { success: true, data: downloadItem };
    } catch (error) {
      console.error('暂停下载失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 取消下载
   * 渲染进程可以通过此 IPC 调用来取消指定模型的下载
   */
  ipcMain.handle('cancel-download', async (_event, modelId: string) => {
    try {
      console.log('取消下载模型:', modelId);
      
      const downloadIndex = downloadQueue.findIndex(item => item.id === modelId);
      if (downloadIndex === -1) {
        return { success: false, error: '未找到指定的下载项' };
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
      console.error('取消下载失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 获取下载历史
   * 渲染进程可以通过此 IPC 调用来获取下载历史记录
   */
  ipcMain.handle('get-download-history', async (_event, page: number = 1, pageSize: number = 10) => {
    try {
      console.log('获取下载历史:', { page, pageSize });
      
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
      console.error('获取下载历史失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 清空下载历史
   * 渲染进程可以通过此 IPC 调用来清空下载历史记录
   */
  ipcMain.handle('clear-download-history', async () => {
    try {
      console.log('清空下载历史');
      
      const clearedCount = downloadHistory.length;
      downloadHistory = [];
      
      return { success: true, data: { clearedCount } };
    } catch (error) {
      console.error('清空下载历史失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  console.log('AI IPC 处理程序初始化完成')
}

/**
 * 模拟下载过程
 * 在实际应用中，这里应该实现真实的文件下载逻辑
 */
function simulateDownload(downloadItem: any) {
  console.log('开始模拟下载:', downloadItem.name);
  
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
      
      console.log('下载完成:', downloadItem.name);
      clearInterval(downloadInterval);
    }
  }, 1000);
}
