/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import RootLayout, { metadata } from '@/app/layout'
import { SERVICE_FULL_TITLE } from '@/lib/constants'

// Mock the components and fonts
jest.mock('@/components/layout/conditional-layout', () => {
  return function MockConditionalLayout({ children }: { children: React.ReactNode }) {
    return (
      <>
        <header data-testid="header">Header</header>
        <main className="flex-1 pt-16">{children}</main>
        <footer data-testid="footer">Footer</footer>
      </>
    )
  }
})

jest.mock('@/lib/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}))

jest.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans',
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono',
  }),
}))

describe('RootLayout', () => {
  it('renders the layout with correct structure', () => {
    render(
      <RootLayout>
        <div data-testid="test-children">Test content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('test-children')).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )

    const main = container.querySelector('main')
    expect(main).toHaveClass('flex-1', 'pt-16')
  })

  it('sets correct HTML lang attribute', () => {
    render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )

    const html = document.documentElement
    expect(html).toHaveAttribute('lang', 'ja')
  })

  it('has correct metadata', () => {
    expect(metadata.title).toBe(SERVICE_FULL_TITLE)
    expect(metadata.description).toBe(
      '化粧品の本当の使い心地を、体験談で共有するコミュニティ。成分や評価ではなく、リアルな体験で「自分に合うかも」を見つけよう。'
    )
  })
})
