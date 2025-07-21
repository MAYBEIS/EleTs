/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 11:01:31
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-21 11:06:01
 * @FilePath: \EleTs\src\renderer\src\util\IpcUtil.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * IPC 通信工具类
 * 封装渲染进程与主进程之间的通信操作，提供文件系统和路径相关的功能
 */

const ipcRenderer = window.electron.ipcRenderer

/**
 * 检查指定路径是否存在
 * @param path 要检查的文件或文件夹路径
 * @returns Promise<boolean> 路径存在返回 true，不存在返回 false
 */
export function checkPathExist(path: string): Promise<boolean> {
  return ipcRenderer.invoke('fs:check-path-exist', path)
}

/**
 * 异步拼接多个路径
 * @param paths 要拼接的路径数组
 * @returns Promise<string> 拼接后的完整路径
 */
export function joinPathAsync(...paths: string[]): Promise<string> {
  return ipcRenderer.invoke('path:join-path', ...paths)
}

/**
 * 打开文件选择对话框，选择单个文件
 * @returns Promise<string | null> 选中的文件路径，取消选择返回 null
 */
export function selectFile(): Promise<string | null> {
  return ipcRenderer.invoke('path:select-file')
}

/**
 * 打开文件夹选择对话框，选择单个文件夹
 * @returns Promise<string | null> 选中的文件夹路径，取消选择返回 null
 */
export function selectFolder(): Promise<string | null> {
  return ipcRenderer.invoke('path:select-folder')
}

/**
 * 打开文件夹选择对话框，支持多选
 * @returns Promise<string[]> 选中的文件夹路径数组，取消选择返回空数组
 */
export function selectFolders(): Promise<string[]> {
  return ipcRenderer.invoke('path:select-folders')
}

/**
 * 在系统文件管理器中打开指定文件夹
 * @param path 要打开的文件夹路径
 * @returns Promise<boolean> 操作成功返回 true，失败返回 false
 */
export function openFolder(path: string): Promise<boolean> {
  // 参数验证：检查路径是否为空
  if (!path) {
    console.log(`Parameter path is empty in openFolder.`)
    return Promise.resolve(false)
  }
  return ipcRenderer.invoke('path:open-folder', path)
}

/**
 * 使用系统默认程序打开指定文件
 * @param path 要打开的文件路径
 * @returns Promise<boolean> 操作成功返回 true，失败返回 false
 */
export function openFile(path: string): Promise<boolean> {
  // 参数验证：检查路径是否为空
  if (!path) {
    console.log(`Parameter path is empty in openFile.`)
    return Promise.resolve(false)
  }
  return ipcRenderer.invoke('path:open-file', path)
}

/**
 * 在系统文件管理器中定位到指定文件（高亮显示该文件）
 * @param filepath 要定位的文件路径
 * @returns Promise<boolean> 操作成功返回 true，失败返回 false
 */
export function openFileLocation(filepath: string): Promise<boolean> {
  // 参数验证：检查文件路径是否为空
  if (!filepath) {
    console.log(`Parameter path is empty in openFileLocation.`)
    return Promise.resolve(false)
  }
  return ipcRenderer.invoke('path:open-file-location', filepath)
}
