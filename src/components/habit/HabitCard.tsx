import { useState } from 'react'
import { StreakDisplay } from './StreakDisplay'
import { WeeklyView } from './WeeklyView'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { calculateStreak, getLast7DaysStatus } from '../../utils/streaks'
import type { Habit, HabitCompletion, Category } from '../../types'

interface HabitCardProps {
  habit: Habit
  completions: HabitCompletion[]
  categories: Category[]
  isCompleted: boolean
  onToggle: (habitId: string) => void
  onEdit: (habit: Habit) => void
  onDelete: (habitId: string) => void
  onArchive: (habitId: string) => void
  onDetail: (habit: Habit) => void
}

export function HabitCard({ habit, completions, categories, isCompleted, onToggle, onEdit, onDelete, onArchive, onDetail }: HabitCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { current, longest } = calculateStreak(completions, habit)
  const weekDays = getLast7DaysStatus(completions, habit)
  const category = categories.find(c => c.id === habit.categoryId)

  return (
    <>
      <div
        className="rounded-xl overflow-hidden shadow-card mb-3"
        style={{ background: 'var(--color-card)' }}
      >
        {/* Color bar + header */}
        <div
          className="px-4 pt-3.5 pb-3 flex items-start gap-3 cursor-pointer active:opacity-70"
          style={{ borderLeft: `4px solid ${habit.color}` }}
          onClick={() => onDetail(habit)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] font-semibold text-primary tracking-[-0.2px]">{habit.title}</span>
              {category && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: category.color + '22', color: category.color }}
                >
                  {category.icon} {category.name}
                </span>
              )}
            </div>
            {habit.description && (
              <p className="text-[13px] text-secondary mt-0.5 line-clamp-1">{habit.description}</p>
            )}
          </div>

          {/* Context actions */}
          <div className="flex gap-0.5 flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onEdit(habit) }}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
              style={{ color: 'var(--color-muted)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); onArchive(habit.id) }}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
              style={{ color: 'var(--color-muted)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <polyline points="21 8 21 21 3 21 3 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="1" y="3" width="22" height="5" rx="1" stroke="currentColor" strokeWidth="1.7"/>
                <line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
              style={{ color: 'var(--color-muted)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats + check */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '0.5px solid var(--color-separator)' }}
        >
          <div className="space-y-2">
            <StreakDisplay current={current} longest={longest} />
            <WeeklyView days={weekDays} color={habit.color} />
          </div>

          {/* Check button */}
          <button
            onClick={e => { e.stopPropagation(); onToggle(habit.id) }}
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-90 shadow-card"
            style={
              isCompleted
                ? { background: habit.color, boxShadow: `0 4px 16px ${habit.color}55` }
                : { background: 'var(--color-fill)', color: 'var(--color-muted)' }
            }
          >
            {isCompleted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5 9-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="습관 삭제"
        message={`"${habit.title}"을 삭제하시겠습니까? 모든 기록이 삭제됩니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={() => { onDelete(habit.id); setConfirmDelete(false) }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
