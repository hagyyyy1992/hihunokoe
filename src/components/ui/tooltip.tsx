'use client'

import React, { useState, useRef, useEffect, cloneElement } from 'react'

interface TooltipProps {
  children: React.ReactNode
}

interface TooltipTriggerProps {
  children: React.ReactElement
  asChild?: boolean
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
}

const TooltipContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
} | null>(null)

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  const context = React.useContext(TooltipContext)
  if (!context) throw new Error('TooltipTrigger must be used within Tooltip')

  const child = React.Children.only(children) as React.ReactElement<{
    onMouseEnter?: (e: React.MouseEvent) => void
    onMouseLeave?: (e: React.MouseEvent) => void
    onFocus?: (e: React.FocusEvent) => void
    onBlur?: (e: React.FocusEvent) => void
  }>

  const handleMouseEnter = (e: React.MouseEvent) => {
    context.setIsOpen(true)
    if (child.props.onMouseEnter) {
      child.props.onMouseEnter(e)
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    context.setIsOpen(false)
    if (child.props.onMouseLeave) {
      child.props.onMouseLeave(e)
    }
  }

  const handleFocus = (e: React.FocusEvent) => {
    context.setIsOpen(true)
    if (child.props.onFocus) {
      child.props.onFocus(e)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    context.setIsOpen(false)
    if (child.props.onBlur) {
      child.props.onBlur(e)
    }
  }

  return cloneElement(
    child as React.ReactElement,
    {
      ref: context.triggerRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    } as React.HTMLAttributes<HTMLElement> & { ref: React.RefObject<HTMLElement | null> }
  )
}

export function TooltipContent({ children, className = '' }: TooltipContentProps) {
  const context = React.useContext(TooltipContext)
  if (!context) throw new Error('TooltipContent must be used within Tooltip')

  const [position, setPosition] = useState({ top: 0, left: 0 })
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (context.isOpen && context.triggerRef.current && contentRef.current) {
      const triggerRect = context.triggerRef.current.getBoundingClientRect()
      const contentRect = contentRef.current.getBoundingClientRect()

      // Position above the trigger by default
      const top = triggerRect.top - contentRect.height - 8
      const left = triggerRect.left + (triggerRect.width - contentRect.width) / 2

      // Adjust if tooltip would go off screen
      const adjustedTop = top < 0 ? triggerRect.bottom + 8 : top
      const adjustedLeft = Math.max(8, Math.min(left, window.innerWidth - contentRect.width - 8))

      setPosition({ top: adjustedTop, left: adjustedLeft })
    }
  }, [context.isOpen, context.triggerRef])

  if (!context.isOpen) return null

  return (
    <div
      ref={contentRef}
      className={`fixed z-50 px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-md pointer-events-none ${className}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  )
}
