# components/ui/Input.tsx

## 概要

フォーム入力用の汎用コンポーネント。ラベル、エラー表示、ヒント、アイコン、パスワード表示切り替えなどの機能を統合しています。

## Props

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string // フィールドラベル
  error?: string // エラーメッセージ
  hint?: string // ヘルパーテキスト
  showPlaceholderHint?: boolean // placeholderをヒントとして表示
  icon?: React.ReactNode // 先頭アイコン
  variant?: 'default' | 'error' // 外観バリアント
  'data-testid'?: string // テスト用ID
}
```

## 主要機能

### 自動パスワードトグル

```tsx
<Input type="password" name="password" label="パスワード" />
```

- type="password"の場合、自動的に表示/非表示トグルボタンを追加
- `usePasswordToggle`フックを内部で使用

### ラベルと必須マーク

```tsx
<Input label="メールアドレス" name="email" required />
```

- requiredプロパティがある場合、ラベルに赤いアスタリスク（\*）を表示

### エラー表示

```tsx
<Input label="ユーザー名" error="ユーザー名は既に使用されています" variant="error" />
```

- エラーメッセージを赤色で表示
- 入力フィールドの枠線も赤色に変更

### ヒントテキスト

```tsx
// 専用ヒント
<Input
  label="パスワード"
  hint="8文字以上で入力してください"
/>

// プレースホルダーをヒントとして使用
<Input
  placeholder="例: user@example.com"
  showPlaceholderHint
/>
```

### アイコン付き入力

```tsx
<Input icon={<SearchIcon />} placeholder="検索..." />
```

- 左側にアイコンを配置
- 適切なパディング調整

## スタイリング

### 基本スタイル

```typescript
const baseClasses = cn(
  'w-full px-3 py-2 border rounded-md',
  'focus:outline-none focus:ring-2',
  variant === 'error' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500',
  icon && 'pl-10' // アイコンがある場合の左パディング
)
```

### レイアウト構造

```
<div>
  {label && <label>}      // ラベル
  <div className="relative">
    {icon}                // アイコン
    <input />             // 入力フィールド
    {toggleButton}        // パスワードトグル
  </div>
  {error && <p>}          // エラーメッセージ
  {hint && <p>}           // ヒントテキスト
</div>
```

## 使用例

### 基本的な使用

```tsx
<Input name="username" label="ユーザー名" placeholder="3文字以上" required />
```

### メールアドレス入力

```tsx
<Input type="email" name="email" label="メールアドレス" error={errors.email} icon={<MailIcon />} />
```

### パスワード入力

```tsx
<Input
  type="password"
  name="password"
  label="パスワード"
  hint="大文字・小文字・数字を含む8文字以上"
  error={errors.password}
/>
```

### 検索フィールド

```tsx
<Input name="search" icon={<SearchIcon />} placeholder="商品名で検索..." showPlaceholderHint />
```

### フォーム内での使用

```tsx
const [formData, setFormData] = useState({ email: '' })
const [errors, setErrors] = useState({})

<Input
  name="email"
  label="メールアドレス"
  value={formData.email}
  onChange={(e) => setFormData({...formData, email: e.target.value})}
  error={errors.email}
  required
/>
```

## アクセシビリティ

### 自動ID生成

```typescript
const inputId = id || name
```

- idが指定されていない場合、name属性から自動生成
- labelとinputの関連付けを保証

### ARIA属性

- エラー時：`aria-invalid="true"`
- 適切なaria-describedbyでエラーメッセージと関連付け

### キーボード操作

- Tabキーでのフォーカス移動
- パスワードトグルボタンもフォーカス可能

## パフォーマンス

- パスワードフィールドのみでトグル機能を初期化
- 条件付きレンダリングで不要な要素を削減

## 依存関係

- `@/hooks/usePasswordToggle`: パスワード表示切り替え
- `cn`: クラス名結合ユーティリティ
- React標準のHTML input属性

## 関連コンポーネント

- `PasswordInput`: パスワード専用の簡略版
- `Button`: フォーム送信ボタン
- `Select`: ドロップダウン選択
