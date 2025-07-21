/*
 * @Description: Maybe编写
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
export { useAppStore } from './app'
export { useUserStore } from './user'


export const useStore = defineStore('main', {
  state: () => ({
    count: 0, // Pinia 实例变量
    themeMode: 'light', // 主题模式
    primary: '#FF7692', // FF5497, FF8F1F
    loadingAppInit: true, // 加载状态
    SFW: false, // 是否开启 SFW 模式
    preciseDependenciesMode: false, // 是否开启精确依赖模式
    menuDisabled: false, // 是否禁用菜单
    networkError: false, // 是否是离线状态
    startVaMPath: '', // VaM 启动路径
    broadcast: {
      message: '',
      count: 0,
      sleep: 50 //ms
    },
    loadingUpdatePackage: false, // 更新资源包时的加载状态
    downloadVarDependencyPackages: [] as string[], // 依赖下载页面的包名
    currentView: '' as string // 当前页面视图
  }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    },
    setThemeMode(themeMode: string) {
      this.themeMode = themeMode
    },
    setSFW(SFW: boolean) {
      this.SFW = SFW
    },
    setPreciseDependenciesMode(preciseDependenciesMode: boolean) {
      this.preciseDependenciesMode = preciseDependenciesMode
    },
    setMenuDisabled(menuDisabled: boolean) {
      this.menuDisabled = menuDisabled
    },
    setNetworkError(networkError: boolean) {
      this.networkError = networkError
    },
    setStartVaMPath(startVaMPath: string) {
      this.startVaMPath = startVaMPath
    },
    setLoadingUpdatePackage(value: boolean) {
      this.loadingUpdatePackage = value
    },
    broadcastMessage(message: string) {
      // 广播消息
      this.broadcast.message = message
      this.broadcast.count++
    }
  }
})