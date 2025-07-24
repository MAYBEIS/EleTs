<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-01-12 12:26:34
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-24 12:22:00
 * @FilePath: \EleTs\src\renderer\src\view\TestPage\TestPage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <n-tabs class="flex no-select" v-model:value="activeTab" @update:value="handleTabChange">
        <n-tab-pane class="no-select flex flex-grow flex-col justify-center items-center" name="tab1"
            tab="选项卡 1">
            <HomePage class="c-css flex h-full" />
        </n-tab-pane>
        <n-tab-pane class="no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab2"
            tab="选项卡 2">
            <ComponentPage class="c-css flex h-full w-full"></ComponentPage>
        </n-tab-pane>
        <n-tab-pane class="no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab3"
            tab="选项卡 3">
        </n-tab-pane>
        <n-tab-pane class="no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab4"
            tab="选项卡 4">
        </n-tab-pane>
        <n-tab-pane class="no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab5"
            tab="选项卡 5">
        </n-tab-pane>
        <n-tab-pane class="no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab6"
            tab="选项卡 6">
        </n-tab-pane>
        <n-tab-pane class="no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab7"
            tab="选项卡 7">
        </n-tab-pane>
        <n-tab-pane class="no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab8"
            tab="选项卡 8">
        </n-tab-pane>
    </n-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import "../../assets/custom.css"
import { NCard, NTabs, NTabPane, NButton, NDivider, NTooltip } from 'naive-ui';
import HomePage from '../HomePage/HomePage.vue';
import ComponentPage from '../Components/ComponentPage.vue';

// 初始化激活的选项卡
const activeTab = ref<string>('tab1'); 
const handleTabChange = (value: string) => {
    console.log('tab change to ', value);
    activeTab.value = value;
};
const changeTab = (tabName: string) => {
    activeTab.value = tabName;
};
</script>

<style scoped>
.c-css {
    /*
      @apply border-2 绿色边框显示线
     */
    @apply border-2 border-emerald-300
}


</style>
