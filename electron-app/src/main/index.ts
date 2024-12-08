import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import electronLog from 'electron-log'

// 使用 electronLog 捕获控制台的所有内容
electronLog.transports.console.level = 'debug' // 设置控制台输出的日志级别, debug 为最低级别
electronLog.transports.file.level = 'debug' // 设置文件输出的日志级别, debug 为最低级别
// 设置日志文件的最大大小
electronLog.transports.file.maxSize = 10 * 1024 * 1024 // 10 MB
// 捕获控制台的所有内容
Object.assign(console, electronLog.functions)
export let mainWindow: BrowserWindow

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true, 
    // // 最大和最小屏幕尺寸  
    // // minWidth: 900,  
    // // minHeight: 670,    // maxWidth: 1920,    // maxHeight: 1080,  
    // // 页面顶部栏隐藏  
    // // frame: false,  
    // // 设置鼠标光标以表示可以拖拽  
    // resizable: true,  
    // //无边框开发环境  
    // frame:false,  
    // transparent:true,  
    // autoHideMenuBar: true,  
    // ...(process.platform === 'linux' ? { icon } : {}),  
    // webPreferences: {  
    //   // ...允许导入外部js  
    //   nodeIntegration: true,  
    //   contextIsolation: false,  
    //   // 这里设置为 false 来允许跨域  
    //   webSecurity: false,  
    //   preload: join(__dirname, '../preload/index.js'),  
    //   sandbox: false  
    // }  
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
