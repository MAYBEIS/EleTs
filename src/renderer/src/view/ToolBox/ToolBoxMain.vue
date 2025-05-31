<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- 顶部菜单栏 -->
    <div class="bg-blue-600 text-white p-2">
      <div class="flex items-center space-x-4">
        <span class="font-bold">工具箱</span>
        <div class="flex space-x-2">
          <button class="px-3 py-1 hover:bg-blue-700 rounded">文件</button>
          <button class="px-3 py-1 hover:bg-blue-700 rounded">编辑</button>
          <button class="px-3 py-1 hover:bg-blue-700 rounded">视图</button>
          <button class="px-3 py-1 hover:bg-blue-700 rounded">工具</button>
          <button class="px-3 py-1 hover:bg-blue-700 rounded">帮助</button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧工具分类 -->
      <div class="w-48 bg-gray-200 p-2 overflow-y-auto">
        <div class="space-y-1">
          <div class="font-semibold p-2">常用工具</div>
          <div class="p-2 hover:bg-gray-300 cursor-pointer">计算器</div>
          <div class="p-2 hover:bg-gray-300 cursor-pointer">记事本</div>
          <div class="p-2 hover:bg-gray-300 cursor-pointer">日历</div>
          
          <div class="font-semibold p-2 mt-4">开发工具</div>
          <div class="p-2 hover:bg-gray-300 cursor-pointer">JSON格式化</div>
          <div class="p-2 hover:bg-gray-300 cursor-pointer">Base64转换</div>
          <div class="p-2 hover:bg-gray-300 cursor-pointer">时间戳转换</div>
        </div>
      </div>

      <!-- 右侧工具展示区 -->
      <div class="flex-1 p-4 overflow-y-auto">
        <div class="grid grid-cols-4 gap-4">
          <!-- 工具卡片 -->
          <div class="bg-white rounded-lg shadow p-4 flex flex-col items-center cursor-pointer hover:shadow-lg">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-blue-600 text-xl">+</span>
            </div>
            <div class="font-medium">计算器</div>
            <div class="text-sm text-gray-500">简单计算工具</div>
          </div>

          <div class="bg-white rounded-lg shadow p-4 flex flex-col items-center cursor-pointer hover:shadow-lg">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-green-600 text-xl">T</span>
            </div>
            <div class="font-medium">记事本</div>
            <div class="text-sm text-gray-500">文本编辑工具</div>
          </div>

          <div class="bg-white rounded-lg shadow p-4 flex flex-col items-center cursor-pointer hover:shadow-lg">
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-yellow-600 text-xl">📅</span>
            </div>
            <div class="font-medium">日历</div>
            <div class="text-sm text-gray-500">日期查看工具</div>
          </div>

          <div class="bg-white rounded-lg shadow p-4 flex flex-col items-center cursor-pointer hover:shadow-lg">
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-purple-600 text-xl">{}</span>
            </div>
            <div class="font-medium">JSON格式化</div>
            <div class="text-sm text-gray-500">JSON数据处理</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="bg-gray-300 p-1 text-sm text-gray-700">
      <div class="flex justify-between px-2">
        <span>就绪</span>
        <span>工具箱 v1.0.0</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 这里可以添加工具箱的逻辑代码
</script>

<style scoped>
/* 可以添加组件特定的样式 */
</style>
