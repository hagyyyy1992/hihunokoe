'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Textarea } from '@/components/ui/textarea'
import { SimpleSelect } from '@/components/ui/select'
import { ContactCategory, ContactStatus } from '@prisma/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ArrowLeft, Mail, Calendar, User, Tag, MessageSquare } from 'lucide-react'

interface ContactInquiry {
  id: string
  name: string
  email: string
  subject: string
  message: string
  category: ContactCategory
  status: ContactStatus
  ipAddress: string | null
  userAgent: string | null
  adminNotes: string | null
  respondedAt: string | null
  respondedBy: string | null
  createdAt: string
  updatedAt: string
  respondedByUser?: {
    userName: string
    email: string
  } | null
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

export default function AdminInquiryDetailPage() {
  const params = useParams()
  const [inquiry, setInquiry] = useState<ContactInquiry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    status: '' as ContactStatus,
    adminNotes: '',
  })
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      const inquiryId = resolvedParams.id as string
      setId(inquiryId)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (id) {
      fetchInquiry()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchInquiry = async () => {
    if (!id) {
      setError('IDが指定されていません')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/inquiries/${id}`)

      if (!response.ok) {
        let errorMessage = 'お問い合わせの取得に失敗しました'

        // レスポンスの Content-Type をチェック
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            console.error('API Error:', errorData)
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            console.error('Failed to parse error response as JSON:', e)
          }
        } else {
          console.error('Non-JSON response received, status:', response.status)
          if (response.status === 404) {
            errorMessage = 'お問い合わせが見つかりませんでした'
          }
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      setInquiry(data.inquiry)
      setFormData({
        status: data.inquiry.status,
        adminNotes: data.inquiry.adminNotes || '',
      })
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = '更新に失敗しました'

        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            console.error('Failed to parse error response as JSON:', e)
          }
        } else {
          console.error('Non-JSON response received for update, status:', response.status)
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      setInquiry(data.inquiry)
      alert('更新しました')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja })
  }

  if (isLoading || !id) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!inquiry) {
    return (
      <Alert variant="destructive">
        <AlertDescription>お問い合わせが見つかりませんでした</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/inquiries">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            一覧に戻る
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{inquiry.subject}</CardTitle>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    {inquiry.name}
                  </span>
                  <span className="flex items-center">
                    <Mail className="mr-1 h-4 w-4" />
                    {inquiry.email}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(inquiry.createdAt)}
                  </span>
                  <span className="flex items-center">
                    <Tag className="mr-1 h-4 w-4" />
                    {categoryLabels[inquiry.category]}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant={statusColors[inquiry.status]}>{statusLabels[inquiry.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              お問い合わせ内容
            </h3>
            <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap">{inquiry.message}</div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold">管理者用</h3>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                ステータス
              </label>
              <SimpleSelect
                id="status"
                value={formData.status}
                onValueChange={value =>
                  setFormData({ ...formData, status: value as ContactStatus })
                }
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SimpleSelect>
            </div>

            <div>
              <label htmlFor="adminNotes" className="block text-sm font-medium mb-2">
                管理者メモ
              </label>
              <Textarea
                id="adminNotes"
                value={formData.adminNotes}
                onChange={e => setFormData({ ...formData, adminNotes: e.target.value })}
                placeholder="対応内容や備考を記入"
                rows={4}
              />
            </div>

            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? '更新中...' : '更新する'}
            </Button>
          </div>

          {inquiry.respondedBy && inquiry.respondedAt && (
            <div className="border-t pt-4 text-sm text-muted-foreground">
              <p>最終更新: {formatDate(inquiry.respondedAt)}</p>
            </div>
          )}

          {(inquiry.ipAddress || inquiry.userAgent) && (
            <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
              {inquiry.ipAddress && <p>IPアドレス: {inquiry.ipAddress}</p>}
              {inquiry.userAgent && <p>ユーザーエージェント: {inquiry.userAgent}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
