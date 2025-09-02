/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-01-12 12:13:32
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:40:22
 * @FilePath: \EleTs\src\renderer\src\router\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomePage from '../view/HomePage.vue'
import PlaylistPage from '../view/PlaylistPage.vue'
import SearchPage from '../view/SearchPage.vue'
import LibraryPage from '../view/LibraryPage.vue'
import TestPlayer from '../view/TestPlayer.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/playlist/:id',
    name: 'Playlist',
    component: PlaylistPage
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchPage
  },
  {
    path: '/library',
    name: 'Library',
    component: LibraryPage
  },
  {
    path: '/test',
    name: 'Test',
    component: TestPlayer
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})
