<template>
  <div class="circular-progress" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="progress-ring">
      <!-- 背景圆环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="backgroundColor"
        :stroke-width="strokeWidth"
        class="progress-ring-background"
      />
      <!-- 进度圆环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        class="progress-ring-progress"
        :class="{ 'animate-progress': animated }"
        stroke-linecap="round"
        transform="rotate(-90)"
        :transform-origin="`${center} ${center}`"
      />
    </svg>
    
    <!-- 中心文本 -->
    <div class="progress-text" v-if="showText">
      <span class="progress-value" :style="{ color: strokeColor }">
        {{ displayValue }}
      </span>
      <span class="progress-unit" v-if="unit">{{ unit }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showText?: boolean
  unit?: string
  animated?: boolean
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  size: 64,
  strokeWidth: 4,
  color: 'blue',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  showText: true,
  unit: '%',
  animated: true,
  duration: 1000
})

// 计算属性
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const percentage = computed(() => {
  return Math.min(Math.max((props.value / props.max) * 100, 0), 100)
})

const strokeDashoffset = computed(() => {
  const progress = percentage.value / 100
  return circumference.value * (1 - progress)
})

const displayValue = computed(() => {
  if (props.unit === '%') {
    return Math.round(percentage.value)
  }
  return Math.round(props.value)
})

const strokeColor = computed(() => {
  const colors = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    red: '#EF4444',
    yellow: '#F59E0B',
    indigo: '#6366F1',
    pink: '#EC4899',
    gray: '#6B7280'
  }
  
  // 如果是预定义颜色，使用对应的颜色值
  if (colors[props.color as keyof typeof colors]) {
    return colors[props.color as keyof typeof colors]
  }
  
  // 否则直接使用传入的颜色值
  return props.color
})

// 动画相关
const animatedValue = ref(0)

const animateValue = (start: number, end: number) => {
  const startTime = performance.now()
  const duration = props.duration

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用缓动函数
    const easeOutCubic = 1 - Math.pow(1 - progress, 3)
    animatedValue.value = start + (end - start) * easeOutCubic

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}

watch(() => props.value, (newValue) => {
  if (props.animated) {
    animateValue(animatedValue.value, newValue)
  } else {
    animatedValue.value = newValue
  }
}, { immediate: true })
</script>

<style scoped>
.circular-progress {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-background {
  opacity: 0.3;
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-ring-progress.animate-progress {
  animation: progress-animation 1s ease-out;
}

.progress-text {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  text-align: center;
}

.progress-value {
  font-size: 0.875rem;
  line-height: 1;
}

.progress-unit {
  font-size: 0.625rem;
  opacity: 0.7;
  margin-top: 1px;
}

@keyframes progress-animation {
  0% {
    stroke-dashoffset: var(--circumference, 251.2);
  }
  100% {
    stroke-dashoffset: var(--final-offset);
  }
}

/* 响应式大小调整 */
.circular-progress[style*="width: 32px"] .progress-value {
  font-size: 0.625rem;
}

.circular-progress[style*="width: 32px"] .progress-unit {
  font-size: 0.5rem;
}

.circular-progress[style*="width: 48px"] .progress-value {
  font-size: 0.75rem;
}

.circular-progress[style*="width: 48px"] .progress-unit {
  font-size: 0.5rem;
}

.circular-progress[style*="width: 80px"] .progress-value {
  font-size: 1rem;
}

.circular-progress[style*="width: 80px"] .progress-unit {
  font-size: 0.75rem;
}

.circular-progress[style*="width: 96px"] .progress-value {
  font-size: 1.125rem;
}

.circular-progress[style*="width: 96px"] .progress-unit {
  font-size: 0.875rem;
}
</style>
