/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-21
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-21 11:14:00
 * @FilePath: \EleTs\src\renderer\src\services\playlistService.ts
 * @Description: 播放列表服务，用于管理播放列表的持久化存储
 */

import type { Playlist, Track } from '../store/music'

// 模拟播放列表存储
let playlists: Playlist[] = []

// 初始化播放列表存储
export const initPlaylistStorage = () => {
  // 从localStorage加载播放列表
  const storedPlaylists = localStorage.getItem('music-playlists')
  if (storedPlaylists) {
    try {
      playlists = JSON.parse(storedPlaylists)
      // 转换日期字符串为Date对象
      playlists = playlists.map(playlist => ({
        ...playlist,
        createdAt: new Date(playlist.createdAt)
      }))
    } catch (error) {
      console.error('解析播放列表数据失败:', error)
      playlists = []
    }
  } else {
    // 初始化默认播放列表
    playlists = [
      {
        id: 'default-1',
        name: '我喜欢的音乐',
        tracks: [],
        createdAt: new Date()
      }
    ]
    savePlaylists()
  }
}

// 保存播放列表到localStorage
const savePlaylists = () => {
  try {
    localStorage.setItem('music-playlists', JSON.stringify(playlists))
  } catch (error) {
    console.error('保存播放列表数据失败:', error)
  }
}

// 获取所有播放列表
export const getPlaylists = (): Playlist[] => {
  return [...playlists]
}

// 根据ID获取播放列表
export const getPlaylistById = (id: string): Playlist | undefined => {
  return playlists.find(playlist => playlist.id === id)
}

// 添加播放列表
export const addPlaylist = (playlist: Playlist): void => {
  playlists.push(playlist)
  savePlaylists()
}

// 更新播放列表
export const updatePlaylist = (playlist: Playlist): void => {
  const index = playlists.findIndex(p => p.id === playlist.id)
  if (index !== -1) {
    playlists[index] = playlist
    savePlaylists()
  }
}

// 删除播放列表
export const deletePlaylist = (id: string): void => {
  playlists = playlists.filter(playlist => playlist.id !== id)
  savePlaylists()
}

// 向播放列表添加歌曲
export const addTrackToPlaylist = (playlistId: string, track: Track): void => {
  const playlist = playlists.find(p => p.id === playlistId)
  if (playlist) {
    playlist.tracks.push(track)
    savePlaylists()
  }
}

// 从播放列表移除歌曲
export const removeTrackFromPlaylist = (playlistId: string, trackId: string): void => {
  const playlist = playlists.find(p => p.id === playlistId)
  if (playlist) {
    playlist.tracks = playlist.tracks.filter(track => track.id !== trackId)
    savePlaylists()
  }
}

// 初始化存储
initPlaylistStorage()