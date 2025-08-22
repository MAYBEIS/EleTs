/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-22 11:33:53
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-22 11:36:01
 * @FilePath: \EleTs\src\main\ipc\downIpc.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 下载 IPC 处理程序
 * 处理所有与模型下载相关的 IPC 通信
 */

import { ipcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { mainWindow } from '..';
import { ModelDownloader, ProxySettings } from '../utils/modelDown';

// 获取配置文件路径
function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'config.json');
}

// 加载配置
async function loadConfig(): Promise<any> {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = await fs.promises.readFile(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Load config failed:', error);
  }
  return {};
}

// 保存配置
async function saveConfig(config: any): Promise<void> {
  try {
    const configPath = getConfigPath();
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Save config failed:', error);
  }
}

// 全局代理设置
let globalProxySettings: ProxySettings = {
  server: undefined,
  enabled: false,
  useSystemProxy: false
};

// 下载目录设置
let downloadDirectory: string = '';

// 创建ModelDownloader实例
let modelDownloader: ModelDownloader | null = null;

// 在初始化时加载配置
loadConfig().then(config => {
  if (config.downloadDirectory) {
    downloadDirectory = config.downloadDirectory;
    console.log('Load download directory setting:', downloadDirectory);
  }
  
  if (config.proxySettings) {
    globalProxySettings = config.proxySettings;
    console.log('Load proxy settings:', globalProxySettings);
  }
}).catch(error => {
  console.error('Load config failed during initialization:', error);
});

/**
 * 初始化下载 IPC 处理程序
 * 注册所有下载相关的 IPC 监听器
 */
export function initDownloadIpc() {
  // 初始化ModelDownloader
  modelDownloader = new ModelDownloader({
    downloadDirectory: downloadDirectory,
    proxySettings: globalProxySettings
  });

  // ==================== IPC 通信处理 ====================

  /**
   * IPC 测试通信
   * 简单的 ping-pong 测试，用于验证主进程和渲染进程间的通信
   */
  ipcMain.on('download-ping', () => console.log('download-pong'));

  /**
   * 处理模型下载请求
   * 渲染进程可以通过此 IPC 调用来下载模型
   */
  ipcMain.handle('download-model', async (_event, url: string, filename: string, taskId: string) => {
    try {
      console.log('Start downloading model:', url, filename, taskId);
      
      // 检查ModelDownloader是否已初始化
      if (!modelDownloader) {
        throw new Error('ModelDownloader not initialized');
      }
      
      // 更新代理设置
      modelDownloader.updateConfig({
        downloadDirectory: downloadDirectory,
        proxySettings: globalProxySettings
      });
      
      // 执行下载
      const success = await modelDownloader.downloadModel(
        taskId,
        url,
        filename,
        // 进度回调
        (progress, downloadedSize, totalSize) => {
          console.log(`Download progress: ${progress}% (${downloadedSize}/${totalSize})`);
          // 通过IPC发送进度更新到渲染进程
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
          // 通过IPC发送完成通知到渲染进程
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
      console.error('Download model failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 处理模型恢复下载请求
   * 渲染进程可以通过此 IPC 调用来恢复下载模型
   */
  ipcMain.handle('resume-download', async (_event, url: string, filename: string, taskId: string) => {
    try {
      console.log('Resume downloading model:', url, filename, taskId);
      
      // 检查ModelDownloader是否已初始化
      if (!modelDownloader) {
        throw new Error('ModelDownloader not initialized');
      }
      
      // 更新代理设置
      modelDownloader.updateConfig({
        downloadDirectory: downloadDirectory,
        proxySettings: globalProxySettings
      });
      
      // 执行恢复下载
      const success = await modelDownloader.resumeDownload(
        taskId,
        url,
        filename,
        // 进度回调
        (progress, downloadedSize, totalSize) => {
          console.log(`Resume download progress: ${progress}% (${downloadedSize}/${totalSize})`);
          // 通过IPC发送进度更新到渲染进程
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
          console.log('Resume download completed:', { success, filePath, error });
          // 通过IPC发送完成通知到渲染进程
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
        console.log('Model resume download started successfully:', filename);
        return { success: true };
      } else {
        throw new Error('Failed to start resume download');
      }
    } catch (error) {
      console.error('Resume download model failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 处理暂停下载请求
   * 渲染进程可以通过此 IPC 调用来暂停下载
   */
  ipcMain.handle('pause-download', async (_event, taskId: string) => {
    try {
      console.log('Pause download:', taskId);
      
      // 检查ModelDownloader是否已初始化
      if (!modelDownloader) {
        throw new Error('ModelDownloader not initialized');
      }
      
      // 执行暂停下载
      const success = modelDownloader.pauseDownload(taskId);
      
      if (success) {
        console.log('Download paused successfully:', taskId);
        return { success: true };
      } else {
        throw new Error('Failed to pause download');
      }
    } catch (error) {
      console.error('Pause download failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 处理取消下载请求
   * 渲染进程可以通过此 IPC 调用来取消下载
   */
  ipcMain.handle('cancel-download', async (_event, taskId: string) => {
    try {
      console.log('Cancel download:', taskId);
      
      // 检查ModelDownloader是否已初始化
      if (!modelDownloader) {
        throw new Error('ModelDownloader not initialized');
      }
      
      // 执行取消下载
      const success = modelDownloader.cancelDownload(taskId);
      
      if (success) {
        console.log('Download cancelled successfully:', taskId);
        return { success: true };
      } else {
        throw new Error('Failed to cancel download');
      }
    } catch (error) {
      console.error('Cancel download failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 获取下载任务信息
   * 渲染进程可以通过此 IPC 调用来获取下载任务信息
   */
  ipcMain.handle('get-download-task', async (_event, taskId: string) => {
    try {
      console.log('Get download task:', taskId);
      
      // 检查ModelDownloader是否已初始化
      if (!modelDownloader) {
        throw new Error('ModelDownloader not initialized');
      }
      
      // 获取下载任务信息
      const task = modelDownloader.getDownloadTask(taskId);
      
      if (task) {
        console.log('Download task found:', taskId);
        return { success: true, data: task };
      } else {
        throw new Error('Download task not found');
      }
    } catch (error) {
      console.error('Get download task failed:', error);
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
        const config = await loadConfig();
        config.downloadDirectory = selectedPath;
        await saveConfig(config);
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
      const config = await loadConfig();
      config.downloadDirectory = directory;
      await saveConfig(config);
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
      const config = await loadConfig();
      if (config.downloadDirectory) {
        downloadDirectory = config.downloadDirectory;
      }
      console.log('Get download directory setting:', downloadDirectory);
      return { success: true, data: downloadDirectory };
    } catch (error) {
      console.error('Get download directory setting failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 更新代理设置
   * 渲染进程可以通过此 IPC 调用来更新代理设置
   */
  ipcMain.handle('update-proxy-settings', async (_event, settings: ProxySettings) => {
    try {
      console.log('Update proxy settings:', settings);
      // 保存代理设置到全局变量
      globalProxySettings = settings;
      console.log('Proxy settings updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Update proxy settings failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * 获取代理设置
   * 渲染进程可以通过此 IPC 调用来获取代理设置
   */
  ipcMain.handle('get-proxy-settings', async () => {
    try {
      console.log('Get proxy settings');
      return { success: true, data: globalProxySettings };
    } catch (error) {
      console.error('Get proxy settings failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  console.log('Download IPC handler initialization completed');
}