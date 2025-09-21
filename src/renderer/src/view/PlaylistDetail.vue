<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-21
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-21 11:16:00
 * @FilePath: \EleTs\src\renderer\src\view\PlaylistDetail.vue
 * @Description: 播放列表详情页面
-->
<template>
  <div class="playlist-detail" v-if="playlist">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="playlist.name"
      @back="() => router.go(-1)"
    >
      <template #extra>
        <a-button key="play" type="primary" @click="playAll">
          <template #icon>
            <PlayCircleOutlined />
          </template>
          播放全部
        </a-button>
        <a-button key="add" @click="showAddTrackModal">
          <template #icon>
            <PlusOutlined />
          </template>
          添加歌曲
        </a-button>
      </template>
    </a-page-header>

    <div class="playlist-info">
      <div class="playlist-stats">
        <span>{{ playlist.tracks.length }} 首歌曲</span>
        <span>创建于 {{ formatDate(playlist.createdAt) }}</span>
      </div>

      <a-table
        :data-source="playlist.tracks"
        :pagination="false"
        :scroll="{ y: 400 }"
        @row-click="onRowClick"
      >
        <a-table-column key="index" title="#" dataIndex="index" :width="60">
          <template #default="{ index }">
            {{ index + 1 }}
          </template>
        </a-table-column>
        <a-table-column key="title" title="歌曲标题" dataIndex="title" />
        <a-table-column key="artist" title="艺术家" dataIndex="artist" />
        <a-table-column key="album" title="专辑" dataIndex="album" />
        <a-table-column key="duration" title="时长" dataIndex="duration" :width="100">
          <template #default="{ text }">
            {{ formatDuration(text) }}
          </template>
        </a-table-column>
        <a-table-column key="actions" title="操作" :width="120">
          <template #default="{ record, index }">
            <a-button type="link" size="small" @click.stop="removeTrack(index)">删除</a-button>
          </template>
        </a-table-column>
      </a-table>
    </div>

    <!-- 添加歌曲模态框 -->
    <a-modal
      v-model:open="addTrackModalVisible"
      title="添加歌曲到播放列表"
      @ok="handleAddTrackOk"
      @cancel="handleAddTrackCancel"
      width="600px"
    >
      <a-form
        :model="addTrackForm"
        layout="vertical"
      >
        <a-form-item label="歌曲标题">
          <a-input v-model:value="addTrackForm.title" />
        </a-form-item>
        <a-form-item label="艺术家">
          <a-input v-model:value="addTrackForm.artist" />
        </a-form-item>
        <a-form-item label="专辑">
          <a-input v-model:value="addTrackForm.album" />
        </a-form-item>
        <a-form-item label="时长（秒）">
          <a-input-number v-model:value="addTrackForm.duration" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { PlayCircleOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { useMusicStore } from '../store/music'
import { getPlaylistById, updatePlaylist } from '../services/playlistService'
import type { Playlist, Track } from '../store/music'

const router = useRouter()
const route = useRoute()
const musicStore = useMusicStore()

// 播放列表数据
const playlist = ref<Playlist | null>(null)

// 添加歌曲模态框相关
const addTrackModalVisible = ref(false)
const addTrackForm = ref({
  title: '',
  artist: '',
  album: '',
  duration: 0
})

// 加载播放列表详情
const loadPlaylist = () => {
  const playlistId = route.params.id as string
  const loadedPlaylist = getPlaylistById(playlistId)
  if (loadedPlaylist) {
    playlist.value = loadedPlaylist
  } else {
    // 如果找不到播放列表，返回上一页
    router.go(-1)
  }
}

// 播放全部歌曲
const playAll = () => {
  if (playlist.value && playlist.value.tracks.length > 0) {
    musicStore.setPlaylist(playlist.value.tracks)
    musicStore.setCurrentIndex(0)
    console.log('播放全部歌曲')
  }
}

// 点击行播放歌曲
const onRowClick = (record: Track) => {
  if (playlist.value) {
    const index = playlist.value.tracks.findIndex(track => track.id === record.id)
    if (index !== -1) {
      musicStore.setPlaylist(playlist.value.tracks)
      musicStore.setCurrentIndex(index)
      console.log('播放曲目:', record)
    }
  }
}

// 移除歌曲
const removeTrack = (index: number) => {
  if (playlist.value) {
    playlist.value.tracks.splice(index, 1)
    // 更新播放列表
    updatePlaylist(playlist.value)
  }
}

// 显示添加歌曲模态框
const showAddTrackModal = () => {
  addTrackForm.value = {
    title: '',
    artist: '',
    album: '',
    duration: 0
  }
  addTrackModalVisible.value = true
}

// 处理添加歌曲确认
const handleAddTrackOk = () => {
  if (playlist.value) {
    const newTrack: Track = {
      id: Date.now().toString(),
      title: addTrackForm.value.title,
      artist: addTrackForm.value.artist,
      album: addTrackForm.value.album,
      duration: addTrackForm.value.duration,
      filePath: '/test-audio.mp3',
      coverArt: '/placeholder-50.png'
    }
    
    playlist.value.tracks.push(newTrack)
    // 更新播放列表
    updatePlaylist(playlist.value)
    handleAddTrackCancel()
  }
}

// 处理添加歌曲取消
const handleAddTrackCancel = () => {
  addTrackModalVisible.value = false
}

// 格式化时长
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

// 组件挂载时加载播放列表
onMounted(() => {
  loadPlaylist()
})
</script>

<style scoped>
.playlist-detail {
  padding: 24px;
}

.playlist-info {
  margin-top: 24px;
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.playlist-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  color: #666;
}
</style>