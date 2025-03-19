<template>
    <n-layout has-sider style="height: 400px;">
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        style="background-color: #f0f2f5;"
      >
        <div style="padding: 16px;">
          <n-skeleton width="100%" height="20px" />
          <n-skeleton width="100%" height="20px" style="margin-top: 8px;"/>
          <n-skeleton width="100%" height="20px" style="margin-top: 8px;"/>
        </div>
      </n-layout-sider>
      <n-layout>
          <n-layout-header bordered style="background-color: #e6f7ff;">
              <div style="padding: 16px;">
                 <n-skeleton width="100px" height="20px" />
              </div>
          </n-layout-header>
        <n-layout-content content-style="padding: 24px; background-color: #fff;" >
          <n-skeleton width="100%" height="160px"/>
          <n-skeleton width="100%" height="20px" style="margin-top: 16px;"/>
          <n-skeleton width="100%" height="20px" style="margin-top: 8px;"/>
           <n-skeleton width="100%" height="20px" style="margin-top: 8px;"/>
        </n-layout-content>
          <n-layout-footer bordered style="background-color: #f0f2f5; padding: 16px;">
              <n-skeleton width="100%" height="20px"/>
          </n-layout-footer>
      </n-layout>
    </n-layout>
  </template>