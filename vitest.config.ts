/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 13:03:40
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-25 00:01:18
 * @FilePath: \EleTs\vitest.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

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
    
    setupFiles: ['./src/renderer/tests/setup.ts'],
    
    ui: {
      host: '127.0.0.1',
      port: 3333
    },
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
  }
})


