'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from './Calendar'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  id?: string
  name?: string
  className?: string
  required?: boolean
  'data-testid'?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = '日付を選択',
  minDate,
  maxDate,
  id,
  name,
  className = '',
  required,
  'data-testid': dataTestId,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    onChange?.(format(date, 'yyyy-MM-dd'))
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          id={id}
          name={name}
          value={value || ''}
          onChange={e => {
            const date = e.target.value ? new Date(e.target.value) : null
            setSelectedDate(date)
            onChange?.(e.target.value)
          }}
          onClick={() => setIsOpen(true)}
          required={required}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-10 py-2 text-sm',
            'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-apple-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&::-webkit-calendar-picker-indicator]:hidden',
            '[&::-webkit-date-and-time-value]:text-left',
            'cursor-pointer',
            className
          )}
          placeholder={placeholder}
          data-testid={dataTestId}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <CalendarIcon className="h-4 w-4 text-gray-500" />
        </div>
        {selectedDate && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={e => {
              e.stopPropagation()
              setSelectedDate(null)
              onChange?.('')
              if (inputRef.current) {
                inputRef.current.value = ''
              }
            }}
          >
            <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
          </button>
        )}
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 p-0"
          style={{
            minWidth: 'min-content',
          }}
        >
          <Calendar
            value={selectedDate}
            onChange={handleDateSelect}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  )
}
