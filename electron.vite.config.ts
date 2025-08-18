/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2024-12-08 15:34:41
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-27 21:44:08
 * @FilePath: \EleTs\electron.vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [
      vue(),
      AutoImport({
        imports: [
          'vue',
          // 添加 Headless UI 的自动导入
          {
            '@headlessui/vue': [
              'Dialog',
              'DialogPanel', 
              'DialogTitle',
              'TransitionRoot',
              'TransitionChild',
              'Menu',
              'MenuButton',
              'MenuItems',
              'MenuItem',
              'Listbox',
              'ListboxButton',
              'ListboxOptions',
              'ListboxOption'
            ]
          }
        ]
      }),
      Components({
        // 自动导入组件
        resolvers: []
      })
    ],
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 删除console语句
          drop_debugger: true, // 删除debugger语句
          pure_funcs: ['console.log'] // 删除指定的函数调用
        },
        mangle: {
          properties: {
            regex: /^__/ // 混淆属性名（以__开头）
          }
        },
        format: {
          comments: false // 删除注释
        }
      }
    }
  },
})





