import { ipcMain } from 'electron';
import { ServiceManager } from './service/ServiceManager';
import { ApiRequest, ApiResponse, IPC_CHANNELS, ERROR_CODES, ApiError } from './interface';
import { randomUUID } from 'crypto';

/**
 * 设置IPC通信
 */
export function setupIpc() {
  const serviceManager = ServiceManager.getInstance();

  // 处理API请求
  ipcMain.handle(IPC_CHANNELS.API_REQUEST, async (event, request: ApiRequest): Promise<ApiResponse> => {
    const startTime = Date.now();

    try {
      console.log(`[IPC] Received API request: ${request.service}.${request.method}`, request.params);

      // 验证请求格式
      if (!request.id || !request.service || !request.method) {
        throw {
          code: ERROR_CODES.INVALID_PARAMS,
          message: 'Invalid request format: missing required fields'
        } as ApiError;
      }

      // 调用服务方法
      const result = await serviceManager.callServiceMethod(
        request.service,
        request.method,
        request.params
      );

      const response: ApiResponse = {
        id: request.id,
        success: true,
        data: result,
        timestamp: Date.now()
      };

      console.log(`[IPC] API request completed in ${Date.now() - startTime}ms`);
      return response;

    } catch (error) {
      const apiError = error as ApiError;
      const response: ApiResponse = {
        id: request.id,
        success: false,
        error: {
          code: apiError.code || ERROR_CODES.INTERNAL_ERROR,
          message: apiError.message || 'Unknown error',
          details: apiError.details,
          stack: apiError.stack
        },
        timestamp: Date.now()
      };

      console.error(`[IPC] API request failed in ${Date.now() - startTime}ms:`, response.error);
      return response;
    }
  });

  // 获取服务列表
  ipcMain.handle(IPC_CHANNELS.SERVICE_LIST, async (): Promise<string[]> => {
    const services = serviceManager.getAllServices();
    return services.map(s => s.name);
  });

  // 获取服务信息
  ipcMain.handle(IPC_CHANNELS.SERVICE_INFO, async (event, serviceName: string) => {
    return serviceManager.getServiceInfo(serviceName);
  });

  console.log('[IPC] IPC handlers registered successfully');
}