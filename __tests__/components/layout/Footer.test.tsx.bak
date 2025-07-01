/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import Footer from '@/components/layout/Footer'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

describe('Footer', () => {
  it('renders the footer element', () => {
    render(<Footer />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('renders the Usaka logo and brand name', () => {
    render(<Footer />)

    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByText('Usaka')).toBeInTheDocument()
  })

  it('renders the service description', () => {
    render(<Footer />)

    expect(
      screen.getByText(/化粧品の本当の使い心地を、体験談で共有するコミュニティ。/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/成分や評価ではなく、リアルな体験で「自分に合うかも」を見つけよう。/)
    ).toBeInTheDocument()
  })

  it('renders service navigation links', () => {
    render(<Footer />)

    expect(screen.getByText('サービス')).toBeInTheDocument()

    const postsLink = screen.getByRole('link', { name: '体験を見る' })
    expect(postsLink).toBeInTheDocument()
    expect(postsLink).toHaveAttribute('href', '/posts')

    const newPostLink = screen.getByRole('link', { name: '体験を投稿' })
    expect(newPostLink).toBeInTheDocument()
    expect(newPostLink).toHaveAttribute('href', '/posts/new')
  })

  it('renders support navigation links', () => {
    render(<Footer />)

    expect(screen.getByText('サポート')).toBeInTheDocument()

    const guidelinesLink = screen.getByRole('link', { name: '投稿ガイドライン' })
    expect(guidelinesLink).toHaveAttribute('href', '/guidelines')

    const helpLink = screen.getByRole('link', { name: 'ヘルプ' })
    expect(helpLink).toHaveAttribute('href', '/help')

    const contactLink = screen.getByRole('link', { name: 'お問い合わせ' })
    expect(contactLink).toHaveAttribute('href', '/contact')

    const privacyLink = screen.getByRole('link', { name: 'プライバシーポリシー' })
    expect(privacyLink).toHaveAttribute('href', '/privacy')

    const termsLink = screen.getByRole('link', { name: '利用規約' })
    expect(termsLink).toHaveAttribute('href', '/terms')
  })

  it('renders the copyright notice', () => {
    render(<Footer />)

    expect(screen.getByText('© 2024 Usaka. All rights reserved.')).toBeInTheDocument()
  })

  it('applies correct CSS classes for layout', () => {
    const { container } = render(<Footer />)

    const footer = container.querySelector('footer')
    expect(footer).toHaveClass('bg-gray-50', 'border-t', 'border-gray-100')

    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-4', 'gap-8')
  })

  it('applies hover styles to navigation links', () => {
    render(<Footer />)

    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveClass('hover:text-pink-600')
    })
  })

  it('renders logo with correct styling', () => {
    const { container } = render(<Footer />)

    const logoContainer = container.querySelector('.w-8.h-8.bg-pink-100.rounded-full')
    expect(logoContainer).toBeInTheDocument()

    const logoText = container.querySelector('.text-pink-600.font-bold.text-sm')
    expect(logoText).toBeInTheDocument()
  })
})
