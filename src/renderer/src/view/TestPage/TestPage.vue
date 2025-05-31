<!--
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-01-12 12:26:34
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-05-25 11:32:11
 * @FilePath: \EleTs\src\renderer\src\view\TestPage\TestPage.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <n-tabs class="flex no-select" v-model:value="activeTab" @update:value="handleTabChange">
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-12 justify-center items-center" name="tab1"
            tab="选项卡 1">
            <div>11111111111111111222221111111111111111</div>
            <!-- <Button1></Button1> -->
            <card1 class="c-css"></card1>
            <card2 class="c-css"></card2>
            <Button1 class="c-css"></Button1>
            <Card3 class="c-css"></Card3>
            <div></div>
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab2"
            tab="选项卡 2">
            <Clock class="c-css"></Clock>
            <Card4
                title="自定义标题1231"
                loading-text="自定义加载文本..."
                theme="light"
            />
            
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab3"
            tab="选项卡 3">
            <MainWin></MainWin>
            <!-- <DevpageBone class="flex flex-grow h-full w-full justify-center items-center"></DevpageBone> -->
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab4"
            tab="选项卡 4">
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab4"
            tab="选项卡 5">
        </n-tab-pane>
    </n-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import "../../assets/custom.css"
import { NCard, NTabs, NTabPane, NButton, NDivider, NTooltip } from 'naive-ui';
import Button1 from '../Components/Button1.vue';
import Card1 from '../Components/Card1.vue';
import Card2 from '../Components/Card2.vue';
import Card3 from '../Components/Card3.vue';
import Clock from '../Components/Clock.vue';
import Card4 from '../Components/Card4.vue';
import DevpageBone from '../DevPage/DevpageBone.vue';
import MainWin from '../App/MainWin.vue';

// 初始化激活的选项卡
const activeTab = ref<string>('tab1'); 
const handleTabChange = (value: string) => {
    console.log('tab change to ', value);
}; scrollBy
const changeTab = (tabName: string) => {
    activeTab.value = tabName;
};
</script>

<style scoped>
.c-css {
    /*
      @apply border-2
     */
    @apply border-2 border-emerald-300
}
</style>