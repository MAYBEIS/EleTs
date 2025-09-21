/**
 * IPC 通信设置
 * 负责处理主进程和渲染进程之间的通信
 */

import { ipcMain } from 'electron';
import { ServiceManager } from './service/ServiceManager';

/**
 * 设置 IPC 通信处理程序
 */
export function setupIpc(): void {
  // 处理服务调用请求
  ipcMain.handle('service-call', async (event, serviceName: string, methodName: string, ...args: any[]) => {
    try {
      const serviceManager = ServiceManager.getInstance();
      const service = serviceManager.getService(serviceName);
      
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }
      
      // 检查方法是否存在
      if (typeof (service as any)[methodName] !== 'function') {
        throw new Error(`Method ${methodName} not found in service ${serviceName}`);
      }
      
      // 调用服务方法
      const result = await (service as any)[methodName](...args);
      return { success: true, result };
    } catch (error: any) {
      console.error('Service call error:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取所有已注册的服务名称
  ipcMain.handle('get-service-names', async () => {
    const serviceManager = ServiceManager.getInstance();
    return serviceManager.getServiceNames();
  });

  // 获取服务信息
  ipcMain.handle('get-service-info', async (event, serviceName: string) => {
    const serviceManager = ServiceManager.getInstance();
    const service = serviceManager.getService(serviceName);
    
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    return service.getServiceInfo();
  });
}
