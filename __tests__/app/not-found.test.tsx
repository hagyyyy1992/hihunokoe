/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import NotFound from '@/app/not-found'

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

describe('NotFound', () => {
  it('renders the 404 error message', () => {
    render(<NotFound />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('ページが見つかりません')).toBeInTheDocument()
    expect(
      screen.getByText('お探しのページは存在しないか、移動された可能性があります。')
    ).toBeInTheDocument()
  })

  it('renders the home link', () => {
    render(<NotFound />)

    const homeLink = screen.getByRole('link', { name: 'ホームに戻る' })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('applies correct CSS classes', () => {
    const { container } = render(<NotFound />)

    const mainDiv = container.querySelector('div')
    expect(mainDiv).toHaveClass(
      'min-h-screen',
      'flex',
      'items-center',
      'justify-center',
      'bg-gray-50'
    )
  })

  it('has correct styling for the home link', () => {
    render(<NotFound />)

    const homeLink = screen.getByRole('link', { name: 'ホームに戻る' })
    expect(homeLink).toHaveClass(
      'inline-block',
      'bg-apple-600',
      'text-white',
      'px-6',
      'py-3',
      'rounded-lg',
      'hover:bg-apple-700',
      'transition-colors'
    )
  })
})
