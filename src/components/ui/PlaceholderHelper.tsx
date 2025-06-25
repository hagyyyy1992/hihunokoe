'use client'

import React, { useState } from 'react'
import { Button } from './Button'

interface PlaceholderItem {
  label: string
  value: string
}

interface PlaceholderHelperProps {
  title: string
  items: PlaceholderItem[]
  className?: string
}

export function PlaceholderHelper({ title, items, className = '' }: PlaceholderHelperProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(label)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className={`mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md ${className}`}>
      <p className="text-sm text-blue-800 font-medium mb-2">{title}</p>
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-xs text-blue-700">
              {item.label}: {item.value}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(item.value, item.label)}
              className="ml-2 text-xs px-2 py-1 h-auto"
            >
              {copiedItem === item.label ? 'コピー済み' : 'コピー'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
