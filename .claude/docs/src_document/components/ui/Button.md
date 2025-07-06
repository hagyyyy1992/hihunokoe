# components/ui/Button.tsx

## 概要

アプリケーション全体で使用される汎用的なボタンコンポーネント。複数のバリアント、サイズ、状態をサポートします。

## Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  'data-testid'?: string
}
```

### Props詳細

| Prop       | 型        | デフォルト | 説明                   |
| ---------- | --------- | ---------- | ---------------------- |
| `variant`  | string    | 'primary'  | ボタンの外観スタイル   |
| `size`     | string    | 'md'       | ボタンのサイズ         |
| `loading`  | boolean   | false      | ローディング状態の表示 |
| `icon`     | ReactNode | -          | ボタン内のアイコン     |
| `children` | ReactNode | 必須       | ボタンのテキスト内容   |

## バリアント

### primary（デフォルト）

```tsx
<Button variant="primary">保存</Button>
```

主要なアクション用。濃い背景色。

### secondary

```tsx
<Button variant="secondary">キャンセル</Button>
```

副次的なアクション用。薄い背景色。

### outline

```tsx
<Button variant="outline">詳細を見る</Button>
```

枠線のみのスタイル。

### ghost

```tsx
<Button variant="ghost">削除</Button>
```

背景なし、ホバー時のみ表示。

### danger / destructive

```tsx
<Button variant="danger">削除する</Button>
```

破壊的なアクション用。赤色系。

## サイズ

```tsx
// 小サイズ
<Button size="sm">小</Button>

// 中サイズ（デフォルト）
<Button size="md">中</Button>

// 大サイズ
<Button size="lg">大</Button>
```

## 機能

### ローディング状態

```tsx
<Button loading={isSubmitting}>送信中...</Button>
```

- ローディング中は自動的に無効化
- スピナーアイコンを表示

### アイコン付きボタン

```tsx
<Button icon={<SaveIcon />}>保存</Button>
```

- アイコンとテキストの間に適切なスペース
- アイコンのみのボタンも可能

### フォワードRef

```tsx
const buttonRef = useRef<HTMLButtonElement>(null)
<Button ref={buttonRef}>クリック</Button>
```

## スタイリング

### CSSクラス構造

```typescript
const baseClasses = 'btn'
const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  // ...
}
const sizeClasses = {
  sm: 'text-sm px-3 py-1',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-6 py-3',
}
```

### カスタマイズ

```tsx
<Button className="custom-class">カスタムボタン</Button>
```

## 使用例

### フォーム送信

```tsx
<form onSubmit={handleSubmit}>
  <Button type="submit" loading={isSubmitting}>
    送信
  </Button>
</form>
```

### 確認ダイアログ

```tsx
<div className="flex gap-2">
  <Button variant="danger" onClick={handleDelete}>
    削除
  </Button>
  <Button variant="outline" onClick={handleCancel}>
    キャンセル
  </Button>
</div>
```

### アイコンボタン

```tsx
<Button variant="ghost" size="sm" icon={<EditIcon />} onClick={handleEdit}>
  編集
</Button>
```

## パフォーマンス

- `React.memo`によるメモ化
- 不要な再レンダリング防止
- propsの参照が変わらない限り再レンダリングしない

## アクセシビリティ

- ネイティブbutton要素を使用
- disabled状態の適切な処理
- フォーカス可能
- キーボード操作対応（Enter/Space）
- ARIA属性のサポート

## テスト

```tsx
<Button data-testid="submit-button">送信</Button>
```

## 依存関係

- React（forwardRef, memo）
- クラス名ユーティリティ（cn関数）
- デザインシステムのCSSクラス
