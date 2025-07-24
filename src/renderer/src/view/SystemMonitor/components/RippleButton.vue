<template>
  <button
    ref="buttonRef"
    @click="handleClick"
    :class="[
      'relative overflow-hidden transition-all duration-300 transform',
      'hover:scale-105 hover:shadow-lg active:scale-95',
      buttonClass
    ]"
    :disabled="disabled"
  >
    <!-- 涟漪效果 -->
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
      :style="{
        left: ripple.x + 'px',
        top: ripple.y + 'px',
        width: ripple.size + 'px',
        height: ripple.size + 'px',
        transform: 'translate(-50%, -50%)'
      }"
    ></span>

    <!-- 按钮内容 -->
    <span class="relative z-10 flex items-center justify-center space-x-2">
      <slot></slot>
    </span>

    <!-- 光晕效果 -->
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  rippleColor?: string
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  rippleColor: 'rgba(255, 255, 255, 0.3)'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonRef = ref<HTMLButtonElement | null>(null)
const ripples = ref<Ripple[]>([])
let rippleId = 0

const buttonClass = computed(() => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-500/30',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border border-gray-500/30',
    success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border border-green-500/30',
    warning: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border border-orange-500/30',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border border-red-500/30'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl'
  }

  return `${variants[props.variant]} ${sizes[props.size]} ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
})

const createRipple = (event: MouseEvent) => {
  const button = buttonRef.value
  if (!button) return

  const rect = button.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const size = Math.max(rect.width, rect.height) * 2

  const ripple: Ripple = {
    id: rippleId++,
    x,
    y,
    size
  }

  ripples.value.push(ripple)

  // 移除涟漪效果
  setTimeout(() => {
    const index = ripples.value.findIndex(r => r.id === ripple.id)
    if (index > -1) {
      ripples.value.splice(index, 1)
    }
  }, 600)
}

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return

  createRipple(event)
  emit('click', event)

  // 添加震动效果（如果支持）
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}
</script>

<style scoped>
@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 0.6s ease-out;
}

/* 按钮悬停时的光晕效果 */
.group:hover .absolute.inset-0 {
  animation: shimmer 1s ease-in-out;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(200%) skewX(-12deg);
  }
}

/* 按钮按下时的脉冲效果 */
button:active {
  animation: pulse 0.2s ease-in-out;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

/* 禁用状态 */
button:disabled {
  transform: none !important;
  box-shadow: none !important;
}

button:disabled:hover {
  transform: none !important;
}

/* 焦点状态 */
button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* 加载状态动画 */
.loading {
  position: relative;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
