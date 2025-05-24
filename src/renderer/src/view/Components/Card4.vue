<script setup lang="ts">
import { ref, computed } from 'vue'

// Props 定义
interface Props {
  title?: string
  loadingText?: string
  showControls?: boolean
  theme?: 'dark' | 'light'
}

// 默认值设置
const props = withDefaults(defineProps<Props>(), {
  title: 'Status',
  loadingText: 'Loading...',
  showControls: true,
  theme: 'dark'
})

// Emits 定义
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'minimize'): void
  (e: 'maximize'): void
  (e: 'textChange', text: string): void
}>()

// 响应式状态
const isMinimized = ref(false)

// 计算属性
const terminalClass = computed(() => ({
  'terminal-loader': true,
  'terminal-loader--light': props.theme === 'light'
}))

// 事件处理函数
const handleClose = () => emit('close')
const handleMinimize = () => {
  isMinimized.value = !isMinimized.value
  emit('minimize')
}
const handleMaximize = () => emit('maximize')
</script>

<template>
  <div :class="terminalClass">
    <div class="terminal-header">
      <div class="terminal-title">{{ title }}</div>
      <div v-if="showControls" class="terminal-controls">
        <div class="control close" @click="handleClose"></div>
        <div class="control minimize" @click="handleMinimize"></div>
        <div class="control maximize" @click="handleMaximize"></div>
      </div>
    </div>
    <div class="text">{{ loadingText }}</div>
  </div>
</template>

<style scoped>
  @keyframes blinkCursor {
    50% {
      border-right-color: transparent;
    }
  }

  @keyframes typeAndDelete {
    0%,
    10% {
      width: 0;
    }
    45%,
    55% {
      width: 6.2em;
    } /* adjust width based on content */
    90%,
    100% {
      width: 0;
    }
  }

  .terminal-loader {
    border: 0.1em solid #333;
    background-color: #1a1a1a;
    color: #0f0;
    font-family: "Courier New", Courier, monospace;
    font-size: 1em;
    padding: 1.5em 1em;
    width: 12em;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }

  .terminal-loader--light {
    background-color: #f5f5f5;
    border-color: #ddd;
    color: #333;
  }

  .terminal-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1.5em;
    background-color: #333;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    padding: 0 0.4em;
    box-sizing: border-box;
  }

  .terminal-controls {
    float: right;
    cursor: pointer;
  }

  .control {
    display: inline-block;
    width: 0.6em;
    height: 0.6em;
    margin-left: 0.4em;
    border-radius: 50%;
    background-color: #777;
    transition: transform 0.2s ease;
  }

  .control:hover {
    transform: scale(1.1);
  }

  .control.close {
    background-color: #e33;
  }

  .control.minimize {
    background-color: #ee0;
  }

  .control.maximize {
    background-color: #0b0;
  }

  .terminal-title {
    float: left;
    line-height: 1.5em;
    color: #eee;
  }

  .text {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    border-right: 0.2em solid currentColor;
    animation:
      typeAndDelete 4s steps(11) infinite,
      blinkCursor 0.5s step-end infinite alternate;
    margin-top: 1.5em;
  }
</style>
