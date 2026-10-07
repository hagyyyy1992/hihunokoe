# 作業別の開発リファレンス

常時適用するルールは [../CLAUDE.md](../CLAUDE.md) を正本とする。
環境準備・DB・API性能・E2Eを変更するときに、該当する節だけを読む。
この一覧は実行依頼ではない。データを消す操作は対象環境と承認を確認してから行う。

## Development Commands

### Setup

```bash
# Initial setup with all services
npm run dev:setup

# Quick development start
npm run dev

# Full development environment setup
npm run dev:setup
```

### Database

```bash
# Start local PostgreSQL
npm run db:setup

# Reset database completely
npm run db:nuke

# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed

# Open database studio
npm run db:studio
```

### Testing & Quality

```bash
# Unit & Integration tests (Jest)
npm test
npm run test:watch
npm run test:coverage
npm run test:api

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
npm run test:e2e:report

# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Email & Database Testing

```bash
# Start MailHog for email testing
npm run mailhog:start

# Stop MailHog
npm run mailhog:stop

# Database management
npm run db:clean    # Reset database with force
npm run db:status   # Check database connection status
```

## 認証・DB・メールの変更

認証入口は `src/lib/auth/auth.ts`、管理者認可は `src/lib/auth/admin-middleware.ts`、
DB接続は `src/lib/db-config.ts` / `src/lib/prisma.ts` を確認する。
既存のDB/mock二重構成を維持し、`USE_MOCK_DATA` やDB接続状態による分岐を変更するときは
実装と対応テストを確認する。本番で認証・認可をmockに置き換える変更をしない。

- PostgreSQL/Prisma、UUID主キー、userの `deletedAt` による論理削除を扱う。
- DB操作前の `isDatabaseAvailable()` と既存のfallback動作を確認する。
- ロールは USER / ADMIN / SUPER_ADMIN。管理操作のAdminLog、メール検証、password reset、退会時の関連データ処理を保持する。
- 開発メールはMailHog、本番はResend。`RESEND_API_KEY` などの値を文書に転記しない。
- APIの認証・認可、入力検証/サニタイズ、JWT検証、rate limitを弱めない。

### Performance Guidelines

#### Database Query Optimization

1. **並列クエリの実行**

   ```typescript
   // ❌ Bad: Sequential queries
   const users = await userRepository.findMany()
   const posts = await postRepository.findMany()
   const comments = await commentRepository.findMany()

   // ✅ Good: Parallel queries
   const [users, posts, comments] = await Promise.all([
     userRepository.findMany(),
     postRepository.findMany(),
     commentRepository.findMany(),
   ])
   ```

2. **N+1クエリの回避**

   ```typescript
   // ❌ Bad: Loop with individual queries
   for (let i = 0; i < 30; i++) {
     const count = await repository.count({ date: dates[i] })
   }

   // ✅ Good: Single aggregation query
   const counts = await repository.aggregateByDate(startDate, endDate)
   ```

3. **適切な集計の使用**

   - カウントには専用のcountメソッドを使用
   - GROUP BYを活用した一括集計
   - 不要なデータの取得を避ける（SELECT必要なカラムのみ）

4. **キャッシュの活用**

   - 頻繁にアクセスされるデータはキャッシュ
   - 統計データは定期的に事前計算

5. **インデックスの適切な使用**
   - WHERE句で使用するカラムにインデックス
   - 複合インデックスの順序に注意

#### APIレスポンスタイムの目標

- 単純なCRUD操作: < 200ms
- 複雑な集計クエリ: < 1秒
- ダッシュボード等の統計: < 2秒

#### パフォーマンス問題の兆候

- 10個以上の順次データベースクエリ
- ループ内でのデータベースアクセス
- 大量データの全件取得
- 未最適化の集計処理

### Clean Architecture (API Layer)

- **Directory structure**: `api/src/` follows clean architecture principles
- **Layers**: From innermost to outermost: Domain, Use Cases, Interface Adapters, Frameworks
- **Naming conventions**:
  - Use Cases: `interactor.ts` (implementation), `input-port.ts`, `output-port.ts`
  - Repositories: `UserRepository` (interface), `UserRepositoryImpl` (implementation)
  - Services: `PasswordHashService` (interface), `PasswordHashServiceImpl` (implementation)
- **Dependency rule**: Dependencies point from outer layers to inner layers, never the reverse
- **Testing**: Each layer can be tested independently with mocks
- **Documentation**: Inspect the existing layers under `api/src/` and their tests before changing dependencies.

### E2E Tests Locator Strategy (重要)

Playwright/Testing Libraryのベストプラクティスに従い、E2Eテストでは以下の優先順位でロケーターを使用すること：

#### 推奨順位（上から順に使用を検討）

1. **getByRole()** - ARIA roleとアクセシブルな名前で要素を取得

   ```typescript
   // Good: ボタンをroleとnameで特定
   await page.getByRole('button', { name: 'ログイン' }).click()
   await page.getByRole('heading', { name: 'ダッシュボード' }).waitFor()
   ```

2. **getByLabel()** - フォーム要素をラベルテキストで取得

   ```typescript
   // Good: ラベル付きの入力フィールド
   await page.getByLabel('メールアドレス').fill('user@example.com')
   await page.getByLabel('パスワード').fill('password123')
   ```

3. **getByPlaceholder()** - プレースホルダーテキストで取得

   ```typescript
   // Good: プレースホルダーが一意の場合
   await page.getByPlaceholder('検索キーワードを入力').fill('化粧水')
   ```

4. **getByText()** - 表示されているテキストで取得

   ```typescript
   // Good: 静的なテキスト要素
   await page.getByText('新規登録はこちら').click()
   expect(page.getByText('投稿が完了しました')).toBeVisible()
   ```

5. **getByAltText()** - 画像のalt属性で取得

   ```typescript
   // Good: 画像要素
   await page.getByAltText('プロフィール画像').click()
   ```

6. **getByTitle()** - title属性（ツールチップ）で取得

   ```typescript
   // Good: ツールチップ付き要素
   await page.getByTitle('詳細を表示').hover()
   ```

7. **getByTestId()** - data-testid属性で取得（最終手段）
   ```typescript
   // Acceptable: 他の方法では特定が困難な場合のみ
   await page.getByTestId('dynamic-content-12345').waitFor()
   ```

#### data-testidを使用すべきケース

以下の場合に限り、data-testidの使用を許可する：

1. **動的に変化するコンテンツ**

   - カウンター表示（例：「3件のコメント」→「4件のコメント」）
   - 状態によって変わるボタンテキスト（例：「フォローする」⇔「フォロー中」）

2. **同一ページに複数存在する同じ要素**

   - モバイルメニューとデスクトップメニューの区別
   - リスト内の個別アイテム

3. **フォーム要素で他の方法では特定困難**
   - ラベルがない、または動的に生成される入力フィールド
   - 複雑なカスタムコンポーネント

#### コンポーネント実装時の注意

フロントエンドコンポーネントには、適切なアクセシビリティ属性を追加すること：

```tsx
// Good: アクセシブルなボタンコンポーネント
<button
  role="button"
  aria-label="投稿を削除"
  onClick={handleDelete}
>
  <TrashIcon />
</button>

// Good: ラベル付きフォーム要素
<label htmlFor="email">メールアドレス</label>
<input id="email" type="email" />

// Acceptable: 動的コンテンツにはdata-testidを追加
<span data-testid={`comment-count-${postId}`}>
  {commentCount}件のコメント
</span>
```

#### 移行ガイドライン

既存のdata-testidベースのテストを段階的に改善：

1. 新規テストは上記優先順位に従って実装
2. 既存テストは機能追加・修正時に併せて改善
3. コンポーネント側にアクセシビリティ属性を追加してからテストを更新
4. 一度に全て変更するのではなく、段階的に移行

### Test Data Strategy

- Unit tests: Mock data and API responses
- E2E tests: Real database with test-specific data
- Use accessibility-based locators as primary method, `data-testid` only when necessary
- Isolated test environments prevent data conflicts
