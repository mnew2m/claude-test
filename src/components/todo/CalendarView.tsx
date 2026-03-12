import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth,
  isToday, addMonths, subMonths, parseISO, isPast,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { TodoList } from './TodoList'
import { Modal } from '../common/Modal'
import type { Todo, Category } from '../../types'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

interface CalendarViewProps {
  todos: Todo[]
  categories: Category[]
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onAdd: (date?: string) => void
}

export function CalendarView({ todos, categories, onComplete, onUncomplete, onDelete, onEdit, onAdd }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())

  const monthStart  = startOfMonth(currentMonth)
  const monthEnd    = endOfMonth(currentMonth)
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd      = endOfWeek(monthEnd,    { weekStartsOn: 0 })
  const days        = eachDayOfInterval({ start: calStart, end: calEnd })

  const todosForDay = (date: Date) =>
    todos.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), date))

  const selectedTodos = todosForDay(selectedDate)

  const today = new Date()

  const handlePickerSelect = (monthIndex: number) => {
    const next = new Date(pickerYear, monthIndex, 1)
    setCurrentMonth(next)
    setPickerOpen(false)
  }

  return (
    <div>
      {/* ── 월 네비게이션 ── */}
      <div className="flex items-center px-4 py-3">
        {/* 왼쪽: 이전 달 */}
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
          style={{ background: 'var(--color-fill)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--color-primary)' }}/>
          </svg>
        </button>

        {/* 중앙: 연월 피커 버튼 (항상 고정 중앙) */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => { setPickerYear(currentMonth.getFullYear()); setPickerOpen(true) }}
            className="flex items-center gap-1 text-[17px] font-semibold text-primary tracking-[-0.3px] transition-opacity active:opacity-60"
          >
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted)', marginTop: 1 }}>
              <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* 오른쪽: 다음 달 */}
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
          style={{ background: 'var(--color-fill)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--color-primary)' }}/>
          </svg>
        </button>
      </div>

      {/* ── 연월 피커 모달 ── */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="연월 선택">
        <div className="px-4 pt-3 pb-6 space-y-4">
          {/* 연도 선택 */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPickerYear(y => y - 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
              style={{ background: 'var(--color-fill)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-[17px] font-semibold text-primary">{pickerYear}년</span>
            <button
              onClick={() => setPickerYear(y => y + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
              style={{ background: 'var(--color-fill)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* 월 그리드 */}
          <div className="grid grid-cols-3 gap-2">
            {MONTH_LABELS.map((label, i) => {
              const isSelected = pickerYear === currentMonth.getFullYear() && i === currentMonth.getMonth()
              const isThisMonth = pickerYear === today.getFullYear() && i === today.getMonth()
              return (
                <button
                  key={i}
                  onClick={() => handlePickerSelect(i)}
                  className="py-3 rounded-xl text-[15px] font-medium transition-all active:scale-95"
                  style={{
                    background: isSelected ? 'var(--color-accent)' : isThisMonth ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'var(--color-fill)',
                    color: isSelected ? 'white' : isThisMonth ? 'var(--color-accent)' : 'var(--color-primary)',
                    fontWeight: isSelected || isThisMonth ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* 초기화 버튼 */}
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); setPickerOpen(false) }}
            className="w-full py-3 rounded-xl text-[15px] font-medium border transition-opacity active:opacity-50"
            style={{ borderColor: 'var(--color-separator)', color: 'var(--color-secondary)' }}
          >
            오늘로 초기화
          </button>
        </div>
      </Modal>

      {/* ── 캘린더 그리드 ── */}
      <div
        className="mx-4 rounded-xl overflow-hidden shadow-card"
        style={{ background: 'var(--color-card)' }}
      >
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--color-separator)' }}>
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className="py-2 text-center text-[12px] font-semibold"
              style={{ color: i === 0 ? '#ef4444' : i === 6 ? 'var(--color-accent)' : 'var(--color-secondary)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayTodos    = todosForDay(day)
            const isSelected  = isSameDay(day, selectedDate)
            const isThisMonth = isSameMonth(day, currentMonth)
            const isTodayDay  = isToday(day)
            const dayOfWeek   = day.getDay()
            const hasOverdue  = dayTodos.some(t => !t.completed && isPast(parseISO(t.dueDate!)) && !isToday(parseISO(t.dueDate!)))
            const completedAll = dayTodos.length > 0 && dayTodos.every(t => t.completed)
            const hasActive   = dayTodos.some(t => !t.completed)
            const isLastRow = idx >= days.length - 7

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className="flex flex-col items-center pt-2 pb-1.5 transition-opacity active:opacity-60 relative"
                style={{
                  borderBottom: isLastRow ? 'none' : '0.5px solid var(--color-separator)',
                  borderRight: (idx % 7 === 6) ? 'none' : '0.5px solid var(--color-separator)',
                  minHeight: 56,
                  opacity: isThisMonth ? 1 : 0.28,
                }}
              >
                {/* 날짜 숫자 */}
                <div
                  className="w-7 h-7 flex items-center justify-center rounded-full text-[14px] font-medium mb-1"
                  style={{
                    background: isSelected ? 'var(--color-accent)' : isTodayDay ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
                    color: isSelected
                      ? 'white'
                      : isTodayDay
                      ? 'var(--color-accent)'
                      : dayOfWeek === 0
                      ? '#ef4444'
                      : dayOfWeek === 6
                      ? 'var(--color-accent)'
                      : 'var(--color-primary)',
                    fontWeight: isTodayDay || isSelected ? 700 : 400,
                  }}
                >
                  {format(day, 'd')}
                </div>

                {/* 할일 도트 */}
                {dayTodos.length > 0 && (
                  <div className="flex items-center gap-0.5">
                    {dayTodos.slice(0, 3).map((t, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: t.completed
                            ? 'var(--color-accent)'
                            : hasOverdue
                            ? '#ef4444'
                            : 'var(--color-muted)',
                        }}
                      />
                    ))}
                    {dayTodos.length > 3 && (
                      <span className="text-[9px] text-muted leading-none">+{dayTodos.length - 3}</span>
                    )}
                  </div>
                )}

                {/* 전체완료 체크 */}
                {completedAll && !hasActive && (
                  <div
                    className="absolute top-1 right-1 w-3 h-3 rounded-full flex items-center justify-center"
                    style={{ background: '#22c55e' }}
                  >
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l2 2 3-3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 선택한 날의 할일 목록 ── */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-semibold text-primary">
            {isToday(selectedDate)
              ? '오늘'
              : format(selectedDate, 'M월 d일 (E)', { locale: ko })}
            {selectedTodos.length > 0 && (
              <span className="ml-1.5 text-[13px] font-normal text-secondary">
                {selectedTodos.filter(t => t.completed).length}/{selectedTodos.length} 완료
              </span>
            )}
          </p>
          <button
            onClick={() => onAdd(format(selectedDate, 'yyyy-MM-dd'))}
            className="flex items-center gap-1 text-[13px] font-medium transition-opacity active:opacity-50"
            style={{ color: 'var(--color-accent)' }}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            추가
          </button>
        </div>

        <TodoList
          todos={selectedTodos}
          categories={categories}
          onComplete={onComplete}
          onUncomplete={onUncomplete}
          onDelete={onDelete}
          onEdit={onEdit}
          onAdd={() => onAdd(format(selectedDate, 'yyyy-MM-dd'))}
          emptyIcon="📭"
          emptyTitle="할일이 없어요"
          emptyDescription={`${format(selectedDate, 'M월 d일', { locale: ko })}에 예정된 할일이 없습니다`}
          emptyCompact
        />
      </div>
    </div>
  )
}
