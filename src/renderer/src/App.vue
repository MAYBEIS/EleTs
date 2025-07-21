<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-21 17:14:09
 * @FilePath: \EleTs\src\renderer\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup>
import mainWin from './view/App/MainWin.vue'
import TestPage from './view/TestPage/TestPage.vue';
import HomePage from './view/HomePage/HomePage.vue';
</script>

<template>
    <!-- 开发模式，窗口空白部分隐藏 -->
    <!-- <div class="AppAll flex scroll-hidden "> -->
    <!-- 调试模式，窗口背景铺满 -->
    <div class="AppAll h-full w-full flex scroll-hidden bg-red-200">
      <!-- <mainWin id="Index-win" class="h-full w-full overflow-hidden drag_able"></mainWin> -->
      <!-- <HomePage id="Index-win" class="h-full w-full overflow-hidden drag_able"></HomePage> -->
      <TestPage id="Index-win" class="h-full w-full overflow-hidden drag_able "></TestPage>
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
