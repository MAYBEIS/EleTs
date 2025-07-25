<template>
  <div class="space-y-6">
    <div class="bg-card border rounded-lg">
      <div class="p-4 border-b">
        <h3 class="font-semibold flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          数据分析
        </h3>
        <p class="text-sm text-muted-foreground">系统性能和用户行为分析</p>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h4>服务器性能</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm">CPU 使用率</span>
                <span class="text-sm">45%</span>
              </div>
              <div class="w-full bg-secondary rounded-full h-2">
                <div class="bg-primary h-2 rounded-full" style="width: 45%" />
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm">内存使用率</span>
                <span class="text-sm">62%</span>
              </div>
              <div class="w-full bg-secondary rounded-full h-2">
                <div class="bg-primary h-2 rounded-full" style="width: 62%" />
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm">磁盘使用率</span>
                <span class="text-sm">78%</span>
              </div>
              <div class="w-full bg-secondary rounded-full h-2">
                <div class="bg-primary h-2 rounded-full" style="width: 78%" />
              </div>
            </div>
          </div>
          
          <div class="space-y-4">
            <h4>用户活动</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-card border rounded-lg p-4 text-center">
                <div class="text-2xl font-bold">1,234</div>
                <div class="text-sm text-muted-foreground">今日访问</div>
              </div>
              <div class="bg-card border rounded-lg p-4 text-center">
                <div class="text-2xl font-bold">98.5%</div>
                <div class="text-sm text-muted-foreground">系统可用性</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 分析内容组件
</script>