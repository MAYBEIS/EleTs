/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:56:40
 * @FilePath: \EleTs\src\renderer\src\store\music.ts
 * @Description: 音乐播放器状态管理
 */

import { defineStore } from 'pinia'

// 定义音乐曲目接口
export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  filePath: string
  coverArt?: string
}

// 定义播放列表接口
export interface Playlist {
  id: string
  name: string
  tracks: Track[]
  createdAt: Date
}

// 定义播放状态接口
export interface PlaybackState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  progress: number
}

export const useMusicStore = defineStore('music', {
  state: (): PlaybackState => ({
    currentTrack: null,
    isPlaying: false,
    volume: 80,
    progress: 0
  }),
  
  actions: {
    setCurrentTrack(track: Track) {
      this.currentTrack = track
    },
    
    setPlaying(playing: boolean) {
      this.isPlaying = playing
    },
    
    setVolume(volume: number) {
      this.volume = Math.max(0, Math.min(100, volume))
    },
    
    setProgress(progress: number) {
      this.progress = progress
    },
    
    togglePlay() {
      this.isPlaying = !this.isPlaying
    },
    
    nextTrack() {
      // 这里将在后续实现中添加下一首歌曲的逻辑
      console.log('下一首')
    },
    
    previousTrack() {
      // 这里将在后续实现中添加上一首歌曲的逻辑
      console.log('上一首')
    }
  }
})