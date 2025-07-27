/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-24 23:57:05
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-27 22:43:21
 * @FilePath: \EleTs\vitest.workspace.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineWorkspace } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineWorkspace([
  // Main 进程测试配置
  {
    test: {
      name: 'main',
      environment: 'node',
      include: ['src/main/**/*.{test,spec}.{js,ts}'],
      exclude: ['node_modules', 'dist', 'out'],
      globals: true,
      clearMocks: true,
      testTimeout: 10000,
      setupFiles: ['./src/main/tests/setup.ts']
    },
    resolve: {
      alias: {
        '@main': resolve(__dirname, 'src/main'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  
  // Renderer 进程测试配置
  {
    plugins: [vue()],
    test: {
      name: 'renderer',
      environment: 'jsdom',
      include: ['src/renderer/**/*.{test,spec}.{js,ts,vue}'],
      exclude: ['node_modules', 'dist', 'out'],
      globals: true,
      clearMocks: true,
      testTimeout: 10000,
      setupFiles: ['./src/renderer/tests/setup.ts']
    },
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    }
  }
])

