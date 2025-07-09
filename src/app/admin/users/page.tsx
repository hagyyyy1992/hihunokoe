'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { SimpleSelect } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Download, UserCheck, UserX, Eye } from 'lucide-react'

interface User {
  id: string
  userName: string
  email: string
  isActive: boolean
  role: string
  skinType?: string
  createdAt: string
  postCount: number
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'suspend' | null>(null)

  const filterUsers = useCallback(() => {
    let filtered = Array.isArray(users) ? users : []

    if (searchTerm) {
      filtered = filtered.filter(
        user =>
          user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'active' ? user.isActive : !user.isActive
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, roleFilter])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include', // HTTPOnlyクッキーを送信
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || data)
      } else if (response.status === 401) {
        console.error('認証されていません。ログインしてください。')
        // 必要に応じてログインページにリダイレクト
      }
    } catch (error) {
      console.error('ユーザー一覧の取得に失敗しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [filterUsers])

  const handleUserAction = async (action: 'activate' | 'suspend') => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/${action}`, {
        method: 'POST',
        credentials: 'include', // HTTPOnlyクッキーを送信
      })

      if (response.ok) {
        await fetchUsers()
        setSelectedUser(null)
        setActionType(null)
      }
    } catch (error) {
      console.error('ユーザー操作に失敗しました:', error)
    }
  }

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        credentials: 'include', // HTTPOnlyクッキーを送信
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('エクスポートに失敗しました:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ユーザー管理</CardTitle>
          <CardDescription>登録ユーザーの一覧表示、検索、管理を行います</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {/* 検索・フィルター */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ユーザー名またはメールアドレスで検索"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <SimpleSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="w-full sm:w-40"
              >
                <option value="all">すべて</option>
                <option value="active">アクティブ</option>
                <option value="inactive">停止中</option>
              </SimpleSelect>

              <SimpleSelect
                value={roleFilter}
                onValueChange={setRoleFilter}
                className="w-full sm:w-40"
              >
                <option value="all">すべて</option>
                <option value="USER">ユーザー</option>
                <option value="ADMIN">管理者</option>
                <option value="SUPER_ADMIN">スーパー管理者</option>
              </SimpleSelect>

              <Button
                onClick={exportUsers}
                variant="outline"
                className="w-full sm:w-auto sm:ml-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                CSV出力
              </Button>
            </div>
          </div>

          {/* ユーザー一覧 - モバイル用カード表示 */}
          <div className="block lg:hidden space-y-3">
            {Array.isArray(filteredUsers) &&
              filteredUsers.map(user => (
                <Card key={user.id}>
                  <CardContent className="p-3 pt-4">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-semibold text-base truncate">{user.userName}</h3>
                        <Badge
                          variant={user.isActive ? 'default' : 'secondary'}
                          className="ml-2 flex-shrink-0 text-xs"
                        >
                          {user.isActive ? 'アクティブ' : '停歂中'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1 mb-3 text-xs">
                      <div className="flex items-center">
                        <span className="text-gray-500 w-16">ロール:</span>
                        <Badge
                          variant={
                            user.role === 'SUPER_ADMIN'
                              ? 'destructive'
                              : user.role === 'ADMIN'
                                ? 'default'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {user.role === 'SUPER_ADMIN'
                            ? 'スーパー'
                            : user.role === 'ADMIN'
                              ? '管理者'
                              : 'ユーザー'}
                        </Badge>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-16">肌タイプ:</span>
                        <span>{user.skinType || '-'}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-16">投稿数:</span>
                        <span>{user.postCount}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-16">登録日:</span>
                        <span>{new Date(user.createdAt).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 px-2 flex-1 text-xs">
                        <Eye className="h-3 w-3 mr-0.5" />
                        詳細
                      </Button>
                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 px-2 flex-1 text-xs"
                          onClick={() => {
                            setSelectedUser(user)
                            setActionType('suspend')
                          }}
                        >
                          <UserX className="h-3 w-3 mr-0.5" />
                          停止
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 px-2 flex-1 text-xs"
                          onClick={() => {
                            setSelectedUser(user)
                            setActionType('activate')
                          }}
                        >
                          <UserCheck className="h-3 w-3 mr-0.5" />
                          復活
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* ユーザー一覧テーブル - デスクトップ表示 */}
          <div className="hidden lg:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>ロール</TableHead>
                  <TableHead>肌タイプ</TableHead>
                  <TableHead>投稿数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(filteredUsers) &&
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.userName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === 'SUPER_ADMIN'
                              ? 'destructive'
                              : user.role === 'ADMIN'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {user.role === 'SUPER_ADMIN'
                            ? 'スーパー管理者'
                            : user.role === 'ADMIN'
                              ? '管理者'
                              : 'ユーザー'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.skinType || '-'}</TableCell>
                      <TableCell>{user.postCount}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'アクティブ' : '停止中'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString('ja-JP')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.isActive ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType('suspend')
                              }}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType('activate')
                              }}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {Array.isArray(filteredUsers) && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              該当するユーザーが見つかりませんでした
            </div>
          )}
        </CardContent>
      </Card>

      {/* 確認ダイアログ */}
      <AlertDialog
        open={!!actionType}
        onOpenChange={() => {
          setActionType(null)
          setSelectedUser(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'suspend' ? 'ユーザーを停止' : 'ユーザーを復活'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'suspend'
                ? `${selectedUser?.userName} を停止しますか？停止されたユーザーはログインできなくなります。`
                : `${selectedUser?.userName} を復活させますか？復活されたユーザーは再びログインできるようになります。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setActionType(null)
                setSelectedUser(null)
              }}
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionType && handleUserAction(actionType)}
              className={actionType === 'suspend' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {actionType === 'suspend' ? '停止する' : '復活させる'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
