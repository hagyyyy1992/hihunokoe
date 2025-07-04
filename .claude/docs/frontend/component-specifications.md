# コンポーネント仕様書

## 設計原則

### コンポーネント設計

- **単一責任**: 1つのコンポーネントは1つの責任を持つ
- **再利用性**: 複数の場所で使えるよう汎用的に設計
- **組み合わせ可能**: 小さなコンポーネントを組み合わせて複雑なUIを構築
- **型安全**: TypeScriptで厳密に型定義

### 命名規則

- **PascalCase**: コンポーネント名（例: PostCard, UserProfile）
- **camelCase**: props名、関数名（例: onClick, isLoading）
- **kebab-case**: CSS クラス名（Tailwind準拠）

## レイアウトコンポーネント

### Header

**場所**: `src/components/layout/Header.tsx`

**責任**: サイト全体のナビゲーション、ユーザー状態表示

**Props**:

```typescript
interface HeaderProps {
  // propsなし（AuthContextから状態取得）
}
```

**機能**:

- ロゴ・サービス名表示
- メインナビゲーション（ホーム、投稿一覧、検索）
- ユーザー状態に応じたメニュー表示
  - 未ログイン: ログイン・会員登録ボタン
  - ログイン済み: ユーザー名・プロフィール・ログアウト
- モバイル対応ハンバーガーメニュー

**状態**:

- `isMenuOpen`: モバイルメニューの開閉状態

### Footer

**場所**: `src/components/layout/Footer.tsx`

**責任**: サイト情報、リンク集表示

**Props**: なし

**機能**:

- サービス説明
- リンク集（サービス、サポート）
- コピーライト表示

## UIコンポーネント

### PostCard

**場所**: `src/components/ui/PostCard.tsx`

**責任**: 投稿一覧での投稿情報表示

**Props**:

```typescript
interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    cosmeticName: string
    cosmeticCategory?: string
    skinType?: string
    moodTag?: string
    publishedAt: string
    viewCount: number
    user: {
      id: string
      userName: string
      displayName?: string
      skinType?: string
    }
    _count: {
      empathies: number
      comments: number
    }
  }
}
```

**機能**:

- 投稿タイトル・内容プレビュー
- コスメ名・カテゴリ表示
- 雰囲気タグ・肌タイプバッジ
- 投稿者情報（匿名化）
- 統計情報（共感数、コメント数、閲覧数）
- 投稿詳細への遷移

**デザイン**:

- カード形式（ボーダー、シャドウ）
- ホバー時のエフェクト
- レスポンシブ対応

### Button

**場所**: `src/components/ui/Button.tsx`

**責任**: 統一されたボタンデザイン提供

**Props**:

```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}
```

**バリエーション**:

- **primary**: メインアクション（ピンク背景）
- **secondary**: サブアクション（グレー背景）
- **outline**: 枠線のみ
- **ghost**: 背景なし

**状態**:

- **default**: 通常状態
- **hover**: ホバー時
- **disabled**: 無効状態
- **loading**: 読み込み中（スピナー表示）

### Input

**場所**: `src/components/ui/Input.tsx`

**責任**: フォーム入力コンポーネント

**Props**:

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'search'
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}
```

**機能**:

- ラベル表示
- エラーメッセージ表示
- 必須項目マーク
- フォーカス時のスタイル変更

## フォームコンポーネント

### PostForm

**場所**: `src/components/forms/PostForm.tsx`

**責任**: 投稿作成・編集フォーム

**Props**:

```typescript
interface PostFormProps {
  initialData?: Partial<PostFormData>
  onSubmit: (data: PostFormData) => Promise<void>
  isEditing?: boolean
}

interface PostFormData {
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory: CosmeticCategory | ''
  skinType: SkinType | ''
  usageSituation: Partial<UsageSituation>
  experienceDetails: Partial<ExperienceDetails>
  moodTag: MoodTag | ''
}
```

**機能**:

- 4ステップのマルチステップフォーム
- ステップ間のバリデーション
- プレビュー機能
- 下書き保存（将来実装）

**ステップ構成**:

1. **基本情報**: タイトル、コスメ名、カテゴリ、体験談
2. **使用状況**: 肌タイプ、季節、時間帯、生理周期、肌状態
3. **体験詳細**: 香り、テクスチャ、使用感
4. **感想とまとめ**: 使用後の状態、総合評価

**バリデーション**:

- 必須項目チェック
- 文字数制限チェック
- 形式チェック

### LoginForm

**場所**: `src/components/forms/LoginForm.tsx`

**責任**: ログインフォーム

**Props**:

```typescript
interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  loading?: boolean
  error?: string
}
```

**機能**:

- メールアドレス・パスワード入力
- バリデーション
- エラー表示
- ローディング状態表示

### RegisterForm

**場所**: `src/components/forms/RegisterForm.tsx`

**責任**: 会員登録フォーム

**Props**:

```typescript
interface RegisterFormProps {
  onSubmit: (data: RegisterData) => Promise<void>
  loading?: boolean
  error?: string
}

interface RegisterData {
  userName: string
  email: string
  password: string
  confirmPassword: string
  displayName?: string
  skinType?: SkinType
}
```

**機能**:

- 基本情報入力
- パスワード確認
- 肌タイプ選択
- バリデーション
- エラー表示

## ページコンポーネント

### PostsPage

**場所**: `src/app/posts/page.tsx`

**責任**: 投稿一覧・検索・フィルタ

**機能**:

- 投稿一覧表示
- フィルタ機能（肌タイプ、カテゴリ、感想）
- キーワード検索
- ページネーション
- ローディング・エラー状態

**状態管理**:

```typescript
interface PostsPageState {
  posts: Post[]
  pagination: Pagination
  loading: boolean
  error: string
  filters: {
    skinType: string
    category: string
    moodTag: string
    search: string
    page: number
  }
}
```

### PostDetailPage

**場所**: `src/app/posts/[id]/page.tsx`

**責任**: 投稿詳細表示

**機能**:

- 投稿詳細情報表示
- 関連情報表示（使用状況、体験詳細）
- 共感ボタン
- コメント一覧
- コメント投稿フォーム

## コンポーネント間通信

### Props Drilling回避

- **Context API**: グローバル状態（認証情報）
- **カスタムフック**: 再利用可能なロジック
- **Compound Components**: 複雑なコンポーネントの構造化

### イベントハンドリング

- **onXxx形式**: コールバック関数
- **型安全**: TypeScriptでイベント型定義
- **エラーハンドリング**: try-catch + ユーザーフレンドリーなエラー表示

## テスト戦略

### 単体テスト

- **対象**: 純粋なロジック、ユーティリティ関数
- **ツール**: Jest + Testing Library（今後実装）

### 統合テスト

- **対象**: フォーム送信、API連携
- **ツール**: Testing Library + MSW

### E2Eテスト

- **対象**: 主要ユーザーフロー
- **ツール**: Playwright（今後実装）

## 性能最適化

### レンダリング最適化

- **React.memo**: 不要な再レンダリング防止
- **useMemo / useCallback**: 重い計算の最適化
- **lazy loading**: コンポーネントの遅延読み込み

### バンドルサイズ最適化

- **Tree shaking**: 未使用コードの除去
- **Code splitting**: ページ別分割
- **Dynamic imports**: 必要時のみインポート
