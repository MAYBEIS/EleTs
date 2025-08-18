<template>
  <div 
    v-if="visible" 
    class="fixed inset-0 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center z-50"
  >
    <div class="text-center">
      <div 
        class="mb-8"
        :style="logoStyle"
      >
        <div class="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl">
          <div 
            class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            :style="spinnerStyle"
          />
        </div>
      </div>

      <h1 
        class="text-white mb-4"
        :style="titleStyle"
      >
        欢迎使用桌面程序
      </h1>

      <div 
        class="text-white/80 mb-8"
        :style="subtitleStyle"
      >
        正在加载您的工作空间...
      </div>

      <div 
        class="h-1 bg-white/30 rounded-full mx-auto overflow-hidden"
        :style="progressBarStyle"
      >
        <div 
          class="h-full bg-white rounded-full"
          :style="progressFillStyle"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  onComplete: () => void
}

const props = defineProps<Props>()

const visible = ref(true)
const animationStep = ref(0)
const animationFrame = ref<number>()

const logoStyle = computed(() => ({
  transform: `scale(${Math.min(1, animationStep.value / 50)}) rotate(${animationStep.value * 3.6}deg)`,
  opacity: Math.min(1, animationStep.value / 25),
  transition: 'all 0.1s ease-out'
}))

const spinnerStyle = computed(() => ({
  transform: `rotate(${animationStep.value * 7.2}deg)`,
  transition: 'transform 0.1s linear'
}))

const titleStyle = computed(() => ({
  opacity: Math.max(0, Math.min(1, (animationStep.value - 25) / 25)),
  transform: `translateY(${Math.max(0, 50 - (animationStep.value - 25) * 2)}px)`,
  transition: 'all 0.1s ease-out'
}))

const subtitleStyle = computed(() => ({
  opacity: Math.max(0, Math.min(1, (animationStep.value - 50) / 25)),
  transform: `translateY(${Math.max(0, 30 - (animationStep.value - 50) * 1.2)}px)`,
  transition: 'all 0.1s ease-out'
}))

const progressBarStyle = computed(() => ({
  width: `${Math.min(200, Math.max(0, (animationStep.value - 75) * 8))}px`,
  transition: 'width 0.1s ease-out'
}))

const progressFillStyle = computed(() => ({
  width: `${Math.min(100, Math.max(0, (animationStep.value - 90) * 10))}%`,
  transition: 'width 0.1s ease-out'
}))

const animate = () => {
  animationStep.value += 1
  
  if (animationStep.value < 150) {
    animationFrame.value = requestAnimationFrame(animate)
  } else {
    setTimeout(() => {
      visible.value = false
      props.onComplete()
    }, 500)
  }
}

onMounted(() => {
  animationFrame.value = requestAnimationFrame(animate)
})

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
})
</script>
