/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-21
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-21 11:19:00
 * @FilePath: \EleTs\src\renderer\src\services\recommendationService.ts
 * @Description: 音乐推荐服务，用于提供推荐内容
 */

// 推荐歌单数据结构
export interface RecommendedPlaylist {
  id: string
  name: string
  coverArt: string
  trackCount: number
}

// 推荐艺术家数据结构
export interface RecommendedArtist {
  id: string
  name: string
  avatar: string
  followers: number
}

// 推荐专辑数据结构
export interface RecommendedAlbum {
  id: string
  name: string
  artist: string
  coverArt: string
  releaseDate: string
}

// 获取推荐歌单
export const getRecommendedPlaylists = (): RecommendedPlaylist[] => {
  return [
    {
      id: 'rec-1',
      name: '流行音乐',
      coverArt: '/placeholder-300x200.png',
      trackCount: 20
    },
    {
      id: 'rec-2',
      name: '摇滚经典',
      coverArt: '/placeholder-300x200.png',
      trackCount: 15
    },
    {
      id: 'rec-3',
      name: '电子音乐',
      coverArt: '/placeholder-300x200.png',
      trackCount: 18
    },
    {
      id: 'rec-4',
      name: '古典音乐',
      coverArt: '/placeholder-300x200.png',
      trackCount: 12
    },
    {
      id: 'rec-5',
      name: '爵士乐',
      coverArt: '/placeholder-300x200.png',
      trackCount: 16
    },
    {
      id: 'rec-6',
      name: '民谣精选',
      coverArt: '/placeholder-300x200.png',
      trackCount: 14
    }
  ]
}

// 获取推荐艺术家
export const getRecommendedArtists = (): RecommendedArtist[] => {
  return [
    {
      id: 'artist-1',
      name: '周杰伦',
      avatar: '/placeholder-100.png',
      followers: 15000000
    },
    {
      id: 'artist-2',
      name: '林俊杰',
      avatar: '/placeholder-100.png',
      followers: 8000000
    },
    {
      id: 'artist-3',
      name: '陈奕迅',
      avatar: '/placeholder-100.png',
      followers: 12000000
    },
    {
      id: 'artist-4',
      name: '邓紫棋',
      avatar: '/placeholder-100.png',
      followers: 6000000
    },
    {
      id: 'artist-5',
      name: '李荣浩',
      avatar: '/placeholder-100.png',
      followers: 5000000
    },
    {
      id: 'artist-6',
      name: '毛不易',
      avatar: '/placeholder-100.png',
      followers: 4000000
    }
  ]
}

// 获取推荐专辑
export const getRecommendedAlbums = (): RecommendedAlbum[] => {
  return [
    {
      id: 'album-1',
      name: '十一月的萧邦',
      artist: '周杰伦',
      coverArt: '/placeholder-300x200.png',
      releaseDate: '2005-11-01'
    },
    {
      id: 'album-2',
      name: '和自己对话',
      artist: '林俊杰',
      coverArt: '/placeholder-300x200.png',
      releaseDate: '2015-12-25'
    },
    {
      id: 'album-3',
      name: 'U87',
      artist: '陈奕迅',
      coverArt: '/placeholder-300x200.png',
      releaseDate: '2005-06-07'
    },
    {
      id: 'album-4',
      name: '新的心跳',
      artist: '邓紫棋',
      coverArt: '/placeholder-300x200.png',
      releaseDate: '2015-11-06'
    }
  ]
}

// 获取最近播放的歌曲
export const getRecentTracks = () => {
  return [
    {
      id: 'recent-1',
      title: '夜曲',
      artist: '周杰伦',
      coverArt: '/placeholder-100.png'
    },
    {
      id: 'recent-2',
      title: '青花瓷',
      artist: '周杰伦',
      coverArt: '/placeholder-100.png'
    },
    {
      id: 'recent-3',
      title: '稻香',
      artist: '周杰伦',
      coverArt: '/placeholder-100.png'
    },
    {
      id: 'recent-4',
      title: '七里香',
      artist: '周杰伦',
      coverArt: '/placeholder-100.png'
    },
    {
      id: 'recent-5',
      title: '简单爱',
      artist: '周杰伦',
      coverArt: '/placeholder-100.png'
    }
  ]
}