import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = ref(false)
  
  // 方法
  const setUser = (user: UserInfo) => {
    userInfo.value = user
    isLoggedIn.value = true
  }
  
  const logout = () => {
    userInfo.value = null
    isLoggedIn.value = false
  }
  
  const updateUserInfo = (updates: Partial<UserInfo>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...updates }
    }
  }
  
  return {
    // 状态
    userInfo,
    isLoggedIn,
    // 方法
    setUser,
    logout,
    updateUserInfo
  }
})