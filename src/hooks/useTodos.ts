import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Todo, Recurrence } from '../types'
import { buildNextTodo } from '../utils/recurrence'

export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTodos = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setTodos(data.map(mapTodo))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  const addTodo = async (input: {
    title: string
    description?: string
    dueDate?: string
    categoryId?: string
    tags?: string[]
    recurrence?: Recurrence
    reminderTime?: string
  }) => {
    if (!user) return
    const now = new Date().toISOString()
    const recurrence: Recurrence = input.recurrence ?? { type: 'none', interval: 1 }
    const newTodo: Todo = {
      id: uuidv4(),
      userId: user.id,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      completed: false,
      dueDate: input.dueDate,
      reminderTime: input.reminderTime,
      recurrence,
      tags: input.tags ?? [],
      createdAt: now,
    }
    setTodos(prev => [newTodo, ...prev])
    await supabase.from('todos').insert(toRow(newTodo))
    return newTodo
  }

  const updateTodo = async (id: string, input: Partial<Omit<Todo, 'id' | 'userId' | 'createdAt'>>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...input } : t))
    await supabase.from('todos').update(toPartialRow(input)).eq('id', id)
  }

  const uncompleteTodo = async (id: string) => {
    await updateTodo(id, { completed: false, completedAt: undefined })
  }

  const completeTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    const now = new Date().toISOString()
    await updateTodo(id, { completed: true, completedAt: now })

    // Auto-create next recurring todo
    if (todo.recurrence.type !== 'none') {
      const next = buildNextTodo({ ...todo, completedAt: now })
      const nextTodo: Todo = {
        ...next,
        id: uuidv4(),
        createdAt: now,
      }
      setTodos(prev => [nextTodo, ...prev])
      await supabase.from('todos').insert(toRow(nextTodo))
    }
  }

  const deleteTodo = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    await supabase.from('todos').delete().eq('id', id)
  }

  const togglePin = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    await updateTodo(id, { pinned: !todo.pinned })
  }

  return { todos, loading, addTodo, updateTodo, completeTodo, uncompleteTodo, deleteTodo, togglePin, refetch: fetchTodos }
}

function mapTodo(row: Record<string, unknown>): Todo {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    categoryId: row.category_id as string | undefined,
    title: row.title as string,
    description: row.description as string | undefined,
    completed: row.completed as boolean,
    dueDate: row.due_date as string | undefined,
    completedAt: row.completed_at as string | undefined,
    reminderTime: row.reminder_time as string | undefined,
    recurrence: {
      type: (row.recurrence_type as Recurrence['type']) ?? 'none',
      interval: (row.recurrence_interval as number) ?? 1,
      daysOfWeek: row.recurrence_days_of_week as number[] | undefined,
      dayOfMonth: row.recurrence_day_of_month as number | undefined,
      endDate: row.recurrence_end_date as string | undefined,
    },
    parentId: row.parent_id as string | undefined,
    tags: (row.tags as string[]) ?? [],
    pinned: (row.pinned as boolean) ?? false,
    createdAt: row.created_at as string,
  }
}

function toRow(todo: Todo) {
  return {
    id: todo.id,
    user_id: todo.userId,
    category_id: todo.categoryId,
    title: todo.title,
    description: todo.description,
    completed: todo.completed,
    due_date: todo.dueDate,
    completed_at: todo.completedAt,
    reminder_time: todo.reminderTime,
    recurrence_type: todo.recurrence.type,
    recurrence_interval: todo.recurrence.interval,
    recurrence_days_of_week: todo.recurrence.daysOfWeek,
    recurrence_day_of_month: todo.recurrence.dayOfMonth,
    recurrence_end_date: todo.recurrence.endDate,
    parent_id: todo.parentId,
    tags: todo.tags,
    pinned: todo.pinned ?? false,
    created_at: todo.createdAt,
  }
}

function toPartialRow(input: Partial<Omit<Todo, 'id' | 'userId' | 'createdAt'>>) {
  const row: Record<string, unknown> = {}
  // 'key' in input 으로 체크해야 undefined(명시적 삭제)와 미전달을 구분할 수 있음
  if ('categoryId'   in input) row.category_id   = input.categoryId   ?? null
  if ('title'        in input) row.title          = input.title
  if ('description'  in input) row.description    = input.description  ?? null
  if ('completed'    in input) row.completed      = input.completed
  if ('dueDate'      in input) row.due_date       = input.dueDate      ?? null
  if ('completedAt'  in input) row.completed_at   = input.completedAt  ?? null
  if ('reminderTime' in input) row.reminder_time  = input.reminderTime ?? null
  if ('recurrence'   in input && input.recurrence) {
    row.recurrence_type          = input.recurrence.type
    row.recurrence_interval      = input.recurrence.interval
    row.recurrence_days_of_week  = input.recurrence.daysOfWeek  ?? null
    row.recurrence_day_of_month  = input.recurrence.dayOfMonth  ?? null
    row.recurrence_end_date      = input.recurrence.endDate     ?? null
  }
  if ('parentId' in input) row.parent_id = input.parentId ?? null
  if ('tags'     in input) row.tags      = input.tags
  if ('pinned'   in input) row.pinned    = input.pinned ?? false
  return row
}
