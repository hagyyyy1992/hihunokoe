/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import ReportsManagement from '@/app/admin/reports/page'

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
  AlertTriangle: ({ className }: { className?: string }) => (
    <span className={className} data-testid="alert-triangle">
      AlertTriangle
    </span>
  ),
  Clock: ({ className }: { className?: string }) => (
    <span className={className} data-testid="clock">
      Clock
    </span>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <span className={className} data-testid="check-circle">
      CheckCircle
    </span>
  ),
  XCircle: ({ className }: { className?: string }) => (
    <span className={className} data-testid="x-circle">
      XCircle
    </span>
  ),
}))

describe('ReportsManagement', () => {
  it('renders the page title and description', () => {
    render(<ReportsManagement />)

    expect(screen.getByTestId('card-title')).toHaveTextContent('通報管理')
    expect(screen.getByTestId('card-description')).toHaveTextContent(
      'ユーザーからの通報を管理し、適切な対応を行います'
    )
  })

  it('renders the main heading', () => {
    render(<ReportsManagement />)

    expect(screen.getByText('通報管理機能')).toBeInTheDocument()
  })

  it('renders the development message', () => {
    render(<ReportsManagement />)

    expect(screen.getByText(/現在、通報管理機能は開発中です。/)).toBeInTheDocument()
    expect(screen.getByText(/以下の機能が実装予定です：/)).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    render(<ReportsManagement />)

    expect(screen.getByText('通報受付')).toBeInTheDocument()
    expect(screen.getByText('不適切な投稿の通報受付')).toBeInTheDocument()

    expect(screen.getByText('通報審査')).toBeInTheDocument()
    expect(screen.getByText('通報内容の確認と判定')).toBeInTheDocument()

    expect(screen.getByText('対応処理')).toBeInTheDocument()
    expect(screen.getByText('投稿削除や警告の実行')).toBeInTheDocument()

    expect(screen.getByText('違反管理')).toBeInTheDocument()
    expect(screen.getByText('ユーザーの違反履歴管理')).toBeInTheDocument()
  })

  it('renders all icons', () => {
    render(<ReportsManagement />)

    expect(screen.getAllByTestId('alert-triangle')).toHaveLength(2)
    expect(screen.getByTestId('clock')).toBeInTheDocument()
    expect(screen.getByTestId('check-circle')).toBeInTheDocument()
    expect(screen.getByTestId('x-circle')).toBeInTheDocument()
  })

  it('applies correct CSS classes for feature cards', () => {
    const { container } = render(<ReportsManagement />)

    const blueCard = container.querySelector('.bg-blue-50')
    const yellowCard = container.querySelector('.bg-yellow-50')
    const greenCard = container.querySelector('.bg-green-50')
    const redCard = container.querySelector('.bg-red-50')

    expect(blueCard).toBeInTheDocument()
    expect(yellowCard).toBeInTheDocument()
    expect(greenCard).toBeInTheDocument()
    expect(redCard).toBeInTheDocument()
  })

  it('renders the grid layout correctly', () => {
    const { container } = render(<ReportsManagement />)

    const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
    expect(grid).toBeInTheDocument()
  })
})
