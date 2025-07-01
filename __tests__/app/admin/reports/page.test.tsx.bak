/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import ReportsManagement from '@/app/admin/reports/page'

// Mock fetch globally
global.fetch = jest.fn()

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'auth-token=test-token',
})

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

jest.mock('@/components/ui/Input', () => ({
  Input: ({ placeholder, ...props }: any) => (
    <input data-testid="input" placeholder={placeholder} {...props} />
  ),
}))

jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}))

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <button data-testid="select-trigger">{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}))

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children }: any) => <td data-testid="table-cell">{children}</td>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
}))

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogAction: ({ children }: any) => (
    <button data-testid="alert-dialog-action">{children}</button>
  ),
  AlertDialogCancel: ({ children }: any) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
  AlertDialogContent: ({ children }: any) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogDescription: ({ children }: any) => (
    <div data-testid="alert-dialog-description">{children}</div>
  ),
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h3 data-testid="alert-dialog-title">{children}</h3>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: (props: any) => (
    <span data-testid="search-icon" {...props}>
      Search
    </span>
  ),
  Eye: (props: any) => (
    <span data-testid="eye-icon" {...props}>
      Eye
    </span>
  ),
  CheckCircle: (props: any) => (
    <span data-testid="check-circle-icon" {...props}>
      CheckCircle
    </span>
  ),
  XCircle: (props: any) => (
    <span data-testid="x-circle-icon" {...props}>
      XCircle
    </span>
  ),
  AlertTriangle: (props: any) => (
    <span data-testid="alert-triangle-icon" {...props}>
      AlertTriangle
    </span>
  ),
  Clock: (props: any) => (
    <span data-testid="clock-icon" {...props}>
      Clock
    </span>
  ),
}))

describe('ReportsManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API response by default
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    })
  })

  it('renders the page title and description', async () => {
    render(<ReportsManagement />)

    await waitFor(() => {
      expect(screen.getByTestId('card-title')).toHaveTextContent('通報管理')
      expect(screen.getByTestId('card-description')).toHaveTextContent(
        'ユーザーからの通報を管理し、適切な対応を行います'
      )
    })
  })

  it('shows empty state when no reports', async () => {
    render(<ReportsManagement />)

    await waitFor(() => {
      expect(screen.getByText('該当する通報が見つかりませんでした')).toBeInTheDocument()
    })
  })

  it('renders search and filter controls', async () => {
    render(<ReportsManagement />)

    await waitFor(() => {
      expect(screen.getByTestId('input')).toBeInTheDocument()
      expect(screen.getAllByTestId('select')).toHaveLength(2) // Status and reason filters
    })
  })

  it('handles API error gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<ReportsManagement />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('通報一覧の取得に失敗しました:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('renders component without crashing', async () => {
    render(<ReportsManagement />)

    await waitFor(() => {
      // Should eventually show the card after loading
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })
})
