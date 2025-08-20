/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-25 10:48:56
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

import { router } from './router'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from './locales'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 注册 Element Plus
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')




