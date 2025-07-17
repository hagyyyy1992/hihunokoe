'use client'

import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export interface WithdrawalSurveyData {
  reasons: string[]
  reasonOther?: string
  feedback?: string
  wouldRecommend?: boolean
}

interface WithdrawalSurveyFormProps {
  onSubmit: (data: WithdrawalSurveyData | null) => void
  onSkip: () => void
}

const WITHDRAWAL_REASONS = [
  { value: 'not_useful', label: 'サービスが自分に合わなかった' },
  { value: 'privacy_concerns', label: 'プライバシーに関する懸念' },
  { value: 'too_many_emails', label: 'メールが多すぎる' },
  { value: 'found_alternative', label: '他のサービスを見つけた' },
  { value: 'temporary_break', label: '一時的に利用を休止したい' },
  { value: 'technical_issues', label: '技術的な問題があった' },
  { value: 'other', label: 'その他' },
]

export function WithdrawalSurveyForm({ onSubmit, onSkip }: WithdrawalSurveyFormProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [reasonOther, setReasonOther] = useState('')
  const [feedback, setFeedback] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)

  const handleReasonToggle = (value: string) => {
    setSelectedReasons(prev =>
      prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedReasons.length === 0) {
      onSkip()
      return
    }

    const surveyData: WithdrawalSurveyData = {
      reasons: selectedReasons,
      reasonOther: selectedReasons.includes('other') ? reasonOther : undefined,
      feedback: feedback.trim() || undefined,
      wouldRecommend: wouldRecommend ?? undefined,
    }

    onSubmit(surveyData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">退会理由をお聞かせください（任意）</h3>
        <p className="text-sm text-muted-foreground mb-4">
          サービス改善のため、退会理由をお聞かせください。いただいた情報は今後のサービス向上に活用させていただきます。
        </p>
      </div>

      <div className="space-y-3">
        <Label>退会の理由（複数選択可）</Label>
        <div className="space-y-2">
          {WITHDRAWAL_REASONS.map(item => (
            <div key={item.value} className="flex items-center space-x-2">
              <Checkbox
                id={item.value}
                checked={selectedReasons.includes(item.value)}
                onChange={() => handleReasonToggle(item.value)}
              />
              <Label htmlFor={item.value} className="font-normal cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {selectedReasons.includes('other') && (
        <div className="space-y-2">
          <Label htmlFor="reasonOther">その他の理由を詳しくお聞かせください</Label>
          <Textarea
            id="reasonOther"
            value={reasonOther}
            onChange={e => setReasonOther(e.target.value)}
            placeholder="理由を入力してください"
            className="min-h-[100px]"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="feedback">ご意見・ご要望（任意）</Label>
        <Textarea
          id="feedback"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="サービスに関するご意見やご要望があればお聞かせください"
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-3">
        <Label>このサービスを友人に薦めたいと思いますか？</Label>
        <RadioGroup
          value={wouldRecommend === null ? '' : wouldRecommend ? 'yes' : 'no'}
          onValueChange={value => setWouldRecommend(value === 'yes')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="recommend-yes" />
            <Label htmlFor="recommend-yes" className="font-normal cursor-pointer">
              はい
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="recommend-no" />
            <Label htmlFor="recommend-no" className="font-normal cursor-pointer">
              いいえ
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="default" className="flex-1">
          アンケートを送信して次へ
        </Button>
        <Button type="button" variant="outline" onClick={onSkip} className="flex-1">
          スキップ
        </Button>
      </div>
    </form>
  )
}
