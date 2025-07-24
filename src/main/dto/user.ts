
/**
 * 用户数据传输对象
 * 定义用户相关的数据结构
 */
export class User {
    /** 用户唯一标识ID */
    id?: number;
    
    /** 用户真实姓名 */
    name: string;
    
    /** 用户邮箱地址（用于登录） */
    email: string;
    
    /** 用户密码（加密存储） */
    password: string;
    
    /** 用户昵称（显示名称） */
    nickname: string;
    
    /** 用户个人签名或描述 */
    word: string;
    
    /** 创建时间 */
    createdAt?: Date;
    
    /** 最后更新时间 */
    updatedAt?: Date;
}

/**
 * 用户登录请求数据
 */
export interface LoginRequest {
    /** 邮箱地址 */
    email: string;
    /** 密码 */
    password: string;
}

/**
 * 用户注册请求数据
 */
export interface RegisterRequest {
    /** 用户真实姓名 */
    name: string;
    /** 邮箱地址 */
    email: string;
    /** 密码 */
    password: string;
    /** 用户昵称 */
    nickname: string;
    /** 个人签名 */
    word?: string;
}

/**
 * 用户信息更新请求数据
 */
export interface UpdateUserRequest {
    /** 用户真实姓名 */
    name?: string;
    /** 用户昵称 */
    nickname?: string;
    /** 个人签名 */
    word?: string;
}

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
    /** 操作是否成功 */
    success: boolean;
    /** 响应数据 */
    data?: T;
    /** 响应消息 */
    message?: string;
}

