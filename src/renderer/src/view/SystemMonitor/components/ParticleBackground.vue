<template>
  <div class="particle-background">
    <canvas ref="canvasRef" class="particle-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  life: number
  maxLife: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let animationId: number | null = null
let mouseX = 0
let mouseY = 0

const colors = [
  'rgba(59, 130, 246, 0.6)',   // blue
  'rgba(16, 185, 129, 0.6)',   // green
  'rgba(139, 92, 246, 0.6)',   // purple
  'rgba(245, 158, 11, 0.6)',   // orange
  'rgba(239, 68, 68, 0.6)',    // red
  'rgba(236, 72, 153, 0.6)'    // pink
]

const createParticle = (x?: number, y?: number): Particle => {
  const canvas = canvasRef.value
  if (!canvas) return {} as Particle

  return {
    x: x ?? Math.random() * canvas.width,
    y: y ?? Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.5 + 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 0,
    maxLife: Math.random() * 200 + 100
  }
}

const updateParticles = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  particles.forEach((particle, index) => {
    // 更新位置
    particle.x += particle.vx
    particle.y += particle.vy

    // 更新生命周期
    particle.life++

    // 边界检测和反弹
    if (particle.x <= 0 || particle.x >= canvas.width) {
      particle.vx *= -1
    }
    if (particle.y <= 0 || particle.y >= canvas.height) {
      particle.vy *= -1
    }

    // 鼠标交互 - 粒子被鼠标吸引
    const dx = mouseX - particle.x
    const dy = mouseY - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 100) {
      const force = (100 - distance) / 100
      particle.vx += (dx / distance) * force * 0.1
      particle.vy += (dy / distance) * force * 0.1
    }

    // 限制速度
    const maxSpeed = 3
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
    if (speed > maxSpeed) {
      particle.vx = (particle.vx / speed) * maxSpeed
      particle.vy = (particle.vy / speed) * maxSpeed
    }

    // 透明度变化
    const lifeRatio = particle.life / particle.maxLife
    if (lifeRatio > 0.8) {
      particle.opacity = (1 - lifeRatio) * 5 * 0.5
    }

    // 移除死亡的粒子
    if (particle.life >= particle.maxLife || particle.opacity <= 0) {
      particles.splice(index, 1)
    }
  })

  // 减少粒子数量以提高性能
  while (particles.length < 25) {
    particles.push(createParticle())
  }
}

const drawParticles = () => {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制粒子
  particles.forEach(particle => {
    ctx.save()
    ctx.globalAlpha = particle.opacity
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  // 绘制连接线
  particles.forEach((particle, i) => {
    particles.slice(i + 1).forEach(otherParticle => {
      const dx = particle.x - otherParticle.x
      const dy = particle.y - otherParticle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 80) {
        ctx.save()
        ctx.globalAlpha = (80 - distance) / 80 * 0.2
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(otherParticle.x, otherParticle.y)
        ctx.stroke()
        ctx.restore()
      }
    })
  })
}

const animate = () => {
  updateParticles()
  drawParticles()
  animationId = requestAnimationFrame(animate)
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

const handleMouseMove = (event: MouseEvent) => {
  mouseX = event.clientX
  mouseY = event.clientY
}

const handleClick = (event: MouseEvent) => {
  // 在点击位置创建爆炸效果
  for (let i = 0; i < 10; i++) {
    const particle = createParticle(event.clientX, event.clientY)
    particle.vx = (Math.random() - 0.5) * 10
    particle.vy = (Math.random() - 0.5) * 10
    particle.size = Math.random() * 5 + 2
    particle.opacity = 0.8
    particles.push(particle)
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  ctx = canvas.getContext('2d')
  if (!ctx) return

  resizeCanvas()

  // 减少初始粒子数量
  for (let i = 0; i < 25; i++) {
    particles.push(createParticle())
  }

  // 开始动画
  animate()

  // 添加事件监听器
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('click', handleClick)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('click', handleClick)
})
</script>

<style scoped>
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.particle-canvas {
  width: 100%;
  height: 100%;
}
</style>
