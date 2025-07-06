# components/ui/PasswordInput.tsx

## 概要

パスワード入力専用のコンポーネント。表示/非表示切り替え機能が組み込まれた、シンプルなAPIを提供します。

## Props

```typescript
interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string // フィールドラベル
  error?: string // エラーメッセージ
  hint?: string // ヘルパーテキスト
  'data-testid'?: string // テスト用ID
}
```

### 注意

- `type`属性は指定できません（常に内部でpassword/textを切り替え）
- その他のHTML input属性はすべてサポート

## 主要機能

### パスワード表示切り替え

```tsx
const { inputType, toggleButton, inputProps } = usePasswordToggle({
  name: props.name || 'password',
  'data-testid': props['data-testid'],
})
```

- 目のアイコンボタンで表示/非表示を切り替え
- セキュリティとユーザビリティのバランス

### エラー表示

```tsx
<PasswordInput name="password" label="パスワード" error="パスワードが短すぎます" />
```

- 赤色のエラーメッセージ
- 入力フィールドの枠線も赤色に

### ヒントテキスト

```tsx
<PasswordInput label="新しいパスワード" hint="8文字以上、大文字・小文字・数字を含む" />
```

## 使用例

### 基本的な使用

```tsx
<PasswordInput name="password" label="パスワード" required />
```

### ログインフォーム

```tsx
<form onSubmit={handleLogin}>
  <PasswordInput
    name="password"
    label="パスワード"
    value={password}
    onChange={e => setPassword(e.target.value)}
    error={loginError}
    placeholder="パスワードを入力"
  />
</form>
```

### パスワード変更フォーム

```tsx
<div className="space-y-4">
  <PasswordInput name="currentPassword" label="現在のパスワード" error={errors.currentPassword} />

  <PasswordInput
    name="newPassword"
    label="新しいパスワード"
    hint="安全なパスワードを設定してください"
    error={errors.newPassword}
  />

  <PasswordInput
    name="confirmPassword"
    label="新しいパスワード（確認）"
    error={errors.confirmPassword}
  />
</div>
```

### バリデーション付き

```tsx
const [password, setPassword] = useState('')
const [error, setError] = useState('')

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value
  setPassword(value)

  // リアルタイムバリデーション
  if (value.length < 8) {
    setError('パスワードは8文字以上必要です')
  } else {
    setError('')
  }
}

;<PasswordInput
  name="password"
  label="パスワード"
  value={password}
  onChange={handleChange}
  error={error}
/>
```

## スタイリング

### レイアウト

```
<div className="mb-4">
  <label>パスワード *</label>
  <div className="relative">
    <input type="password|text" />
    <button className="absolute right-2">👁</button>
  </div>
  <p className="error">エラーメッセージ</p>
  <p className="hint">ヒントテキスト</p>
</div>
```

### カスタマイズ

```tsx
<PasswordInput className="custom-input-class" style={{ fontSize: '16px' }} />
```

## Inputコンポーネントとの違い

| 機能             | PasswordInput  | Input                    |
| ---------------- | -------------- | ------------------------ |
| type属性の指定   | ❌ 不可        | ✅ 可能                  |
| パスワードトグル | ✅ 常に有効    | ✅ type="password"時のみ |
| API              | シンプル       | 汎用的                   |
| 用途             | パスワード専用 | あらゆる入力             |

## パフォーマンス

- `usePasswordToggle`フックによる状態管理の最適化
- 不要な再レンダリングを防ぐ設計

## アクセシビリティ

- トグルボタンの適切なaria-label
- キーボードでの操作に対応
- スクリーンリーダー対応

## セキュリティ考慮事項

- パスワードはデフォルトで非表示
- ユーザーの明示的なアクションでのみ表示
- フォーム送信時は自動的に非表示に戻る

## 依存関係

- `@/hooks/usePasswordToggle`: トグル機能
- `@/components/ui/Input`: ベースコンポーネント

## 関連コンポーネント

- `Input`: 汎用入力コンポーネント
- `PasswordStrengthIndicator`: パスワード強度表示
- `PasswordRequirements`: パスワード要件表示
