/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 12:55:00
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
  playlist: Track[]
  currentIndex: number
}

export const useMusicStore = defineStore('music', {
  state: (): PlaybackState => ({
    currentTrack: null,
    isPlaying: false,
    volume: 80,
    progress: 0,
    playlist: [],
    currentIndex: -1
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
    
    setPlaylist(playlist: Track[]) {
      this.playlist = playlist
      this.currentIndex = -1
    },
    
    setCurrentIndex(index: number) {
      this.currentIndex = index
      if (index >= 0 && index < this.playlist.length) {
        this.currentTrack = this.playlist[index]
      }
    },
    
    togglePlay() {
      this.isPlaying = !this.isPlaying
    },
    
    nextTrack() {
      if (this.playlist.length > 0) {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length
        this.currentTrack = this.playlist[this.currentIndex]
        this.isPlaying = true
      }
      console.log('下一首')
    },
    
    previousTrack() {
      if (this.playlist.length > 0) {
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length
        this.currentTrack = this.playlist[this.currentIndex]
        this.isPlaying = true
      }
      console.log('上一首')
    },
    
    addToPlaylist(track: Track) {
      this.playlist.push(track)
    },
    
    removeFromPlaylist(index: number) {
      if (index >= 0 && index < this.playlist.length) {
        this.playlist.splice(index, 1)
        if (this.currentIndex >= index) {
          this.currentIndex = Math.max(0, this.currentIndex - 1)
        }
      }
    },
    
    clearPlaylist() {
      this.playlist = []
      this.currentIndex = -1
      this.currentTrack = null
    },
    
    // 播放列表管理功能
    addTrackToPlaylist(track: Track) {
      this.playlist.push(track)
    },
    
    removeTrackFromPlaylist(index: number) {
      if (index >= 0 && index < this.playlist.length) {
        this.playlist.splice(index, 1)
        if (this.currentIndex >= index) {
          this.currentIndex = Math.max(0, this.currentIndex - 1)
        }
      }
    },
    
    moveTrackInPlaylist(fromIndex: number, toIndex: number) {
      if (fromIndex >= 0 && fromIndex < this.playlist.length &&
          toIndex >= 0 && toIndex < this.playlist.length) {
        const track = this.playlist.splice(fromIndex, 1)[0]
        this.playlist.splice(toIndex, 0, track)
        
        // 更新当前索引
        if (this.currentIndex === fromIndex) {
          this.currentIndex = toIndex
        } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
          this.currentIndex--
        } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
          this.currentIndex++
        }
      }
    },
    
    // 播放列表管理
    getPlaylists(): Playlist[] {
      // 在实际应用中，这将从存储中获取播放列表
      return []
    },
    
    addPlaylist(playlist: Playlist) {
      // 在实际应用中，这将添加播放列表到存储
      console.log('添加播放列表:', playlist)
    },
    
    updatePlaylist(playlist: Playlist) {
      // 在实际应用中，这将更新存储中的播放列表
      console.log('更新播放列表:', playlist)
    },
    
    deletePlaylist(id: string) {
      // 在实际应用中，这将从存储中删除播放列表
      console.log('删除播放列表:', id)
    }
  }
})