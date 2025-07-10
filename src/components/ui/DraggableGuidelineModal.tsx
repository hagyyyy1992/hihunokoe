'use client'

import { useEffect, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

export default function DraggableGuidelineModal() {
  const [showGuideline, setShowGuideline] = useState(true)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }

    updateWindowSize()
    window.addEventListener('resize', updateWindowSize)

    return () => window.removeEventListener('resize', updateWindowSize)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const modalWidth = modalRef.current?.offsetWidth || 320
      const modalHeight = modalRef.current?.offsetHeight || 200

      const clampedX = Math.max(0, Math.min(newX, windowWidth - modalWidth))
      const clampedY = Math.max(0, Math.min(newY, windowHeight - modalHeight))

      setPosition({ x: clampedX, y: clampedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isDragging, dragOffset])

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return

      e.preventDefault()

      const touch = e.touches[0]
      const newX = touch.clientX - dragOffset.x
      const newY = touch.clientY - dragOffset.y

      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const modalWidth = modalRef.current?.offsetWidth || 320
      const modalHeight = modalRef.current?.offsetHeight || 200

      const clampedX = Math.max(0, Math.min(newX, windowWidth - modalWidth))
      const clampedY = Math.max(0, Math.min(newY, windowHeight - modalHeight))

      setPosition({ x: clampedX, y: clampedY })
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragOffset])

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = modalRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()

    const touch = e.touches[0]
    const rect = modalRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    })
    setIsDragging(true)
  }

  useEffect(() => {
    if (!modalRef.current || isInitialized) return

    const isMobile = window.innerWidth < 640
    if (isMobile) {
      const modalWidth = window.innerWidth - 32
      const modalHeight = modalRef.current.offsetHeight || 200
      const centerX = (window.innerWidth - modalWidth) / 2
      const bottomY = window.innerHeight - modalHeight - 80

      setPosition({ x: centerX, y: bottomY })
      setIsInitialized(true)
    }
  }, [isInitialized, showGuideline])

  const getPositionStyle = () => {
    if (!isInitialized && position.x === 0 && position.y === 0) {
      const isMobile = window.innerWidth < 640
      if (isMobile) {
        return {
          bottom: '5rem',
          left: '1rem',
          right: '1rem',
          top: 'auto',
        }
      }
      return {
        bottom: '1rem',
        right: '1rem',
        left: 'auto',
        top: 'auto',
      }
    }
    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
      bottom: 'auto',
      right: 'auto',
    }
  }

  if (!showGuideline) {
    return (
      <button
        onClick={() => setShowGuideline(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors z-50 cursor-pointer"
        aria-label="投稿ガイドラインを表示"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    )
  }

  return (
    <div
      ref={modalRef}
      className={`fixed bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 shadow-lg z-50 ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{
        ...getPositionStyle(),
        transition: isDragging ? 'none' : 'all 0.3s ease',
        width:
          windowSize.width < 640 && (!isInitialized || position.x === 0)
            ? 'calc(100% - 2rem)'
            : '20rem',
        maxWidth: '20rem',
      }}
    >
      <div
        className="flex justify-between items-start mb-2 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ touchAction: 'none' }}
      >
        <h3 className="text-xs sm:text-sm font-medium text-blue-800 select-none">
          投稿ガイドライン
        </h3>
        <button
          onClick={() => setShowGuideline(false)}
          className="text-blue-600 hover:text-blue-800 -mt-1 -mr-1 cursor-pointer pointer-events-auto"
          aria-label="閉じる"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <ul className="text-xs text-blue-700 space-y-1 select-none">
        <li>• 個人の体験談として、正直な感想を書いてください</li>
        <li>• 「合わなかった」体験も大切な情報です</li>
        <li>• 他の人を批判したり、攻撃的な表現は避けてください</li>
        <li>• 商品の宣伝や営業目的の投稿はご遠慮ください</li>
      </ul>
    </div>
  )
}
