/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:48:19
 * @FilePath: \EleTs\src\renderer\src\composables\useMusicPlayer.ts
 * @Description: 音乐播放器核心功能模块
 */

import { ref, watch } from 'vue'
import { Howl, Howler } from 'howler'
import { useMusicStore } from '../store/music'

// 定义音频对象引用
const audio = ref<Howl | null>(null)

// 获取音乐状态管理实例
const musicStore = useMusicStore()

// 播放音乐
export const play = () => {
  if (audio.value) {
    audio.value.play()
    musicStore.setPlaying(true)
  }
}

// 暂停音乐
export const pause = () => {
  if (audio.value) {
    audio.value.pause()
    musicStore.setPlaying(false)
  }
}

// 停止音乐
export const stop = () => {
  if (audio.value) {
    audio.value.stop()
    musicStore.setPlaying(false)
  }
}

// 设置音量
export const setVolume = (volume: number) => {
  if (audio.value) {
    audio.value.volume(volume / 100)
    musicStore.setVolume(volume)
  }
}

// 跳转到指定位置
export const seek = (position: number) => {
  if (audio.value) {
    audio.value.seek(position)
  }
}

// 加载音乐文件
export const loadTrack = (filePath: string) => {
  // 如果当前有正在播放的音频，先停止并卸载
  if (audio.value) {
    audio.value.unload()
  }
  
  // 创建新的 Howl 实例
  audio.value = new Howl({
    src: [filePath],
    html5: true, // 强制使用 HTML5 Audio，支持更多格式
    volume: musicStore.volume / 100,
    onplay: () => {
      // 开始播放时更新状态
      musicStore.setPlaying(true)
      updateProgress()
    },
    onpause: () => {
      // 暂停时更新状态
      musicStore.setPlaying(false)
    },
    onstop: () => {
      // 停止时更新状态
      musicStore.setPlaying(false)
    },
    onend: () => {
      // 播放结束时更新状态
      musicStore.setPlaying(false)
      // 可以在这里添加播放下一首的逻辑
    },
    onloaderror: (id, error) => {
      console.error('音频加载失败:', error)
    },
    onplayerror: (id, error) => {
      console.error('音频播放失败:', error)
    }
  })
  
  return audio.value
}

// 更新播放进度
const updateProgress = () => {
  if (audio.value && musicStore.isPlaying) {
    const progress = audio.value.seek() as number
    musicStore.setProgress(progress)
    
    // 每秒更新一次进度
    setTimeout(updateProgress, 1000)
  }
}

// 监听音量变化
watch(
  () => musicStore.volume,
  (newVolume) => {
    setVolume(newVolume)
  }
)

// 监听播放状态变化
watch(
  () => musicStore.isPlaying,
  (isPlaying) => {
    if (isPlaying) {
      play()
    } else {
      pause()
    }
  }
)

// 组件卸载时清理音频资源
export const unloadAudio = () => {
  if (audio.value) {
    audio.value.unload()
    audio.value = null
  }
}

// 导出所有功能
export const useMusicPlayer = () => {
  return {
    audio,
    play,
    pause,
    stop,
    setVolume,
    seek,
    loadTrack,
    unloadAudio
  }
}