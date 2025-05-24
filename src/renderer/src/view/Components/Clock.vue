<template>
  <div class="clock-container">
    <!-- 数字时钟 -->
    <div class="digital-clock">
      {{ hours }}:{{ minutes }}:{{ seconds }}
    </div>
    
    <!-- 模拟时钟 -->
    <div class="analog-clock">
      <div class="clock-face">
        <!-- 时钟刻度 -->
        <div v-for="n in 12" :key="n" class="hour-marker"
          :style="{ transform: 'rotate(' + (n * 30) + 'deg)' }">
          <div class="marker"></div>
        </div>
        
        <!-- 时针、分针、秒针 -->
        <div class="hand hour" :style="{ transform: 'rotate(' + hourDegrees + 'deg)' }"></div>
        <div class="hand minute" :style="{ transform: 'rotate(' + minuteDegrees + 'deg)' }"></div>
        <div class="hand second" :style="{ transform: 'rotate(' + secondDegrees + 'deg)' }"></div>
        
        <!-- 中心点 -->
        <div class="center-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineComponent } from 'vue'

// 时间数据
const hours = ref('00')
const minutes = ref('00')
const seconds = ref('00')
const hourDegrees = ref(0)
const minuteDegrees = ref(0)
const secondDegrees = ref(0)

// 更新时间的函数
const updateTime = () => {
  const now = new Date()
  
  // 更新数字时钟
  hours.value = now.getHours().toString().padStart(2, '0')
  minutes.value = now.getMinutes().toString().padStart(2, '0')
  seconds.value = now.getSeconds().toString().padStart(2, '0')
  
  // 更新模拟时钟
  secondDegrees.value = now.getSeconds() * 6
  minuteDegrees.value = now.getMinutes() * 6 + now.getSeconds() * 0.1
  hourDegrees.value = now.getHours() * 30 + now.getMinutes() * 0.5
}

let timer: NodeJS.Timeout

// 组件挂载时启动定时器
onMounted(() => {
  updateTime() // 立即执行一次
  timer = setInterval(updateTime, 1000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  clearInterval(timer)
})

</script>

<style scoped>
.clock-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.digital-clock {
  font-size: 2.5rem;
  font-family: 'Courier New', monospace;
  color: #333;
  background: #f5f5f5;
  padding: 10px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.analog-clock {
  width: 200px;
  height: 200px;
  position: relative;
}

.clock-face {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  background: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.hour-marker {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.marker {
  position: absolute;
  width: 2px;
  height: 10px;
  background: #333;
  left: 50%;
  top: 5px;
  transform: translateX(-50%);
}

.hand {
  position: absolute;
  bottom: 50%;
  left: 50%;
  transform-origin: bottom;
  background: #333;
  border-radius: 4px;
}

.hour {
  width: 4px;
  height: 30%;
  background: #333;
}

.minute {
  width: 3px;
  height: 40%;
  background: #666;
}

.second {
  width: 2px;
  height: 45%;
  background: #f00;
}

.center-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #333;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
