/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 12:00:56
 * @FilePath: \EleTs\src\renderer\src\main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import './assets/main.css'
// 1. 首先导入 Tailwind 基础样式
import './assets/tailwind.css'
// 2. 然后导入设计系统样式（会覆盖部分 Tailwind 默认值）
import './assets/figma.css'
// 3. 最后导入自定义样式
import './assets/custom.css'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Ant Design Vue
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

import { router } from './router'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from './locales'
import App from './App.vue'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// 注册 Element Plus
app.use(ElementPlus)
// 注册 Ant Design Vue
app.use(Antd);
app.use(router)
app.use(i18n)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 监听全局快捷键事件
window.api.on('music:play-pause', () => {
  console.log('接收到播放/暂停快捷键')
  // 这里将在后续实现中添加播放/暂停逻辑
})

window.api.on('music:next', () => {
  console.log('接收到下一首快捷键')
  // 这里将在后续实现中添加下一首逻辑
})

window.api.on('music:previous', () => {
  console.log('接收到上一首快捷键')
  // 这里将在后续实现中添加上一首逻辑
})

window.api.on('music:volume-up', () => {
  console.log('接收到音量增加快捷键')
  // 这里将在后续实现中添加音量增加逻辑
})

window.api.on('music:volume-down', () => {
  console.log('接收到音量减少快捷键')
  // 这里将在后续实现中添加音量减少逻辑
})


app.mount('#app')
