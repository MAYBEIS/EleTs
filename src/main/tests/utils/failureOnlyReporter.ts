/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-25 19:40:43
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-25 20:06:29
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
            // 清理错误消息，删除冗余的ANSI颜色代码
            let cleanMessage = error.message.replace(/\u001b\[[0-9;]*m/g, '');
            console.log(`   错误 ${errorIndex + 1}: ${cleanMessage}`)
            
            // 检查是否有期望值和实际值的信息
            if (error.expected !== undefined && error.actual !== undefined) {
              console.log(`   期望值: ${JSON.stringify(error.expected)}`)
              console.log(`   实际值: ${JSON.stringify(error.actual)}`)
            }
            
            // 处理堆栈信息，提取测试用例对应的函数
            if (error.stack) {
              // 提取堆栈中的关键信息
              const stackLines = error.stack.split('\n');
              // 查找测试文件中的行
              const testFileLine = stackLines.find((line: string) =>
                line.includes('src\\main\\tests\\utils\\coreCivitai.test.ts') ||
                line.includes('src/main/tests/utils/coreCivitai.test.ts')
              );
              
              if (testFileLine) {
                // 提取行号信息
                const lineMatch = testFileLine.match(/:(\d+):(\d+)/);
                if (lineMatch) {
                  console.log(`   位置: coreCivitai.test.ts:${lineMatch[1]}:${lineMatch[2]}`);
                }
                
                // 尝试提取函数名（如果有）
                const functionMatch = testFileLine.match(/at\s+([a-zA-Z0-9_]+)\s*\(/);
                if (functionMatch && functionMatch[1] !== 'Object') {
                  console.log(`   函数: ${functionMatch[1]}`);
                }
              }
            }
          })
        } else if (test.result?.error) {
          // 清理错误消息，删除冗余的ANSI颜色代码
          let cleanMessage = test.result.error.message.replace(/\u001b\[[0-9;]*m/g, '');
          console.log(`   错误: ${cleanMessage}`)
          
          // 检查是否有期望值和实际值的信息
          if (test.result.error.expected !== undefined && test.result.error.actual !== undefined) {
            console.log(`   期望值: ${JSON.stringify(test.result.error.expected)}`)
            console.log(`   实际值: ${JSON.stringify(test.result.error.actual)}`)
          }
          
          // 处理堆栈信息，提取测试用例对应的函数
          if (test.result.error.stack) {
            // 提取堆栈中的关键信息
            const stackLines = test.result.error.stack.split('\n');
            // 查找测试文件中的行
            const testFileLine = stackLines.find((line: string) =>
              line.includes('src\\main\\tests\\utils\\coreCivitai.test.ts') ||
              line.includes('src/main/tests/utils/coreCivitai.test.ts')
            );
            
            if (testFileLine) {
              // 提取行号信息
              const lineMatch = testFileLine.match(/:(\d+):(\d+)/);
              if (lineMatch) {
                console.log(`   位置: coreCivitai.test.ts:${lineMatch[1]}:${lineMatch[2]}`);
              }
              
              // 尝试提取函数名（如果有）
              const functionMatch = testFileLine.match(/at\s+([a-zA-Z0-9_]+)\s*\(/);
              if (functionMatch && functionMatch[1] !== 'Object') {
                console.log(`   函数: ${functionMatch[1]}`);
              }
            }
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
          errorInfo = test.result.errors.map((error: any) => {
            // 清理错误消息，删除冗余的ANSI颜色代码
            let cleanMessage = error.message.replace(/\u001b\[[0-9;]*m/g, '');
            
            // 简化堆栈信息，只保留关键部分
            let simplifiedStack = null;
            if (error.stack) {
              // 提取堆栈中的关键信息
              const stackLines = error.stack.split('\n');
              // 查找测试文件中的行
              const testFileLine = stackLines.find((line: string) =>
                line.includes('src\\main\\tests\\utils\\coreCivitai.test.ts') ||
                line.includes('src/main/tests/utils/coreCivitai.test.ts')
              );
              
              // 查找源代码文件中的行
              const sourceFileLine = stackLines.find((line: string) =>
                line.includes('src\\main\\utils\\coreCivitai.ts') ||
                line.includes('src/main/utils/coreCivitai.ts')
              );
              
              simplifiedStack = [];
              if (testFileLine) simplifiedStack.push(testFileLine.trim());
              if (sourceFileLine) simplifiedStack.push(sourceFileLine.trim());
            }
            
            return {
              message: cleanMessage,
              stack: simplifiedStack,
              expected: error.expected,
              actual: error.actual
            };
          });
        } else if (test.result?.error) {
          // 清理错误消息，删除冗余的ANSI颜色代码
          let cleanMessage = test.result.error.message.replace(/\u001b\[[0-9;]*m/g, '');
          
          // 简化堆栈信息，只保留关键部分
          let simplifiedStack = null;
          if (test.result.error.stack) {
            // 提取堆栈中的关键信息
            const stackLines = test.result.error.stack.split('\n');
            // 查找测试文件中的行
            const testFileLine = stackLines.find((line: string) =>
              line.includes('src\\main\\tests\\utils\\coreCivitai.test.ts') ||
              line.includes('src/main/tests/utils/coreCivitai.test.ts')
            );
            
            // 查找源代码文件中的行
            const sourceFileLine = stackLines.find((line: string) =>
              line.includes('src\\main\\utils\\coreCivitai.ts') ||
              line.includes('src/main/utils/coreCivitai.ts')
            );
            
            simplifiedStack = [];
            if (testFileLine) simplifiedStack.push(testFileLine.trim());
            if (sourceFileLine) simplifiedStack.push(sourceFileLine.trim());
          }
          
          errorInfo = {
            message: cleanMessage,
            stack: simplifiedStack,
            expected: test.result.error.expected,
            actual: test.result.error.actual
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