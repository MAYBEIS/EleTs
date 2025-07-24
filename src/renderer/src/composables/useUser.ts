/**
 * 用户管理组合式函数
 * 提供用户相关的响应式状态和操作方法
 */

import { ref, reactive } from 'vue'
import type { User, LoginRequest, RegisterRequest, UpdateUserRequest } from '@main/dto/user'
import * as UserIpcUtil from '@renderer/util/UserIpcUtil'

export function useUser() {
  // ==================== 响应式状态 ====================
  
  /** 当前登录用户信息 */
  const currentUser = ref<Omit<User, 'password'> | null>(null)
  
  /** 用户列表 */
  const users = ref<Omit<User, 'password'>[]>([])
  
  /** 加载状态 */
  const loading = reactive({
    login: false,      // 登录加载状态
    register: false,   // 注册加载状态
    update: false,     // 更新加载状态
    delete: false,     // 删除加载状态
    fetch: false       // 获取数据加载状态
  })
  
  /** 错误信息 */
  const error = ref<string | null>(null)
  
  // ==================== 用户操作方法 ====================
  
  /**
   * 用户登录
   * @param loginData 登录数据
   * @returns 登录是否成功
   */
  const login = async (loginData: LoginRequest): Promise<boolean> => {
    loading.login = true
    error.value = null
    
    try {
      const result = await UserIpcUtil.loginUser(loginData)
      
      if (result.success && result.data) {
        currentUser.value = result.data
        // 可以在这里保存到本地存储
        localStorage.setItem('currentUser', JSON.stringify(result.data))
        return true
      } else {
        error.value = result.message || '登录失败'
        return false
      }
    } catch (err) {
      error.value = '登录过程中发生错误'
      console.error('登录错误:', err)
      return false
    } finally {
      loading.login = false
    }
  }
  
  /**
   * 用户注册
   * @param registerData 注册数据
   * @returns 注册是否成功
   */
  const register = async (registerData: RegisterRequest): Promise<boolean> => {
    loading.register = true
    error.value = null
    
    try {
      const result = await UserIpcUtil.registerUser(registerData)
      
      if (result.success) {
        return true
      } else {
        error.value = result.message || '注册失败'
        return false
      }
    } catch (err) {
      error.value = '注册过程中发生错误'
      console.error('注册错误:', err)
      return false
    } finally {
      loading.register = false
    }
  }
  
  /**
   * 用户登出
   */
  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }
  
  /**
   * 更新用户信息
   * @param userId 用户ID
   * @param updateData 更新数据
   * @returns 更新是否成功
   */
  const updateUser = async (userId: number, updateData: UpdateUserRequest): Promise<boolean> => {
    loading.update = true
    error.value = null
    
    try {
      const result = await UserIpcUtil.updateUser(userId, updateData)
      
      if (result.success && result.data) {
        // 如果更新的是当前用户，更新当前用户信息
        if (currentUser.value && currentUser.value.id === userId) {
          currentUser.value = result.data
          localStorage.setItem('currentUser', JSON.stringify(result.data))
        }
        
        // 更新用户列表中的对应用户
        const userIndex = users.value.findIndex(u => u.id === userId)
        if (userIndex !== -1) {
          users.value[userIndex] = result.data
        }
        
        return true
      } else {
        error.value = result.message || '更新失败'
        return false
      }
    } catch (err) {
      error.value = '更新过程中发生错误'
      console.error('更新错误:', err)
      return false
    } finally {
      loading.update = false
    }
  }
  
  /**
   * 删除用户
   * @param userId 用户ID
   * @returns 删除是否成功
   */
  const deleteUser = async (userId: number): Promise<boolean> => {
    loading.delete = true
    error.value = null
    
    try {
      const result = await UserIpcUtil.deleteUser(userId)
      
      if (result.success) {
        // 从用户列表中移除
        users.value = users.value.filter(u => u.id !== userId)
        
        // 如果删除的是当前用户，执行登出
        if (currentUser.value && currentUser.value.id === userId) {
          logout()
        }
        
        return true
      } else {
        error.value = result.message || '删除失败'
        return false
      }
    } catch (err) {
      error.value = '删除过程中发生错误'
      console.error('删除错误:', err)
      return false
    } finally {
      loading.delete = false
    }
  }
  
  /**
   * 获取所有用户
   */
  const fetchUsers = async (): Promise<void> => {
    loading.fetch = true
    error.value = null
    
    try {
      const result = await UserIpcUtil.getAllUsers()
      
      if (result.success && result.data) {
        users.value = result.data
      } else {
        error.value = result.message || '获取用户列表失败'
      }
    } catch (err) {
      error.value = '获取用户列表过程中发生错误'
      console.error('获取用户列表错误:', err)
    } finally {
      loading.fetch = false
    }
  }
  
  /**
   * 根据ID获取用户
   * @param userId 用户ID
   * @returns 用户信息
   */
  const getUserById = async (userId: number): Promise<Omit<User, 'password'> | null> => {
    try {
      const result = await UserIpcUtil.getUserById(userId)
      return result.success && result.data ? result.data : null
    } catch (err) {
      console.error('获取用户信息错误:', err)
      return null
    }
  }
  
  /**
   * 初始化用户状态（从本地存储恢复）
   */
  const initUser = () => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        currentUser.value = JSON.parse(savedUser)
      } catch (err) {
        console.error('恢复用户状态失败:', err)
        localStorage.removeItem('currentUser')
      }
    }
  }
  
  // ==================== 返回接口 ====================
  
  return {
    // 状态
    currentUser,
    users,
    loading,
    error,
    
    // 方法
    login,
    register,
    logout,
    updateUser,
    deleteUser,
    fetchUsers,
    getUserById,
    initUser
  }
}