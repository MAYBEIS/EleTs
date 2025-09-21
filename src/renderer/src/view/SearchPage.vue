<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:30:28
 * @FilePath: \EleTs\src\renderer/src/view/SearchPage.vue
 * @Description: 搜索页面组件
-->
<template>
  <div class="search-page">
    <div class="search-header">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索音乐、艺术家或专辑"
        enter-button
        size="large"
        @search="handleSearch"
      />
    </div>
    
    <div class="search-results" v-if="searchResults.length > 0">
      <h2>搜索结果</h2>
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="tracks" tab="歌曲">
          <a-list
            :data-source="searchResults"
            :split="false"
          >
            <template #renderItem="{ item }">
              <a-list-item @click="playTrack(item)">
                <a-list-item-meta
                  :title="item.title"
                  :description="`${item.artist} - ${item.album}`"
                >
                  <template #avatar>
                    <a-avatar :src="item.coverArt || '/placeholder-50.png'" />
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-tab-pane>
        
        <a-tab-pane key="artists" tab="艺术家" force-render>
          <div class="artists-grid">
            <div
              v-for="artist in artistResults"
              :key="artist.id"
              class="artist-card"
              @click="goToArtist(artist.id)"
            >
              <a-avatar :src="artist.avatar || '/placeholder-100.png'" :size="80" />
              <div class="artist-name">{{ artist.name }}</div>
            </div>
          </div>
        </a-tab-pane>
        
        <a-tab-pane key="albums" tab="专辑">
          <div class="albums-grid">
            <a-card
              v-for="album in albumResults"
              :key="album.id"
              hoverable
              @click="goToAlbum(album.id)"
            >
              <template #cover>
                <img :src="album.coverArt || '/placeholder-300x200.png'" alt="album cover" />
              </template>
              <a-card-meta :title="album.name" :description="album.artist" />
            </a-card>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
    
    <div class="no-results" v-else-if="searchQuery && searchResults.length === 0">
      <a-empty description="没有找到相关结果" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMusicStore } from '../store/music'

const router = useRouter()
const route = useRoute()
const musicStore = useMusicStore()

const searchQuery = ref('')
const activeTab = ref('tracks')
const searchResults = ref([])
const artistResults = ref([])
const albumResults = ref([])

// 处理搜索
const handleSearch = (value: string) => {
  searchQuery.value = value
  performSearch(value)
}

// 执行搜索
const performSearch = async (query: string) => {
  if (!query) return
  
  // 在实际应用中，这些数据将从 IPC 接口获取
  // const results = await window.musicAPI.search(query)
  
  // 模拟搜索结果
  searchResults.value = [
    {
      id: '301',
      title: '告白气球',
      artist: '周杰伦',
      album: '周杰伦的床边故事',
      coverArt: '/placeholder-50.png'
    },
    {
      id: '302',
      title: '简单爱',
      artist: '周杰伦',
      album: '范特西',
      coverArt: '/placeholder-50.png'
    },
    {
      id: '303',
      title: '稻香',
      artist: '周杰伦',
      album: '魔杰座',
      coverArt: '/placeholder-50.png'
    }
  ]
  
  artistResults.value = [
    {
      id: 'a01',
      name: '周杰伦',
      avatar: '/placeholder-100.png'
    },
    {
      id: 'a02',
      name: '林俊杰',
      avatar: '/placeholder-100.png'
    }
  ]
  
  albumResults.value = [
    {
      id: 'b01',
      name: '十一月的萧邦',
      artist: '周杰伦',
      coverArt: '/placeholder-300x200.png'
    },
    {
      id: 'b02',
      name: '七里香',
      artist: '周杰伦',
      coverArt: '/placeholder-300x200.png'
    }
  ]
}

// 播放指定歌曲
const playTrack = (track: any) => {
  musicStore.setCurrentTrack(track)
  musicStore.setPlaying(true)
  console.log('播放曲目:', track)
}

// 跳转到艺术家页面
const goToArtist = (artistId: string) => {
  console.log('跳转到艺术家:', artistId)
}

// 跳转到专辑页面
const goToAlbum = (albumId: string) => {
  console.log('跳转到专辑:', albumId)
}

// 监听路由查询参数变化
watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery) {
      searchQuery.value = newQuery as string
      performSearch(newQuery as string)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.search-page {
  padding: 24px;
}

.search-header {
  margin-bottom: 32px;
}

.search-results h2 {
  margin-bottom: 16px;
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
}

.artist-name {
  margin-top: 8px;
  font-size: 14px;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.no-results {
  text-align: center;
  margin-top: 64px;
}
</style>