# components/forms/PostForm.tsx

## 概要

コスメ体験投稿の作成・編集を行う多段階フォームコンポーネント。4つのステップに分かれた包括的な入力フォームを提供します。

## Props

```typescript
interface PostFormProps {
  initialData?: PostFormData // 編集時の初期データ
  postId?: string // 編集対象の投稿ID
  isEditMode?: boolean // 編集モードフラグ（デフォルト: false）
}
```

## フォームデータ構造

```typescript
interface PostFormData {
  title: string // タイトル
  content: string // 本文
  cosmeticName: string // 商品名
  cosmeticCategory: CosmeticCategory | '' // カテゴリー
  skinType: SkinType | '' // 肌質
  usageSituation: Partial<UsageSituation> // 使用状況
  experienceDetails: Partial<ExperienceDetails> // 体験詳細
  moodTag: MoodTag | '' // 気分タグ
}
```

## ステップ構成

### ステップ1: 基本情報（必須）

```
- タイトル（必須）
- 商品名（必須）
- カテゴリー
- 投稿内容（必須）
```

### ステップ2: 使用状況（任意）

```
- 肌質
- 季節（複数選択可）
- 使用時間帯
- 生理周期
- 肌の状態
```

### ステップ3: 体験の詳細（任意）

```
- 香り
  - タイプ
  - 強さ
- テクスチャー
  - タイプ
  - 伸びやすさ
  - 吸収性
```

### ステップ4: 感想とまとめ（任意）

```
- 使用後の状態
  - 潤い
  - 肌触り
  - 快適さ
  - 持続時間
- 総合的な印象（気分タグ）
```

## 主要機能

### マルチステップナビゲーション

```typescript
const handleNext = () => {
  if (currentStep === 1 && !validateStep1()) {
    return
  }
  if (currentStep < 4) {
    setCurrentStep(currentStep + 1)
  }
}
```

### ステップインジケーター

```tsx
<div className="flex items-center justify-between mb-8">
  {steps.map((step, index) => (
    <div key={index} className={`step ${index + 1 <= currentStep ? 'active' : ''}`}>
      <div className="step-number">{index + 1}</div>
      <div className="step-label">{step.label}</div>
    </div>
  ))}
</div>
```

### バリデーション

```typescript
const validateStep1 = (): boolean => {
  if (!formData.title.trim()) {
    setError('タイトルを入力してください')
    return false
  }
  if (!formData.cosmeticName.trim()) {
    setError('商品名を入力してください')
    return false
  }
  if (!formData.content.trim()) {
    setError('投稿内容を入力してください')
    return false
  }
  return true
}
```

### 編集モード

```typescript
// 編集モード時の削除ボタン表示
{isEditMode && currentStep === 1 && (
  <Button
    type="button"
    variant="danger"
    onClick={() => setShowDeleteConfirm(true)}
  >
    投稿を削除
  </Button>
)}
```

### 送信防止機構

```typescript
// Enterキーでの誤送信を防ぐ
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && e.target instanceof HTMLElement) {
    const isTextarea = e.target.tagName === 'TEXTAREA'
    const isSubmitButton = e.target.getAttribute('type') === 'submit'

    if (!isTextarea && !isSubmitButton) {
      e.preventDefault()
    }
  }
}
```

## API連携

### 投稿作成

```typescript
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dataToSubmit),
  credentials: 'include',
})
```

### 投稿更新

```typescript
const response = await fetch(`/api/posts/update?id=${postId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dataToSubmit),
  credentials: 'include',
})
```

### 投稿削除

```typescript
const response = await fetch(`/api/posts/delete?id=${postId}`, {
  method: 'DELETE',
  credentials: 'include',
})
```

## 使用例

### 新規投稿作成

```tsx
<PostForm />
```

### 投稿編集

```tsx
<PostForm initialData={existingPost} postId={postId} isEditMode={true} />
```

### 完全な実装例

```tsx
const NewPostPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>コスメ体験を投稿する</h1>
      <PostForm />
    </div>
  )
}
```

## UI/UX設計

### レスポンシブデザイン

- 最大幅制限（max-w-2xl）
- モバイル対応のグリッドレイアウト

### 視覚的フィードバック

- アクティブステップの強調表示
- 進行状況バー
- エラーメッセージの赤色表示
- ローディング状態の表示

### ユーザビリティ

- 任意フィールドの明確な表示
- プレースホルダーによるヒント
- ステップ間の自由な移動
- 誤操作防止（削除確認ダイアログ）

## 状態管理

| State               | 型           | 説明                  |
| ------------------- | ------------ | --------------------- |
| `formData`          | PostFormData | フォームデータ        |
| `currentStep`       | number       | 現在のステップ（1-4） |
| `loading`           | boolean      | API通信中フラグ       |
| `error`             | string       | エラーメッセージ      |
| `showDeleteConfirm` | boolean      | 削除確認表示          |
| `canSubmit`         | boolean      | 送信可能フラグ        |

## 依存関係

- `@/components/ui/*`: UIコンポーネント群
- `@/types`: 型定義
- `react-router-dom`: ナビゲーション
- `@/lib/constants`: 定数定義
