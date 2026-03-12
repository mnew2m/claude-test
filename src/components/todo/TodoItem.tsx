import { useState, useRef } from 'react'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { formatDate } from '../../utils/dateHelpers'
import type { Todo } from '../../types'

interface TodoItemProps {
  todo: Todo
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onCopy?: (todo: Todo) => void
  isLast?: boolean
}

const SWIPE_THRESHOLD = 72   // px: 이 이상 당기면 삭제 버튼 노출
const SWIPE_CONFIRM   = 160  // px: 이 이상 당기면 바로 confirm 오픈

export function TodoItem({ todo, onComplete, onUncomplete, onDelete, onEdit, onCopy, isLast }: TodoItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [translateX, setTranslateX] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const startX    = useRef(0)
  const startY    = useRef(0)
  const dragging  = useRef(false)
  const lockAxis  = useRef<'h' | 'v' | null>(null)

  const isOverdue = !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date()

  const handleToggle = () => {
    if (todo.completed) onUncomplete(todo.id)
    else onComplete(todo.id)
  }

  /* ── Touch handlers ── */
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current   = e.touches[0].clientX
    startY.current   = e.touches[0].clientY
    dragging.current = true
    lockAxis.current = null
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    // 첫 움직임으로 축 고정
    if (!lockAxis.current) {
      lockAxis.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    if (lockAxis.current === 'v') return

    e.preventDefault() // 수평 스와이프 시 스크롤 방지
    if (dx > 0) {
      // 오른쪽 → 살짝만 허용 (열려있을 때 닫기)
      setTranslateX(Math.min(0, -SWIPE_THRESHOLD + dx))
      return
    }
    const clamped = Math.max(dx, -SWIPE_CONFIRM - 20)
    setTranslateX(clamped)
  }

  const onTouchEnd = () => {
    dragging.current = false
    const x = translateX

    if (x <= -SWIPE_CONFIRM) {
      // 충분히 멀리 → confirm 다이얼로그
      setTranslateX(0)
      setRevealed(false)
      setConfirmOpen(true)
    } else if (x <= -SWIPE_THRESHOLD) {
      // 임계 이상 → 버튼 노출 상태 유지
      setTranslateX(-SWIPE_THRESHOLD)
      setRevealed(true)
    } else {
      // 그 외 → 닫기
      setTranslateX(0)
      setRevealed(false)
    }
  }

  const closeSwipe = () => {
    setTranslateX(0)
    setRevealed(false)
  }

  return (
    <>
      {/* Swipe wrapper */}
      <div
        className="relative overflow-hidden"
        style={{ borderBottom: isLast ? 'none' : '0.5px solid var(--color-separator)' }}
      >
        {/* Delete background (스와이프 중일 때만 렌더) */}
        {translateX < 0 && (
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-end pr-3"
            style={{ width: SWIPE_THRESHOLD, background: '#ef4444' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* Item row */}
        <div
          className="flex items-center gap-3 py-3 bg-card"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: dragging.current ? 'none' : 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
            paddingLeft: 0,
            paddingRight: 0,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={revealed ? closeSwipe : undefined}
        >
          {/* Checkbox */}
          <button
            onClick={e => { e.stopPropagation(); if (revealed) { closeSwipe(); return } handleToggle() }}
            className="flex-shrink-0 w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              border: todo.completed ? 'none' : '2px solid var(--color-border)',
              background: todo.completed ? 'var(--color-accent)' : 'transparent',
            }}
          >
            {todo.completed && (
              <svg className="animate-check-pop" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7l3.5 3.5 5.5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Content */}
          <button
            className="flex-1 min-w-0 text-left"
            onClick={e => { e.stopPropagation(); if (revealed) { closeSwipe(); return } onEdit(todo) }}
          >
            <p className={`text-[16px] leading-snug tracking-[-0.2px] ${
              todo.completed ? 'line-through text-muted' : 'text-primary'
            }`}>
              {todo.title}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {todo.description && (
                <span className="text-[13px] text-secondary line-clamp-1 w-full">{todo.description}</span>
              )}
              {todo.dueDate && (
                <span className={`text-[12px] ${isOverdue ? 'text-red-500' : 'text-secondary'}`}>
                  {isOverdue ? '⚠ ' : ''}{formatDate(todo.dueDate)}
                </span>
              )}
              {todo.reminderTime && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted)', transform: 'translateY(1px)', flexShrink: 0 }}>
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {todo.recurrence.type !== 'none' && (
                <span className="text-[12px]" style={{ color: 'var(--color-accent)' }}>
                  ↺ {{ daily: '매일', weekly: '매주', monthly: '매월', custom: '커스텀', none: '' }[todo.recurrence.type]}
                </span>
              )}
              {todo.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-fill)', color: 'var(--color-secondary)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </button>

          {/* 복사 버튼 (onCopy 있을 때만) */}
          {onCopy && (
            <button
              onClick={e => { e.stopPropagation(); if (revealed) { closeSwipe(); return } onCopy(todo) }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
              style={{ color: 'var(--color-muted)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* 휴지통 버튼 */}
          <button
            onClick={e => { e.stopPropagation(); setConfirmOpen(true) }}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
            style={{ color: 'var(--color-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Swipe-revealed delete button (tap to confirm) */}
        {revealed && (
          <button
            className="absolute inset-y-0 right-0 flex items-center justify-center text-white text-[13px] font-semibold"
            style={{ width: SWIPE_THRESHOLD, background: '#ef4444' }}
            onClick={() => { closeSwipe(); setConfirmOpen(true) }}
          >
            삭제
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="할일 삭제"
        message={`"${todo.title}"을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        danger
        onConfirm={() => { onDelete(todo.id); setConfirmOpen(false) }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
