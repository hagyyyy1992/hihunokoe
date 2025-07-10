/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import AdminSettings from '@/app/admin/settings/page'

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Settings: ({ className }: { className?: string }) => (
    <span className={className} data-testid="settings">
      Settings
    </span>
  ),
  Database: ({ className }: { className?: string }) => (
    <span className={className} data-testid="database">
      Database
    </span>
  ),
  Shield: ({ className }: { className?: string }) => (
    <span className={className} data-testid="shield">
      Shield
    </span>
  ),
  Mail: ({ className }: { className?: string }) => (
    <span className={className} data-testid="mail">
      Mail
    </span>
  ),
  Globe: ({ className }: { className?: string }) => (
    <span className={className} data-testid="globe">
      Globe
    </span>
  ),
}))

describe('AdminSettings', () => {
  it('renders the page title and description', () => {
    render(<AdminSettings />)

    expect(screen.getByTestId('card-title')).toHaveTextContent('システム設定')
    expect(screen.getByTestId('card-description')).toHaveTextContent(
      '管理画面とアプリケーションの設定を管理します'
    )
  })

  it('renders the main heading', () => {
    render(<AdminSettings />)

    expect(screen.getByText('システム設定機能')).toBeInTheDocument()
  })

  it('renders the development message', () => {
    render(<AdminSettings />)

    expect(screen.getByText(/現在、システム設定機能は開発中です。/)).toBeInTheDocument()
    expect(screen.getByText(/以下の設定機能が実装予定です：/)).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    render(<AdminSettings />)

    expect(screen.getByText('マスターデータ')).toBeInTheDocument()
    expect(screen.getByText('肌タイプ、タグ、NGワード管理')).toBeInTheDocument()

    expect(screen.getByText('セキュリティ')).toBeInTheDocument()
    expect(screen.getByText('認証設定、アクセス制御')).toBeInTheDocument()

    expect(screen.getByText('メール設定')).toBeInTheDocument()
    expect(screen.getByText('通知メール、お知らせ配信')).toBeInTheDocument()

    expect(screen.getByText('サイト設定')).toBeInTheDocument()
    expect(screen.getByText('利用規約、プライバシーポリシー')).toBeInTheDocument()

    expect(screen.getByText('システム監視')).toBeInTheDocument()
    expect(screen.getByText('ログ管理、パフォーマンス監視')).toBeInTheDocument()

    expect(screen.getByText('バックアップ')).toBeInTheDocument()
    expect(screen.getByText('データバックアップ、復元')).toBeInTheDocument()
  })

  it('renders all icons', () => {
    render(<AdminSettings />)

    expect(screen.getAllByTestId('settings')).toHaveLength(2)
    expect(screen.getAllByTestId('database')).toHaveLength(2)
    expect(screen.getByTestId('shield')).toBeInTheDocument()
    expect(screen.getByTestId('mail')).toBeInTheDocument()
    expect(screen.getByTestId('globe')).toBeInTheDocument()
  })

  it('applies correct CSS classes for feature cards', () => {
    const { container } = render(<AdminSettings />)

    const blueCard = container.querySelector('.bg-blue-50')
    const greenCard = container.querySelector('.bg-green-50')
    const purpleCard = container.querySelector('.bg-purple-50')
    const yellowCard = container.querySelector('.bg-yellow-50')
    const redCard = container.querySelector('.bg-red-50')
    const grayCard = container.querySelector('.bg-gray-50')

    expect(blueCard).toBeInTheDocument()
    expect(greenCard).toBeInTheDocument()
    expect(purpleCard).toBeInTheDocument()
    expect(yellowCard).toBeInTheDocument()
    expect(redCard).toBeInTheDocument()
    expect(grayCard).toBeInTheDocument()
  })

  it('renders the grid layout correctly', () => {
    const { container } = render(<AdminSettings />)

    const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3')
    expect(grid).toBeInTheDocument()
  })
})
