/**
 * waitForTimeoutの代替実装
 * Playwrightの waitForTimeout が異常に長く待機する問題を回避するため
 */
export async function wait(ms: number): Promise<void> {
  const startTime = Date.now()

  return new Promise(resolve => {
    const checkTime = () => {
      const elapsed = Date.now() - startTime
      if (elapsed >= ms) {
        resolve()
      } else {
        // 10msごとにチェック
        setTimeout(checkTime, Math.min(10, ms - elapsed))
      }
    }

    // 初回のsetTimeoutを設定
    setTimeout(checkTime, Math.min(ms, 10))
  })
}

/**
 * デバッグ用のwait関数
 * 実際の待機時間をログ出力する
 */
export async function waitWithLog(ms: number, context?: string): Promise<void> {
  const startTime = Date.now()
  console.log(`[WAIT] Starting wait for ${ms}ms${context ? ` (${context})` : ''}`)

  await wait(ms)

  const actualWaitTime = Date.now() - startTime
  if (actualWaitTime > ms * 1.5) {
    console.warn(
      `[WAIT] WARNING: Expected to wait ${ms}ms but actually waited ${actualWaitTime}ms${context ? ` (${context})` : ''}`
    )
  } else {
    console.log(`[WAIT] Completed wait: ${actualWaitTime}ms${context ? ` (${context})` : ''}`)
  }
}
