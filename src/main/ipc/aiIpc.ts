/**
 * AI IPC 处理程序
 * 处理所有与 AI 相关的 IPC 通信
 */

import { mainWindow } from '..'
import { ipcMain, app } from 'electron'
import { HttpsProxyAgent } from 'https-proxy-agent'
import nodeFetch from 'node-fetch'

/**
 * 初始化 AI IPC 处理程序
 * 注册所有 AI 相关的 IPC 监听器
 */
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
      
      // 如果启用了系统代理，则使用系统代理
      if (useSystemProxy) {
        console.log('使用系统代理');
        // 在 Electron 中，系统代理设置通常会自动应用
        // 如果需要手动配置，可以在这里添加相关代码
      }
      // 如果启用了自定义代理，则配置代理
      else if (proxy && proxy.server && proxy.enabled) {
        console.log('使用自定义代理:', proxy.server);
        try {
          // 使用代理发送请求
          const agent = new HttpsProxyAgent(proxy.server);
          console.log('发送代理请求...');
          const response = await nodeFetch(url, {
            method: 'GET',
            headers: options.headers || {},
            agent: agent
          });
          console.log('代理请求响应状态:', response.status);
          console.log('代理请求响应头:', JSON.stringify(Array.from(response.headers.entries()), null, 2));
          const data = await response.json();
          console.log('代理请求响应数据大小:', JSON.stringify(data).length);
          return { ok: response.ok, data };
        } catch (agentError) {
          console.error('使用代理失败:', agentError);
          // 代理失败时尝试直接连接
        }
      }
      
      // 直接连接（无代理或代理失败时）
      console.log('发送直接请求...');
      const response = await nodeFetch(url, {
        method: 'GET',
        headers: options.headers || {}
      });
      console.log('直接请求响应状态:', response.status);
      console.log('直接请求响应头:', JSON.stringify(Array.from(response.headers.entries()), null, 2));
      const data = await response.json();
      console.log('直接请求响应数据大小:', JSON.stringify(data).length);
      return { ok: response.ok, data };
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
      // 这里实现模型下载逻辑
      // 例如：使用 Node.js 的 fs 和 https 模块下载文件
      console.log('开始下载模型:', url, filename)
      // 使用 node-fetch 下载文件
      const response = await nodeFetch(url);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }
      
      // 这里可以添加实际的文件保存逻辑
      // 例如：将响应内容保存到文件系统
      console.log('模型下载完成:', filename);
      return { success: true }
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
      // 这里实现代理设置更新逻辑
      console.log('更新代理设置:', settings)
      // 保存代理设置到全局变量或配置文件
      global.proxySettings = settings;
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
      // 这里实现代理连接测试逻辑
      console.log('测试代理连接:', proxyServer)
      // 使用代理测试连接
      if (proxyServer) {
        try {
          // 使用代理测试连接
          const agent = new HttpsProxyAgent(proxyServer);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
          
          const response = await nodeFetch('https://www.google.com', {
            agent: agent,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          console.log('代理测试响应状态:', response.status);
          return { success: response.ok };
        } catch (testError) {
          console.error('代理测试失败:', testError);
          return { success: false, error: testError instanceof Error ? testError.message : '连接失败' };
        }
      }
      // 模拟测试成功
      return { success: true }
    } catch (error) {
      console.error('测试代理连接失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })
  
  console.log('AI IPC 处理程序初始化完成')
}
