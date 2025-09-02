<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:27:17
 * @FilePath: \EleTs\src\renderer\src\view\PlaylistPage.vue
 * @Description: 播放列表页面组件
-->
<template>
  <div class="playlist-page">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      title="播放列表"
      @back="() => router.go(-1)"
    >
      <template #extra>
        <a-button key="play" type="primary" @click="playAll">
          <template #icon>
            <PlayCircleOutlined />
          </template>
          播放全部
        </a-button>
      </template>
    </a-page-header>
    
    <div class="playlist-content">
      <a-list
        :data-source="playlistTracks"
        :split="false"
      >
        <template #renderItem="{ item, index }">
          <a-list-item @click="playTrack(item)">
            <a-list-item-meta
              :title="item.title"
              :description="`${item.artist} - ${item.album}`"
            >
              <template #avatar>
                <a-avatar :src="item.coverArt || '/placeholder-50.png'" />
              </template>
            </a-list-item-meta>
            <div class="track-duration">
              {{ formatDuration(item.duration) }}
            </div>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { PlayCircleOutlined } from '@ant-design/icons-vue'
import { useMusicStore } from '../store/music'

const router = useRouter()
const route = useRoute()
const musicStore = useMusicStore()

const playlistTracks = ref([])

// 播放全部歌曲
const playAll = () => {
  if (playlistTracks.value.length > 0) {
    musicStore.setCurrentTrack(playlistTracks.value[0])
    musicStore.setPlaying(true)
    console.log('播放全部歌曲')
  }
}

// 播放指定歌曲
const playTrack = (track: any) => {
  musicStore.setCurrentTrack(track)
  musicStore.setPlaying(true)
  console.log('播放曲目:', track)
}

// 格式化时长
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 模拟数据
onMounted(async () => {
  // 在实际应用中，这些数据将从 IPC 接口获取
  // const playlistId = route.params.id
  // playlistTracks.value = await window.musicAPI.getPlaylistTracks(playlistId)
  
  // 模拟播放列表数据
  playlistTracks.value = [
    {
      id: '201',
      title: '晴天',
      artist: '周杰伦',
      album: '叶惠美',
      duration: 234,
      coverArt: '/placeholder-50.png'
    },
    {
      id: '202',
      title: '七里香',
      artist: '周杰伦',
      album: '七里香',
      duration: 215,
      coverArt: '/placeholder-50.png'
    },
    {
      id: '203',
      title: '稻香',
      artist: '周杰伦',
      album: '魔杰座',
      duration: 243,
      coverArt: '/placeholder-50.png'
    },
    {
      id: '204',
      title: '夜曲',
      artist: '周杰伦',
      album: '十一月的萧邦',
      duration: 210,
      coverArt: '/placeholder-50.png'
    }
  ]
})
</script>

<style scoped>
.playlist-page {
  padding: 24px;
}

.playlist-content {
  margin-top: 24px;
}

.track-duration {
  color: #666;
  font-size: 14px;
}
</style>