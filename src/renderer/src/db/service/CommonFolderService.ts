import { commonFolderMapper } from '../mapper/CommonFolderMapper'
import CommonFolder from '../entity/Game/CommonFolder'
import { checkPathExist } from '../../util/IpcUtil'

/**
 * CommonFolder 业务服务层
 * 处理常用文件夹相关的业务逻辑
 */
export class CommonFolderService {

  /**
   * 添加常用文件夹（带验证）
   */
  async addFolder(name: string, path: string, gameId: string): Promise<{ success: boolean; message: string; data?: CommonFolder }> {
    try {
      // 验证路径是否存在
      const pathExists = await checkPathExist(path)
      if (!pathExists) {
        return { success: false, message: '文件夹路径不存在' }
      }

      // 检查路径是否已添加
      const exists = await commonFolderMapper.existsByPath(path)
      if (exists) {
        return { success: false, message: '该文件夹已存在' }
      }

      // 创建并保存
      const folder = new CommonFolder(name, path, gameId)
      await commonFolderMapper.add(folder)
      
      return { success: true, message: '添加成功', data: folder }
    } catch (error) {
      return { success: false, message: `添加失败: ${error}` }
    }
  }

  /**
   * 获取所有文件夹
   */
  async getAllFolders(): Promise<CommonFolder[]> {
    return await commonFolderMapper.getAll()
  }

  /**
   * 根据游戏ID获取文件夹
   */
  async getFoldersByGameId(gameId: string): Promise<CommonFolder[]> {
    return await commonFolderMapper.getByGameId(gameId)
  }

  /**
   * 更新文件夹名称
   */
  async updateFolderName(id: string, newName: string): Promise<{ success: boolean; message: string }> {
    try {
      const updated = await commonFolderMapper.update(id, { name: newName })
      if (updated > 0) {
        return { success: true, message: '更新成功' }
      }
      return { success: false, message: '文件夹不存在' }
    } catch (error) {
      return { success: false, message: `更新失败: ${error}` }
    }
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await commonFolderMapper.delete(id)
      return { success: true, message: '删除成功' }
    } catch (error) {
      return { success: false, message: `删除失败: ${error}` }
    }
  }

  /**
   * 验证并清理无效路径
   */
  async validateAndCleanup(): Promise<{ removed: number; invalid: string[] }> {
    const folders = await commonFolderMapper.getAll()
    const invalidPaths: string[] = []
    let removedCount = 0

    for (const folder of folders) {
      const exists = await checkPathExist(folder.path)
      if (!exists) {
        invalidPaths.push(folder.path)
        await commonFolderMapper.delete(folder.id)
        removedCount++
      }
    }

    return { removed: removedCount, invalid: invalidPaths }
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{ total: number; byGame: Record<string, number> }> {
    const folders = await commonFolderMapper.getAll()
    const byGame: Record<string, number> = {}
    
    folders.forEach(folder => {
      byGame[folder.game_id] = (byGame[folder.game_id] || 0) + 1
    })

    return {
      total: folders.length,
      byGame
    }
  }
}

export const commonFolderService = new CommonFolderService()