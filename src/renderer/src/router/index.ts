import { createRouter, createWebHashHistory } from 'vue-router'
import { Component } from 'vue'

const routes = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    name: 'index',
    component: (): Promise<Component> => import('../view/App/MainWin.vue')
  },
  {
    path: '/toolbox',
    name: 'toolbox',
    component: (): Promise<Component> => import('../view/ToolBox/ToolBoxMain.vue')
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes: routes
})
