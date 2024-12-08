<script setup>
import mainWin from './view/mainWin.vue'
</script>

<template>
    <!-- 开发模式，窗口空白部分隐藏 -->
    <!-- <div class="AppAll flex scroll-hidden "> -->
    <!-- 调试模式，窗口背景铺满 -->
    <div class="AppAll h-full w-full flex scroll-hidden bg-yellow-500">
      <mainWin id="Index-win" class="h-full w-full overflow-hidden drag_able"></mainWin>
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
