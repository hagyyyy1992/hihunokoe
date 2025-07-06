import { Resend } from 'resend'
import { createTransport } from 'nodemailer'
import { SERVICE_NAME } from '@/lib/constants'

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
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com'
  // 本番環境でRESEND_API_KEYが未設定の場合
  if (!isDevelopment && !resend) {
    console.error('RESEND_API_KEY is not set in production environment', {
      isDevelopment,
      hasResend: !!resend,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    })
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
      return { success: true }
    } catch (error) {
      console.error('MailHog email error:', error)
      throw new Error('Failed to send email via MailHog')
    }
  } else {
    // 本番環境ではResendを使用
    try {
      const result = await resend!.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      })
      const messageId = result.data?.id
      return { success: true, id: messageId }
    } catch (error) {
      console.error('Resend email error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        to,
        subject,
        fromEmail,
      })
      throw new Error(
        `Failed to send email via Resend: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
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
        <h2 style="color: #2c3e50;">${SERVICE_NAME}</h2>
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
${SERVICE_NAME}

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
        <h2 style="color: #2c3e50;">${SERVICE_NAME}</h2>
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
${SERVICE_NAME}

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

export function generateAccountDeletionEmailHtml(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>アカウント削除完了</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">${SERVICE_NAME}</h2>
        <h3>アカウント削除完了</h3>
        
        <p>こんにちは、${userName}さん</p>
        
        <p>アカウント削除の手続きが完了いたしました。</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #495057;">削除された内容</h4>
          <ul style="color: #6c757d;">
            <li>プロフィール情報</li>
            <li>投稿した体験談</li>
            <li>コメントと共感履歴</li>
            <li>その他のアカウント関連データ</li>
          </ul>
        </div>
        
        <p>今後、このメールアドレスでの新規登録が可能です。<br>
        また、何かご不明な点がございましたら、サポートまでお問い合わせください。</p>
        
        <p>これまで${SERVICE_NAME}をご利用いただき、ありがとうございました。</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          このメールは自動送信されています。返信はできません。
        </p>
      </div>
    </body>
    </html>
  `
}

export function generateAccountDeletionEmailText(userName: string): string {
  return `
${SERVICE_NAME}

アカウント削除完了

こんにちは、${userName}さん

アカウント削除の手続きが完了いたしました。

削除された内容:
- プロフィール情報
- 投稿した体験談
- コメントと共感履歴
- その他のアカウント関連データ

今後、このメールアドレスでの新規登録が可能です。
また、何かご不明な点がございましたら、サポートまでお問い合わせください。

これまで${SERVICE_NAME}をご利用いただき、ありがとうございました。

---
このメールは自動送信されています。返信はできません。
  `
}
