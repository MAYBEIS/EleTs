<template>
    <div>1223123</div>
    <div>{{ v1 }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const ipcrender = window.electron.ipcrender
const v1 = ref("")

onMounted(async () => {
  try {
    v1.value = await ipcrender.invoke("W-version-1.1")
  } catch (error) {
    console.error('IPC调用失败:', error)
    v1.value = "调用失败"
  }
})
</script>

<style scoped>
</style>