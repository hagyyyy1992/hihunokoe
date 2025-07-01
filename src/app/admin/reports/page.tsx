'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Search, Eye, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'

interface Report {
  id: string
  reporter: {
    id: string
    userName: string
    email: string
  }
  reported?: {
    id: string
    userName: string
    email: string
  } | null
  post?: {
    id: string
    title: string
  } | null
  comment?: {
    id: string
    content: string
  } | null
  reason: string
  description?: string
  status: string
  resolvedBy?: string | null
  resolvedAt?: string | null
  resolution?: string | null
  createdAt: string
  updatedAt: string
}

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [actionType, setActionType] = useState<'resolve' | 'dismiss' | 'review' | null>(null)
  const [resolution, setResolution] = useState('')

  const filterReports = useCallback(() => {
    let filtered = reports

    if (searchTerm) {
      filtered = filtered.filter(
        report =>
          report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.reporter.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.reported?.userName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status.toLowerCase() === statusFilter)
    }

    if (reasonFilter !== 'all') {
      filtered = filtered.filter(report => report.reason.toLowerCase() === reasonFilter)
    }

    setFilteredReports(filtered)
  }, [reports, searchTerm, statusFilter, reasonFilter])

  const fetchReports = useCallback(async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (reasonFilter !== 'all') params.append('reason', reasonFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('通報一覧の取得に失敗しました:', error)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, reasonFilter, searchTerm])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    filterReports()
  }, [filterReports])

  const handleReportAction = async (action: 'resolve' | 'dismiss' | 'review') => {
    if (!selectedReport) return

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      if (action === 'review') {
        // Update status to reviewing
        const response = await fetch(`/api/admin/reports/${selectedReport.id}/update-status`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'REVIEWING' }),
        })

        if (response.ok) {
          await fetchReports()
        }
      } else {
        // Resolve or dismiss
        const response = await fetch(`/api/admin/reports/${selectedReport.id}/resolve`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, resolution }),
        })

        if (response.ok) {
          await fetchReports()
        }
      }

      setSelectedReport(null)
      setActionType(null)
      setResolution('')
    } catch (error) {
      console.error('通報操作に失敗しました:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            未対応
          </Badge>
        )
      case 'reviewing':
        return (
          <Badge variant="default">
            <AlertTriangle className="w-3 h-3 mr-1" />
            審査中
          </Badge>
        )
      case 'resolved':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            解決済み
          </Badge>
        )
      case 'dismissed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            却下
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      SPAM: 'スパム',
      HARASSMENT: 'ハラスメント',
      INAPPROPRIATE: '不適切な内容',
      COPYRIGHT: '著作権侵害',
      FAKE_INFO: '偽の情報',
      VIOLENCE: '暴力的内容',
      HATE_SPEECH: 'ヘイトスピーチ',
      OTHER: 'その他',
    }
    return reasonMap[reason.toUpperCase()] || reason
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
          <CardTitle>通報管理</CardTitle>
          <CardDescription>ユーザーからの通報を管理し、適切な対応を行います</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 検索・フィルター */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="説明文、通報者、被通報者で検索"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="pending">未対応</SelectItem>
                <SelectItem value="reviewing">審査中</SelectItem>
                <SelectItem value="resolved">解決済み</SelectItem>
                <SelectItem value="dismissed">却下</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="理由" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="spam">スパム</SelectItem>
                <SelectItem value="harassment">ハラスメント</SelectItem>
                <SelectItem value="inappropriate">不適切な内容</SelectItem>
                <SelectItem value="copyright">著作権侵害</SelectItem>
                <SelectItem value="fake_info">偽の情報</SelectItem>
                <SelectItem value="violence">暴力的内容</SelectItem>
                <SelectItem value="hate_speech">ヘイトスピーチ</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 通報一覧テーブル */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>通報者</TableHead>
                  <TableHead>被通報者</TableHead>
                  <TableHead>対象</TableHead>
                  <TableHead>理由</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>通報日</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.reporter.userName}</TableCell>
                    <TableCell>{report.reported?.userName || '-'}</TableCell>
                    <TableCell>
                      {report.post
                        ? `投稿: ${report.post.title}`
                        : report.comment
                          ? `コメント: ${report.comment.content.slice(0, 30)}...`
                          : 'ユーザー'}
                    </TableCell>
                    <TableCell>{getReasonLabel(report.reason)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={report.description}>
                        {report.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString('ja-JP')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {report.status.toLowerCase() === 'pending' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedReport(report)
                              setActionType('review')
                            }}
                          >
                            審査開始
                          </Button>
                        )}
                        {(report.status.toLowerCase() === 'pending' ||
                          report.status.toLowerCase() === 'reviewing') && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedReport(report)
                                setActionType('resolve')
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedReport(report)
                                setActionType('dismiss')
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">該当する通報が見つかりませんでした</div>
          )}
        </CardContent>
      </Card>

      {/* 確認ダイアログ */}
      <AlertDialog
        open={!!actionType}
        onOpenChange={() => {
          setActionType(null)
          setSelectedReport(null)
          setResolution('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'resolve' && '通報を解決'}
              {actionType === 'dismiss' && '通報を却下'}
              {actionType === 'review' && '審査を開始'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'resolve' &&
                '通報を解決済みとしてマークします。対応内容を入力してください。'}
              {actionType === 'dismiss' &&
                '通報を却下としてマークします。却下理由を入力してください。'}
              {actionType === 'review' && '通報を審査中としてマークします。'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(actionType === 'resolve' || actionType === 'dismiss') && (
            <div className="py-4">
              <Input
                placeholder={actionType === 'resolve' ? '対応内容を入力' : '却下理由を入力'}
                value={resolution}
                onChange={e => setResolution(e.target.value)}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionType && handleReportAction(actionType)}
              disabled={(actionType === 'resolve' || actionType === 'dismiss') && !resolution}
              className={
                actionType === 'dismiss'
                  ? 'bg-red-600 hover:bg-red-700'
                  : actionType === 'resolve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
              }
            >
              {actionType === 'resolve' && '解決済みにする'}
              {actionType === 'dismiss' && '却下する'}
              {actionType === 'review' && '審査開始'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
