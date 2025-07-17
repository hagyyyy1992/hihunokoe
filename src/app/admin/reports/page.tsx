'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function ReportsManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>通報管理</CardTitle>
          <CardDescription>ユーザーからの通報を管理し、適切な対応を行います</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">通報管理機能</h3>
            <p className="text-gray-600 mb-6">
              現在、通報管理機能は開発中です。
              <br />
              以下の機能が実装予定です：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-900">通報受付</h4>
                <p className="text-sm text-blue-700">不適切な投稿の通報受付</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h4 className="font-medium text-yellow-900">通報審査</h4>
                <p className="text-sm text-yellow-700">通報内容の確認と判定</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-900">対応処理</h4>
                <p className="text-sm text-green-700">投稿削除や警告の実行</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h4 className="font-medium text-red-900">違反管理</h4>
                <p className="text-sm text-red-700">ユーザーの違反履歴管理</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
