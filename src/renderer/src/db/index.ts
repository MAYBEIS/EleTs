/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-07-21 11:45:59
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-07-21 11:48:50
 * @FilePath: \EleTs\src\renderer\src\db\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 导入 CommonFolder 实体
import CommonFolder from "@renderer/db/entity/Game/CommonFolder"

// 导入 Dexie 数据库框架
import Dexie, { Table } from 'dexie'

/**
 * 通用数据库类 - 存储常用文件夹信息
 * 管理用户常用的文件夹路径
 */
class CommonDatabase extends Dexie {
  // 常用文件夹表 - 存储用户常用的文件夹路径
  commonFolderTable!: Table<CommonFolder, string>

  constructor() {
    super('CommonDatabase')
    // 定义数据库版本1的表结构
    this.version(1).stores({
      // 常用文件夹表字段：ID、名称、路径、关联游戏ID、创建时间
      commonFolderTable: 'id,name,path,game_id,created_at'
    })
  }
}

// 导出数据库实例，供应用程序使用
export const commonDatabase = new CommonDatabase()

/**
 * 清空常用文件夹数据库的所有数据
 * 用于重新扫描或重置文件夹信息时使用
 */
export async function clearCommonFolderDatabase() {
  await commonDatabase.commonFolderTable.clear()
}
