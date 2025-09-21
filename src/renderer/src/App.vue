<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 12:49:36
 * @FilePath: \EleTs\src\renderer\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 -->

<script setup>
import { RouterView } from 'vue-router'
import WelcomeAnimation from './view/Components/Loader/WelcomeAnimation.vue';
import CivitaiPage from './view/LoraPage/CivitaiPage.vue';


const showWelcome = ref(true)

const handleWelcomeComplete = () => {
  showWelcome.value = false
}
import SystemMonitorLayout from './view/SystemMonitor/SystemMonitorLayout.vue';

</script>

<template>
  <!-- 开发模式，窗口空白部分隐藏 -->
  <!-- <div class="AppAll flex scroll-hidden "> -->
  <!-- 调试模式，窗口背景铺满 -->
  <div class="AppAll h-full w-full flex scroll-hidden">
    <!-- <SystemMonitorLayout id="Index-win" class="h-full w-full overflow-hidden drag_notable"></SystemMonitorLayout> -->
    <SystemMonitorLayout id="Index-win" class="h-full w-full overflow-hidden drag_notable"></SystemMonitorLayout>
  </div>
</template>

<style>
.app-layout {
  height: 100vh;
}

.logo {
  height: 32px;
  margin: 16px;
  color: white;
  text-align: center;
}

.header {
  background: #fff;
  padding: 0;
  display: flex;
  align-items: center;
}

.content {
  margin: 24px 16px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
  overflow: auto;
}

/* 确保 html 和 body 全屏 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.scroll-hidden {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.scroll-hidden::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, and Opera */
}
</style>
