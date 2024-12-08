import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import electronLog from 'electron-log'
import { join } from 'path'

// import './handler/DownloadHandler'
// import './ipc/handlers/global-hanlder'


// 使用 electronLog 捕获控制台的所有内容
electronLog.transports.console.level = 'debug' // 设置控制台输出的日志级别, debug 为最低级别
electronLog.transports.file.level = 'debug' // 设置文件输出的日志级别, debug 为最低级别

// 设置日志文件的最大大小
electronLog.transports.file.maxSize = 10 * 1024 * 1024 // 10 MB

// 捕获控制台的所有内容
Object.assign(console, electronLog.functions)

export let mainWindow: BrowserWindow

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1100, // 900
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Win App ' + app.getVersion(),
    icon: join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setMenu(null) // 禁止按 Alt 键显示菜单栏
  })

  mainWindow.on('focus', () => {
    mainWindow.webContents.send('app-focus')
    // console.log('focus')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
      if (is.dev) {
        // 自动打开开发者工具
        window.webContents.openDevTools()
      }
    })

    mainWindow = createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

// IPC test
ipcMain.on('ping', () => console.log('pong'))

ipcMain.handle('app-quit', async () => {
  app.quit()
})

ipcMain.handle('open-dev-tools', async () => {
  mainWindow.webContents.openDevTools()
})
