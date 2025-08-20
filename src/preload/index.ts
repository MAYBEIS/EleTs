import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for render
const api = {
  fetchCivitaiModels: (url: string, options: any) => 
    ipcRenderer.invoke('fetch-civitai-models', url, options),
  downloadCivitaiModel: (url: string, filename: string) => 
    ipcRenderer.invoke('download-civitai-model', url, filename),
  updateProxySettings: (settings: any) => 
    ipcRenderer.invoke('update-proxy-settings', settings),
  testProxyConnection: (proxyServer: string) => 
    ipcRenderer.invoke('test-proxy-connection', proxyServer)
}

// Use `contextBridge` APIs to expose Electron APIs to
// render only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
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
