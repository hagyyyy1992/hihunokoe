/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { SERVICE_NAME } from '@/lib/constants'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Helper function to render with AuthProvider
const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>)
}

describe('Footer', () => {
  it('renders the footer element', () => {
    renderWithAuth(<Footer />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('renders the logo and brand name', () => {
    renderWithAuth(<Footer />)

    expect(screen.getByText('H')).toBeInTheDocument()
    expect(screen.getByText(SERVICE_NAME)).toBeInTheDocument()
  })

  it('renders the service description', () => {
    renderWithAuth(<Footer />)

    expect(
      screen.getByText(/化粧品の本当の使い心地を、体験談で共有するコミュニティ。/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/成分や評価ではなく、リアルな体験で「自分に合うかも」を見つけよう。/)
    ).toBeInTheDocument()
  })

  it('renders service navigation links for non-logged in users', () => {
    renderWithAuth(<Footer />)

    expect(screen.getByText('サービス')).toBeInTheDocument()

    const postsLink = screen.getByRole('link', { name: '体験を見る' })
    expect(postsLink).toBeInTheDocument()
    expect(postsLink).toHaveAttribute('href', '/posts')

    // 非ログインユーザーには「体験を投稿」リンクは表示されない
    const newPostLink = screen.queryByRole('link', { name: '体験を投稿' })
    expect(newPostLink).not.toBeInTheDocument()
  })

  it('renders support navigation links', () => {
    renderWithAuth(<Footer />)

    expect(screen.getByText('サポート')).toBeInTheDocument()

    const guidelinesLink = screen.getByRole('link', { name: '投稿ガイドライン' })
    expect(guidelinesLink).toHaveAttribute('href', '/guidelines')

    const helpLink = screen.getByRole('link', { name: 'ヘルプ' })
    expect(helpLink).toHaveAttribute('href', '/help')

    const contactLink = screen.getByRole('link', { name: 'お問い合わせ' })
    expect(contactLink).toHaveAttribute('href', '/contact')

    const privacyLink = screen.getByRole('link', { name: 'プライバシーポリシー' })
    expect(privacyLink).toHaveAttribute('href', '/legal/privacy')

    const termsLink = screen.getByRole('link', { name: '利用規約' })
    expect(termsLink).toHaveAttribute('href', '/legal/terms')
  })

  it('renders the copyright notice', () => {
    renderWithAuth(<Footer />)

    expect(screen.getByText(`© 2025 ${SERVICE_NAME}. All rights reserved.`)).toBeInTheDocument()
  })

  it('applies correct CSS classes for layout', () => {
    const { container } = renderWithAuth(<Footer />)

    const footer = container.querySelector('footer')
    expect(footer).toHaveClass('bg-gray-50', 'border-t', 'border-gray-100')

    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-4', 'gap-8')
  })

  it('applies hover styles to navigation links', () => {
    renderWithAuth(<Footer />)

    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveClass('hover:text-apple-600')
    })
  })

  it('renders logo with correct styling', () => {
    const { container } = renderWithAuth(<Footer />)

    const logoContainer = container.querySelector('.w-8.h-8.bg-apple-100.rounded-full')
    expect(logoContainer).toBeInTheDocument()

    const logoText = container.querySelector('.text-apple-600.font-bold.text-sm')
    expect(logoText).toBeInTheDocument()
  })
})
