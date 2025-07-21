<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 17:23:13
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-21 17:48:17
 * @FilePath: \EleTs\src\renderer\src\view\Components\ComponentPage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import Button1 from './Button/Button1.vue';
import Button2 from './Button/Button2.vue';
</script>

<template>
    <div class="border-2 flex flex-col justify-center items-center"> 
        <!-- 自定义样式 -->
        <Button1 
          text="自定义按钮"
          color="#FF5497"
          hover-color="yellow"
          width="300px"
          height="60px"
          font-size="20px"
          animation-duration="0.5s"
        />

        <Button2 text="自定义文字" />
        
    </div>
</template>

<style lang="less"></style>
