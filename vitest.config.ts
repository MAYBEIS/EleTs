/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 13:03:40
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-25 19:44:33
 * @FilePath: \EleTs\vitest.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import FailureOnlyReporter from './src/main/tests/utils/failureOnlyReporter'

export default defineConfig({
  test: {
    environment: 'jsdom',
    
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    exclude: [
      'node_modules',
      'dist',
      'out',
      '.git',
      '.cache'
    ],
    
    globals: true,
    clearMocks: true,
    testTimeout: 10000,
    
    // 配置测试报告输出到文件，只输出失败的测试用例
    reporters: ['default', new FailureOnlyReporter(), 'junit'],
    outputFile: {
      junit: 'test-results/junit.xml'
    },
    
    setupFiles: ['./src/renderer/tests/setup.ts'],
    
    // 启用 UI
    ui: true,
    // API 配置
    api: {
      host: '127.0.0.1',
      port: 3334
    },
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/renderer/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    }
  },
  
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'src/main'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },

  // 添加 esbuild 配置来处理 Vue 文件
  esbuild: {
    target: 'node14'
  },

  // 定义外部依赖，避免打包问题
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
})
