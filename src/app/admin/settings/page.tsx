'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Database, Shield, Mail, Globe } from 'lucide-react'

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>システム設定</CardTitle>
          <CardDescription>管理画面とアプリケーションの設定を管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">システム設定機能</h3>
            <p className="text-gray-600 mb-6">
              現在、システム設定機能は開発中です。
              <br />
              以下の設定機能が実装予定です：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-900">マスターデータ</h4>
                <p className="text-sm text-blue-700">肌タイプ、タグ、NGワード管理</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-900">セキュリティ</h4>
                <p className="text-sm text-green-700">認証設定、アクセス制御</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-purple-900">メール設定</h4>
                <p className="text-sm text-purple-700">通知メール、お知らせ配信</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <Globe className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h4 className="font-medium text-yellow-900">サイト設定</h4>
                <p className="text-sm text-yellow-700">利用規約、プライバシーポリシー</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <Settings className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h4 className="font-medium text-red-900">システム監視</h4>
                <p className="text-sm text-red-700">ログ管理、パフォーマンス監視</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <Database className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">バックアップ</h4>
                <p className="text-sm text-gray-700">データバックアップ、復元</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
