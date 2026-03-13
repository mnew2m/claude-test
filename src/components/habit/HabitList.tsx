import { HabitCard } from './HabitCard'
import { EmptyState } from '../common/EmptyState'
import type { Habit, HabitCompletion, Category } from '../../types'

interface HabitListProps {
  habits: Habit[]
  completions: HabitCompletion[]
  categories: Category[]
  selectedDate: string
  isCompletedOnDate: (id: string, date: string) => boolean
  getCompletionsForHabit: (id: string) => HabitCompletion[]
  onToggle: (id: string) => void
  onEdit: (habit: Habit) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  onDetail: (habit: Habit) => void
  onAdd: () => void
}

export function HabitList({
  habits,
  categories,
  selectedDate,
  isCompletedOnDate,
  getCompletionsForHabit,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onDetail,
  onAdd,
}: HabitListProps) {
  if (habits.length === 0) {
    return (
      <EmptyState
        icon="🌱"
        title="습관이 없어요"
        description="좋은 습관을 만들어보세요"
        action={{ label: '습관 추가', onClick: onAdd }}
      />
    )
  }

  return (
    <div className="space-y-3">
      {habits.map(habit => (
        <HabitCard
          key={habit.id}
          habit={habit}
          completions={getCompletionsForHabit(habit.id)}
          categories={categories}
          isCompleted={isCompletedOnDate(habit.id, selectedDate)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onDetail={onDetail}
        />
      ))}
    </div>
  )
}
