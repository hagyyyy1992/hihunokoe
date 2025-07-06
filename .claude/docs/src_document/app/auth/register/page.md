# auth/register/page.tsx

## 概要

新規ユーザー登録ページ。基本情報から詳細なプロフィール情報まで、包括的なユーザー情報を収集します。

## フォーム構成

### 基本情報

- **ユーザー名**: 3文字以上、必須
- **メールアドレス**: 有効なメール形式、必須
- **パスワード**: 8文字以上、必須
  - パスワード強度インジケーター付き
  - リアルタイムで要件をチェック
- **パスワード確認**: パスワードと一致が必要

### プロフィール情報

- **生年月日**: DatePickerコンポーネント使用
- **性別**: 男性/女性/その他/回答しない
- **肌質**:
  - 普通肌/乾燥肌/脂性肌/混合肌/敏感肌
  - 「その他」選択時はテキスト入力可能

### アレルギー情報

複数選択可能なチェックボックス：

- 定義済みアレルギー（9種類）
- 「その他」オプションでカスタム入力

### キーボードショートカット

```typescript
if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
  e.preventDefault()
  // 全選択/全解除トグル
}
```

## 登録フロー

1. **フォーム入力**

   - クライアントサイドバリデーション
   - パスワード一致確認

2. **APIリクエスト**

   ```typescript
   POST / api / auth / register
   {
     username, email, password, birthDate, gender, skinType, allergies, skinTypeOther, allergyOther
   }
   ```

3. **成功時の処理**

   - `/auth/registration-complete?email={email}` へリダイレクト
   - メール認証の案内ページへ遷移

4. **エラー処理**
   - フィールド別エラー表示
   - ページトップへ自動スクロール

## 型定義

```typescript
interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  birthDate: string
  gender: Gender
  skinType: SkinType
  skinTypeOther: string
  allergies: AllergyType[]
  allergyOther: string
}
```

## コンポーネント依存関係

- `@/components/ui/PasswordInput`: パスワード入力
- `@/components/ui/PasswordStrengthIndicator`: 強度表示
- `@/components/ui/PasswordRequirements`: 要件表示
- `@/components/ui/DatePicker`: 日付選択
- `@/lib/auth/password-validation`: パスワード検証

## 定数定義

```typescript
const ALLERGY_OPTIONS = [
  { value: 'ALCOHOL', label: 'アルコール' },
  { value: 'FRAGRANCE', label: '香料' },
  // ... 他のオプション
]
```

## パフォーマンス最適化

- 定数は関数外で定義（再作成防止）
- `useCallback`によるイベントハンドラーの最適化
- 条件付きレンダリングで不要な要素を削減

## アクセシビリティ

- 適切なラベルとaria属性
- キーボード操作対応
- エラーメッセージの明確な表示

## テスト考慮事項

- フォームバリデーションのエッジケース
- アレルギー選択の複数パターン
- エラー状態の各種シナリオ
