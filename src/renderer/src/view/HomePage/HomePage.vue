<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 16:26:29
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-25 17:08:19
 * @FilePath: \EleTs\src\renderer\src\view\HomePage\HomePage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="home-page h-full w-full">
    <n-layout has-sider>
      <!-- 左侧边栏 -->
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="selectedKey"
          @update:value="handleMenuSelect"
        />
      </n-layout-sider>

      <!-- 主内容区域 -->
      <n-layout>
        <n-layout-header bordered style="height: 64px; padding: 24px;">
          <div class="header-content">
            <h2>{{ currentPageTitle }}</h2>
            <n-space>
              <n-button quaternary circle @click="toggleTheme">
                <template #icon>
                  <n-icon :component="isDark ? SunIcon : MoonIcon" />
                </template>
              </n-button>
            </n-space>
          </div>
        </n-layout-header>

        <n-layout-content content-style="padding: 24px;">
          <!-- 动态内容区域 -->
          <component :is="currentComponent" />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { 
  NLayout, 
  NLayoutSider, 
  NLayoutHeader, 
  NLayoutContent,
  NMenu, 
  NButton, 
  NIcon, 
  NSpace,
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  useOsTheme,
  darkTheme,
  lightTheme
} from 'naive-ui'
// 使用 @heroicons/vue (项目中已安装)
import { 
  HomeIcon,
  CogIcon as SettingsIcon,
  UserIcon,
  ChartBarIcon as StatsIcon,
  DocumentIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/vue/24/outline'

// 响应式状态
const collapsed = ref(false)
const selectedKey = ref('home')
const isDark = ref(false)

// 菜单选项配置
const menuOptions = [
  {
    label: '首页',
    key: 'home',
    icon: () => h(NIcon, { component: HomeIcon })
  },
  {
    label: '数据统计',
    key: 'stats',
    icon: () => h(NIcon, { component: StatsIcon })
  },
  {
    label: '文档管理',
    key: 'documents',
    icon: () => h(NIcon, { component: DocumentIcon })
  },
  {
    label: '用户中心',
    key: 'user',
    icon: () => h(NIcon, { component: UserIcon })
  },
  {
    label: '系统设置',
    key: 'settings',
    icon: () => h(NIcon, { component: SettingsIcon })
  }
]

// 计算属性
const currentPageTitle = computed(() => {
  const option = menuOptions.find(item => item.key === selectedKey.value)
  return option?.label || '首页'
})

// 页面组件映射
const pageComponents = {
  home: () => h('div', { class: 'page-content' }, [
    h(NGrid, { cols: 3, xGap: 12, yGap: 12 }, [
      h(NGridItem, {}, [
        h(NCard, { title: '总用户数' }, [
          h(NStatistic, { value: 1234, label: '活跃用户' })
        ])
      ]),
      h(NGridItem, {}, [
        h(NCard, { title: '今日访问' }, [
          h(NStatistic, { value: 567, label: '页面浏览量' })
        ])
      ]),
      h(NGridItem, {}, [
        h(NCard, { title: '系统状态' }, [
          h(NStatistic, { value: 99.9, label: '运行时间 (%)', precision: 1 })
        ])
      ])
    ])
  ]),
  stats: () => h('div', { class: 'page-content green-container' }, [
    h(NCard, { title: '数据统计页面' }, '这里是数据统计内容')
  ]),
  documents: () => h('div', { class: 'page-content' }, [
    h(NCard, { title: '文档管理页面' }, '这里是文档管理内容')
  ]),
  user: () => h('div', { class: 'page-content' }, [
    h(NCard, { title: '用户中心页面' }, '这里是用户中心内容')
  ]),
  settings: () => h('div', { class: 'page-content' }, [
    h(NCard, { title: '系统设置页面' }, '这里是系统设置内容')
  ])
}

// 根据当前选中的菜单项动态返回对应的页面组件
const currentComponent = computed(() => {
  return pageComponents[selectedKey.value as keyof typeof pageComponents] || pageComponents.home
})

// 事件处理
const handleMenuSelect = (key: string) => {
  selectedKey.value = key
  console.log('切换到页面:', key)
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  console.log('切换主题:', isDark.value ? '暗色' : '亮色')
}
</script>

<style scoped>

/* From Uiverse.io by FColombati */ 
.green-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-repeat: repeat;
  background-position: 50% 50%;
  background-size: 154px 265px;
  background-image: conic-gradient(
      from 0deg at 92.66% 50%,
      #6a994e 0 120deg,
      #fff0 0 100%
    ),
    conic-gradient(from -60deg at 81.66% 10.25%, #6a994e 0 180deg, #fff0 0 100%),
    conic-gradient(from -60deg at 66.66% 22.25%, #a7c957 0 120deg, #fff0 0 100%),
    conic-gradient(from 0deg at 71.66% 43%, #386641 0 120deg, #fff0 0 100%),
    conic-gradient(from 0deg at 66.66% 45.95%, #386641 0 60deg, #fff0 0 100%),
    conic-gradient(from 120deg at 25% 91.5%, #a7c957 0 120deg, #fff0 0 100%),
    conic-gradient(from 180deg at 16% 73.5%, #6a994e 0 120deg, #fff0 0 100%),
    conic-gradient(from 180deg at 16% 73.5%, #6a994e 0 120deg, #fff0 0 100%),
    conic-gradient(from 180deg at 16% 73.5%, #6a994e 0 120deg, #fff0 0 100%),
    conic-gradient(from 180deg at 16% 73.5%, #6a994e 0 120deg, #fff0 0 100%),
    conic-gradient(
      from 180deg at 39.5% 65.65%,
      #386641 0 60deg,
      #a7c957 0 120deg,
      #fff0 0 100%
    ),
    conic-gradient(
      from 180deg at 39.5% 65.65%,
      #386641 0 60deg,
      #a7c957 0 120deg,
      #fff0 0 100%
    ),
    conic-gradient(
      from 180deg at 39.5% 65.65%,
      #386641 0 60deg,
      #a7c957 0 120deg,
      #fff0 0 100%
    ),
    conic-gradient(
      from 180deg at 39.5% 65.65%,
      #386641 0 60deg,
      #a7c957 0 120deg,
      #fff0 0 100%
    ),
    conic-gradient(
      from 60deg at 50% 51.5%,
      #a7c957 0 60deg,
      #6a994e 0 120deg,
      #4a8656 0 100%
    );
}


.home-page {
  height: 100%;
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.page-content {
  min-height: 100vh;
}


</style>


