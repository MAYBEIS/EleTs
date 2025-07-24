// 通信框架核心类型定义

/**
 * 服务方法的元数据
 */
export interface ServiceMethodMetadata {
  name: string;
  description?: string;
  inputType?: string;
  outputType?: string;
}

/**
 * 服务接口定义
 */
export interface IService {
  readonly serviceName: string;
  readonly version: string;
  readonly description?: string;
  
  // 获取服务的所有方法
  getMethods(): ServiceMethodMetadata[];
  
  // 初始化服务
  initialize?(): Promise<void>;
  
  // 销毁服务
  destroy?(): Promise<void>;
}

/**
 * API请求结构
 */
export interface ApiRequest<T = any> {
  id: string;
  service: string;
  method: string;
  params: T;
  timestamp: number;
}

/**
 * API响应结构
 */
export interface ApiResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
}

/**
 * API错误结构
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * 服务调用结果
 */
export type ServiceResult<T = any> = Promise<T>;

/**
 * 服务方法签名
 */
export type ServiceMethod<TInput = any, TOutput = any> = (params: TInput) => ServiceResult<TOutput>;

/**
 * 服务构造函数
 */
export interface ServiceConstructor {
  new (): IService;
}

/**
 * 服务注册信息
 */
export interface ServiceRegistration {
  name: string;
  service: IService;
  instance: any;
}

/**
 * 通信通道常量
 */
export const IPC_CHANNELS = {
  API_REQUEST: 'api:request',
  API_RESPONSE: 'api:response',
  SERVICE_LIST: 'api:service-list',
  SERVICE_INFO: 'api:service-info'
} as const;

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  METHOD_NOT_FOUND: 'METHOD_NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
