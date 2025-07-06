# hooks/usePasswordToggle.tsx

## 概要

パスワード入力フィールドの表示/非表示を切り替える機能を提供するカスタムフック。状態管理、切り替え関数、トグルボタンコンポーネントを含む完全なソリューションです。

## 戻り値

```typescript
interface UsePasswordToggleReturn {
  inputType: 'text' | 'password' // 入力フィールドのtype属性
  isPasswordVisible: boolean // パスワード表示状態
  togglePasswordVisibility: () => void // 表示切り替え関数
  PasswordToggleIcon: React.FC // トグルボタンコンポーネント
}
```

## 基本的な使用方法

```tsx
import { usePasswordToggle } from '@/hooks/usePasswordToggle'

function PasswordField() {
  const { inputType, PasswordToggleIcon } = usePasswordToggle()

  return (
    <div className="relative">
      <input type={inputType} placeholder="パスワードを入力" className="w-full pr-10" />
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <PasswordToggleIcon />
      </div>
    </div>
  )
}
```

## PasswordToggleIconコンポーネント

### 特徴

- 目のアイコン（表示時）と斜線付き目のアイコン（非表示時）を切り替え
- アクセシビリティ対応のaria-label
- tabIndex={-1}でタブナビゲーションをスキップ
- ホバー・フォーカス時のスタイリング

### アイコンデザイン

```tsx
// 非表示時（目のアイコン）
<svg viewBox="0 0 24 24">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
  <circle cx="12" cy="12" r="3" />
</svg>

// 表示時（斜線付き目のアイコン）
<svg viewBox="0 0 24 24">
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8..." />
  <line x1="1" y1="1" x2="23" y2="23" />
</svg>
```

## 高度な使用例

### カスタムスタイリング

```tsx
function CustomPasswordField() {
  const { inputType, isPasswordVisible, togglePasswordVisibility } = usePasswordToggle()

  return (
    <div className="relative">
      <input type={inputType} className="w-full pr-12 py-3 border rounded-lg" />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2"
      >
        {isPasswordVisible ? '非表示' : '表示'}
      </button>
    </div>
  )
}
```

### フォームでの使用

```tsx
function LoginForm() {
  const [password, setPassword] = useState('')
  const { inputType, PasswordToggleIcon } = usePasswordToggle()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // ログイン処理
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative mb-4">
        <input
          type={inputType}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="パスワード"
          className="w-full pr-10"
          required
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <PasswordToggleIcon />
        </div>
      </div>
      <button type="submit">ログイン</button>
    </form>
  )
}
```

### 複数のパスワードフィールド

```tsx
function PasswordChangeForm() {
  const currentPassword = usePasswordToggle()
  const newPassword = usePasswordToggle()
  const confirmPassword = usePasswordToggle()

  return (
    <form>
      <div className="space-y-4">
        <div className="relative">
          <input
            type={currentPassword.inputType}
            placeholder="現在のパスワード"
            className="w-full pr-10"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <currentPassword.PasswordToggleIcon />
          </div>
        </div>

        <div className="relative">
          <input
            type={newPassword.inputType}
            placeholder="新しいパスワード"
            className="w-full pr-10"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <newPassword.PasswordToggleIcon />
          </div>
        </div>

        <div className="relative">
          <input
            type={confirmPassword.inputType}
            placeholder="新しいパスワード（確認）"
            className="w-full pr-10"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <confirmPassword.PasswordToggleIcon />
          </div>
        </div>
      </div>
    </form>
  )
}
```

## アクセシビリティ

### ARIA属性

```tsx
aria-label={isPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示'}
```

### キーボード操作

- `tabIndex={-1}`: タブキーでスキップ（入力フィールドから直接送信ボタンへ）
- マウスまたはタッチでのみ操作可能

## スタイリング

### デフォルトのボタンスタイル

```css
/* 基本スタイル */
.text-gray-400        /* 通常時の色 */
.hover:text-gray-600  /* ホバー時の色 */
.focus:outline-none   /* フォーカス時のアウトライン除去 */
.focus:ring-2         /* フォーカスリング */
.focus:ring-blue-500  /* フォーカスリングの色 */
.transition-colors    /* 色変化のトランジション */
```

## パフォーマンス

- `useCallback`による関数のメモ化
- 軽量なSVGアイコン使用
- 不要な再レンダリング防止

## 関連コンポーネント

- `Input`: このフックを内部で使用
- `PasswordInput`: パスワード専用入力コンポーネント

## 注意事項

- セキュリティ上、パスワードはデフォルトで非表示
- フォーム送信時も表示状態は維持される
- ブラウザのパスワード自動入力との互換性あり
