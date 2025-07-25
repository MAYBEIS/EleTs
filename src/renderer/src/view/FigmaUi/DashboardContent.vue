<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="bg-card border rounded-lg hover:shadow-lg transition-shadow">
      <div class="p-4">
        <div class="flex items-center justify-between space-y-0 pb-2">
          <h3 class="text-sm font-medium">总用户数</h3>
          <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <div class="text-2xl font-bold">2,345</div>
        <p class="text-xs text-muted-foreground">比上月增长 20.1%</p>
      </div>
    </div>

    <div class="bg-card border rounded-lg hover:shadow-lg transition-shadow">
      <div class="p-4">
        <div class="flex items-center justify-between space-y-0 pb-2">
          <h3 class="text-sm font-medium">活跃会话</h3>
          <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="text-2xl font-bold">1,234</div>
        <p class="text-xs text-muted-foreground">实时数据</p>
      </div>
    </div>

    <div class="bg-card border rounded-lg hover:shadow-lg transition-shadow">
      <div class="p-4">
        <div class="flex items-center justify-between space-y-0 pb-2">
          <h3 class="text-sm font-medium">月度收入</h3>
          <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div class="text-2xl font-bold">¥45,231</div>
        <p class="text-xs text-muted-foreground">比上月增长 12%</p>
      </div>
    </div>

    <div class="md:col-span-2 lg:col-span-3 bg-card border rounded-lg hover:shadow-lg transition-shadow">
      <div class="p-4 border-b">
        <h3 class="font-semibold">项目进度</h3>
        <p class="text-sm text-muted-foreground">当前进行中的项目状态</p>
      </div>
      <div class="p-4 space-y-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm">移动应用开发</span>
            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
              进行中
            </span>
          </div>
          <div class="w-full bg-secondary rounded-full h-2">
            <div class="bg-primary h-2 rounded-full" style="width: 75%" />
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm">网站重构</span>
            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
              即将完成
            </span>
          </div>
          <div class="w-full bg-secondary rounded-full h-2">
            <div class="bg-primary h-2 rounded-full" style="width: 90%" />
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm">数据分析系统</span>
            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
              开始
            </span>
          </div>
          <div class="w-full bg-secondary rounded-full h-2">
            <div class="bg-primary h-2 rounded-full" style="width: 25%" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 仪表板内容组件
</script>