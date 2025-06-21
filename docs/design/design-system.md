# デザインシステム

## デザインコンセプト

### ブランド価値
- **安心感**: 心理的安全性を重視したデザイン
- **親しみやすさ**: 専門的すぎず、カジュアルな雰囲気
- **清潔感**: 化粧品サービスらしい清潔で上品な印象
- **包括性**: 多様な肌質・体験を受け入れる包容力

### デザイン原則
1. **共感を促進**: ユーザー同士の理解を深める
2. **情報の整理**: 複雑な体験情報をわかりやすく表示
3. **アクセシビリティ**: 誰でも使いやすいUI
4. **一貫性**: 統一されたビジュアル言語

## カラーパレット

### プライマリーカラー
```css
/* ピンク系 - メインブランドカラー */
--pink-50: #fdf2f8;   /* 背景・薄い装飾 */
--pink-100: #fce7f3;  /* ホバー背景 */
--pink-500: #ec4899;  /* アクションボタン */
--pink-600: #db2777;  /* ホバー状態 */
--pink-700: #be185d;  /* アクティブ状態 */
```

### セカンダリーカラー
```css
/* グレー系 - テキスト・ニュートラル */
--gray-50: #f9fafb;   /* 背景 */
--gray-100: #f3f4f6;  /* カード背景 */
--gray-300: #d1d5db;  /* ボーダー */
--gray-500: #6b7280;  /* セカンダリテキスト */
--gray-700: #374151;  /* メインテキスト */
--gray-900: #111827;  /* ヘッドライン */
```

### アクセントカラー
```css
/* ブルー系 - 情報・カテゴリ */
--blue-100: #dbeafe;
--blue-800: #1e40af;

/* グリーン系 - 成功・ポジティブ */
--green-100: #dcfce7;
--green-700: #15803d;

/* イエロー系 - 注意・警告 */
--yellow-100: #fef3c7;
--yellow-700: #a16207;

/* レッド系 - エラー・削除 */
--red-100: #fee2e2;
--red-700: #b91c1c;
```

### 感想タグカラー
```css
/* 雰囲気タグ専用カラー */
--disappointed: --gray-100;   /* ちょっと残念 */
--okay: --yellow-100;         /* まあまあ */
--good: --green-100;          /* 良かった */
--love: --pink-100;           /* また使いたい */
--perfect: #f3e8ff;           /* 完璧（紫系） */
```

## タイポグラフィ

### フォントファミリー
```css
/* プライマリフォント - Geist Sans */
font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* モノスペースフォント - Geist Mono */
font-family: var(--font-geist-mono), 'SF Mono', Monaco, monospace;
```

### 文字サイズ・行間
```css
/* ヘッドライン */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* 30px/36px */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }     /* 24px/32px */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }   /* 20px/28px */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }  /* 18px/28px */

/* ボディテキスト */
.text-base { font-size: 1rem; line-height: 1.5rem; }     /* 16px/24px */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }  /* 14px/20px */
.text-xs { font-size: 0.75rem; line-height: 1rem; }      /* 12px/16px */
```

### 文字色
```css
/* メインテキスト */
.text-gray-900 { color: #111827; }

/* セカンダリテキスト */
.text-gray-600 { color: #4b5563; }

/* 補助テキスト */
.text-gray-500 { color: #6b7280; }

/* アクセントテキスト */
.text-pink-600 { color: #db2777; }
```

## コンポーネント仕様

### ボタン
```css
/* プライマリボタン */
.btn-primary {
  @apply bg-pink-600 text-white hover:bg-pink-700 
         px-4 py-2 rounded-full font-medium 
         transition-colors duration-200;
}

/* セカンダリボタン */
.btn-secondary {
  @apply border border-pink-600 text-pink-600 hover:bg-pink-50
         px-4 py-2 rounded-full font-medium
         transition-colors duration-200;
}

/* ゴーストボタン */
.btn-ghost {
  @apply text-gray-700 hover:text-pink-600 hover:bg-gray-50
         px-3 py-2 rounded-md font-medium
         transition-colors duration-200;
}
```

### 入力フィールド
```css
.form-input {
  @apply block w-full px-3 py-2 
         border border-gray-300 rounded-md 
         placeholder-gray-400 
         focus:outline-none focus:ring-pink-500 focus:border-pink-500
         sm:text-sm;
}

.form-input-error {
  @apply border-red-300 focus:ring-red-500 focus:border-red-500;
}
```

### カード
```css
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.card-hover {
  @apply hover:shadow-md transition-shadow duration-200;
}
```

### バッジ・タグ
```css
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-category {
  @apply bg-blue-100 text-blue-800;
}

.badge-skin-type {
  @apply bg-gray-100 text-gray-700;
}

.badge-mood {
  /* 動的にクラス適用 */
}
```

## レイアウト

### グリッドシステム
```css
/* コンテナ */
.container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* セクション */
.section {
  @apply py-12 sm:py-16 lg:py-20;
}

/* カードグリッド */
.card-grid {
  @apply grid gap-6 md:grid-cols-2 lg:grid-cols-3;
}
```

### スペーシング
```css
/* マージン・パディング基準 */
--spacing-unit: 0.25rem; /* 4px */

/* よく使用するスペース */
.space-y-4 > * + * { margin-top: 1rem; }    /* 16px */
.space-y-6 > * + * { margin-top: 1.5rem; }  /* 24px */
.space-y-8 > * + * { margin-top: 2rem; }    /* 32px */
```

## レスポンシブデザイン

### ブレークポイント
```css
/* Tailwind CSS ブレークポイント */
sm: 640px   /* モバイル横・小タブレット */
md: 768px   /* タブレット */
lg: 1024px  /* 小デスクトップ */
xl: 1280px  /* デスクトップ */
2xl: 1536px /* 大画面 */
```

### モバイルファースト
```css
/* 基本: モバイル（320px〜） */
.responsive-text {
  @apply text-base;
}

/* タブレット以上 */
@screen md {
  .responsive-text {
    @apply text-lg;
  }
}

/* デスクトップ以上 */
@screen lg {
  .responsive-text {
    @apply text-xl;
  }
}
```

## アイコン

### アイコンライブラリ
- **Heroicons**: メインアイコンセット
- **SVG**: カスタムアイコン
- **サイズ**: 16px, 20px, 24px（基本3サイズ）

### よく使用するアイコン
```jsx
/* 共感 */
<HeartIcon className="w-5 h-5" />

/* コメント */
<ChatBubbleLeftIcon className="w-5 h-5" />

/* 表示 */
<EyeIcon className="w-5 h-5" />

/* 検索 */
<MagnifyingGlassIcon className="w-5 h-5" />

/* ユーザー */
<UserIcon className="w-5 h-5" />
```

## アニメーション・インタラクション

### トランジション
```css
/* 基本トランジション */
.transition-default {
  @apply transition-colors duration-200 ease-in-out;
}

/* ホバーエフェクト */
.hover-lift {
  @apply transform hover:-translate-y-1 transition-transform duration-200;
}

/* フェードイン */
.fade-in {
  @apply opacity-0 animate-fade-in;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### ローディング状態
```css
.loading-spinner {
  @apply animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600;
}

.loading-skeleton {
  @apply bg-gray-200 animate-pulse rounded;
}
```

## アクセシビリティ

### コントラスト比
- **通常テキスト**: 4.5:1 以上
- **大きなテキスト**: 3:1 以上
- **UIコンポーネント**: 3:1 以上

### フォーカス管理
```css
.focus-visible {
  @apply focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2;
}
```

### セマンティック
- 適切なHTML要素の使用
- ARIA属性の適用
- キーボードナビゲーション対応

## 状態別デザイン

### ボタン状態
- **default**: 通常状態
- **hover**: ホバー時（色変更）
- **active**: クリック時（わずかに暗く）
- **disabled**: 無効時（透明度50%）
- **loading**: 処理中（スピナー表示）

### フォーム状態
- **default**: 通常状態
- **focus**: フォーカス時（アウトライン）
- **error**: エラー時（赤ボーダー）
- **success**: 成功時（緑ボーダー）
- **disabled**: 無効時（グレーアウト）

## 実装ガイドライン

### クラス命名
```css
/* BEM風の命名 */
.post-card { }
.post-card__header { }
.post-card__content { }
.post-card--featured { }
```

### Tailwind利用
```jsx
/* Utility-First */
<button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-full">
  投稿する
</button>

/* コンポーネント抽出 */
<Button variant="primary" size="md">
  投稿する
</Button>
```

### ダークモード対応（将来実装）
```css
.dark .card {
  @apply bg-gray-800 border-gray-700;
}

.dark .text-primary {
  @apply text-gray-100;
}
```