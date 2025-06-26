import { Resend } from 'resend'
import { createTransport } from 'nodemailer'
import { logEmailSend } from './email-events'

// 開発環境でResend APIキーが未設定の場合はnullで初期化
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// MailHog用のTransporter（開発環境）
const mailhogTransporter = createTransport({
  host: process.env.MAILHOG_HOST || 'localhost',
  port: parseInt(process.env.MAILHOG_PORT || '1025'),
  secure: false,
  // auth: false の代わりに undefined を使用
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  tracking?: {
    open?: boolean
    click?: boolean
    tags?: Record<string, string>
  }
}

export async function sendEmail({ to, subject, html, text, tracking }: EmailOptions) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com'
  const environment = process.env.VERCEL_ENV || 'local'

  // 本番環境でRESEND_API_KEYが未設定の場合
  if (!isDevelopment && !resend) {
    console.error('RESEND_API_KEY is not set in production environment')
    throw new Error(
      'Email service is not configured. Please set RESEND_API_KEY environment variable.'
    )
  }

  // 開発環境では常にMailHogを使用（RESEND_API_KEYが設定されていても）
  if (isDevelopment) {
    try {
      await mailhogTransporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      })
      console.log(`📧 Email sent to MailHog: ${to}`)
      return { success: true }
    } catch (error) {
      console.error('MailHog email error:', error)
      throw new Error('Failed to send email via MailHog')
    }
  } else {
    // 本番環境ではResendを使用
    try {
      // デフォルトのトラッキング設定
      const defaultTracking = {
        open: true,
        click: true,
        tags: {
          environment,
          version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
          service: 'usaka',
        },
      }

      // トラッキング設定をマージ
      const trackingOptions = tracking ? { ...defaultTracking, ...tracking } : defaultTracking

      const result = await resend!.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        text,
        tags: trackingOptions.tags
          ? Object.entries(trackingOptions.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      })

      const messageId = result.data?.id

      console.log(`📧 Email sent via Resend:`, {
        to,
        from: fromEmail,
        subject,
        messageId,
        environment,
        tracking: trackingOptions,
        error: result.error,
      })

      // メール送信ログをSupabaseに記録
      if (messageId) {
        try {
          await logEmailSend({
            resendId: messageId,
            to,
            from: fromEmail,
            subject,
            environment,
          })
        } catch (logError) {
          console.warn('Failed to log email send to database:', logError)
          // ログ失敗してもメール送信は成功とする
        }
      }

      return { success: true, id: messageId }
    } catch (error) {
      console.error('Resend email error:', error)
      throw new Error('Failed to send email via Resend')
    }
  }
}

export function generateVerificationEmailHtml(userName: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>メールアドレスの確認</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">化粧品体験共有サービス</h2>
        <h3>メールアドレスの確認</h3>
        
        <p>こんにちは、${userName}さん</p>
        
        <p>アカウント登録ありがとうございます。<br>
        以下のリンクをクリックして、メールアドレスの確認を完了してください。</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            メールアドレスを確認する
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          このリンクは24時間有効です。<br>
          もしこのメールに心当たりがない場合は、このメールを無視してください。
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          このメールは自動送信されています。返信はできません。
        </p>
      </div>
    </body>
    </html>
  `
}

export function generateVerificationEmailText(userName: string, verificationUrl: string): string {
  return `
化粧品体験共有サービス

メールアドレスの確認

こんにちは、${userName}さん

アカウント登録ありがとうございます。
以下のURLにアクセスして、メールアドレスの確認を完了してください。

${verificationUrl}

このリンクは24時間有効です。
もしこのメールに心当たりがない場合は、このメールを無視してください。

---
このメールは自動送信されています。返信はできません。
  `
}

export function generatePasswordResetEmailHtml(userName: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>パスワードリセット</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">化粧品体験共有サービス</h2>
        <h3>パスワードリセット</h3>
        
        <p>こんにちは、${userName}さん</p>
        
        <p>パスワードリセットのリクエストを受け付けました。<br>
        以下のリンクをクリックして、新しいパスワードを設定してください。</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            パスワードをリセットする
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          このリンクは24時間有効です。<br>
          もしこのメールに心当たりがない場合は、このメールを無視してください。<br>
          パスワードリセットをリクエストしていない場合は、アカウントのセキュリティを確認することをお勧めします。
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          このメールは自動送信されています。返信はできません。
        </p>
      </div>
    </body>
    </html>
  `
}

export function generatePasswordResetEmailText(userName: string, resetUrl: string): string {
  return `
化粧品体験共有サービス

パスワードリセット

こんにちは、${userName}さん

パスワードリセットのリクエストを受け付けました。
以下のURLにアクセスして、新しいパスワードを設定してください。

${resetUrl}

このリンクは24時間有効です。
もしこのメールに心当たりがない場合は、このメールを無視してください。
パスワードリセットをリクエストしていない場合は、アカウントのセキュリティを確認することをお勧めします。

---
このメールは自動送信されています。返信はできません。
  `
}
