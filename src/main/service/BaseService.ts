/**
 * 服务基类
 * 提供所有服务的通用功能
 */
export abstract class BaseService {
  abstract readonly serviceName: string;
  abstract readonly version: string;
  abstract readonly description: string;

  /**
   * 初始化服务
   */
  abstract initialize(): Promise<void>;

  /**
   * 销毁服务
   */
  async destroy(): Promise<void> {
    // 默认实现，子类可以覆盖
  }

  /**
   * 获取方法描述
   */
  protected getMethodDescription(methodName: string): string | undefined {
    // 默认实现，子类可以覆盖
    return undefined;
  }

  /**
   * 记录日志
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.serviceName}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage, error);
        break;
    }
  }

  /**
   * 获取服务信息
   */
  getServiceInfo(): any {
    return {
      name: this.serviceName,
      version: this.version,
      description: this.description
    };
  }
}