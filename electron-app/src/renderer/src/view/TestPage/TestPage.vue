<template>
    <n-tabs class="flex no-select" v-model:value="activeTab" @update:value="handleTabChange">
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab1" tab="选项卡 1">
            <!-- <Button1></Button1> -->
             <card1></card1>
             <card2></card2>
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab2" tab="选项卡 2">
        </n-tab-pane>
        <n-tab-pane class="c-css no-select flex flex-grow flex-col space-y-40 justify-center items-center" name="tab3" tab="选项卡 3">
        </n-tab-pane>
      </n-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { NCard, NTabs, NTabPane, NButton, NDivider, NTooltip } from 'naive-ui';
import Button1 from '../Components/Button1.vue';
import Card1 from '../Components/Card1.vue';
import Card2 from '../Components/Card2.vue';
import "../../assets/custom.css"

const activeTab = ref<string>('tab1'); // 初始化激活的选项卡
const handleTabChange = (value: string) => {
    console.log('tab change to ', value);
};
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