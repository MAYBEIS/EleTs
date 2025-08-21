/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-18 12:49:11
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-21 17:56:21
 * @FilePath: \EleTs\src\preload\index.d.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ElectronAPI } from '@electron-toolkit/preload'

// 定义 IPC API 的类型
interface IpcAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, func: (...args: any[]) => void) => void
  once: (channel: string, func: (...args: any[]) => void) => void
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IpcAPI
  }
}
