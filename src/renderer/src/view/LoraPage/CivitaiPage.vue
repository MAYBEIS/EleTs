<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-22 17:41:25
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-22 17:44:55
 * @FilePath: \EleTs\src\renderer\src\view\LoraPage\CivitaiPage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useStore } from '@renderer/store'

const store = useStore()
const ipcRenderer = window.electron.ipcRenderer

onMounted(async () => {
  // onMounted
})
</script>

<template>
  <div>Empty Vue !!</div>
</template>

<style lang="less"></style>
