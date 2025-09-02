<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 11:50:51
 * @FilePath: \EleTs\src\renderer\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 -->

<script setup>
import { ref, watch } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { Layout, Menu, Button } from 'ant-design-vue'
import {
  HomeOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons-vue'
import PlayerControls from './components/PlayerControls.vue'

const { Header, Sider, Content } = Layout

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const selectedKeys = ref(['home'])

// 监听路由变化，更新选中的菜单项
watch(
  () => route.name,
  (newName) => {
    if (newName) {
      selectedKeys.value = [newName.toString().toLowerCase()]
    }
  },
  { immediate: true }
)

// 菜单点击处理
const handleMenuClick = ({ key }) => {
  switch (key) {
    case 'home':
      router.push({ name: 'Home' })
      break
    case 'search':
      router.push({ name: 'Search' })
      break
    case 'library':
      router.push({ name: 'Library' })
      break
    case 'test':
      router.push({ name: 'Test' })
      break
  }
}
</script>

<template>
  <Layout class="app-layout">
    <Sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo">
        <h2 v-if="!collapsed">音乐播放器</h2>
        <h2 v-else>🎵</h2>
      </div>
      <Menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <Menu.Item key="home">
          <HomeOutlined />
          <span>首页</span>
        </Menu.Item>
        <Menu.Item key="search">
          <SearchOutlined />
          <span>搜索</span>
        </Menu.Item>
        <Menu.Item key="library">
          <PlayCircleOutlined />
          <span>音乐库</span>
        </Menu.Item>
        <Menu.Item key="test">
          <PlayCircleOutlined />
          <span>测试播放器</span>
        </Menu.Item>
      </Menu>
    </Sider>
    
    <Layout>
      <Header class="header">
        <Button
          type="text"
          :icon="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
          @click="() => (collapsed = !collapsed)"
        />
      </Header>
      
      <Content class="content">
        <RouterView />
      </Content>
      
      <PlayerControls />
    </Layout>
  </Layout>
</template>

<style>
.app-layout {
  height: 100vh;
}

.logo {
  height: 32px;
  margin: 16px;
  color: white;
  text-align: center;
}

.header {
  background: #fff;
  padding: 0;
  display: flex;
  align-items: center;
}

.content {
  margin: 24px 16px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
  overflow: auto;
}

/* 确保 html 和 body 全屏 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.scroll-hidden {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.scroll-hidden::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, and Opera */
}
</style>
