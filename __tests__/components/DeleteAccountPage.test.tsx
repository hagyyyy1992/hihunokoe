import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import DeleteAccountPage from '../../src/app/account/delete/page'

// モック
const mockPush = jest.fn()
const mockUseRouter = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// fetchをモック
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('DeleteAccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('初期状態で警告メッセージと継続ボタンが表示される', () => {
    render(<DeleteAccountPage />)

    expect(screen.getByRole('heading', { name: /アカウント削除/i })).toBeInTheDocument()
    expect(screen.getByText(/この操作は取り消すことができません/)).toBeInTheDocument()
    expect(screen.getByText(/プロフィール情報/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /アカウント削除を続行/ })).toBeInTheDocument()
  })

  it('継続ボタンをクリックするとパスワード入力フォームが表示される', () => {
    render(<DeleteAccountPage />)

    const continueButton = screen.getByRole('button', { name: /アカウント削除を続行/ })
    fireEvent.click(continueButton)

    expect(screen.getByText(/最終確認/)).toBeInTheDocument()
    expect(screen.getByLabelText(/パスワードを入力して削除を確認/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /キャンセル/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /アカウントを削除/ })).toBeInTheDocument()
  })

  it('パスワードが入力されていない場合はエラーメッセージが表示される', async () => {
    render(<DeleteAccountPage />)

    // 継続ボタンをクリック
    const continueButton = screen.getByRole('button', { name: /アカウント削除を続行/ })
    fireEvent.click(continueButton)

    // パスワードを入力せずに削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除/ })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByTestId('error-message')).toHaveTextContent('パスワードを入力してください')
    })
  })

  it('パスワード入力後に削除ボタンが有効になる', () => {
    render(<DeleteAccountPage />)

    // 継続ボタンをクリック
    const continueButton = screen.getByRole('button', { name: /アカウント削除を続行/ })
    fireEvent.click(continueButton)

    const passwordInput = screen.getByLabelText(/パスワードを入力して削除を確認/)
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除/ })

    // 初期状態では無効
    expect(deleteButton).toBeDisabled()

    // パスワード入力後は有効
    fireEvent.change(passwordInput, { target: { value: 'test123' } })
    expect(deleteButton).not.toBeDisabled()
  })

  it('アカウント削除が成功した場合はトップページにリダイレクトされる', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'アカウントが正常に削除されました' }),
    } as Response)

    render(<DeleteAccountPage />)

    // 継続ボタンをクリック
    const continueButton = screen.getByRole('button', { name: /アカウント削除を続行/ })
    fireEvent.click(continueButton)

    // パスワードを入力
    const passwordInput = screen.getByLabelText(/パスワードを入力して削除を確認/)
    fireEvent.change(passwordInput, { target: { value: 'test123' } })

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除/ })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'test123' }),
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('アカウント削除が失敗した場合はエラーメッセージが表示される', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'ユーザーが見つかりません' }),
    } as Response)

    render(<DeleteAccountPage />)

    // 継続ボタンをクリック
    const continueButton = screen.getByRole('button', { name: /アカウント削除を続行/ })
    fireEvent.click(continueButton)

    // パスワードを入力
    const passwordInput = screen.getByLabelText(/パスワードを入力して削除を確認/)
    fireEvent.change(passwordInput, { target: { value: 'test123' } })

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除/ })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByTestId('error-message')).toHaveTextContent('ユーザーが見つかりません')
    })
  })

  it('キャンセルボタンをクリックすると初期状態に戻る', () => {
    render(<DeleteAccountPage />)

    // 継続ボタンをクリック
    const continueButton = screen.getByRole('button', { name: /アカウント削除を続行/ })
    fireEvent.click(continueButton)

    // パスワードを入力
    const passwordInput = screen.getByLabelText(/パスワードを入力して削除を確認/)
    fireEvent.change(passwordInput, { target: { value: 'test123' } })

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: /キャンセル/ })
    fireEvent.click(cancelButton)

    // 初期状態に戻ることを確認
    expect(screen.getByRole('button', { name: /アカウント削除を続行/ })).toBeInTheDocument()
    expect(screen.queryByLabelText(/パスワードを入力して削除を確認/)).not.toBeInTheDocument()
  })

  it('削除中はローディング状態が表示される', async () => {
    // 永続的なpendingのPromiseを作成
    mockFetch.mockReturnValueOnce(new Promise(() => {}))

    render(<DeleteAccountPage />)

    // 継続ボタンをクリック
    const continueButton = screen.getByRole('button', { name: /アカウント削除を続行/ })
    fireEvent.click(continueButton)

    // パスワードを入力
    const passwordInput = screen.getByLabelText(/パスワードを入力して削除を確認/)
    fireEvent.change(passwordInput, { target: { value: 'test123' } })

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除/ })
    fireEvent.click(deleteButton)

    // ローディング状態を確認
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /削除中.../ })).toBeInTheDocument()
    })
  })
})
