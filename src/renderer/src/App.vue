<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-24 12:18:00
 * @FilePath: \EleTs\src\renderer\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

<script setup>
import SystemMonitorLayout from './view/SystemMonitor/SystemMonitorLayout.vue';
</script>

<template>
    <div class="AppAll h-full w-full flex scroll-hidden">
      <!-- <SystemMonitorLayout id="Index-win" class="h-full w-full overflow-hidden drag_notable"></SystemMonitorLayout> -->
    <SystemMonitorLayout id="Index-win" class="h-full w-full overflow-hidden drag_notable"></SystemMonitorLayout>
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
