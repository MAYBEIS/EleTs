<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 16:02:50
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-05-25 11:28:32
 * @FilePath: \EleTs\src\renderer\src\view\App\MainWin.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="main-container">
    <header class="app-header">
      <h1>电子测试应用</h1>
      <div class="version-info">版本: {{ v1 }}</div>
    </header>

    <nav class="main-nav">
      <Button1 @click="openPage('Page1')">页面1</Button1>
      <Button1 @click="openPage('Page2')">页面2</Button1>
      <Button1 @click="openPage('TestPage')">测试页面</Button1>
      <Button1 @click="openPage('ToolBox')">工具箱</Button1>
    </nav>

    <div class="status-bar">
      <div>当前时间: {{ currentTime }}</div>
      <div>状态: 就绪</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Button1 from '../Components/Button1.vue'

const ipcrender = window.electron.ipcRenderer
const v1 = ref("")
const currentTime = ref(new Date().toLocaleTimeString())

let timer: NodeJS.Timeout

onMounted(async () => {
  try {
    v1.value = await ipcrender.invoke("W-version-1.1")
  } catch (error) {
    console.error('IPC调用失败:', error)
    v1.value = "调用失败"
  }

  // 更新时间
  timer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

function openPage(pageName: string) {
  ipcrender.send('navigate-to', pageName)
}
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.main-nav {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.status-bar {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #eee;
  font-size: 0.9em;
  color: #666;
}
</style>