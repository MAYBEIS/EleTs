<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:49:14
 * @FilePath: \EleTs\src\renderer\src\components\PlayerControls.vue
 * @Description: 播放控制组件
-->
<template>
  <div class="player-controls">
    <div class="track-info" v-if="currentTrack">
      <a-avatar :src="currentTrack.coverArt || '/placeholder-50.png'" :size="50" />
      <div class="track-details">
        <div class="track-title">{{ currentTrack.title }}</div>
        <div class="track-artist">{{ currentTrack.artist }}</div>
      </div>
    </div>
    
    <div class="control-buttons">
      <a-button type="text" @click="previousTrack">
        <template #icon>
          <StepBackwardOutlined />
        </template>
      </a-button>
      
      <a-button type="primary" shape="circle" @click="togglePlay">
        <template #icon>
          <PauseOutlined v-if="isPlaying" />
          <PlayCircleOutlined v-else />
        </template>
      </a-button>
      
      <a-button type="text" @click="nextTrack">
        <template #icon>
          <StepForwardOutlined />
        </template>
      </a-button>
    </div>
    
    <div class="progress-controls">
      <span class="time">{{ formatTime(progress) }}</span>
      <a-slider
        v-model:value="progress"
        :max="currentTrack ? currentTrack.duration : 100"
        @change="onProgressChange"
        class="progress-slider"
      />
      <span class="time">{{ currentTrack ? formatTime(currentTrack.duration) : '0:00' }}</span>
    </div>
    
    <div class="volume-controls">
      <a-button type="text" @click="toggleMute">
        <template #icon>
          <SoundOutlined v-if="!isMuted" />
          <AudioMutedOutlined v-else />
        </template>
      </a-button>
      <a-slider
        v-model:value="volume"
        :max="100"
        @change="onVolumeChange"
        class="volume-slider"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  PlayCircleOutlined,
  PauseOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  AudioMutedOutlined
} from '@ant-design/icons-vue'
import { useMusicStore } from '../store/music'
import { useMusicPlayer } from '../composables/useMusicPlayer'

const musicStore = useMusicStore()
const { play, pause, setVolume, seek, unloadAudio } = useMusicPlayer()

// 计算属性
const currentTrack = computed(() => musicStore.currentTrack)
const isPlaying = computed(() => musicStore.isPlaying)
const progress = computed({
  get: () => musicStore.progress,
  set: (value) => musicStore.setProgress(value)
})
const volume = computed({
  get: () => musicStore.volume,
  set: (value) => musicStore.setVolume(value)
})

// 本地状态
const isMuted = ref(false)
const previousVolume = ref(80)

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 切换播放/暂停
const togglePlay = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

// 上一首
const previousTrack = () => {
  musicStore.previousTrack()
}

// 下一首
const nextTrack = () => {
  musicStore.nextTrack()
}

// 切换静音
const toggleMute = () => {
  if (isMuted.value) {
    // 取消静音
    setVolume(previousVolume.value)
    isMuted.value = false
  } else {
    // 静音
    previousVolume.value = volume.value
    setVolume(0)
    isMuted.value = true
  }
}

// 进度条变化
const onProgressChange = (value: number) => {
  seek(value)
}

// 音量变化
const onVolumeChange = (value: number) => {
  setVolume(value)
  if (value > 0 && isMuted.value) {
    isMuted.value = false
  }
}

// 监听当前曲目变化
watch(
  () => musicStore.currentTrack,
  (newTrack) => {
    if (newTrack && newTrack.filePath) {
      // 加载新曲目
      // loadTrack(newTrack.filePath)
      console.log('加载曲目:', newTrack.filePath)
    }
  }
)

// 组件卸载时清理
onUnmounted(() => {
  unloadAudio()
})
</script>

<style scoped>
.player-controls {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-top: 1px solid #e8e8e8;
}

.track-info {
  display: flex;
  align-items: center;
  width: 200px;
}

.track-details {
  margin-left: 12px;
  overflow: hidden;
}

.track-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.control-buttons {
  display: flex;
  align-items: center;
  margin: 0 24px;
}

.control-buttons .ant-btn {
  margin: 0 8px;
}

.progress-controls {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 500px;
}

.progress-slider {
  margin: 0 12px;
}

.time {
  font-size: 12px;
  color: #666;
  width: 40px;
  text-align: center;
}

.volume-controls {
  display: flex;
  align-items: center;
  width: 150px;
  margin-left: 24px;
}

.volume-slider {
  margin: 0 12px;
  flex: 1;
}
</style>