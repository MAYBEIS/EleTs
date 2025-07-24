import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ipcMain } from 'electron'
import { initUserIpc, initTestUsers, getUserCount, clearAllUsers } from '../../ipc/userIpc'

// Mock electron 模块
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn()
  }
}))

// 模拟 IPC 处理器存储
const ipcHandlers = new Map<string, Function>()

// Mock ipcMain.handle 实现
const mockIpcHandle = vi.mocked(ipcMain.handle)
mockIpcHandle.mockImplementation((channel: string, handler: Function) => {
  ipcHandlers.set(channel, handler)
})

// 辅助函数：调用 IPC 处理器
const callIpcHandler = async (channel: string, ...args: any[]) => {
  const handler = ipcHandlers.get(channel)
  if (!handler) {
    throw new Error(`No handler found for channel: ${channel}`)
  }
  return await handler({}, ...args)
}

describe('用户 IPC 处理程序测试', () => {
  beforeEach(() => {
    // 清空所有用户数据
    clearAllUsers()
    // 初始化 IPC 处理程序
    initUserIpc()
  })

  afterEach(() => {
    // 清理
    ipcHandlers.clear()
    vi.clearAllMocks()
  })

  describe('用户创建 (user:create)', () => {
    it('应该成功创建新用户', async () => {
      const userData = {
        name: '测试用户',
        email: 'test@example.com',
        password: '123456',
        nickname: '测试',
        word: '这是测试用户'
      }

      const result = await callIpcHandler('user:create', userData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.id).toBe(1)
      expect(result.data.email).toBe(userData.email)
      expect(result.data.name).toBe(userData.name)
      expect(result.data.password).toBeUndefined() // 密码不应该返回
      expect(result.message).toBe('注册成功')
    })

    it('应该拒绝重复的邮箱', async () => {
      const userData = {
        name: '测试用户1',
        email: 'test@example.com',
        password: '123456',
        nickname: '测试1',
        word: '测试用户1'
      }

      // 创建第一个用户
      await callIpcHandler('user:create', userData)

      // 尝试创建相同邮箱的用户
      const duplicateUser = { ...userData, name: '测试用户2' }
      const result = await callIpcHandler('user:create', duplicateUser)

      expect(result.success).toBe(false)
      expect(result.message).toBe('邮箱已被注册')
    })

    it('应该正确处理创建用户时的异常', async () => {
      // 通过传入无效数据来触发异常
      const result = await callIpcHandler('user:create', null)

      expect(result.success).toBe(false)
      expect(result.message).toBe('创建用户失败')
    })
  })

  describe('用户登录 (user:login)', () => {
    beforeEach(async () => {
      // 创建测试用户
      await callIpcHandler('user:create', {
        name: '登录测试用户',
        email: 'login@example.com',
        password: '123456',
        nickname: '登录测试',
        word: '用于登录测试'
      })
    })

    it('应该成功登录有效用户', async () => {
      const result = await callIpcHandler('user:login', 'login@example.com', '123456')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.email).toBe('login@example.com')
      expect(result.data.password).toBeUndefined() // 密码不应该返回
      expect(result.message).toBe('登录成功')
    })

    it('应该拒绝错误的邮箱', async () => {
      const result = await callIpcHandler('user:login', 'wrong@example.com', '123456')

      expect(result.success).toBe(false)
      expect(result.message).toBe('邮箱或密码错误')
    })

    it('应该拒绝错误的密码', async () => {
      const result = await callIpcHandler('user:login', 'login@example.com', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.message).toBe('邮箱或密码错误')
    })
  })

  describe('获取用户信息', () => {
    let userId: number

    beforeEach(async () => {
      const createResult = await callIpcHandler('user:create', {
        name: '查询测试用户',
        email: 'query@example.com',
        password: '123456',
        nickname: '查询测试',
        word: '用于查询测试'
      })
      userId = createResult.data.id
    })

    it('应该能通过ID获取用户信息 (user:get-by-id)', async () => {
      const result = await callIpcHandler('user:get-by-id', userId)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.id).toBe(userId)
      expect(result.data.email).toBe('query@example.com')
      expect(result.data.password).toBeUndefined()
    })

    it('应该能通过邮箱获取用户信息 (user:get-by-email)', async () => {
      const result = await callIpcHandler('user:get-by-email', 'query@example.com')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.email).toBe('query@example.com')
      expect(result.data.password).toBeUndefined()
    })

    it('应该处理不存在的用户ID', async () => {
      const result = await callIpcHandler('user:get-by-id', 999)

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户不存在')
    })

    it('应该处理不存在的邮箱', async () => {
      const result = await callIpcHandler('user:get-by-email', 'notexist@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户不存在')
    })
  })

  describe('获取所有用户 (user:get-all)', () => {
    it('应该返回空数组当没有用户时', async () => {
      const result = await callIpcHandler('user:get-all')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('应该返回所有用户信息（不包含密码）', async () => {
      // 创建两个测试用户
      await callIpcHandler('user:create', {
        name: '用户1',
        email: 'user1@example.com',
        password: '123456',
        nickname: '用户1',
        word: '第一个用户'
      })

      await callIpcHandler('user:create', {
        name: '用户2',
        email: 'user2@example.com',
        password: '123456',
        nickname: '用户2',
        word: '第二个用户'
      })

      const result = await callIpcHandler('user:get-all')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].password).toBeUndefined()
      expect(result.data[1].password).toBeUndefined()
      expect(result.data[0].email).toBe('user1@example.com')
      expect(result.data[1].email).toBe('user2@example.com')
    })
  })

  describe('更新用户信息 (user:update)', () => {
    let userId: number

    beforeEach(async () => {
      const createResult = await callIpcHandler('user:create', {
        name: '更新测试用户',
        email: 'update@example.com',
        password: '123456',
        nickname: '更新测试',
        word: '用于更新测试'
      })
      userId = createResult.data.id
    })

    it('应该成功更新用户信息', async () => {
      const updateData = {
        name: '更新后的用户',
        nickname: '新昵称',
        word: '更新后的个人简介'
      }

      const result = await callIpcHandler('user:update', userId, updateData)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe(updateData.name)
      expect(result.data.nickname).toBe(updateData.nickname)
      expect(result.data.word).toBe(updateData.word)
      expect(result.data.email).toBe('update@example.com') // 邮箱未更新
      expect(result.message).toBe('更新成功')
    })

    it('应该能更新邮箱（如果不重复）', async () => {
      const result = await callIpcHandler('user:update', userId, {
        email: 'newemail@example.com'
      })

      expect(result.success).toBe(true)
      expect(result.data.email).toBe('newemail@example.com')
    })

    it('应该拒绝重复的邮箱更新', async () => {
      // 创建另一个用户
      await callIpcHandler('user:create', {
        name: '另一个用户',
        email: 'another@example.com',
        password: '123456',
        nickname: '另一个',
        word: '另一个用户'
      })

      // 尝试将第一个用户的邮箱更新为第二个用户的邮箱
      const result = await callIpcHandler('user:update', userId, {
        email: 'another@example.com'
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('邮箱已被其他用户使用')
    })

    it('应该处理不存在的用户ID', async () => {
      const result = await callIpcHandler('user:update', 999, { name: '新名字' })

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户不存在')
    })
  })

  describe('删除用户 (user:delete)', () => {
    let userId: number

    beforeEach(async () => {
      const createResult = await callIpcHandler('user:create', {
        name: '删除测试用户',
        email: 'delete@example.com',
        password: '123456',
        nickname: '删除测试',
        word: '用于删除测试'
      })
      userId = createResult.data.id
    })

    it('应该成功删除用户', async () => {
      const result = await callIpcHandler('user:delete', userId)

      expect(result.success).toBe(true)
      expect(result.message).toBe('删除成功')

      // 验证用户已被删除
      const getResult = await callIpcHandler('user:get-by-id', userId)
      expect(getResult.success).toBe(false)
    })

    it('应该处理不存在的用户ID', async () => {
      const result = await callIpcHandler('user:delete', 999)

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户不存在')
    })
  })

  describe('邮箱检查 (user:check-email-exists)', () => {
    beforeEach(async () => {
      await callIpcHandler('user:create', {
        name: '邮箱检查用户',
        email: 'check@example.com',
        password: '123456',
        nickname: '邮箱检查',
        word: '用于邮箱检查测试'
      })
    })

    it('应该正确检测存在的邮箱', async () => {
      const result = await callIpcHandler('user:check-email-exists', 'check@example.com')

      expect(result.success).toBe(true)
      expect(result.data.exists).toBe(true)
    })

    it('应该正确检测不存在的邮箱', async () => {
      const result = await callIpcHandler('user:check-email-exists', 'notexist@example.com')

      expect(result.success).toBe(true)
      expect(result.data.exists).toBe(false)
    })
  })

  describe('修改密码 (user:change-password)', () => {
    let userId: number

    beforeEach(async () => {
      const createResult = await callIpcHandler('user:create', {
        name: '密码测试用户',
        email: 'password@example.com',
        password: '123456',
        nickname: '密码测试',
        word: '用于密码测试'
      })
      userId = createResult.data.id
    })

    it('应该成功修改密码', async () => {
      const result = await callIpcHandler('user:change-password', userId, '123456', 'newpassword')

      expect(result.success).toBe(true)
      expect(result.message).toBe('密码修改成功')

      // 验证新密码可以登录
      const loginResult = await callIpcHandler('user:login', 'password@example.com', 'newpassword')
      expect(loginResult.success).toBe(true)
    })

    it('应该拒绝错误的旧密码', async () => {
      const result = await callIpcHandler('user:change-password', userId, 'wrongpassword', 'newpassword')

      expect(result.success).toBe(false)
      expect(result.message).toBe('原密码错误')
    })

    it('应该处理不存在的用户ID', async () => {
      const result = await callIpcHandler('user:change-password', 999, '123456', 'newpassword')

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户不存在')
    })
  })

  describe('批量删除用户 (user:batch-delete)', () => {
    let userIds: number[]

    beforeEach(async () => {
      userIds = []
      
      // 创建三个测试用户
      for (let i = 1; i <= 3; i++) {
        const result = await callIpcHandler('user:create', {
          name: `批量测试用户${i}`,
          email: `batch${i}@example.com`,
          password: '123456',
          nickname: `批量${i}`,
          word: `第${i}个批量测试用户`
        })
        userIds.push(result.data.id)
      }
    })

    it('应该成功批量删除用户', async () => {
      const result = await callIpcHandler('user:batch-delete', [userIds[0], userIds[2]])

      expect(result.success).toBe(true)
      expect(result.data.deletedCount).toBe(2)
      expect(result.message).toBe('成功删除 2 个用户')

      // 验证用户已被删除
      const getResult1 = await callIpcHandler('user:get-by-id', userIds[0])
      const getResult2 = await callIpcHandler('user:get-by-id', userIds[1])
      const getResult3 = await callIpcHandler('user:get-by-id', userIds[2])

      expect(getResult1.success).toBe(false)
      expect(getResult2.success).toBe(true) // 这个用户没有被删除
      expect(getResult3.success).toBe(false)
    })

    it('应该处理空的用户ID数组', async () => {
      const result = await callIpcHandler('user:batch-delete', [])

      expect(result.success).toBe(true)
      expect(result.data.deletedCount).toBe(0)
    })

    it('应该处理不存在的用户ID', async () => {
      const result = await callIpcHandler('user:batch-delete', [999, 1000])

      expect(result.success).toBe(true)
      expect(result.data.deletedCount).toBe(0)
    })
  })

  describe('搜索用户 (user:search)', () => {
    beforeEach(async () => {
      // 创建多个测试用户用于搜索
      const testUsers = [
        { name: '张三', email: 'zhangsan@example.com', nickname: '小张', word: '热爱编程' },
        { name: '李四', email: 'lisi@example.com', nickname: '小李', word: '设计师' },
        { name: '王五', email: 'wangwu@example.com', nickname: '小王', word: '产品经理' }
      ]

      for (const user of testUsers) {
        await callIpcHandler('user:create', {
          ...user,
          password: '123456'
        })
      }
    })

    it('应该能通过姓名搜索用户', async () => {
      const result = await callIpcHandler('user:search', '张三')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('张三')
    })

    it('应该能通过昵称搜索用户', async () => {
      const result = await callIpcHandler('user:search', '小李')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].nickname).toBe('小李')
    })

    it('应该能通过邮箱搜索用户', async () => {
      const result = await callIpcHandler('user:search', 'wangwu@example.com')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].email).toBe('wangwu@example.com')
    })

    it('应该能通过个人简介搜索用户', async () => {
      const result = await callIpcHandler('user:search', '设计师')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].word).toBe('设计师')
    })

    it('应该支持模糊搜索', async () => {
      const result = await callIpcHandler('user:search', '小')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3) // 所有用户的昵称都包含"小"
    })

    it('应该返回空结果当没有匹配时', async () => {
      const result = await callIpcHandler('user:search', '不存在的关键词')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
      expect(result.message).toBe('找到 0 个匹配的用户')
    })
  })

  describe('获取用户统计 (user:get-stats)', () => {
    it('应该返回正确的统计信息', async () => {
      // 创建一些测试用户
      await callIpcHandler('user:create', {
        name: '统计用户1',
        email: 'stats1@example.com',
        password: '123456',
        nickname: '统计1',
        word: '统计测试用户1'
      })

      await callIpcHandler('user:create', {
        name: '统计用户2',
        email: 'stats2@example.com',
        password: '123456',
        nickname: '统计2',
        word: '统计测试用户2'
      })

      const result = await callIpcHandler('user:get-stats')

      expect(result.success).toBe(true)
      expect(result.data.totalUsers).toBe(2)
      expect(result.data.recentUsers).toBe(2) // 刚创建的用户都是最近的
      expect(result.data.activeUsers).toBe(2)
    })

    it('应该返回零统计当没有用户时', async () => {
      const result = await callIpcHandler('user:get-stats')

      expect(result.success).toBe(true)
      expect(result.data.totalUsers).toBe(0)
      expect(result.data.recentUsers).toBe(0)
      expect(result.data.activeUsers).toBe(0)
    })
  })

  describe('辅助函数测试', () => {
    it('getUserCount 应该返回正确的用户数量', () => {
      expect(getUserCount()).toBe(0)
    })

    it('initTestUsers 应该创建测试用户', () => {
      initTestUsers()
      expect(getUserCount()).toBe(3)
    })

    it('clearAllUsers 应该清空所有用户', () => {
      initTestUsers()
      expect(getUserCount()).toBe(3)
      
      clearAllUsers()
      expect(getUserCount()).toBe(0)
    })
  })
})