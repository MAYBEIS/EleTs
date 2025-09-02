<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:46:02
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
        >
          <template #cover>
            <img :src="playlist.coverArt" alt="playlist cover" />
          </template>
          <a-card-meta :title="playlist.name" :description="`${playlist.trackCount} 首歌曲`" />
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
          <a-list-item @click="playTrack(item)">
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

const router = useRouter()
const musicStore = useMusicStore()

const searchQuery = ref('')
const recommendedPlaylists = ref([])
const recentTracks = ref([])

const handleSearch = (value: string) => {
  router.push({ name: 'Search', query: { q: value } })
}

const goToPlaylist = (playlistId: string) => {
  router.push({ name: 'Playlist', params: { id: playlistId } })
}

const playTrack = (track: any) => {
  musicStore.setCurrentTrack(track)
  musicStore.setPlaying(true)
  console.log('播放曲目:', track)
}

// 模拟数据
onMounted(async () => {
  // 在实际应用中，这些数据将从 IPC 接口获取
  // recommendedPlaylists.value = await window.musicAPI.getRecommendedPlaylists()
  // recentTracks.value = await window.musicAPI.getRecentTracks()
  
  // 模拟推荐歌单数据
  recommendedPlaylists.value = [
    {
      id: '1',
      name: '流行音乐',
      coverArt: '/placeholder-300x200.png',
      trackCount: 20
    },
    {
      id: '2',
      name: '摇滚经典',
      coverArt: '/placeholder-300x200.png',
      trackCount: 15
    },
    {
      id: '3',
      name: '电子音乐',
      coverArt: '/placeholder-300x200.png',
      trackCount: 18
    }
  ]
  
  // 模拟最近播放数据
  recentTracks.value = [
    {
      id: '101',
      title: '夜曲',
      artist: '周杰伦',
      coverArt: '/placeholder-100.png'
    },
    {
      id: '102',
      title: '青花瓷',
      artist: '周杰伦',
      coverArt: '/placeholder-100.png'
    },
    {
      id: '103',
      title: '稻香',
      artist: '周杰伦',
      coverArt: '/placeholder-100.png'
    }
  ]
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

.recommendations .header {
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

.recent-played {
  margin-top: 32px;
}
</style>