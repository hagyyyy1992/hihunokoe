import { render, screen, createUser, expectElementToBeVisible } from '../../helpers/rtl-utils'
import { Button } from '../../../src/components/ui/Button'
import { setupComponentTest, cleanupComponentTest } from '../../helpers/component-test-setup'

// Mock cn utility
jest.mock('../../../src/lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' ')
}))

describe('Button Component', () => {
  beforeEach(() => {
    setupComponentTest()
  })

  afterEach(() => {
    cleanupComponentTest()
  })

  it('基本的なボタンをレンダリングする', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expectElementToBeVisible(button)
    expect(button).toHaveTextContent('Click me')
  })

  it('異なるvariantのスタイルを適用する', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('btn btn-primary')

    rerender(<Button variant="secondary">Secondary</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('btn btn-secondary')

    rerender(<Button variant="outline">Outline</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('btn btn-outline')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('btn btn-ghost')

    rerender(<Button variant="danger">Danger</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('btn btn-danger')
  })

  it('異なるsizeのスタイルを適用する', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('px-3 py-1.5 text-sm')

    rerender(<Button size="md">Medium</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('px-4 py-2 text-sm')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('px-6 py-3 text-base')
  })

  it('loading状態を正しく表示する', () => {
    render(<Button loading>Loading</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50 cursor-not-allowed')
    
    const spinner = button.querySelector('.loading-spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('iconを表示する', () => {
    const TestIcon = () => <span data-testid="test-icon">🎉</span>
    
    render(<Button icon={<TestIcon />}>With Icon</Button>)
    
    const button = screen.getByRole('button')
    const icon = screen.getByTestId('test-icon')
    
    expectElementToBeVisible(button)
    expectElementToBeVisible(icon)
    expect(button).toHaveTextContent('With Icon')
  })

  it('loading中はiconを非表示にする', () => {
    const TestIcon = () => <span data-testid="test-icon">🎉</span>
    
    render(<Button loading icon={<TestIcon />}>Loading</Button>)
    
    const button = screen.getByRole('button')
    const icon = screen.queryByTestId('test-icon')
    const spinner = button.querySelector('.loading-spinner')
    
    expect(icon).not.toBeInTheDocument()
    expect(spinner).toBeInTheDocument()
  })

  it('disabled状態が正しく動作する', () => {
    render(<Button disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('カスタムclassNameを適用する', () => {
    render(<Button className="custom-class">Custom</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('クリックイベントが正しく動作する', async () => {
    const handleClick = jest.fn()
    const user = createUser()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('loading中はクリックイベントが発火しない', async () => {
    const handleClick = jest.fn()
    const user = createUser()
    
    render(<Button loading onClick={handleClick}>Loading</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('disabled中はクリックイベントが発火しない', async () => {
    const handleClick = jest.fn()
    const user = createUser()
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('forwardRefが正しく動作する', () => {
    const ref = { current: null }
    
    render(<Button ref={ref}>Ref Test</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('追加のpropsが正しく渡される', () => {
    render(<Button data-testid="custom-button" aria-label="Custom button">Test</Button>)
    
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-label', 'Custom button')
  })
})