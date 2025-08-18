<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-25 17:07:06
 * @FilePath: \EleTs\src\renderer\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

<script setup>
import TestPage from './view/TestPage/TestPage.vue';
import HomePage from './view/HomePage/HomePage.vue';
import WelcomeAnimation from './view/Components/Loader/WelcomeAnimation.vue';

const showWelcome = ref(true)

const handleWelcomeComplete = () => {
  showWelcome.value = false
}
</script>

<template>
    <!-- 开发模式，窗口空白部分隐藏 -->
    <!-- <div class="AppAll flex scroll-hidden "> -->
    <!-- 调试模式，窗口背景铺满 -->
    <div class="AppAll h-full w-full flex scroll-hidden bg-red-200">

      <!-- <TestPage id="Index-win" class="h-full w-full overflow-hidden drag_able "></TestPage> -->
      <WelcomeAnimation 
      v-if="showWelcome" 
      :onComplete="handleWelcomeComplete" 
      />
      <!-- <MainInterface v-else /> -->
      <HomePage v-else id="Index-win" class="h-full w-full overflow-hidden drag_notable"></HomePage>
    </div>

</template>


<style>
.drag_able{
  -webkit-app-region: drag
}
.drag_notable{
  -webkit-app-region: no-drag
}
</style>

<style scoped>

/* 确保 html 和 body 全屏 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.AppAll {
  width: 100vw;
  height: 100vh;
  /*background: #2d8cf0;*/
}
.scroll-hidden {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.scroll-hidden::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, and Opera */
}

</style>
