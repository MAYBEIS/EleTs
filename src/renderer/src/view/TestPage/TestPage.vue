<template>
    <n-tabs class="flex no-select" v-model:value="activeTab" @update:value="handleTabChange">
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-12 justify-center items-center" name="tab1" tab="选项卡 1">
            <!-- <Button1></Button1> -->
            <card1 class="c-css"></card1>
            <card2 class="c-css"></card2>
            <Button1 class="c-css"></Button1>
            <Card3 class="c-css"></Card3>
            <div>1112311</div>
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab2" tab="选项卡 2">
            <!-- <DevpageBone class="flex flex-grow h-full w-full justify-center items-center"></DevpageBone> -->
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab3" tab="选项卡 3">
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab4" tab="选项卡 4">
        </n-tab-pane>
      </n-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { NCard, NTabs, NTabPane, NButton, NDivider, NTooltip } from 'naive-ui';
import Button1 from '../Components/Button1.vue';
import Card1 from '../Components/Card1.vue';
import Card2 from '../Components/Card2.vue';
import Card3 from '../Components/Card3.vue';
import "../../assets/custom.css"
import DevpageBone from '../DevPage/DevpageBone.vue';

const activeTab = ref<string>('tab1'); // 初始化激活的选项卡
const handleTabChange = (value: string) => {
    console.log('tab change to ', value);
};scrollBy
const changeTab = (tabName: string) => {
    activeTab.value = tabName;
};
</script>

<style scoped>
.c-css{
    /*
      @apply border-2
     */
    @apply border-2
    border-emerald-300
}
</style>