'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, TrendingUp, Users } from 'lucide-react'

interface WithdrawalSurvey {
  id: string
  userId: string
  reason: string
  reasonOther?: string
  feedback?: string
  wouldRecommend?: boolean
  createdAt: string
  user?: {
    userName: string | null
  }
}

interface SurveyStatistics {
  totalResponses: number
  byReason: Record<string, number>
  recommendationRate: number
}

const REASON_LABELS: Record<string, string> = {
  not_useful: 'サービスが自分に合わなかった',
  privacy_concerns: 'プライバシーに関する懸念',
  too_many_emails: 'メールが多すぎる',
  found_alternative: '他のサービスを見つけた',
  temporary_break: '一時的に利用を休止したい',
  technical_issues: '技術的な問題があった',
  other: 'その他',
}

const formatReasonDetails = (
  reasonOther: string | undefined
): { reasons: string[]; otherText?: string } | null => {
  if (!reasonOther) return null

  try {
    const parsed = JSON.parse(reasonOther)
    if (parsed.allReasons && Array.isArray(parsed.allReasons)) {
      return {
        reasons: parsed.allReasons.map((r: string) => REASON_LABELS[r] || r),
        otherText: parsed.otherText,
      }
    }
  } catch {
    // JSONでない場合はそのまま返す
    return { reasons: [reasonOther], otherText: undefined }
  }

  return { reasons: [reasonOther], otherText: undefined }
}

export default function WithdrawalSurveysPage() {
  const [surveys, setSurveys] = useState<WithdrawalSurvey[]>([])
  const [statistics, setStatistics] = useState<SurveyStatistics | null>(null)
  const [period, setPeriod] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const fetchSurveys = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/withdrawal-surveys')
      if (response.ok) {
        const data = await response.json()
        setSurveys(data.surveys)
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchStatistics = useCallback(async (timePeriod?: string) => {
    try {
      const params = new URLSearchParams()
      const now = new Date()

      if (timePeriod && timePeriod !== 'all') {
        const startDate = new Date()
        switch (timePeriod) {
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }

        params.append('startDate', startDate.toISOString())
        params.append('endDate', now.toISOString())
      }

      const response = await fetch(`/api/admin/withdrawal-surveys/statistics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }, [])

  useEffect(() => {
    fetchSurveys()
    fetchStatistics(period)
  }, [period, fetchSurveys, fetchStatistics])

  useEffect(() => {
    const handlePeriodChange = () => {
      fetchStatistics(period)
    }
    handlePeriodChange()
  }, [period, fetchStatistics])

  const exportToCSV = () => {
    const headers = ['日付', '退会理由', 'その他の理由', 'フィードバック', '推奨意向']
    const rows = surveys.map(survey => [
      new Date(survey.createdAt).toLocaleDateString('ja-JP'),
      REASON_LABELS[survey.reason] || survey.reason,
      (() => {
        const details = formatReasonDetails(survey.reasonOther)
        if (details) {
          const reasons = details.reasons.join('、')
          return details.otherText ? `${reasons}（その他: ${details.otherText}）` : reasons
        }
        return ''
      })(),
      survey.feedback || '',
      survey.wouldRecommend === true ? 'はい' : survey.wouldRecommend === false ? 'いいえ' : '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // BOMを追加してExcelでの文字化けを防ぐ
    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `withdrawal_surveys_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">退会アンケート分析</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            ユーザーの退会理由を分析し、サービス改善に活用
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2 w-full md:w-auto">
          <Download className="h-4 w-4" />
          CSVエクスポート
        </Button>
      </div>

      <div className="flex gap-2 md:gap-4 items-center">
        <label htmlFor="period-select" className="text-sm font-medium whitespace-nowrap">
          期間:
        </label>
        <select
          id="period-select"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="px-2 md:px-3 py-1.5 md:py-2 border rounded-md text-sm md:text-base"
        >
          <option value="all">全期間</option>
          <option value="week">過去7日間</option>
          <option value="month">過去30日間</option>
          <option value="quarter">過去90日間</option>
        </select>
      </div>

      {statistics && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">回答数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{statistics.totalResponses}</div>
              <p className="text-xs text-muted-foreground">
                退会時にアンケートに回答したユーザー数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">推奨率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {statistics.recommendationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                サービスを他人に薦めたいと回答した割合
              </p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最多退会理由</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base md:text-lg font-bold">
                {Object.entries(statistics.byReason).length > 0
                  ? REASON_LABELS[
                      Object.entries(statistics.byReason).sort((a, b) => b[1] - a[1])[0][0]
                    ] || 'その他'
                  : 'データなし'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>退会理由の内訳</CardTitle>
          <CardDescription>期間内の退会理由の分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics &&
              Object.entries(statistics.byReason)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => (
                  <div key={reason} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{REASON_LABELS[reason] || reason}</span>
                      <span className="text-sm text-muted-foreground">{count}件</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-apple-600 h-2 rounded-full"
                        style={{
                          width: `${(count / statistics.totalResponses) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近のフィードバック</CardTitle>
          <CardDescription>ユーザーからの具体的な意見</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {surveys
              .filter(survey => survey.feedback || survey.reasonOther)
              .slice(0, 10)
              .map(survey => (
                <div key={survey.id} className="border rounded-lg p-3 md:p-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {(() => {
                          if (survey.user?.userName) {
                            return survey.user.userName
                          }
                          return `削除済みユーザー`
                        })()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(survey.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    {survey.wouldRecommend !== null && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full self-start ${
                          survey.wouldRecommend
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        推奨: {survey.wouldRecommend ? 'はい' : 'いいえ'}
                      </span>
                    )}
                  </div>

                  {(() => {
                    const details = formatReasonDetails(survey.reasonOther)
                    if (details && details.reasons.length > 1) {
                      return (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-600 mb-2">選択された理由:</p>
                          <div className="flex flex-wrap gap-2">
                            {details.reasons.map((reason, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 bg-white border rounded-full"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                          {details.otherText && (
                            <p className="text-xs text-gray-600 mt-2 ml-2">
                              → その他の詳細: {details.otherText}
                            </p>
                          )}
                        </div>
                      )
                    } else {
                      return (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            主な理由: {REASON_LABELS[survey.reason] || survey.reason}
                          </span>
                        </div>
                      )
                    }
                  })()}

                  {survey.feedback && (
                    <div className="mt-3 p-2 md:p-3 bg-white rounded">
                      <p className="text-xs font-medium text-gray-600 mb-1">フィードバック:</p>
                      <p className="text-xs sm:text-sm text-gray-700">{survey.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
