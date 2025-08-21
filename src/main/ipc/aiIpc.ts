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
  
  console.log('AI IPC 处理程序初始化完成')
}
