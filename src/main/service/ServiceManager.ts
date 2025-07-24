import { IService, ServiceRegistration, ApiError, ERROR_CODES } from '../interface';
import { BaseService } from './BaseService';

/**
 * 服务管理器
 * 负责服务的注册、查找和调用
 */
export class ServiceManager {
  private static instance: ServiceManager;
  private services: Map<string, ServiceRegistration> = new Map();

  private constructor() {}

  /**
   * 获取服务管理器单例
   */
  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * 注册服务
   */
  async registerService(service: IService): Promise<void> {
    try {
      if (this.services.has(service.serviceName)) {
        throw new Error(`Service ${service.serviceName} is already registered`);
      }

      // 初始化服务
      if (service.initialize) {
        await service.initialize();
      }

      const registration: ServiceRegistration = {
        name: service.serviceName,
        service,
        instance: service
      };

      this.services.set(service.serviceName, registration);
      console.log(`Service ${service.serviceName} registered successfully`);
    } catch (error) {
      console.error(`Failed to register service ${service.serviceName}:`, error);
      throw error;
    }
  }

  /**
   * 注销服务
   */
  async unregisterService(serviceName: string): Promise<void> {
    const registration = this.services.get(serviceName);
    if (!registration) {
      throw new Error(`Service ${serviceName} not found`);
    }

    try {
      // 销毁服务
      if (registration.service.destroy) {
        await registration.service.destroy();
      }

      this.services.delete(serviceName);
      console.log(`Service ${serviceName} unregistered successfully`);
    } catch (error) {
      console.error(`Failed to unregister service ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * 获取服务
   */
  getService(serviceName: string): IService | undefined {
    const registration = this.services.get(serviceName);
    return registration?.service;
  }

  /**
   * 获取所有已注册的服务
   */
  getAllServices(): ServiceRegistration[] {
    return Array.from(this.services.values());
  }

  /**
   * 调用服务方法
   */
  async callServiceMethod(serviceName: string, methodName: string, params: any): Promise<any> {
    const service = this.getService(serviceName);
    
    if (!service) {
      const error: ApiError = {
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: `Service ${serviceName} not found`
      };
      throw error;
    }

    const serviceInstance = service as any;
    const method = serviceInstance[methodName];

    if (!method || typeof method !== 'function') {
      const error: ApiError = {
        code: ERROR_CODES.METHOD_NOT_FOUND,
        message: `Method ${methodName} not found in service ${serviceName}`
      };
      throw error;
    }

    try {
      // 调用服务方法
      const result = await method.call(serviceInstance, params);
      return result;
    } catch (error) {
      const apiError: ApiError = {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: `Error calling ${serviceName}.${methodName}`,
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
      throw apiError;
    }
  }

  /**
   * 检查服务是否存在
   */
  hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * 获取服务信息
   */
  getServiceInfo(serviceName: string) {
    const service = this.getService(serviceName);
    if (!service) {
      return null;
    }

    return {
      name: service.serviceName,
      version: service.version,
      description: service.description,
      methods: service.getMethods()
    };
  }

  /**
   * 销毁所有服务
   */
  async destroyAll(): Promise<void> {
    const promises = Array.from(this.services.values()).map(async (registration) => {
      try {
        if (registration.service.destroy) {
          await registration.service.destroy();
        }
      } catch (error) {
        console.error(`Error destroying service ${registration.name}:`, error);
      }
    });

    await Promise.all(promises);
    this.services.clear();
    console.log('All services destroyed');
  }
}
