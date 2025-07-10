import { User, UserRole } from '@api/domain/entities/User'

describe('User Entity', () => {
  const mockUser = new User(
    'user-123',
    'test@example.com',
    'testuser',
    'testuser', // userName alias
    'hashedPassword123',
    'Test User',
    'https://example.com/avatar.jpg',
    new Date('1990-01-01'),
    'male',
    'dry',
    null,
    ['peanuts'],
    'other allergies',
    true,
    null,
    null,
    null,
    0,
    null,
    UserRole.USER,
    true,
    true, // isActive alias
    null,
    new Date('2023-01-01'),
    new Date('2023-01-02')
  )

  describe('constructor', () => {
    it('正常にUserエンティティを作成できる', () => {
      expect(mockUser.id).toBe('user-123')
      expect(mockUser.email).toBe('test@example.com')
      expect(mockUser.username).toBe('testuser')
      expect(mockUser.userName).toBe('testuser')
      expect(mockUser.active).toBe(true)
      expect(mockUser.isActive).toBe(true)
      expect(mockUser.role).toBe(UserRole.USER)
    })

    it('エイリアスフィールドが正しく設定される', () => {
      expect(mockUser.userName).toBe(mockUser.username)
      expect(mockUser.isActive).toBe(mockUser.active)
    })
  })

  describe('isLocked', () => {
    it('lockedUntilがnullの場合はfalseを返す', () => {
      expect(mockUser.isLocked()).toBe(false)
    })

    it('lockedUntilが現在時刻より前の場合はfalseを返す', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60) // 1時間前
      const lockedUser = new User(
        'user-123',
        'test@example.com',
        'testuser',
        'testuser',
        'hashedPassword123',
        'Test User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        pastDate,
        UserRole.USER,
        true,
        true,
        null,
        new Date(),
        new Date()
      )
      expect(lockedUser.isLocked()).toBe(false)
    })

    it('lockedUntilが現在時刻より後の場合はtrueを返す', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60) // 1時間後
      const lockedUser = new User(
        'user-123',
        'test@example.com',
        'testuser',
        'testuser',
        'hashedPassword123',
        'Test User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        futureDate,
        UserRole.USER,
        true,
        true,
        null,
        new Date(),
        new Date()
      )
      expect(lockedUser.isLocked()).toBe(true)
    })
  })

  describe('canLogin', () => {
    it('アクティブで、ロックされておらず、削除されていない場合はtrueを返す', () => {
      expect(mockUser.canLogin()).toBe(true)
    })

    it('非アクティブの場合はfalseを返す', () => {
      const inactiveUser = new User(
        'user-123',
        'test@example.com',
        'testuser',
        'testuser',
        'hashedPassword123',
        'Test User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        null,
        UserRole.USER,
        false, // inactive
        false,
        null,
        new Date(),
        new Date()
      )
      expect(inactiveUser.canLogin()).toBe(false)
    })

    it('ロックされている場合はfalseを返す', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60)
      const lockedUser = new User(
        'user-123',
        'test@example.com',
        'testuser',
        'testuser',
        'hashedPassword123',
        'Test User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        futureDate,
        UserRole.USER,
        true,
        true,
        null,
        new Date(),
        new Date()
      )
      expect(lockedUser.canLogin()).toBe(false)
    })

    it('削除されている場合はfalseを返す', () => {
      const deletedUser = new User(
        'user-123',
        'test@example.com',
        'testuser',
        'testuser',
        'hashedPassword123',
        'Test User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        null,
        UserRole.USER,
        true,
        true,
        new Date(), // deletedAt
        new Date(),
        new Date()
      )
      expect(deletedUser.canLogin()).toBe(false)
    })
  })

  describe('isDeleted', () => {
    it('deletedAtがnullの場合はfalseを返す', () => {
      expect(mockUser.isDeleted()).toBe(false)
    })

    it('deletedAtが設定されている場合はtrueを返す', () => {
      const deletedUser = new User(
        'user-123',
        'test@example.com',
        'testuser',
        'testuser',
        'hashedPassword123',
        'Test User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        null,
        UserRole.USER,
        true,
        true,
        new Date(),
        new Date(),
        new Date()
      )
      expect(deletedUser.isDeleted()).toBe(true)
    })
  })

  describe('isAdmin', () => {
    it('USERロールの場合はfalseを返す', () => {
      expect(mockUser.isAdmin()).toBe(false)
    })

    it('ADMINロールの場合はtrueを返す', () => {
      const adminUser = new User(
        'admin-123',
        'admin@example.com',
        'admin',
        'admin',
        'hashedPassword123',
        'Admin User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        null,
        UserRole.ADMIN,
        true,
        true,
        null,
        new Date(),
        new Date()
      )
      expect(adminUser.isAdmin()).toBe(true)
    })

    it('SUPER_ADMINロールの場合はtrueを返す', () => {
      const superAdminUser = new User(
        'superadmin-123',
        'superadmin@example.com',
        'superadmin',
        'superadmin',
        'hashedPassword123',
        'Super Admin User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        null,
        UserRole.SUPER_ADMIN,
        true,
        true,
        null,
        new Date(),
        new Date()
      )
      expect(superAdminUser.isAdmin()).toBe(true)
    })
  })

  describe('isSuperAdmin', () => {
    it('USERロールの場合はfalseを返す', () => {
      expect(mockUser.isSuperAdmin()).toBe(false)
    })

    it('ADMINロールの場合はfalseを返す', () => {
      const adminUser = new User(
        'admin-123',
        'admin@example.com',
        'admin',
        'admin',
        'hashedPassword123',
        'Admin User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        null,
        UserRole.ADMIN,
        true,
        true,
        null,
        new Date(),
        new Date()
      )
      expect(adminUser.isSuperAdmin()).toBe(false)
    })

    it('SUPER_ADMINロールの場合はtrueを返す', () => {
      const superAdminUser = new User(
        'superadmin-123',
        'superadmin@example.com',
        'superadmin',
        'superadmin',
        'hashedPassword123',
        'Super Admin User',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        null,
        null,
        null,
        0,
        null,
        UserRole.SUPER_ADMIN,
        true,
        true,
        null,
        new Date(),
        new Date()
      )
      expect(superAdminUser.isSuperAdmin()).toBe(true)
    })
  })

  describe('UserRole enum', () => {
    it('正しい値を持つ', () => {
      expect(UserRole.USER).toBe('USER')
      expect(UserRole.ADMIN).toBe('ADMIN')
      expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN')
    })
  })
})
