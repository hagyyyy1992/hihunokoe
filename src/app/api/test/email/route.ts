import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/email'
import { z } from 'zod'

const testEmailSchema = z.object({
  to: z.string().email('有効なメールアドレスを入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    // 開発環境またはテスト環境でのみ許可
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development or preview environments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = testEmailSchema.parse(body)

    const testSubject = '【テスト】メール送信テスト'
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>メール送信テスト</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>メール送信テスト</h2>
          <p>このメールは、メール送信機能のテストメールです。</p>
          
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>送信情報</h3>
            <ul>
              <li>送信先: ${validatedData.to}</li>
              <li>送信元: ${process.env.FROM_EMAIL || 'noreply@yourdomain.com'}</li>
              <li>環境: ${process.env.NODE_ENV} / ${process.env.VERCEL_ENV || 'local'}</li>
              <li>日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</li>
            </ul>
          </div>
          
          <p>正常にメールが届いている場合、メール送信設定は正しく構成されています。</p>
        </div>
      </body>
      </html>
    `
    const testText = `
メール送信テスト

このメールは、メール送信機能のテストメールです。

送信情報:
- 送信先: ${validatedData.to}
- 送信元: ${process.env.FROM_EMAIL || 'noreply@yourdomain.com'}
- 環境: ${process.env.NODE_ENV} / ${process.env.VERCEL_ENV || 'local'}
- 日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}

正常にメールが届いている場合、メール送信設定は正しく構成されています。
    `

    await sendEmail({
      to: validatedData.to,
      subject: testSubject,
      html: testHtml,
      text: testText,
    })

    return NextResponse.json({
      success: true,
      message: 'テストメールを送信しました',
      details: {
        to: validatedData.to,
        from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
        environment: `${process.env.NODE_ENV} / ${process.env.VERCEL_ENV || 'local'}`,
      },
    })
  } catch (error) {
    console.error('Test email error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: 'メール送信に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}