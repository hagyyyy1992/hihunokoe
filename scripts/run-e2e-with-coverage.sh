#!/bin/bash

# E2E Tests with Code Coverage
# 実際のコードカバレッジを収集しながらE2Eテストを実行

echo "🚀 Starting E2E tests with coverage collection..."

# 環境変数設定
export NODE_ENV=test
export COLLECT_COVERAGE=true

# カバレッジディレクトリを作成
mkdir -p coverage/e2e

# Next.jsをカバレッジモードで起動（バックグラウンド）
echo "📦 Starting Next.js with coverage instrumentation..."
npm run build:local
NODE_OPTIONS="--require ./scripts/coverage-setup.js" npm start &
NEXT_PID=$!

# Next.jsの起動を待機
echo "⏳ Waiting for server to start..."
sleep 10

# サーバーが起動したか確認
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server failed to start"
    kill $NEXT_PID 2>/dev/null
    exit 1
fi

echo "✅ Server started successfully"

# E2Eテストを実行
echo "🧪 Running E2E tests..."
npm run test:e2e

# テスト結果を保存
TEST_EXIT_CODE=$?

# Next.jsサーバーを停止
echo "🛑 Stopping server..."
kill $NEXT_PID 2>/dev/null
wait $NEXT_PID 2>/dev/null

# カバレッジレポートを生成
if [ -d "coverage/e2e" ] && [ "$(ls -A coverage/e2e)" ]; then
    echo "📊 Generating coverage report..."
    npx nyc report --reporter=html --reporter=text --report-dir=coverage/e2e-html
    echo "📁 Coverage report generated in coverage/e2e-html/"
else
    echo "⚠️  No coverage data collected"
fi

# 結果表示
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ E2E tests completed successfully!"
else
    echo "❌ E2E tests failed with exit code $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE