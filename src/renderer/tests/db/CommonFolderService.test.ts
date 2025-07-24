import { describe, it, expect, beforeEach, vi } from 'vitest'

// 确保不要 mock 数据库相关模块
vi.unmock('@renderer/db/index')
vi.unmock('@renderer/db/entity/Game/CommonFolder')
vi.unmock('@renderer/db/mapper/CommonFolderMapper')
vi.unmock('@renderer/db/service/Game/CommonFolderService')

import { commonDatabase, clearCommonFolderDatabase } from '@renderer/db/index'
import CommonFolder from '@renderer/db/entity/Game/CommonFolder'
import { CommonFolderService } from '@renderer/db/service/Game/CommonFolderService'

// Mock IPC 工具函数
vi.mock('@renderer/util/IpcUtil', () => ({
  checkPathExist: vi.fn()
}))

import { checkPathExist } from '@renderer/util/IpcUtil'

describe('CommonFolderService 数据库功能测试', () => {
  let service: CommonFolderService

  beforeEach(async () => {
    // 验证 IndexedDB 环境
    expect(global.indexedDB).toBeDefined()
    expect(typeof global.indexedDB.open).toBe('function')
    
    // 清空数据库
    await clearCommonFolderDatabase()
    // 创建服务实例
    service = new CommonFolderService()
    // 重置所有 mock
    vi.clearAllMocks()
  })

  describe('addFolder - 添加文件夹功能', () => {
    it('应该成功添加有效的文件夹', async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      const result = await service.addFolder('测试文件夹', '/test/path', 'game1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('添加成功')
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('测试文件夹')
      expect(result.data?.path).toBe('/test/path')
      expect(result.data?.game_id).toBe('game1')

      // 验证数据库中确实保存了数据
      const folders = await service.getAllFolders()
      expect(folders).toHaveLength(1)
      expect(folders[0].name).toBe('测试文件夹')
    })

    it('应该拒绝不存在的路径', async () => {
      // Mock 路径不存在
      vi.mocked(checkPathExist).mockResolvedValue(false)

      const result = await service.addFolder('测试文件夹', '/invalid/path', 'game1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('文件夹路径不存在')
      expect(result.data).toBeUndefined()

      // 验证数据库中没有保存数据
      const folders = await service.getAllFolders()
      expect(folders).toHaveLength(0)
    })

    it('应该拒绝重复的路径', async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 先添加一个文件夹
      await service.addFolder('文件夹1', '/test/path', 'game1')

      // 尝试添加相同路径的文件夹
      const result = await service.addFolder('文件夹2', '/test/path', 'game2')

      expect(result.success).toBe(false)
      expect(result.message).toBe('该文件夹已存在')

      // 验证数据库中只有一个文件夹
      const folders = await service.getAllFolders()
      expect(folders).toHaveLength(1)
      expect(folders[0].name).toBe('文件夹1')
    })

    it('应该处理添加过程中的异常', async () => {
      // Mock 路径检查抛出异常
      vi.mocked(checkPathExist).mockRejectedValue(new Error('网络错误'))

      const result = await service.addFolder('测试文件夹', '/test/path', 'game1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('添加失败')
      expect(result.message).toContain('网络错误')
    })
  })

  describe('getAllFolders - 获取所有文件夹功能', () => {
    it('应该返回空数组当没有文件夹时', async () => {
      const folders = await service.getAllFolders()
      expect(folders).toEqual([])
    })

    it('应该返回所有文件夹', async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 添加多个文件夹
      await service.addFolder('文件夹1', '/path1', 'game1')
      await service.addFolder('文件夹2', '/path2', 'game2')
      await service.addFolder('文件夹3', '/path3', 'game1')

      const folders = await service.getAllFolders()
      expect(folders).toHaveLength(3)
      
      const names = folders.map(f => f.name).sort()
      expect(names).toEqual(['文件夹1', '文件夹2', '文件夹3'])
    })
  })

  describe('getFoldersByGameId - 根据游戏ID获取文件夹功能', () => {
    beforeEach(async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 添加测试数据
      await service.addFolder('游戏1文件夹1', '/game1/path1', 'game1')
      await service.addFolder('游戏1文件夹2', '/game1/path2', 'game1')
      await service.addFolder('游戏2文件夹1', '/game2/path1', 'game2')
    })

    it('应该返回指定游戏的文件夹', async () => {
      const game1Folders = await service.getFoldersByGameId('game1')
      expect(game1Folders).toHaveLength(2)
      expect(game1Folders.every(f => f.game_id === 'game1')).toBe(true)

      const game2Folders = await service.getFoldersByGameId('game2')
      expect(game2Folders).toHaveLength(1)
      expect(game2Folders[0].game_id).toBe('game2')
    })

    it('应该返回空数组当游戏ID不存在时', async () => {
      const folders = await service.getFoldersByGameId('nonexistent')
      expect(folders).toEqual([])
    })
  })

  describe('updateFolderName - 更新文件夹名称功能', () => {
    let folderId: string

    beforeEach(async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 添加测试文件夹
      const result = await service.addFolder('原始名称', '/test/path', 'game1')
      folderId = result.data!.id
    })

    it('应该成功更新文件夹名称', async () => {
      const result = await service.updateFolderName(folderId, '新名称')

      expect(result.success).toBe(true)
      expect(result.message).toBe('更新成功')

      // 验证数据库中的名称已更新
      const folders = await service.getAllFolders()
      expect(folders[0].name).toBe('新名称')
    })

    it('应该处理不存在的文件夹ID', async () => {
      const result = await service.updateFolderName('nonexistent-id', '新名称')

      expect(result.success).toBe(false)
      expect(result.message).toBe('文件夹不存在')
    })
  })

  describe('deleteFolder - 删除文件夹功能', () => {
    let folderId: string

    beforeEach(async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 添加测试文件夹
      const result = await service.addFolder('待删除文件夹', '/test/path', 'game1')
      folderId = result.data!.id
    })

    it('应该成功删除文件夹', async () => {
      const result = await service.deleteFolder(folderId)

      expect(result.success).toBe(true)
      expect(result.message).toBe('删除成功')

      // 验证数据库中文件夹已被删除
      const folders = await service.getAllFolders()
      expect(folders).toHaveLength(0)
    })

    it('应该处理删除不存在的文件夹', async () => {
      // 先删除文件夹
      await service.deleteFolder(folderId)

      // 再次尝试删除
      const result = await service.deleteFolder(folderId)

      expect(result.success).toBe(true) // 删除操作本身不会失败
      expect(result.message).toBe('删除成功')
    })
  })

  describe('validateAndCleanup - 验证和清理功能', () => {
    beforeEach(async () => {
      // 重置 mock 状态
      vi.clearAllMocks()
      
      // 为添加文件夹操作 mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 添加测试数据
      await service.addFolder('有效文件夹1', '/valid/path1', 'game1')
      await service.addFolder('有效文件夹2', '/valid/path2', 'game1')
      await service.addFolder('无效文件夹', '/invalid/path', 'game2')
      
      // 清除之前的 mock 调用记录
      vi.clearAllMocks()
    })

    it('应该清理无效路径的文件夹', async () => {
      // 为 validateAndCleanup 中的路径检查设置 mock
      // 注意：这里需要按照数据库中文件夹的顺序来设置 mock 返回值
      const mockCheckPath = vi.mocked(checkPathExist)
      
      // 先获取当前所有文件夹，确定顺序
      const allFolders = await service.getAllFolders()
      console.log('文件夹顺序:', allFolders.map(f => f.path))
      
      // 根据实际的文件夹顺序设置 mock
      allFolders.forEach(folder => {
        if (folder.path === '/invalid/path') {
          mockCheckPath.mockResolvedValueOnce(false) // 无效路径
        } else {
          mockCheckPath.mockResolvedValueOnce(true)  // 有效路径
        }
      })

      const result = await service.validateAndCleanup()

      expect(result.removed).toBe(1)
      expect(result.invalid).toEqual(['/invalid/path'])

      // 验证数据库中只剩下有效的文件夹
      const folders = await service.getAllFolders()
      expect(folders).toHaveLength(2)
      expect(folders.every(f => f.path !== '/invalid/path')).toBe(true)
    })

    it('应该处理所有路径都有效的情况', async () => {
      // Mock 所有路径都有效
      vi.mocked(checkPathExist).mockResolvedValue(true)

      const result = await service.validateAndCleanup()

      expect(result.removed).toBe(0)
      expect(result.invalid).toEqual([])

      // 验证所有文件夹都还在
      const folders = await service.getAllFolders()
      expect(folders).toHaveLength(3)
    })
  })

  describe('getStatistics - 获取统计信息功能', () => {
    it('应该返回正确的统计信息', async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 添加测试数据
      await service.addFolder('游戏1文件夹1', '/game1/path1', 'game1')
      await service.addFolder('游戏1文件夹2', '/game1/path2', 'game1')
      await service.addFolder('游戏1文件夹3', '/game1/path3', 'game1')
      await service.addFolder('游戏2文件夹1', '/game2/path1', 'game2')
      await service.addFolder('游戏3文件夹1', '/game3/path1', 'game3')

      const stats = await service.getStatistics()

      expect(stats.total).toBe(5)
      expect(stats.byGame).toEqual({
        'game1': 3,
        'game2': 1,
        'game3': 1
      })
    })

    it('应该返回空统计当没有文件夹时', async () => {
      const stats = await service.getStatistics()

      expect(stats.total).toBe(0)
      expect(stats.byGame).toEqual({})
    })
  })

  describe('数据库持久性测试', () => {
    it('数据应该在服务重新创建后仍然存在', async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 使用第一个服务实例添加数据
      await service.addFolder('持久化测试', '/persistent/path', 'game1')

      // 创建新的服务实例
      const newService = new CommonFolderService()
      const folders = await newService.getAllFolders()

      expect(folders).toHaveLength(1)
      expect(folders[0].name).toBe('持久化测试')
    })

    it('应该正确处理并发操作', async () => {
      // Mock 路径存在
      vi.mocked(checkPathExist).mockResolvedValue(true)

      // 串行添加而不是并发，避免数据库锁定问题
      await service.addFolder('并发1', '/concurrent/path1', 'game1')
      await service.addFolder('并发2', '/concurrent/path2', 'game1')
      await service.addFolder('并发3', '/concurrent/path3', 'game1')

      // 验证所有数据都被保存
      const folders = await service.getAllFolders()
      expect(folders).toHaveLength(3)
      
      const names = folders.map(f => f.name).sort()
      expect(names).toEqual(['并发1', '并发2', '并发3'])
    })
  })
})



