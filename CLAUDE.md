# CLAUDE.md

Hihunokoeは化粧品の体験共有サービス。日本語で対話する。このファイルを開発ルールの正本とし、`.claude/CLAUDE.md` は入口だけにする。

## 構成と変更先

- Next.js 15 App Router / TypeScript / Tailwind CSS v4。正確な依存バージョンとコマンドは [package.json](package.json) を確認する。
- PostgreSQL / Prisma。schemaは `prisma/schema.prisma`、接続設定は `src/lib/db-config.ts` / `src/lib/prisma.ts`。
- 認証は `src/lib/auth/auth.ts`、管理者認可は `src/lib/auth/admin-middleware.ts`。JWT、メール検証、password reset、退会、USER / ADMIN / SUPER_ADMINの権限とAdminLogを維持する。
- `src/app/api/`: auth、posts、admin、profile等のAPI。`src/app/admin/`: 管理UI。
- `api/src/`: 内側からDomain、Use Cases、Interface Adapters、Frameworksの順に分けるAPI層。依存は外側から内側へ向け、内側から外側への依存を追加しない。
- `src/components/ui/` / `forms/` / `layout/`: 共通UI、フォーム、レイアウト。
- importは `@/` / `@api/` を優先し、相対importは同じディレクトリ内に限る。追加のaliasは `tsconfig.json` の設定と参照先の実在を確認する。

## 認証・DB・環境の注意

- 認証/認可・入力検証/サニタイズ・JWT検証・rate limitを弱めない。APIは既存のエラー応答形式を使い、UIはError Boundaryと例外処理を保つ。
- DB/mockの二重構成は既存実装を確認する。`USE_MOCK_DATA`、接続状態によるfallback、論理削除、退会時の関連データ処理、管理ログを無断で変更しない。
- 開発はDocker PostgreSQL / MailHog、本番メールはResend。DB接続先・秘密の値を出力・コミットしない。
- DBリセット・migration・seedは接続先と影響を確認してから実行する。環境準備やDB/認証変更時は [開発リファレンス](docs/agent-development.md) の該当節を読む。

## 実装・テスト・品質ゲート

- 原則TDD。期待する入出力のテストを先に書き、失敗を確認してから実装する。テストの期待値を実装に合わせて不当に弱めない。
- 失敗を確認しただけの状態はcommitしない。変更に対応するテストを追加し、型・lint・unitが通る動く単位でcommitする。
- 開発中の品質確認はformat、Prisma format、lint、型、coverageを行う。

```bash
npm run format
npx prisma format
npm run lint
npx tsc --noEmit
npm run test:coverage
```

- commit/push前、および依頼されたdeployの前は `npm run quality-check` を実行する。
  [実装](scripts/quality-check.js) が型、format、Prisma format、HTML nesting、lint、unit、build:checkを検査する。終了コードと各結果を確認し、失敗を修正するまでpushしない。
- 小さな変更、時間不足、直前の成功だけを理由に必須チェックを省略しない。ユーザーが明示した実行範囲は尊重し、省略・未実行の項目は成功と報告しない。
- formatで生じた差分も確認し、この作業に必要なものは同じ目的のcommitへ含める。無関係な既存差分を取り込まない。

## E2E

- 重要な変更や主要release前にはE2Eを確認する。このプロジェクトのE2E方針は他製品の方針で上書きしない。
- 既定は **Mobile Safariのみ**。他ブラウザはユーザーが明示した場合に実行する。

```bash
npm run test:e2e -- --project='Mobile Safari'
```

- Unit/integrationは主に `src/__tests__/` のJest、E2Eは `e2e/` のPlaywright。E2Eは実DBのテスト専用データを使い、環境を分離する。
- locatorはrole/label等のアクセシビリティ情報を優先し、必要な場合だけ `data-testid` を使う。フロー/locator変更時は [開発リファレンス](docs/agent-development.md) を読む。

## Commit・PR・merge

- コミットは `feat|fix|docs|style|refactor|perf|test|chore: 〇〇なため、△△を変更` の形式で、目的ごとにまとめる。
- rename/移動だけの変更、無関係な修正、レビュー指摘ごとの修正は分ける。変更理由が同じformat調整は該当する変更へ含める。
- 依存変更時は `package.json` と対応するlockfileの整合を確認し、一緒にcommitする。他の作業の変更を混ぜない。
- PR作成・更新後は `gh pr checks` でCIを確認する。失敗はログから修正し、3回の修正で解消できなければ原因・試行・再開条件をユーザーへ報告する。
- 追加commitではPR全体の差分を確認し、タイトル・本文・test planを現在の実装へ合わせる。CI成功未確認のPRを完了扱いしない。
- **mergeにはユーザーの明示指示、必須CI成功、必要なreview完了がすべて必要**。失敗・未確認のCIを成功と扱ったり、保護を迂回したりしない。
- PR作成、merge、deploy、公開確認は別の状態として報告する。

## 必要なときに読む資料

- 環境準備、DB/メール、API性能、E2E locator: [開発リファレンス](docs/agent-development.md)。
- 既存の作業補助は `.claude/commands/`。共通ルールをそこへ重複させず、このファイルと実際のscriptを優先する。
- 一般的なGit操作の教材はこの入口へ追加しない。
