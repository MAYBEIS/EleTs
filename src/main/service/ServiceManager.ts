/**
 * 服务管理器
 * 负责注册、管理和销毁所有服务
 */

import { BaseService } from './BaseService';

export class ServiceManager {
  private static instance: ServiceManager;
  private services: Map<string, BaseService> = new Map();

  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * 注册服务
   * @param service 要注册的服务实例
   */
  async registerService(service: BaseService): Promise<void> {
    const serviceName = service.serviceName;
    
    // 检查服务是否已注册
    if (this.services.has(serviceName)) {
      throw new Error(`Service ${serviceName} is already registered`);
    }

    // 初始化服务
    await service.initialize();
    
    // 注册服务
    this.services.set(serviceName, service);
    console.log(`Service ${serviceName} registered and initialized`);
  }

  /**
   * 获取服务
   * @param serviceName 服务名称
   * @returns 服务实例或 undefined
   */
  getService<T extends BaseService>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T | undefined;
  }

  /**
   * 销毁所有服务
   */
  async destroyAll(): Promise<void> {
    // 创建服务销毁的 Promise 数组
    const destroyPromises: Promise<void>[] = [];
    
    // 销毁所有服务
    this.services.forEach((service, name) => {
      try {
        destroyPromises.push(service.destroy());
        console.log(`Service ${name} destroy requested`);
      } catch (error) {
        console.error(`Error destroying service ${name}:`, error);
      }
    });
    
    // 等待所有服务销毁完成
    await Promise.all(destroyPromises);
    
    // 清空服务映射
    this.services.clear();
    console.log('All services destroyed');
  }

  /**
   * 获取所有已注册的服务名称
   * @returns 服务名称数组
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}
