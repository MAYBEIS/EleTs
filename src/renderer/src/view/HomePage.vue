<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-21 11:20:00
 * @FilePath: \EleTs\src\renderer\src\view\HomePage.vue
 * @Description: 音乐播放器主页组件
-->
<template>
  <div class="home-page">
    <!-- 顶部搜索区域 -->
    <div class="search-section">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索音乐、艺术家或专辑"
        @search="handleSearch"
        size="large"
      />
    </div>
    
    <!-- 推荐内容区域 -->
    <div class="recommendations">
      <div class="header">
        <h2>推荐歌单</h2>
        <a-button type="primary" @click="testPlay">测试播放</a-button>
      </div>
      <div class="playlist-grid">
        <a-card
          v-for="playlist in recommendedPlaylists"
          :key="playlist.id"
          hoverable
          @click="goToPlaylist(playlist.id)"
          class="playlist-card"
        >
          <template #cover>
            <img :src="playlist.coverArt" alt="playlist cover" />
          </template>
          <a-card-meta :title="playlist.name" :description="`${playlist.trackCount} 首歌曲`" />
        </a-card>
      </div>
    </div>
    
    <!-- 推荐艺术家区域 -->
    <div class="recommended-artists">
      <div class="header">
        <h2>推荐艺术家</h2>
      </div>
      <div class="artists-grid">
        <div
          v-for="artist in recommendedArtists"
          :key="artist.id"
          class="artist-card"
          @click="goToArtist(artist.id)"
        >
          <a-avatar :src="artist.avatar" :size="80" />
          <div class="artist-name">{{ artist.name }}</div>
          <div class="artist-followers">{{ formatFollowers(artist.followers) }} 粉丝</div>
        </div>
      </div>
    </div>
    
    <!-- 我的播放列表区域 -->
    <div class="my-playlists">
      <div class="header">
        <h2>我的播放列表</h2>
        <a-button type="primary" @click="goToLibrary">查看更多</a-button>
      </div>
      <div class="playlist-grid">
        <a-card
          v-for="playlist in myPlaylists"
          :key="playlist.id"
          hoverable
          @click="goToPlaylistDetail(playlist.id)"
          class="playlist-card"
        >
          <template #cover>
            <img :src="getPlaylistCover(playlist)" alt="playlist cover" />
          </template>
          <a-card-meta :title="playlist.name" :description="`${playlist.tracks.length} 首歌曲`" />
        </a-card>
      </div>
    </div>
    
    <!-- 最近播放区域 -->
    <div class="recent-played">
      <h2>最近播放</h2>
      <a-list
        :data-source="recentTracks"
        :split="false"
      >
        <template #renderItem="{ item }">
          <a-list-item @click="playTrack(item)" class="recent-track-item">
            <a-list-item-meta
              :title="item.title"
              :description="item.artist"
            >
              <template #avatar>
                <a-avatar :src="item.coverArt" />
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMusicStore } from '../store/music'
import { getPlaylists } from '../services/playlistService'
import { 
  getRecommendedPlaylists, 
  getRecommendedArtists, 
  getRecentTracks 
} from '../services/recommendationService'

const router = useRouter()
const musicStore = useMusicStore()

const searchQuery = ref('')
const recommendedPlaylists = ref([])
const recommendedArtists = ref([])
const myPlaylists = ref([])
const recentTracks = ref([])

const handleSearch = (value: string) => {
  router.push({ name: 'Search', query: { q: value } })
}

const goToPlaylist = (playlistId: string) => {
  router.push({ name: 'Playlist', params: { id: playlistId } })
}

const goToPlaylistDetail = (playlistId: string) => {
  router.push({ name: 'PlaylistDetail', params: { id: playlistId } })
}

const goToLibrary = () => {
  router.push({ name: 'Library' })
}

const goToArtist = (artistId: string) => {
  console.log('跳转到艺术家:', artistId)
  // 在实际应用中，这里会跳转到艺术家详情页面
}

const playTrack = (track: any) => {
  musicStore.setCurrentTrack(track)
  musicStore.setPlaying(true)
  console.log('播放曲目:', track)
}

// 获取播放列表封面
const getPlaylistCover = (playlist: any) => {
  if (playlist.tracks.length > 0 && playlist.tracks[0].coverArt) {
    return playlist.tracks[0].coverArt
  }
  return '/placeholder-300x200.png'
}

// 格式化粉丝数量
const formatFollowers = (count: number) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  }
  return count.toString()
}

// 模拟数据
onMounted(async () => {
  // 获取推荐内容
  recommendedPlaylists.value = getRecommendedPlaylists()
  recommendedArtists.value = getRecommendedArtists()
  
  // 获取我的播放列表
  myPlaylists.value = getPlaylists().slice(0, 4) // 只显示前4个播放列表
  
  // 获取最近播放数据
  recentTracks.value = getRecentTracks()
})

// 测试播放功能
const testPlay = () => {
  const testTrack = {
    id: 'test',
    title: '测试音频',
    artist: '测试艺术家',
    album: '测试专辑',
    duration: 100,
    filePath: '/test-audio.mp3',
    coverArt: '/placeholder-100.png'
  }
  
  musicStore.setCurrentTrack(testTrack)
  musicStore.setPlaying(true)
}
</script>

<style scoped>
.home-page {
  padding: 24px;
}

.search-section {
  margin-bottom: 32px;
}

.search-section :deep(.ant-input-search) {
  border-radius: 20px;
}

.recommendations .header,
.recommended-artists .header,
.my-playlists .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.playlist-card {
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.playlist-card:hover {
  transform: translateY(-5px);
}

.playlist-card :deep(.ant-card-cover) {
  height: 200px;
  overflow: hidden;
}

.playlist-card :deep(.ant-card-cover img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 24px;
  padding: 16px 0;
}

.artist-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.artist-card:hover {
  transform: scale(1.05);
}

.artist-name {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 500;
}

.artist-followers {
  font-size: 12px;
  color: #666;
}

.recent-played {
  margin-top: 32px;
}

.recent-track-item {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.recent-track-item:hover {
  background-color: #f5f5f5;
}

.recent-track-item :deep(.ant-list-item-meta-title) {
  margin-bottom: 0;
}
</style>