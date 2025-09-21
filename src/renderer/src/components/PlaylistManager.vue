<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-21
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-21 11:15:00
 * @FilePath: \EleTs\src\renderer\src\components\PlaylistManager.vue
 * @Description: 播放列表管理组件
-->
<template>
  <div class="playlist-manager">
    <div class="playlist-header">
      <h2>播放列表管理</h2>
      <a-button type="primary" @click="showCreateModal">
        <template #icon>
          <PlusOutlined />
        </template>
        创建播放列表
      </a-button>
    </div>

    <div class="playlist-list">
      <a-list
        :data-source="playlists"
        :split="false"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta
              :title="item.name"
              :description="`${item.tracks.length} 首歌曲`"
            >
              <template #avatar>
                <a-avatar :src="getPlaylistCover(item)" />
              </template>
            </a-list-item-meta>
            <div class="playlist-actions">
              <a-button type="link" @click="editPlaylist(item)">编辑</a-button>
              <a-button type="link" @click="deletePlaylist(item.id)">删除</a-button>
              <a-button type="link" @click="playPlaylist(item)">播放</a-button>
              <a-button type="link" @click="viewPlaylist(item.id)">查看</a-button>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </div>

    <!-- 创建/编辑播放列表模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingPlaylist ? '编辑播放列表' : '创建播放列表'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        :model="playlistForm"
        layout="vertical"
      >
        <a-form-item
          label="播放列表名称"
          :rules="[{ required: true, message: '请输入播放列表名称' }]"
        >
          <a-input v-model:value="playlistForm.name" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useMusicStore } from '../store/music'
import { getPlaylists, addPlaylist, updatePlaylist, deletePlaylist } from '../services/playlistService'
import type { Playlist, Track } from '../store/music'

const router = useRouter()
const musicStore = useMusicStore()

// 播放列表数据
const playlists = ref<Playlist[]>([])

// 模态框相关
const modalVisible = ref(false)
const editingPlaylist = ref<Playlist | null>(null)
const playlistForm = ref({
  name: ''
})

// 刷新播放列表
const refreshPlaylists = () => {
  playlists.value = getPlaylists()
}

// 显示创建模态框
const showCreateModal = () => {
  editingPlaylist.value = null
  playlistForm.value.name = ''
  modalVisible.value = true
}

// 编辑播放列表
const editPlaylist = (playlist: Playlist) => {
  editingPlaylist.value = playlist
  playlistForm.value.name = playlist.name
  modalVisible.value = true
}

// 删除播放列表
const deletePlaylistHandler = (id: string) => {
  deletePlaylist(id)
  refreshPlaylists()
}

// 播放播放列表
const playPlaylist = (playlist: Playlist) => {
  if (playlist.tracks.length > 0) {
    musicStore.setPlaylist(playlist.tracks)
    musicStore.setCurrentIndex(0)
    console.log('播放播放列表:', playlist.name)
  }
}

// 查看播放列表详情
const viewPlaylist = (id: string) => {
  router.push({ name: 'PlaylistDetail', params: { id } })
}

// 获取播放列表封面
const getPlaylistCover = (playlist: Playlist) => {
  if (playlist.tracks.length > 0 && playlist.tracks[0].coverArt) {
    return playlist.tracks[0].coverArt
  }
  return '/placeholder-50.png'
}

// 处理模态框确认
const handleModalOk = () => {
  if (editingPlaylist.value) {
    // 编辑现有播放列表
    const updatedPlaylist = {
      ...editingPlaylist.value,
      name: playlistForm.value.name
    }
    updatePlaylist(updatedPlaylist)
  } else {
    // 创建新播放列表
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: playlistForm.value.name,
      tracks: [],
      createdAt: new Date()
    }
    addPlaylist(newPlaylist)
  }
  
  refreshPlaylists()
  handleModalCancel()
}

// 处理模态框取消
const handleModalCancel = () => {
  modalVisible.value = false
  editingPlaylist.value = null
  playlistForm.value.name = ''
}

// 组件挂载时刷新播放列表
onMounted(() => {
  refreshPlaylists()
})

// 组件卸载时保存播放列表
onUnmounted(() => {
  // 播放列表已经在playlistService中自动保存
})
</script>

<style scoped>
.playlist-manager {
  padding: 24px;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.playlist-list {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.playlist-actions {
  display: flex;
  gap: 8px;
}
</style>