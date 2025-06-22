import { Resend } from 'resend'
import { createTransport } from 'nodemailer'

// 開発環境でResend APIキーが未設定の場合はnullで初期化
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// MailHog用のTransporter（開発環境）
const mailhogTransporter = createTransport({
  host: process.env.MAILHOG_HOST || 'localhost',
  port: parseInt(process.env.MAILHOG_PORT || '1025'),
  secure: false,
  auth: false,
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

  if (isDevelopment || !resend) {
    // 開発環境またはResend APIキーが未設定の場合はMailHogを使用
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
      const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      })
      console.log(`📧 Email sent via Resend: ${to}`)
      return { success: true, id: result.data?.id }
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
