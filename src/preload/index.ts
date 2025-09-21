/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-21 15:37:42
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:38:03
 * @FilePath: \EleTs\src\preload\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 定义音乐播放器相关的安全通道
const musicChannels = [
  'music:play',
  'music:pause',
  'music:stop',
  'music:next',
  'music:previous',
  'music:set-volume',
  'music:seek',
  'music:load-track'
] as const

// 定义安全的 IPC 对象，只暴露需要的方法
const api = {
  // 安全地暴露 ipcRenderer 的 invoke 和 send 方法
  invoke: (channel: string, ...args: any[]) => {
    // 验证通道是否在允许的列表中
    if (musicChannels.includes(channel as any)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    console.warn(`尝试访问未授权的通道: ${channel}`)
    return Promise.reject(new Error('未授权的通道'))
  },
  send: (channel: string, ...args: any[]) => {
    // 验证通道是否在允许的列表中
    if (musicChannels.includes(channel as any)) {
      ipcRenderer.send(channel, ...args)
    } else {
      console.warn(`尝试访问未授权的通道: ${channel}`)
    }
  },
  // 添加其他需要的方法
  on: (channel: string, func: (...args: any[]) => void) => {
    // 允许监听特定的事件通道
    const allowedChannels = [
      'music:play-pause',
      'music:next',
      'music:previous',
      'music:volume-up',
      'music:volume-down',
      'app-focus'
    ]
    
    if (allowedChannels.includes(channel)) {
      const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => func(...args)
      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    }
    console.warn(`尝试监听未授权的通道: ${channel}`)
    return () => {}
  },
  once: (channel: string, func: (...args: any[]) => void) => {
    const allowedChannels = [
      'music:play-pause',
      'music:next',
      'music:previous',
      'music:volume-up',
      'music:volume-down',
      'app-focus'
    ]
    
    if (allowedChannels.includes(channel)) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args))
    } else {
      console.warn(`尝试监听未授权的通道: ${channel}`)
    }
  },
  removeAllListeners: (channel: string) => {
    const allowedChannels = [
      'music:play-pause',
      'music:next',
      'music:previous',
      'music:volume-up',
      'music:volume-down',
      'app-focus'
    ]
    
    if (allowedChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel)
    } else {
      console.warn(`尝试移除未授权的通道监听器: ${channel}`)
    }
  }
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
  