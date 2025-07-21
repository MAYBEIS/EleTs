import { commonDatabase } from '../index'
import CommonFolder from '../entity/Game/CommonFolder'

/**
 * CommonFolder 数据访问层
 * 提供对常用文件夹数据的 CRUD 操作
 */
export class CommonFolderMapper {
  
  /**
   * 添加常用文件夹
   */
  async add(folder: CommonFolder): Promise<string> {
    return await commonDatabase.commonFolderTable.add(folder)
  }

  /**
   * 根据ID获取文件夹
   */
  async getById(id: string): Promise<CommonFolder | undefined> {
    return await commonDatabase.commonFolderTable.get(id)
  }

  /**
   * 获取所有文件夹
   */
  async getAll(): Promise<CommonFolder[]> {
    return await commonDatabase.commonFolderTable.toArray()
  }

  /**
   * 根据游戏ID获取文件夹列表
   */
  async getByGameId(gameId: string): Promise<CommonFolder[]> {
    return await commonDatabase.commonFolderTable
      .where('game_id')
      .equals(gameId)
      .toArray()
  }

  /**
   * 根据路径查找文件夹
   */
  async getByPath(path: string): Promise<CommonFolder | undefined> {
    return await commonDatabase.commonFolderTable
      .where('path')
      .equals(path)
      .first()
  }

  /**
   * 更新文件夹信息
   */
  async update(id: string, updates: Partial<CommonFolder>): Promise<number> {
    return await commonDatabase.commonFolderTable.update(id, updates)
  }

  /**
   * 删除文件夹
   */
  async delete(id: string): Promise<void> {
    await commonDatabase.commonFolderTable.delete(id)
  }

  /**
   * 批量删除
   */
  async deleteByGameId(gameId: string): Promise<number> {
    return await commonDatabase.commonFolderTable
      .where('game_id')
      .equals(gameId)
      .delete()
  }

  /**
   * 检查路径是否已存在
   */
  async existsByPath(path: string): Promise<boolean> {
    const count = await commonDatabase.commonFolderTable
      .where('path')
      .equals(path)
      .count()
    return count > 0
  }

  /**
   * 获取文件夹总数
   */
  async count(): Promise<number> {
    return await commonDatabase.commonFolderTable.count()
  }
}

export const commonFolderMapper = new CommonFolderMapper()