/**
 * 用户管理 IPC 处理程序
 * 处理所有与用户相关的 IPC 通信
 */

import { ipcMain } from 'electron'

/**
 * 用户数据类型定义
 */
interface User {
  id: number
  name: string
  email: string
  password: string
  nickname: string
  word: string
  createdAt: Date
  updatedAt: Date
}

/**
 * API 响应类型定义
 */
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}

/**
 * 用户数据存储（简单的内存存储，实际项目中应使用数据库）
 */
let users: User[] = []
let currentUserId = 1

/**
 * 初始化用户 IPC 处理程序
 * 注册所有用户相关的 IPC 监听器
 */
export function initUserIpc() {
  /**
   * 创建新用户
   * 处理用户注册请求，创建新的用户账户
   */
  ipcMain.handle('user:create', async (_, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Omit<User, 'password'>>> => {
    try {
      // 检查邮箱是否已存在
      const existingUser = users.find(u => u.email === userData.email)
      if (existingUser) {
        return { success: false, message: '邮箱已被注册' }
      }

      // 创建新用户
      const newUser: User = {
        id: currentUserId++,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      users.push(newUser)
      console.log('用户创建成功:', newUser.email)
      
      // 返回用户信息时不包含密码
      const { password, ...userWithoutPassword } = newUser
      return { success: true, data: userWithoutPassword, message: '注册成功' }
    } catch (error) {
      console.error('创建用户失败:', error)
      return { success: false, message: '创建用户失败' }
    }
  })

  /**
   * 根据ID获取用户信息
   * 通过用户ID查询用户详细信息
   */
  ipcMain.handle('user:get-by-id', async (_, userId: number): Promise<ApiResponse<Omit<User, 'password'>>> => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) {
        return { success: false, message: '用户不存在' }
      }
      
      const { password, ...userWithoutPassword } = user
      return { success: true, data: userWithoutPassword }
    } catch (error) {
      console.error('获取用户失败:', error)
      return { success: false, message: '获取用户失败' }
    }
  })

  /**
   * 根据邮箱获取用户信息
   * 通过邮箱地址查询用户信息
   */
  ipcMain.handle('user:get-by-email', async (_, email: string): Promise<ApiResponse<Omit<User, 'password'>>> => {
    try {
      const user = users.find(u => u.email === email)
      if (!user) {
        return { success: false, message: '用户不存在' }
      }
      
      const { password, ...userWithoutPassword } = user
      return { success: true, data: userWithoutPassword }
    } catch (error) {
      console.error('获取用户失败:', error)
      return { success: false, message: '获取用户失败' }
    }
  })

  /**
   * 获取所有用户列表
   * 返回系统中所有用户的信息列表
   */
  ipcMain.handle('user:get-all', async (): Promise<ApiResponse<Omit<User, 'password'>[]>> => {
    try {
      const usersWithoutPassword = users.map(({ password, ...user }) => user)
      return { success: true, data: usersWithoutPassword }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      return { success: false, message: '获取用户列表失败' }
    }
  })

  /**
   * 更新用户信息
   * 修改指定用户的个人信息
   */
  ipcMain.handle('user:update', async (_, userId: number, updateData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<ApiResponse<Omit<User, 'password'>>> => {
    try {
      const userIndex = users.findIndex(u => u.id === userId)
      if (userIndex === -1) {
        return { success: false, message: '用户不存在' }
      }
      
      // 如果更新邮箱，检查是否与其他用户重复
      if (updateData.email && updateData.email !== users[userIndex].email) {
        const emailExists = users.some(u => u.email === updateData.email && u.id !== userId)
        if (emailExists) {
          return { success: false, message: '邮箱已被其他用户使用' }
        }
      }
      
      // 更新用户信息
      users[userIndex] = {
        ...users[userIndex],
        ...updateData,
        updatedAt: new Date()
      }
      
      console.log('用户信息更新成功:', users[userIndex].email)
      
      const { password, ...userWithoutPassword } = users[userIndex]
      return { success: true, data: userWithoutPassword, message: '更新成功' }
    } catch (error) {
      console.error('更新用户失败:', error)
      return { success: false, message: '更新用户失败' }
    }
  })

  /**
   * 删除用户
   * 从系统中删除指定的用户账户
   */
  ipcMain.handle('user:delete', async (_, userId: number): Promise<ApiResponse> => {
    try {
      const userIndex = users.findIndex(u => u.id === userId)
      if (userIndex === -1) {
        return { success: false, message: '用户不存在' }
      }
      
      const deletedUser = users[userIndex]
      users.splice(userIndex, 1)
      
      console.log('用户删除成功:', deletedUser.email)
      return { success: true, message: '删除成功' }
    } catch (error) {
      console.error('删除用户失败:', error)
      return { success: false, message: '删除用户失败' }
    }
  })

  /**
   * 用户登录验证
   * 验证用户邮箱和密码，返回登录结果
   */
  ipcMain.handle('user:login', async (_, email: string, password: string): Promise<ApiResponse<Omit<User, 'password'>>> => {
    try {
      const user = users.find(u => u.email === email && u.password === password)
      if (!user) {
        return { success: false, message: '邮箱或密码错误' }
      }
      
      console.log('用户登录成功:', user.email)
      
      const { password: _, ...userWithoutPassword } = user
      return { success: true, data: userWithoutPassword, message: '登录成功' }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: '登录失败' }
    }
  })

  /**
   * 检查邮箱是否已存在
   * 验证邮箱地址是否已被其他用户注册
   */
  ipcMain.handle('user:check-email-exists', async (_, email: string): Promise<ApiResponse<{ exists: boolean }>> => {
    try {
      const exists = users.some(u => u.email === email)
      return { success: true, data: { exists } }
    } catch (error) {
      console.error('检查邮箱失败:', error)
      return { success: false, message: '检查邮箱失败' }
    }
  })

  /**
   * 修改用户密码
   * 验证旧密码并更新为新密码
   */
  ipcMain.handle('user:change-password', async (_, userId: number, oldPassword: string, newPassword: string): Promise<ApiResponse> => {
    try {
      const userIndex = users.findIndex(u => u.id === userId)
      if (userIndex === -1) {
        return { success: false, message: '用户不存在' }
      }
      
      // 验证旧密码
      if (users[userIndex].password !== oldPassword) {
        return { success: false, message: '原密码错误' }
      }
      
      // 更新密码
      users[userIndex].password = newPassword
      users[userIndex].updatedAt = new Date()
      
      console.log('用户密码修改成功:', users[userIndex].email)
      return { success: true, message: '密码修改成功' }
    } catch (error) {
      console.error('修改密码失败:', error)
      return { success: false, message: '修改密码失败' }
    }
  })

  /**
   * 批量删除用户
   * 删除多个指定的用户账户
   */
  ipcMain.handle('user:batch-delete', async (_, userIds: number[]): Promise<ApiResponse<{ deletedCount: number }>> => {
    try {
      let deletedCount = 0
      
      // 从后往前删除，避免索引变化问题
      for (let i = users.length - 1; i >= 0; i--) {
        if (userIds.includes(users[i].id)) {
          console.log('批量删除用户:', users[i].email)
          users.splice(i, 1)
          deletedCount++
        }
      }
      
      return { 
        success: true, 
        data: { deletedCount }, 
        message: `成功删除 ${deletedCount} 个用户` 
      }
    } catch (error) {
      console.error('批量删除用户失败:', error)
      return { success: false, message: '批量删除失败' }
    }
  })

  /**
   * 搜索用户
   * 根据关键词搜索用户（支持姓名、昵称、邮箱搜索）
   */
  ipcMain.handle('user:search', async (_, keyword: string): Promise<ApiResponse<Omit<User, 'password'>[]>> => {
    try {
      const searchResults = users.filter(user => 
        user.name.toLowerCase().includes(keyword.toLowerCase()) ||
        user.nickname.toLowerCase().includes(keyword.toLowerCase()) ||
        user.email.toLowerCase().includes(keyword.toLowerCase()) ||
        user.word.toLowerCase().includes(keyword.toLowerCase())
      )
      
      const resultsWithoutPassword = searchResults.map(({ password, ...user }) => user)
      
      return { 
        success: true, 
        data: resultsWithoutPassword,
        message: `找到 ${resultsWithoutPassword.length} 个匹配的用户`
      }
    } catch (error) {
      console.error('搜索用户失败:', error)
      return { success: false, message: '搜索失败' }
    }
  })

  /**
   * 获取用户统计信息
   * 返回用户相关的统计数据
   */
  ipcMain.handle('user:get-stats', async (): Promise<ApiResponse<{
    totalUsers: number
    recentUsers: number
    activeUsers: number
  }>> => {
    try {
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const stats = {
        totalUsers: users.length,
        recentUsers: users.filter(u => u.createdAt > oneWeekAgo).length,
        activeUsers: users.length // 这里可以根据实际需求定义活跃用户的标准
      }
      
      return { success: true, data: stats }
    } catch (error) {
      console.error('获取用户统计失败:', error)
      return { success: false, message: '获取统计信息失败' }
    }
  })

  console.log('用户 IPC 处理程序初始化完成')
}

/**
 * 初始化测试用户数据
 * 在开发环境下创建一些测试用户
 */
export function initTestUsers() {
  if (users.length === 0) {
    const testUsers = [
      {
        name: '张三',
        email: 'zhangsan@example.com',
        password: '123456',
        nickname: '小张',
        word: '热爱编程的开发者'
      },
      {
        name: '李四',
        email: 'lisi@example.com',
        password: '123456',
        nickname: '小李',
        word: '设计师，追求完美'
      },
      {
        name: '王五',
        email: 'wangwu@example.com',
        password: '123456',
        nickname: '小王',
        word: '产品经理，关注用户体验'
      }
    ]
    
    testUsers.forEach(userData => {
      const newUser: User = {
        id: currentUserId++,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      users.push(newUser)
    })
    
    console.log('初始化测试用户数据完成，共创建', testUsers.length, '个用户')
  }
}

/**
 * 获取当前用户数量（用于调试）
 */
export function getUserCount(): number {
  return users.length
}

/**
 * 清空所有用户数据（用于测试）
 */
export function clearAllUsers(): void {
  users = []
  currentUserId = 1
  console.log('已清空所有用户数据')
}