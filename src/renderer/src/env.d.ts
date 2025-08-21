/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-21 23:37:00
 * @FilePath: \EleTs\src\renderer\src\env.d.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/// <reference types="vite/client" />
/// <reference types="../../preload/index.d.ts" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
