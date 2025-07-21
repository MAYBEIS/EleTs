import { describe, it, expect, beforeEach } from 'vitest'
import { commonDatabase, clearCommonFolderDatabase } from '@renderer/db/index'
import CommonFolder from '@renderer/db/entity/Game/CommonFolder'

describe('CommonDatabase 数据库测试', () => {
  
  beforeEach(async () => {
    await clearCommonFolderDatabase()
  })

  it('应该能添加文件夹到数据库', async () => {
    const folder = new CommonFolder('测试文件夹', '/test/path', 'game1')
    
    await commonDatabase.commonFolderTable.add(folder)
    
    const saved = await commonDatabase.commonFolderTable.get(folder.id)
    expect(saved).toBeDefined()
    expect(saved?.name).toBe('测试文件夹')
    expect(saved?.path).toBe('/test/path')
    expect(saved?.game_id).toBe('game1')
  })

  it('应该能查询所有文件夹', async () => {
    const folder1 = new CommonFolder('文件夹1', '/path1', 'game1')
    const folder2 = new CommonFolder('文件夹2', '/path2', 'game2')
    
    await commonDatabase.commonFolderTable.bulkAdd([folder1, folder2])
    
    const all = await commonDatabase.commonFolderTable.toArray()
    expect(all).toHaveLength(2)
  })

  it('应该能根据游戏ID查询文件夹', async () => {
    const folder1 = new CommonFolder('文件夹1', '/path1', 'game1')
    const folder2 = new CommonFolder('文件夹2', '/path2', 'game1')
    const folder3 = new CommonFolder('文件夹3', '/path3', 'game2')
    
    await commonDatabase.commonFolderTable.bulkAdd([folder1, folder2, folder3])
    
    const game1Folders = await commonDatabase.commonFolderTable
      .where('game_id')
      .equals('game1')
      .toArray()
    
    expect(game1Folders).toHaveLength(2)
    expect(game1Folders.every(f => f.game_id === 'game1')).toBe(true)
  })

  it('应该能更新文件夹信息', async () => {
    const folder = new CommonFolder('原名称', '/path', 'game1')
    await commonDatabase.commonFolderTable.add(folder)
    
    await commonDatabase.commonFolderTable.update(folder.id, { name: '新名称' })
    
    const updated = await commonDatabase.commonFolderTable.get(folder.id)
    expect(updated?.name).toBe('新名称')
  })

  it('应该能删除文件夹', async () => {
    const folder = new CommonFolder('测试', '/path', 'game1')
    await commonDatabase.commonFolderTable.add(folder)
    
    await commonDatabase.commonFolderTable.delete(folder.id)
    
    const deleted = await commonDatabase.commonFolderTable.get(folder.id)
    expect(deleted).toBeUndefined()
  })

  it('清空数据库功能应该正常工作', async () => {
    // 添加一些数据
    const folders = [
      new CommonFolder('文件夹1', '/path1', 'game1'),
      new CommonFolder('文件夹2', '/path2', 'game2')
    ]
    await commonDatabase.commonFolderTable.bulkAdd(folders)
    
    // 验证数据存在
    let count = await commonDatabase.commonFolderTable.count()
    expect(count).toBe(2)
    
    // 清空数据库
    await clearCommonFolderDatabase()
    
    // 验证数据已清空
    count = await commonDatabase.commonFolderTable.count()
    expect(count).toBe(0)
  })
})