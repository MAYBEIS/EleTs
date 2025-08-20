/**
 * Electron 主进程入口文件
 * 负责创建和管理应用程序窗口，处理应用程序生命周期事件
 * 以及设置 IPC 通信处理程序
 */

// 导入 Electron 工具包，提供常用的 Electron 开发工具
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
// 导入 Electron 核心模块
import { app, BrowserWindow, ipcMain, shell } from 'electron'
// 导入日志记录库，用于应用程序日志管理
import electronLog from 'electron-log'
// 导入 Node.js 路径处理模块
import { join } from 'path'
// 导入用户 IPC 处理程序
import { initUserIpc, initTestUsers } from './ipc/userIpc'
// 导入 https-proxy-agent
import { HttpsProxyAgent } from 'https-proxy-agent'

// ==================== 日志配置 ====================

/**
 * 配置 electronLog 日志系统
 * 用于捕获和记录应用程序的所有日志信息
 */

// 设置控制台输出的日志级别为 debug（最详细的日志级别）
electronLog.transports.console.level = 'debug'
// 设置文件输出的日志级别为 debug
electronLog.transports.file.level = 'debug'

// 设置日志文件的最大大小为 10MB，超过后会自动轮转
electronLog.transports.file.maxSize = 10 * 1024 * 1024

// 将 electronLog 的日志函数绑定到全局 console 对象
// 这样所有的 console.log、console.error 等调用都会被 electronLog 捕获
Object.assign(console, electronLog.functions)

// ==================== 全局变量 ====================

/**
 * 主窗口实例的全局引用
 * 导出以便其他模块可以访问主窗口
 */
export let mainWindow: BrowserWindow

// ==================== 窗口创建函数 ====================

/**
 * 创建应用程序主窗口
 * @returns {BrowserWindow} 创建的主窗口实例
 */
function createWindow(): BrowserWindow {
  // 创建新的浏览器窗口实例
  const mainWindow = new BrowserWindow({
    // 窗口初始尺寸
    width: 1200,
    height: 800,
    // 窗口最小尺寸限制
    minWidth: 1100,
    minHeight: 600,
    // 窗口创建时不立即显示，等待内容加载完成
    show: false,
    // 自动隐藏菜单栏（Windows/Linux）
    autoHideMenuBar: true,
    // 窗口标题，包含应用版本号
    title: 'Win App ' + app.getVersion(),
    // 窗口图标路径
    icon: join(__dirname, '../../resources/icon.ico'),
    // Web 首选项配置
    webPreferences: {
      // 预加载脚本路径，用于在渲染进程中注入 API
      preload: join(__dirname, '../preload/index.js'),
      // 禁用沙箱模式，允许更多的 Node.js API 访问
      sandbox: false,
      // 禁用网络安全策略，允许加载本地文件（开发时使用）
      webSecurity: false,
      // 设置内容安全策略，允许连接到外部API
      additionalArguments: ['--disable-web-security']
    }
  })

  // ==================== 窗口事件监听 ====================

  /**
   * 窗口准备显示时的事件处理
   * 当页面加载完成并准备显示时触发
   */
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()  // 显示窗口
    mainWindow.setMenu(null)  // 禁用菜单栏，防止 Alt 键显示菜单
  })

  /**
   * 窗口获得焦点时的事件处理
   * 向渲染进程发送焦点事件通知
   */
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('app-focus')
    // console.log('focus')  // 调试用日志（已注释）
  })

  /**
   * 处理窗口中的新窗口打开请求
   * 将所有新窗口请求重定向到系统默认浏览器
   */
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)  // 使用系统默认浏览器打开链接
    return { action: 'deny' }  // 拒绝在应用内打开新窗口
  })

  // ==================== 页面加载配置 ====================

  /**
   * 根据环境加载不同的页面内容
   * 开发环境：加载开发服务器 URL
   * 生产环境：加载打包后的本地 HTML 文件
   */
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // 开发环境：从开发服务器加载页面
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // 生产环境：加载打包后的 HTML 文件
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// ==================== 单实例应用控制 ====================

/**
 * 确保应用程序只能运行一个实例
 * 如果尝试启动第二个实例，会激活已存在的实例
 */
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 如果没有获得锁（即已有实例在运行），退出当前实例
  app.quit()
} else {
  /**
   * 处理第二个实例启动的情况
   * 当用户尝试启动第二个实例时，激活已存在的窗口
   */
  app.on('second-instance', () => {
    if (mainWindow) {
      // 如果窗口被最小化，恢复窗口
      if (mainWindow.isMinimized()) mainWindow.restore()
      // 将窗口置于前台
      mainWindow.focus()
    }
  })

  // ==================== 应用程序生命周期事件 ====================

  /**
   * 应用程序准备就绪时的处理
   * 这是应用程序启动后的主要初始化逻辑
   */
  app.whenReady().then(() => {
    // 设置应用程序用户模型 ID（Windows 任务栏分组）
    electronApp.setAppUserModelId('com.electron')

    // 初始化用户 IPC 处理程序
    initUserIpc()

    /**
     * 为所有浏览器窗口设置开发工具快捷键监听
     * 在开发模式下自动打开开发者工具
     */
    app.on('browser-window-created', (_, window) => {
      // 监听窗口快捷键（如 F12 打开开发工具）
      optimizer.watchWindowShortcuts(window)
      
      if (is.dev) {
        // 开发模式下自动打开开发者工具
        window.webContents.openDevTools()
      }
    })

    // 创建主窗口并保存引用
    mainWindow = createWindow()

    // 初始化测试用户（开发环境）
    if (is.dev) {
      initTestUsers()
    }

    /**
     * macOS 特有的应用激活事件处理
     * 当点击 Dock 图标时，如果没有窗口则创建新窗口
     */
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  /**
   * 所有窗口关闭时的处理
   * Windows/Linux：退出应用程序
   * macOS：保持应用程序运行（符合 macOS 应用习惯）
   */
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

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
    // 获取代理设置
    const { proxy, useSystemProxy } = options;
    delete options.proxy; // 从选项中移除代理设置，避免传递给 fetch
    delete options.useSystemProxy; // 从选项中移除系统代理设置
    
    // 配置请求选项
    const requestOptions: any = {
      method: 'GET',
      headers: options.headers || {}
    };
    
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
        // 创建代理代理
        const agent = new HttpsProxyAgent(proxy.server);
        requestOptions.agent = agent;
      } catch (agentError) {
        console.error('创建代理失败:', agentError);
      }
    }
    
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error('获取 Civitai 模型数据失败:', error);
    // 尝试不使用代理直接连接
    try {
      console.log('尝试不使用代理直接连接');
      const directResponse = await fetch(url, {
        method: 'GET',
        headers: options.headers || {}
      });
      const data = await directResponse.json();
      return { ok: directResponse.ok, data };
    } catch (directError) {
      console.error('直接连接也失败:', directError);
      return { ok: false, error: error instanceof Error ? error.message : '未知错误' };
    }
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
    // 模拟下载成功
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
    // 模拟设置成功
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
        const agent = new HttpsProxyAgent(proxyServer);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch('https://www.google.com', {
          agent: agent,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
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
