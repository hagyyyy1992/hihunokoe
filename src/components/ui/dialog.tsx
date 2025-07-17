'use client'

import React from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  )
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div
      className={`relative bg-white rounded-lg shadow-xl p-6 w-full ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return <h2 className={`text-xl font-semibold text-gray-900 ${className}`}>{children}</h2>
}
