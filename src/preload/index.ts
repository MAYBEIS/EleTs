/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-21 15:37:42
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-21 17:55:50
 * @FilePath: \EleTs\src\preload\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 定义一个安全的 IPC 对象，只暴露需要的方法
const api = {
  // 安全地暴露 ipcRenderer 的 invoke 和 send 方法
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  // 添加其他需要的方法
  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => func(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },
  once: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (_event, ...args) => func(...args))
  },
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
}

// Use `contextBridge` APIs to expose Electron APIs to
// render only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    // 安全地暴露自定义 IPC API
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
