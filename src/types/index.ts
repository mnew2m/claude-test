export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface Recurrence {
  type: RecurrenceType
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  endDate?: string
}

export interface Category {
  id: string
  userId: string
  name: string
  color: string
  icon?: string
  createdAt: string
}

export interface Todo {
  id: string
  userId: string
  categoryId?: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  completedAt?: string
  reminderTime?: string
  recurrence: Recurrence
  parentId?: string
  tags: string[]
  pinned?: boolean
  createdAt: string
}

export interface Habit {
  id: string
  userId: string
  categoryId?: string
  title: string
  description?: string
  color: string
  recurrence: Recurrence
  reminderTime?: string
  archived: boolean
  createdAt: string
}

export interface HabitCompletion {
  id: string
  habitId: string
  completedDate: string
  createdAt: string
}

export type Theme = 'dark' | 'light'

export interface StatsData {
  date: string
  completed: number
  total: number
  rate: number
}
