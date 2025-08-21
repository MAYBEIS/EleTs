/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-21 17:37:19
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-21 17:43:30
 * @FilePath: \EleTs\src\main\ipc\civitaiIpc.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * Civitai IPC 处理程序
 * 处理所有与 Civitai 网站相关的 IPC 通信
 *
 * 提供以下功能：
 * 1. 获取 Civitai 主页模型信息
 * 2. 代理设置和测试功能
 * 3. 应用程序控制功能
 */

import { ipcMain, app, net } from 'electron'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'

/**
 * 全局代理设置
 */
let globalProxySettings: {
  server?: string;
  enabled?: boolean;
  useSystemProxy?: boolean;
} = {};

/**
 * 创建默认的浏览器请求头
 */
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

/**
 * 初始化 Civitai IPC 处理程序
 * 注册所有 Civitai 相关的 IPC 监听器
 */
export function initCivitaiIpc() {
  // ==================== IPC 通信处理 ====================

  /**
   * IPC 测试通信
   * 简单的 ping-pong 测试，用于验证主进程和渲染进程间的通信
   */
  ipcMain.on('civitai-ping', () => console.log('[Civitai IPC] pong'))

  /**
   * 处理应用程序退出请求
   * 渲染进程可以通过此 IPC 调用来退出应用程序
   */
  ipcMain.handle('civitai-app-quit', async () => {
    console.log('[Civitai IPC] 收到应用程序退出请求');
    app.quit();
  })

  /**
   * 处理打开开发者工具的请求
   * 渲染进程可以通过此 IPC 调用来打开开发者工具
   * 注意：此功能需要在主进程中获取 mainWindow 对象
   */
  ipcMain.handle('civitai-open-dev-tools', async (_event) => {
    // 注意：这里需要获取 mainWindow 对象来打开开发者工具
    // 由于当前文件结构限制，我们暂时只输出日志
    console.log('[Civitai IPC] 收到打开开发者工具请求');
    console.warn('[Civitai IPC] 警告：当前实现未实际打开开发者工具，需要在主进程中获取 mainWindow 对象');
    // 实际实现应该类似：mainWindow.webContents.openDevTools()
  })

  /**
   * 处理 Civitai 主页模型信息获取请求
   * 渲染进程可以通过此 IPC 调用来获取 Civitai 主页模型信息
   */
  ipcMain.handle('fetch-civitai-homepage-models', async (_event, options = {}) => {
    try {
      console.log('[Civitai IPC] 开始获取 Civitai 主页模型信息');
      
      // 获取代理设置
      const { proxy, useSystemProxy } = options;
      // 从选项中移除代理设置，避免传递给 fetch
      const requestOptions = { ...options };
      delete requestOptions.proxy;
      delete requestOptions.useSystemProxy;
      
      // 合并请求头
      const headers = { ...defaultHeaders, ...requestOptions.headers };
      
      // Civitai 主页 URL
      const url = 'https://civitai.com/api/v1/models?sort=Most+Downloaded&period=AllTime';
      
      // 如果启用了系统代理，则使用系统代理
      if (useSystemProxy) {
        console.log('[Civitai IPC] 使用系统代理获取 Civitai 主页模型信息');
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
        
        console.log('[Civitai IPC] 系统代理请求响应状态:', response.statusCode);
        
        // 解析JSON数据
        let data;
        try {
          data = JSON.parse(response.data);
        } catch (parseError) {
          console.error('[Civitai IPC] 解析响应数据失败:', parseError);
          throw new Error('响应数据不是有效的JSON格式');
        }
        
        return { ok: response.statusCode >= 200 && response.statusCode < 300, data };
      }
      // 如果启用了自定义代理，则配置代理
      else if (proxy && proxy.server && proxy.enabled) {
        console.log('[Civitai IPC] 使用自定义代理获取 Civitai 主页模型信息:', proxy.server);
        try {
          // 使用代理发送请求
          let agent;
          if (proxy.server.startsWith('https://')) {
            agent = new HttpsProxyAgent(proxy.server);
          } else {
            agent = new HttpProxyAgent(proxy.server);
          }
          
          // 创建一个AbortController用于超时控制
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
          
          // 使用node-fetch通过代理发送请求
          const { default: nodeFetch } = await import('node-fetch');
          const response = await nodeFetch(url, {
            method: 'GET',
            headers: headers,
            agent: agent,
            signal: controller.signal as any
          });
          
          clearTimeout(timeoutId);
          
          console.log('[Civitai IPC] 代理请求响应状态:', response.status);
          
          // 获取响应数据
          const data = await response.json();
          return { ok: response.ok, data };
        } catch (agentError) {
          console.error('[Civitai IPC] 使用代理失败:', agentError);
          return { ok: false, error: agentError instanceof Error ? agentError.message : '代理连接失败' };
        }
      }
      
      // 直接连接（无代理或代理失败时）
      console.log('[Civitai IPC] 发送直接请求获取 Civitai 主页模型信息...');
      try {
        // 创建一个AbortController用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        // 使用node-fetch直接发送请求
        const { default: nodeFetch } = await import('node-fetch');
        const response = await nodeFetch(url, {
          method: 'GET',
          headers: headers,
          signal: controller.signal as any
        });
        
        clearTimeout(timeoutId);
        
        console.log('[Civitai IPC] 直接请求响应状态:', response.status);
        
        // 获取响应数据
        const data = await response.json();
        return { ok: response.ok, data };
      } catch (error) {
        console.error('[Civitai IPC] 直接请求失败:', error);
        return { ok: false, error: error instanceof Error ? error.message : '直接连接失败' };
      }
    } catch (error) {
      console.error('[Civitai IPC] 获取 Civitai 主页模型信息失败:', error);
      return { ok: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 更新代理设置
   * 渲染进程可以通过此 IPC 调用来更新代理设置
   */
  ipcMain.handle('update-civitai-proxy-settings', async (_event, settings) => {
    try {
      console.log('[Civitai IPC] 更新代理设置:', settings);
      // 保存代理设置到全局变量
      globalProxySettings = settings;
      console.log('[Civitai IPC] 代理设置更新成功');
      return { success: true };
    } catch (error) {
      console.error('[Civitai IPC] 更新代理设置失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  /**
   * 测试代理连接
   * 渲染进程可以通过此 IPC 调用来测试代理连接
   */
  ipcMain.handle('test-civitai-proxy-connection', async (_event, proxyServer) => {
    try {
      console.log('[Civitai IPC] 测试代理连接:', proxyServer);
      
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
          const { default: nodeFetch } = await import('node-fetch');
          const response = await nodeFetch('https://www.google.com', {
            method: 'GET',
            headers: defaultHeaders,
            agent: agent,
            signal: controller.signal as any
          });
          
          clearTimeout(timeoutId);
          
          console.log('[Civitai IPC] 自定义代理测试响应状态:', response.status);
          return { success: response.ok };
        } catch (testError) {
          console.error('[Civitai IPC] 自定义代理测试失败:', testError);
          return { success: false, error: testError instanceof Error ? testError.message : '连接失败' };
        }
      }
      // 如果没有提供代理服务器，则测试系统代理
      else {
        // 获取全局代理设置
        const { useSystemProxy } = globalProxySettings;
        
        if (useSystemProxy) {
          try {
            console.log('[Civitai IPC] 测试系统代理连接');
            
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
            
            console.log('[Civitai IPC] 系统代理测试响应状态:', response.statusCode);
            return { success: response.statusCode >= 200 && response.statusCode < 300 };
          } catch (testError) {
            console.error('[Civitai IPC] 系统代理测试失败:', testError);
            return { success: false, error: testError instanceof Error ? testError.message : '连接失败' };
          }
        } else {
          // 没有启用任何代理，模拟测试成功
          console.log('[Civitai IPC] 未启用代理，模拟测试成功');
          return { success: true };
        }
      }
    } catch (error) {
      console.error('[Civitai IPC] 测试代理连接失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  });

  console.log('[Civitai IPC] Civitai IPC 处理程序初始化完成')
}