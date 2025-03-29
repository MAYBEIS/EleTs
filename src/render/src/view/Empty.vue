<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useStore } from '@render/store'

const store = useStore()
const ipcrender = window.electron.ipcrender

onMounted(async () => {
  // onMounted
})
</script>

<template>
  <div></div>
</template>

<style lang="less"></style>
