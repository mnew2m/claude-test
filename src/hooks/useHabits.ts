import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Habit, HabitCompletion, Recurrence } from '../types'
import { todayString } from '../utils/dateHelpers'

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHabits = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const habitsRes = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const habitIds = habitsRes.data?.map(h => h.id as string) ?? []
    if (habitsRes.data) setHabits(habitsRes.data.map(mapHabit))

    if (habitIds.length > 0) {
      const completionsRes = await supabase
        .from('habit_completions')
        .select('*')
        .in('habit_id', habitIds)
      if (completionsRes.data) setCompletions(completionsRes.data.map(mapCompletion))
    } else {
      setCompletions([])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  const addHabit = async (input: {
    title: string
    description?: string
    color: string
    categoryId?: string
    recurrence: Recurrence
    reminderTime?: string
  }) => {
    if (!user) return
    const now = new Date().toISOString()
    const newHabit: Habit = {
      id: uuidv4(),
      userId: user.id,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      color: input.color,
      recurrence: input.recurrence,
      reminderTime: input.reminderTime,
      archived: false,
      createdAt: now,
    }
    setHabits(prev => [...prev, newHabit])
    await supabase.from('habits').insert(toHabitRow(newHabit))
  }

  const updateHabit = async (id: string, input: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt'>>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...input } : h))
    await supabase.from('habits').update(toPartialHabitRow(input)).eq('id', id)
  }

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    setCompletions(prev => prev.filter(c => c.habitId !== id))
    await supabase.from('habits').delete().eq('id', id)
  }

  const toggleCompletion = async (habitId: string, date?: string) => {
    const targetDate = date ?? todayString()
    const existing = completions.find(c => c.habitId === habitId && c.completedDate === targetDate)

    if (existing) {
      setCompletions(prev => prev.filter(c => c.id !== existing.id))
      await supabase.from('habit_completions').delete().eq('id', existing.id)
    } else {
      const now = new Date().toISOString()
      const newCompletion: HabitCompletion = {
        id: uuidv4(),
        habitId,
        completedDate: targetDate,
        createdAt: now,
      }
      setCompletions(prev => [...prev, newCompletion])
      await supabase.from('habit_completions').insert({
        id: newCompletion.id,
        habit_id: habitId,
        completed_date: targetDate,
        created_at: now,
      })
    }
  }

  const getCompletionsForHabit = (habitId: string) =>
    completions.filter(c => c.habitId === habitId)

  const isCompletedToday = (habitId: string) =>
    completions.some(c => c.habitId === habitId && c.completedDate === todayString())

  const isCompletedOnDate = (habitId: string, date: string) =>
    completions.some(c => c.habitId === habitId && c.completedDate === date)

  return {
    habits,
    completions,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    getCompletionsForHabit,
    isCompletedToday,
    isCompletedOnDate,
    refetch: fetchHabits,
  }
}

function mapHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    categoryId: row.category_id as string | undefined,
    title: row.title as string,
    description: row.description as string | undefined,
    color: row.color as string,
    recurrence: {
      type: (row.recurrence_type as Recurrence['type']) ?? 'daily',
      interval: 1,
      daysOfWeek: row.recurrence_days_of_week as number[] | undefined,
    },
    reminderTime: row.reminder_time as string | undefined,
    archived: (row.archived as boolean) ?? false,
    createdAt: row.created_at as string,
  }
}

function mapCompletion(row: Record<string, unknown>): HabitCompletion {
  return {
    id: row.id as string,
    habitId: row.habit_id as string,
    completedDate: row.completed_date as string,
    createdAt: row.created_at as string,
  }
}

function toHabitRow(habit: Habit) {
  return {
    id: habit.id,
    user_id: habit.userId,
    category_id: habit.categoryId,
    title: habit.title,
    description: habit.description,
    color: habit.color,
    recurrence_type: habit.recurrence.type,
    recurrence_days_of_week: habit.recurrence.daysOfWeek,
    reminder_time: habit.reminderTime,
    archived: habit.archived,
    created_at: habit.createdAt,
  }
}

function toPartialHabitRow(input: Partial<Omit<Habit, 'id' | 'userId' | 'createdAt'>>) {
  const row: Record<string, unknown> = {}
  if (input.title !== undefined) row.title = input.title
  if (input.description !== undefined) row.description = input.description
  if (input.color !== undefined) row.color = input.color
  if (input.categoryId !== undefined) row.category_id = input.categoryId
  if (input.recurrence !== undefined) {
    row.recurrence_type = input.recurrence.type
    row.recurrence_days_of_week = input.recurrence.daysOfWeek
  }
  if (input.reminderTime !== undefined) row.reminder_time = input.reminderTime
  if (input.archived !== undefined) row.archived = input.archived
  return row
}
