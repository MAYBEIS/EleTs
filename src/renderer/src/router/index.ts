/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-01-12 12:13:32
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-21 22:01:40
 * @FilePath: \EleTs\src\renderer\src\router\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import CivitaiPage from '../view/LoraPage/CivitaiPage.vue'
import ModelDetailPage from '../view/LoraPage/ModelDetailPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/civitai'
  },
  {
    path: '/civitai',
    name: 'Civitai',
    component: CivitaiPage
  },
  {
    path: '/model/:id',
    name: 'ModelDetail',
    component: ModelDetailPage,
    props: true
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})
