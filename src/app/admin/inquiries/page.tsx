'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { SimpleSelect } from '@/components/ui/select'
import { ContactCategory, ContactStatus } from '@prisma/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Search, Mail, RefreshCw } from 'lucide-react'

interface ContactInquiry {
  id: string
  name: string
  email: string
  subject: string
  category: ContactCategory
  status: ContactStatus
  createdAt: string
  updatedAt: string
}

const categoryLabels: Record<ContactCategory, string> = {
  general: '一般的なお問い合わせ',
  bug_report: 'バグ報告',
  feature_request: '機能リクエスト',
  account: 'アカウント関連',
  privacy: 'プライバシー関連',
  other: 'その他',
}

const statusLabels: Record<ContactStatus, string> = {
  UNREAD: '未読',
  READ: '既読',
  IN_PROGRESS: '対応中',
  RESOLVED: '解決済み',
  SPAM: 'スパム',
}

const statusColors: Record<ContactStatus, 'destructive' | 'secondary' | 'default' | 'outline'> = {
  UNREAD: 'destructive',
  READ: 'secondary',
  IN_PROGRESS: 'default',
  RESOLVED: 'secondary',
  SPAM: 'outline',
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | 'all'>('all')

  const fetchInquiries = async () => {
    setIsLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)

      const response = await fetch(`/api/admin/inquiries?${params}`)
      if (!response.ok) {
        throw new Error('お問い合わせ一覧の取得に失敗しました')
      }

      const data = await response.json()
      setInquiries(data.inquiries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInquiries()
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>お問い合わせ管理</CardTitle>
            <CardDescription>ユーザーからのお問い合わせを管理します</CardDescription>
          </div>
          <Button onClick={fetchInquiries} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="名前、メールアドレス、件名で検索..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">検索</Button>
          </form>

          <div className="flex gap-4">
            <SimpleSelect
              className="w-[180px]"
              value={statusFilter}
              onValueChange={value => setStatusFilter(value as ContactStatus | 'all')}
            >
              <option value="all">すべて</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SimpleSelect>

            <SimpleSelect
              className="w-[200px]"
              value={categoryFilter}
              onValueChange={value => setCategoryFilter(value as ContactCategory | 'all')}
            >
              <option value="all">すべて</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SimpleSelect>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            お問い合わせが見つかりませんでした
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ステータス</TableHead>
                  <TableHead>送信日時</TableHead>
                  <TableHead>名前</TableHead>
                  <TableHead>件名</TableHead>
                  <TableHead>カテゴリー</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map(inquiry => (
                  <TableRow key={inquiry.id}>
                    <TableCell>
                      <Badge variant={statusColors[inquiry.status]}>
                        {statusLabels[inquiry.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{inquiry.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          {inquiry.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{inquiry.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryLabels[inquiry.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/inquiries/${inquiry.id}`}>
                        <Button variant="ghost" size="sm">
                          詳細
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
