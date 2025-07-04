/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'
import { SERVICE_NAME } from '@/lib/constants'

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

describe('Home', () => {
  it('renders the main heading', () => {
    render(<Home />)

    expect(screen.getByText(/化粧品の/)).toBeInTheDocument()
    expect(screen.getByText('リアルな体験')).toBeInTheDocument()
    expect(screen.getByText(/を共有しよう/)).toBeInTheDocument()
  })

  it('renders the hero section description', () => {
    render(<Home />)

    expect(
      screen.getByText(
        '成分や評価ではなく、実際の使い心地から「自分に合うかも」を見つける新しいコミュニティ'
      )
    ).toBeInTheDocument()
  })

  it('renders the main navigation links', () => {
    render(<Home />)

    const postsLink = screen.getByRole('link', { name: '体験談を見る' })
    const newPostLink = screen.getByRole('link', { name: '体験を投稿する' })

    expect(postsLink).toBeInTheDocument()
    expect(postsLink).toHaveAttribute('href', '/posts')

    expect(newPostLink).toBeInTheDocument()
    expect(newPostLink).toHaveAttribute('href', '/posts/new')
  })

  it('renders the features section', () => {
    render(<Home />)

    expect(screen.getByText(`${SERVICE_NAME}の特徴`)).toBeInTheDocument()
    expect(screen.getByText('体験重視の投稿')).toBeInTheDocument()
    expect(screen.getByText('安心して投稿')).toBeInTheDocument()
    expect(screen.getByText('肌質別検索')).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    render(<Home />)

    expect(
      screen.getByText('成分表や点数評価ではなく、実際の使用感や肌の変化に焦点を当てた体験談を共有')
    ).toBeInTheDocument()
    expect(
      screen.getByText('「合わなかった」体験も大切な情報として受け入れる、優しいコミュニティ環境')
    ).toBeInTheDocument()
    expect(
      screen.getByText('肌タイプや季節、体調に合わせて、自分に近い状況での体験談を効率的に発見')
    ).toBeInTheDocument()
  })

  it('renders the CTA section', () => {
    render(<Home />)

    expect(screen.getByText('あなたの体験が、誰かの参考になる')).toBeInTheDocument()
    expect(
      screen.getByText(
        '化粧品選びで迷っている人のために、あなたのリアルな体験談を共有してみませんか？'
      )
    ).toBeInTheDocument()
  })

  it('renders the register link', () => {
    render(<Home />)

    const registerLink = screen.getByRole('link', { name: '今すぐ始める' })
    expect(registerLink).toBeInTheDocument()
    expect(registerLink).toHaveAttribute('href', '/auth/register')
  })

  it('has correct number of SVG icons in features section', () => {
    const { container } = render(<Home />)

    const svgElements = container.querySelectorAll('svg')
    expect(svgElements).toHaveLength(3)
  })

  it('applies correct gradient background', () => {
    const { container } = render(<Home />)

    const mainDiv = container.querySelector('div')
    expect(mainDiv).toHaveClass('bg-gradient-to-b', 'from-pink-50', 'to-white')
  })
})
