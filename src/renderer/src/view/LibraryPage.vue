<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-21
 * @FilePath: \EleTs\src\renderer/src/view/LibraryPage.vue
 * @Description: 音乐库页面组件
-->
<template>
  <div class="library-page">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      title="音乐库"
    >
      <template #extra>
        <a-button key="add" type="primary">
          <template #icon>
            <PlusOutlined />
          </template>
          添加音乐
        </a-button>
      </template>
    </a-page-header>
    
    <div class="library-content">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="playlists" tab="播放列表">
          <PlaylistManager />
        </a-tab-pane>
        
        <a-tab-pane key="artists" tab="艺术家">
          <div class="artists-grid">
            <div
              v-for="artist in artists"
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
              v-for="album in albums"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusOutlined } from '@ant-design/icons-vue'
import PlaylistManager from '../components/PlaylistManager.vue'

const router = useRouter()

const activeTab = ref('playlists')
const artists = ref([])
const albums = ref([])

// 跳转到艺术家
const goToArtist = (artistId: string) => {
  console.log('跳转到艺术家:', artistId)
}

// 跳转到专辑
const goToAlbum = (albumId: string) => {
  console.log('跳转到专辑:', albumId)
}

// 添加音乐
const addMusic = () => {
  console.log('添加音乐')
}

// 模拟数据
onMounted(async () => {
  // 在实际应用中，这些数据将从 IPC 接口获取
  // artists.value = await window.api.invoke('music:get-artists')
  // albums.value = await window.api.invoke('music:get-albums')
  
  // 模拟艺术家数据
  artists.value = [
    {
      id: 'a001',
      name: '周杰伦',
      avatar: '/placeholder-100.png'
    },
    {
      id: 'a002',
      name: '林俊杰',
      avatar: '/placeholder-100.png'
    }
  ]
  
  // 模拟专辑数据
  albums.value = [
    {
      id: 'b001',
      name: '十一月的萧邦',
      artist: '周杰伦',
      coverArt: '/placeholder-300x200.png'
    },
    {
      id: 'b002',
      name: '七里香',
      artist: '周杰伦',
      coverArt: '/placeholder-300x200.png'
    }
  ]
})
</script>

<style scoped>
.library-page {
  padding: 24px;
}

.library-content {
  margin-top: 24px;
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
</style>