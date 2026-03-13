import { useState, useMemo } from 'react'
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useHabits } from '../hooks/useHabits'
import { useCategories } from '../hooks/useCategories'
import { HabitList } from '../components/habit/HabitList'
import { HabitForm } from '../components/habit/HabitForm'
import { Modal } from '../components/common/Modal'
import { todayString } from '../utils/dateHelpers'
import type { Habit, HabitCompletion } from '../types'

type Tab = 'active' | 'archived'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function HabitDetailSheet({ habit, completions, onToggle }: {
  habit: Habit
  completions: HabitCompletion[]
  onToggle: (habitId: string, date: string) => void
}) {
  const today = todayString()
  const [calMonth, setCalMonth] = useState(() => format(new Date(), 'yyyy-MM'))

  const monthStart = startOfMonth(parseISO(calMonth + '-01'))
  const monthEnd   = endOfMonth(monthStart)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad   = getDay(monthStart) // 0=일 ~ 6=토

  const completedDates = useMemo(
    () => new Set(completions.map(c => c.completedDate)),
    [completions]
  )

  return (
    <div className="px-4 pt-2 pb-6">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCalMonth(format(subMonths(parseISO(calMonth + '-01'), 1), 'yyyy-MM'))}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
          style={{ background: 'var(--color-fill)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-[16px] font-semibold text-primary">
          {format(parseISO(calMonth + '-01'), 'yyyy년 M월', { locale: ko })}
        </span>
        <button
          onClick={() => setCalMonth(format(addMonths(parseISO(calMonth + '-01'), 1), 'yyyy-MM'))}
          disabled={calMonth >= today.substring(0, 7)}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity active:opacity-50 disabled:opacity-30"
          style={{ background: 'var(--color-fill)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[12px] font-medium py-1" style={{ color: 'var(--color-muted)' }}>{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* 시작 패딩 */}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isCompleted = completedDates.has(dateStr)
          const isFuture = dateStr > today
          const isDisabled = isFuture
          const isToday = dateStr === today

          return (
            <div key={dateStr} className="flex items-center justify-center py-0.5">
              <button
                onClick={() => !isDisabled && onToggle(habit.id, dateStr)}
                disabled={isDisabled}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium transition-all active:scale-90 disabled:cursor-default"
                style={{
                  background: isCompleted ? habit.color : isToday ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
                  color: isCompleted ? 'white' : isDisabled ? 'var(--color-border)' : isToday ? 'var(--color-accent)' : 'var(--color-primary)',
                  border: isToday && !isCompleted ? `1.5px solid var(--color-accent)` : 'none',
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {format(day, 'd')}
              </button>
            </div>
          )
        })}
      </div>

      {/* 완료 현황 요약 */}
      <div className="mt-4 pt-4 flex gap-4" style={{ borderTop: '0.5px solid var(--color-separator)' }}>
        <div className="flex-1 text-center">
          <p className="text-[22px] font-bold" style={{ color: habit.color }}>
            {completions.filter(c => c.completedDate.startsWith(calMonth)).length}
          </p>
          <p className="text-[12px] text-secondary mt-0.5">이번 달 완료</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[22px] font-bold text-primary">{completions.length}</p>
          <p className="text-[12px] text-secondary mt-0.5">전체 완료</p>
        </div>
      </div>
    </div>
  )
}

export function HabitsPage() {
  const {
    habits, completions, loading,
    addHabit, updateHabit, deleteHabit, toggleCompletion,
    getCompletionsForHabit, isCompletedToday, isCompletedOnDate,
  } = useHabits()
  const { categories } = useCategories()
  const [tab, setTab] = useState<Tab>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null)
  const [formKey, setFormKey] = useState(0)

  const today = todayString()
  const [selectedDate, setSelectedDate] = useState(today)
  const isSelectedToday = selectedDate === today

  const activeHabits   = habits.filter(h => !h.archived)
  const archivedHabits = habits.filter(h => h.archived)
  const completedToday = activeHabits.filter(h => isCompletedToday(h.id)).length
  const completedOnDate = activeHabits.filter(h => isCompletedOnDate(h.id, selectedDate)).length

  const handleEdit = (habit: Habit) => {
    setEditHabit(habit)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: Parameters<typeof addHabit>[0]) => {
    if (editHabit) await updateHabit(editHabit.id, data)
    else await addHabit(data)
    setEditHabit(null)
  }

  const handleArchive = (id: string) => {
    const habit = habits.find(h => h.id === id)
    if (habit) updateHabit(id, { archived: !habit.archived })
  }

  const handleToggle = (habitId: string) => {
    toggleCompletion(habitId, selectedDate)
  }

  const dateLabel = isSelectedToday
    ? '오늘'
    : format(new Date(selectedDate + 'T00:00:00'), 'M월 d일 (EEE)', { locale: ko })

  return (
    <div className="pt-safe">
      {/* Header */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[34px] font-bold text-primary tracking-[-0.5px] leading-tight">습관</h1>
            {activeHabits.length > 0 && (
              <p className="text-[13px] text-secondary mt-0.5">
                오늘 {completedToday}/{activeHabits.length} 완료
              </p>
            )}
          </div>
          <button
            onClick={() => { setEditHabit(null); setFormKey(k => k + 1); setFormOpen(true) }}
            className="mb-1 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 active:opacity-70 shadow-card"
            style={{ background: 'var(--color-accent)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Today progress bar */}
        {activeHabits.length > 0 && (
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-fill)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedToday / activeHabits.length) * 100}%`,
                background: 'var(--color-accent)',
              }}
            />
          </div>
        )}

        {/* 날짜 네비게이터 */}
        <div className="flex items-center justify-between mt-3 px-1">
          <button
            onClick={() => setSelectedDate(format(subDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
            style={{ background: 'var(--color-fill)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={() => setSelectedDate(today)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-all active:opacity-70"
            style={{
              background: isSelectedToday ? 'var(--color-accent)' : 'var(--color-fill)',
              color: isSelectedToday ? 'white' : 'var(--color-primary)',
            }}
          >
            <span className="text-[14px] font-semibold">{dateLabel}</span>
            {!isSelectedToday && activeHabits.length > 0 && (
              <span className="text-[12px]" style={{ color: 'var(--color-secondary)' }}>
                {completedOnDate}/{activeHabits.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))}
            disabled={isSelectedToday}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50 disabled:opacity-30"
            style={{ background: 'var(--color-fill)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {(['active', 'archived'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-[14px] font-medium transition-all active:scale-95"
              style={
                tab === t
                  ? { background: 'var(--color-accent)', color: 'white' }
                  : { background: 'var(--color-fill)', color: 'var(--color-secondary)' }
              }
            >
              {t === 'active' ? `활성 ${activeHabits.length > 0 ? `(${activeHabits.length})` : ''}` : `보관 ${archivedHabits.length > 0 ? `(${archivedHabits.length})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-[2.5px] border-accent border-t-transparent animate-spin" />
          </div>
        ) : (
          <HabitList
            habits={tab === 'active' ? activeHabits : archivedHabits}
            completions={completions}
            categories={categories}
            selectedDate={selectedDate}
            isCompletedOnDate={isCompletedOnDate}
            getCompletionsForHabit={getCompletionsForHabit}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={deleteHabit}
            onArchive={handleArchive}
            onDetail={setDetailHabit}
            onAdd={() => { setEditHabit(null); setFormKey(k => k + 1); setFormOpen(true) }}
          />
        )}
      </div>

      <HabitForm
        key={editHabit?.id ?? `new_${formKey}`}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditHabit(null) }}
        onSubmit={handleFormSubmit}
        categories={categories}
        initialValues={editHabit ?? undefined}
      />

      {/* 습관 상세 모달 */}
      <Modal
        open={!!detailHabit}
        onClose={() => setDetailHabit(null)}
        title={detailHabit?.title ?? ''}
      >
        {detailHabit && (
          <HabitDetailSheet
            habit={detailHabit}
            completions={getCompletionsForHabit(detailHabit.id)}
            onToggle={toggleCompletion}
          />
        )}
      </Modal>
    </div>
  )
}
