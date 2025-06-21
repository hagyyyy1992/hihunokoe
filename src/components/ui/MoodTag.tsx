import React from 'react'
import { cn } from '@/lib/utils'

export interface MoodTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  mood: 'disappointed' | 'okay' | 'good' | 'love' | 'perfect'
  children: React.ReactNode
}

const MoodTag: React.FC<MoodTagProps> = ({ className, mood, children, ...props }) => {
  const moodClasses = {
    disappointed: 'mood-disappointed',
    okay: 'mood-okay',
    good: 'mood-good',
    love: 'mood-love',
    perfect: 'mood-perfect',
  }

  return (
    <span className={cn('mood-tag', moodClasses[mood], className)} {...props}>
      {children}
    </span>
  )
}

MoodTag.displayName = 'MoodTag'

export { MoodTag }
