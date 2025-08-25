/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-25 19:40:43
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-25 19:46:08
 * @FilePath: \EleTs\src\main\tests\utils\failureOnlyReporter.ts
 * @Description: 自定义 reporter，只输出失败的测试用例
 */
import type { Reporter, TaskResultPack, UserConsoleLog } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

class FailureOnlyReporter implements Reporter {
  onInit(ctx: any) {
    ctx.logger.log('运行测试中...\n')
  }

  onTaskUpdate(packs: TaskResultPack[]) {
    // 只关注更新的任务
  }

  onFinished(files: any[] | undefined, errors: unknown[] | undefined) {
    if (!files) return
    
    // 收集所有失败的测试
    const failedTests: any[] = []
    
    const collectFailedTests = (tasks: any[]) => {
      for (const task of tasks) {
        if (task.type === 'test') {
          if (task.result?.state === 'fail') {
            failedTests.push(task)
          }
        }
        if (task.tasks && task.tasks.length > 0) {
          collectFailedTests(task.tasks)
        }
      }
    }
    
    files.forEach(file => {
      if (file.tasks && file.tasks.length > 0) {
        collectFailedTests(file.tasks)
      }
    })
    
    // 输出失败的测试
    if (failedTests.length > 0) {
      console.log('\n失败的测试用例:')
      console.log('==================')
      
      failedTests.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.name}`)
        if (test.result?.errors) {
          test.result.errors.forEach((error: any, errorIndex: number) => {
            console.log(`   错误 ${errorIndex + 1}: ${error.message}`)
            if (error.stack) {
              console.log(`   堆栈: ${error.stack.split('\n').slice(0, 3).join('\n         ')}`)
            }
          })
        } else if (test.result?.error) {
          console.log(`   错误: ${test.result.error.message}`)
          if (test.result.error.stack) {
            console.log(`   堆栈: ${test.result.error.stack.split('\n').slice(0, 3).join('\n         ')}`)
          }
        }
      })
      
      console.log(`\n总共 ${failedTests.length} 个测试失败\n`)
    } else {
      console.log('所有测试都通过了！\n')
    }
    
    // 输出错误信息
    if (errors && errors.length > 0) {
      console.log('\n运行时错误:')
      console.log('============')
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error}`)
      })
    }
    
    // 生成只包含失败测试的 JSON 文件
    const failureReport = {
      numFailedTests: failedTests.length,
      failedTests: failedTests.map(test => {
        // 提取错误信息
        let errorInfo = null;
        if (test.result?.errors && test.result.errors.length > 0) {
          errorInfo = test.result.errors.map((error: any) => ({
            message: error.message,
            stack: error.stack
          }));
        } else if (test.result?.error) {
          errorInfo = {
            message: test.result.error.message,
            stack: test.result.error.stack
          };
        }
        
        return {
          name: test.name,
          fullName: test.fullName,
          error: errorInfo
        };
      }),
      errors: errors || []
    }
    
    // 确保目录存在
    const outputPath = path.join(process.cwd(), 'test-results', 'failed-tests.json')
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // 写入文件
    fs.writeFileSync(outputPath, JSON.stringify(failureReport, null, 2))
    console.log(`\n失败测试报告已保存到: ${outputPath}\n`)
  }

  onConsoleLog(log: UserConsoleLog) {
    // 可以选择是否输出控制台日志
  }
}

export default FailureOnlyReporter