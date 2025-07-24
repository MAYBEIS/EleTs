import { IService, ServiceMethodMetadata } from '../interface';

/**
 * 服务基类
 * 所有服务都应该继承此基类
 */
export abstract class BaseService implements IService {
  abstract readonly serviceName: string;
  abstract readonly version: string;
  abstract readonly description?: string;

  /**
   * 获取服务的所有方法
   */
  getMethods(): ServiceMethodMetadata[] {
    const methods: ServiceMethodMetadata[] = [];
    const prototype = Object.getPrototypeOf(this);
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const name of propertyNames) {
      if (name === 'constructor' || name === 'getMethods' || name === 'initialize' || name === 'destroy') {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (descriptor && typeof descriptor.value === 'function') {
        methods.push({
          name,
          description: this.getMethodDescription(name),
          inputType: this.getMethodInputType(name),
          outputType: this.getMethodOutputType(name)
        });
      }
    }

    return methods;
  }

  /**
   * 获取方法描述（子类可重写）
   */
  protected getMethodDescription(methodName: string): string | undefined {
    return undefined;
  }

  /**
   * 获取方法输入类型（子类可重写）
   */
  protected getMethodInputType(methodName: string): string | undefined {
    return undefined;
  }

  /**
   * 获取方法输出类型（子类可重写）
   */
  protected getMethodOutputType(methodName: string): string | undefined {
    return undefined;
  }

  /**
   * 初始化服务（子类可重写）
   */
  async initialize(): Promise<void> {
    // 默认实现为空
  }

  /**
   * 销毁服务（子类可重写）
   */
  async destroy(): Promise<void> {
    // 默认实现为空
  }

  /**
   * 验证参数（子类可使用）
   */
  protected validateParams(params: any, schema?: any): void {
    // 基础参数验证逻辑
    if (schema && typeof params !== 'object') {
      throw new Error('Invalid parameters: expected object');
    }
  }

  /**
   * 记录日志（子类可使用）
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.serviceName}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }
}
