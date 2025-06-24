import {
  render,
  screen,
  expectElementToBeVisible,
  expectElementToHaveText,
} from '../../helpers/rtl-utils'
import { MoodTag } from '../../../src/components/ui/MoodTag'
import { setupComponentTest, cleanupComponentTest } from '../../helpers/component-test-setup'

// Mock cn utility
jest.mock('../../../src/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

describe('MoodTag Component', () => {
  beforeEach(() => {
    setupComponentTest()
  })

  afterEach(() => {
    cleanupComponentTest()
  })

  it('基本的なMoodTagをレンダリングする', () => {
    render(<MoodTag mood="good">良い感じ</MoodTag>)

    const moodTag = screen.getByText('良い感じ')
    expectElementToBeVisible(moodTag)
    expectElementToHaveText(moodTag, '良い感じ')
  })

  it('すべてのmoodタイプに対応するクラスを適用する', () => {
    const moods = ['disappointed', 'okay', 'good', 'love', 'perfect'] as const

    moods.forEach(mood => {
      const { unmount } = render(<MoodTag mood={mood}>{mood}</MoodTag>)

      const moodTag = screen.getByText(mood)
      expect(moodTag).toHaveClass('mood-tag')
      expect(moodTag).toHaveClass(`mood-${mood}`)

      unmount()
    })
  })

  it('カスタムclassNameを適用する', () => {
    render(
      <MoodTag mood="good" className="custom-mood">
        テスト
      </MoodTag>
    )

    const moodTag = screen.getByText('テスト')
    expect(moodTag).toHaveClass('mood-tag')
    expect(moodTag).toHaveClass('mood-good')
    expect(moodTag).toHaveClass('custom-mood')
  })

  it('追加のpropsが正しく渡される', () => {
    render(
      <MoodTag mood="love" data-testid="custom-mood-tag" aria-label="Love mood tag">
        大好き
      </MoodTag>
    )

    const moodTag = screen.getByTestId('custom-mood-tag')
    expect(moodTag).toHaveAttribute('aria-label', 'Love mood tag')
    expectElementToHaveText(moodTag, '大好き')
  })

  it('複数の子要素をレンダリングする', () => {
    render(
      <MoodTag mood="perfect">
        <span>完璧</span>
        <span>✨</span>
      </MoodTag>
    )

    const moodTag = screen.getByText('完璧').parentElement
    expect(moodTag).toBeInTheDocument()
    expect(screen.getByText('完璧')).toBeInTheDocument()
    expect(screen.getByText('✨')).toBeInTheDocument()
  })

  it('空のchildren でもレンダリングする', () => {
    render(<MoodTag mood="okay" data-testid="empty-mood">Empty</MoodTag>)

    const moodTag = screen.getByTestId('empty-mood')
    expectElementToBeVisible(moodTag)
    expect(moodTag).toHaveClass('mood-tag')
    expect(moodTag).toHaveClass('mood-okay')
  })

  it('React要素をchildrenとして受け入れる', () => {
    const CustomIcon = () => <i data-testid="custom-icon">❤️</i>

    render(
      <MoodTag mood="love">
        愛してる <CustomIcon />
      </MoodTag>
    )

    const moodTag = screen.getByText('愛してる').parentElement
    const icon = screen.getByTestId('custom-icon')

    expect(moodTag).toBeInTheDocument()
    expectElementToBeVisible(icon)
    expect(moodTag).toHaveTextContent('愛してる ❤️')
  })

  it('span要素として正しくレンダリングされる', () => {
    render(<MoodTag mood="good">テスト</MoodTag>)

    const moodTag = screen.getByText('テスト')
    expect(moodTag.tagName).toBe('SPAN')
  })

  it('onClick イベントが正しく動作する', async () => {
    const handleClick = jest.fn()

    render(
      <MoodTag mood="good" onClick={handleClick}>
        クリック可能
      </MoodTag>
    )

    const moodTag = screen.getByText('クリック可能')
    moodTag.click()

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
