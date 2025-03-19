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
  <div></div>
</template>

<style lang="less"></style>
