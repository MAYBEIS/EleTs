import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { randomUUID } from 'crypto'

// 定义API请求和响应类型
interface ApiRequest<T = any> {
  id: string;
  service: string;
  method: string;
  params: T;
  timestamp: number;
}

interface ApiResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: number;
}

// 创建API客户端
const createApiClient = () => {
  return {
    /**
     * 调用服务方法
     */
    async call<T = any>(service: string, method: string, params?: any): Promise<T> {
      const request: ApiRequest = {
        id: randomUUID(),
        service,
        method,
        params: params || {},
        timestamp: Date.now()
      };

      try {
        const response: ApiResponse<T> = await ipcRenderer.invoke('api:request', request);

        if (response.success) {
          return response.data as T;
        } else {
          const error = new Error(response.error?.message || 'Unknown error');
          (error as any).code = response.error?.code;
          (error as any).details = response.error?.details;
          throw error;
        }
      } catch (error) {
        console.error(`API call failed: ${service}.${method}`, error);
        throw error;
      }
    },

    /**
     * 获取服务列表
     */
    async getServices(): Promise<string[]> {
      return ipcRenderer.invoke('api:service-list');
    },

    /**
     * 获取服务信息
     */
    async getServiceInfo(serviceName: string): Promise<any> {
      return ipcRenderer.invoke('api:service-info', serviceName);
    }
  };
};

// Custom APIs for render
const api = {
  // API客户端
  client: createApiClient(),

  // 系统监控API
  system: {
    getCpuInfo: () => api.client.call('SystemMonitor', 'getCpuInfo'),
    getMemoryInfo: () => api.client.call('SystemMonitor', 'getMemoryInfo'),
    getDiskInfo: () => api.client.call('SystemMonitor', 'getDiskInfo'),
    getNetworkInfo: () => api.client.call('SystemMonitor', 'getNetworkInfo'),
    getSystemOverview: () => api.client.call('SystemMonitor', 'getSystemOverview'),
    getRealTimeStats: () => api.client.call('SystemMonitor', 'getRealTimeStats')
  },

  // 硬件信息API
  hardware: {
    getCpuDetails: () => api.client.call('HardwareInfo', 'getCpuDetails'),
    getMemoryDetails: () => api.client.call('HardwareInfo', 'getMemoryDetails'),
    getGraphicsInfo: () => api.client.call('HardwareInfo', 'getGraphicsInfo'),
    getMotherboardInfo: () => api.client.call('HardwareInfo', 'getMotherboardInfo'),
    getStorageDevices: () => api.client.call('HardwareInfo', 'getStorageDevices'),
    getAudioDevices: () => api.client.call('HardwareInfo', 'getAudioDevices'),
    getUsbDevices: () => api.client.call('HardwareInfo', 'getUsbDevices'),
    getAllHardwareInfo: () => api.client.call('HardwareInfo', 'getAllHardwareInfo')
  },

  // 网络API
  network: {
    getNetworkInterfaces: () => api.client.call('Network', 'getNetworkInterfaces'),
    getNetworkStats: () => api.client.call('Network', 'getNetworkStats'),
    pingHost: (params: { host: string; count?: number }) => api.client.call('Network', 'pingHost', params),
    getConnectionInfo: () => api.client.call('Network', 'getConnectionInfo'),
    getWifiInfo: () => api.client.call('Network', 'getWifiInfo'),
    getNetworkSpeed: () => api.client.call('Network', 'getNetworkSpeed'),
    getActiveConnections: () => api.client.call('Network', 'getActiveConnections'),
    getNetworkOverview: () => api.client.call('Network', 'getNetworkOverview')
  }
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
