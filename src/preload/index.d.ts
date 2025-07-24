import { ElectronAPI } from '@electron-toolkit/preload'

// API类型定义
interface ApiClient {
  call<T = any>(service: string, method: string, params?: any): Promise<T>;
  getServices(): Promise<string[]>;
  getServiceInfo(serviceName: string): Promise<any>;
}

interface SystemApi {
  getCpuInfo(): Promise<any>;
  getMemoryInfo(): Promise<any>;
  getDiskInfo(): Promise<any>;
  getNetworkInfo(): Promise<any>;
  getSystemOverview(): Promise<any>;
  getRealTimeStats(): Promise<any>;
}

interface HardwareApi {
  getCpuDetails(): Promise<any>;
  getMemoryDetails(): Promise<any>;
  getGraphicsInfo(): Promise<any>;
  getMotherboardInfo(): Promise<any>;
  getStorageDevices(): Promise<any>;
  getAudioDevices(): Promise<any>;
  getUsbDevices(): Promise<any>;
  getAllHardwareInfo(): Promise<any>;
}

interface NetworkApi {
  getNetworkInterfaces(): Promise<any>;
  getNetworkStats(): Promise<any>;
  pingHost(params: { host: string; count?: number }): Promise<any>;
  getConnectionInfo(): Promise<any>;
  getWifiInfo(): Promise<any>;
  getNetworkSpeed(): Promise<any>;
  getActiveConnections(): Promise<any>;
  getNetworkOverview(): Promise<any>;
}

interface CustomApi {
  client: ApiClient;
  system: SystemApi;
  hardware: HardwareApi;
  network: NetworkApi;
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomApi
  }
}
