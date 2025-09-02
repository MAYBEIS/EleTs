<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02
 * @FilePath: \EleTs\src\renderer/src/view/TestPlayer.vue
 * @Description: 音乐播放器测试页面
-->
<template>
  <div class="test-player">
    <h1>音乐播放器测试</h1>
    
    <div class="test-section">
      <h2>测试音频播放</h2>
      <a-button type="primary" @click="playTestAudio">播放测试音频</a-button>
      <a-button @click="pauseAudio" :disabled="!isPlaying">暂停</a-button>
      <a-button @click="stopAudio">停止</a-button>
    </div>
    
    <div class="test-section">
      <h2>音量控制</h2>
      <a-slider
        v-model:value="volume"
        :min="0"
        :max="100"
        @change="onVolumeChange"
      />
      <span>音量: {{ volume }}%</span>
    </div>
    
    <div class="test-section">
      <h2>播放进度</h2>
      <a-slider
        v-model:value="progress"
        :min="0"
        :max="duration"
        @change="onProgressChange"
      />
      <div>进度: {{ formatTime(progress) }} / {{ formatTime(duration) }}</div>
    </div>
    
    <div class="status">
      <h3>播放状态</h3>
      <p>当前曲目: {{ currentTrack?.title || '无' }}</p>
      <p>播放状态: {{ isPlaying ? '播放中' : '已暂停' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMusicStore } from '../store/music'
import { useMusicPlayer } from '../composables/useMusicPlayer'

const musicStore = useMusicStore()
const { play, pause, stop, setVolume, seek, loadTrack } = useMusicPlayer()

// 计算属性
const currentTrack = computed(() => musicStore.currentTrack)
const isPlaying = computed(() => musicStore.isPlaying)
const progress = computed({
  get: () => musicStore.progress,
  set: (value) => musicStore.setProgress(value)
})

// 本地状态
const volume = ref(80)
const duration = ref(100)

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 播放测试音频
const playTestAudio = () => {
  // 设置测试曲目
  const testTrack = {
    id: 'test-001',
    title: '测试音频',
    artist: '测试艺术家',
    album: '测试专辑',
    duration: 100,
    filePath: '/test-audio.mp3',
    coverArt: '/placeholder-50.png'
  }
  
  musicStore.setCurrentTrack(testTrack)
  loadTrack('/test-audio.mp3')
  play()
}

// 暂停音频
const pauseAudio = () => {
  pause()
}

// 停止音频
const stopAudio = () => {
  stop()
}

// 音量变化
const onVolumeChange = (value: number) => {
  setVolume(value)
}

// 进度变化
const onProgressChange = (value: number) => {
  seek(value)
}

// 组件挂载时设置初始音量
onMounted(() => {
  setVolume(volume.value)
})
</script>

<style scoped>
.test-player {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 32px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.test-section h2 {
  margin-top: 0;
}

.status {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
}

.status p {
  margin: 8px 0;
}
</style>