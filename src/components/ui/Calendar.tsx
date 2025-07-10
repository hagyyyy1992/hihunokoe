'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isBefore,
  isAfter,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CalendarProps {
  value?: Date | null
  onChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function Calendar({ value, onChange, minDate, maxDate, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDateClick = (date: Date) => {
    if (minDate && date < minDate) return
    if (maxDate && date > maxDate) return
    onChange?.(date)
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return true
    if (maxDate && isAfter(date, maxDate)) return true
    return false
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className={cn('p-3 bg-white rounded-lg shadow-md border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className={cn(
            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
            'hover:bg-gray-100 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
            'cursor-pointer'
          )}
          type="button"
          aria-label="前の月"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-sm font-medium">
          {format(currentMonth, 'yyyy年 M月', { locale: ja })}
        </div>

        <button
          onClick={handleNextMonth}
          className={cn(
            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
            'hover:bg-gray-100 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
            'cursor-pointer'
          )}
          type="button"
          aria-label="次の月"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              'text-center text-xs font-medium text-gray-500 pb-2',
              index === 0 && 'text-red-500',
              index === 6 && 'text-blue-500'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isSelected = value && isSameDay(day, value)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isDisabled = isDateDisabled(day)
          const isTodayDate = isToday(day)
          const dayOfWeek = day.getDay()
          const isSunday = dayOfWeek === 0
          const isSaturday = dayOfWeek === 6

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              type="button"
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal transition-colors',
                'hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950',
                !isCurrentMonth && 'text-gray-400',
                isDisabled && 'pointer-events-none opacity-50',
                isSelected &&
                  'bg-apple-500 text-white hover:bg-apple-500 hover:text-white focus:bg-apple-500 focus:text-white',
                isTodayDate && !isSelected && 'bg-gray-100 text-gray-900',
                !isSelected && !isTodayDate && isSunday && 'text-red-500',
                !isSelected && !isTodayDate && isSaturday && 'text-blue-500',
                !isDisabled && 'cursor-pointer',
                isDisabled && 'cursor-not-allowed'
              )}
              aria-label={format(day, 'yyyy年M月d日', { locale: ja })}
              aria-disabled={isDisabled}
            >
              <time dateTime={format(day, 'yyyy-MM-dd')}>{format(day, 'd')}</time>
            </button>
          )
        })}
      </div>
    </div>
  )
}
