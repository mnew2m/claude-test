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
  onPin?: (id: string) => void
  isLast?: boolean
}

const SWIPE_THRESHOLD = 72   // 왼쪽: 삭제 버튼 노출
const SWIPE_CONFIRM   = 160  // 왼쪽: 바로 confirm
const PIN_THRESHOLD   = 72   // 오른쪽: 고정 버튼 노출
const PIN_CONFIRM     = 160  // 오른쪽: 바로 고정 처리

export function TodoItem({ todo, onComplete, onUncomplete, onDelete, onEdit, onCopy, onPin, isLast }: TodoItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [translateX, setTranslateX] = useState(0)
  const [revealed,      setRevealed]      = useState(false)  // 왼쪽 (삭제)
  const [revealedRight, setRevealedRight] = useState(false)  // 오른쪽 (고정)

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

    if (!lockAxis.current) {
      lockAxis.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    if (lockAxis.current === 'v') return

    e.preventDefault()

    if (dx > 0) {
      if (revealed) {
        // 왼쪽 열려있을 때 오른쪽 → 닫기
        setTranslateX(Math.min(0, -SWIPE_THRESHOLD + dx))
      } else {
        // 오른쪽 스와이프 → 고정 버튼 노출
        setTranslateX(Math.min(dx, PIN_CONFIRM + 20))
      }
    } else {
      if (revealedRight) {
        // 오른쪽 열려있을 때 왼쪽 → 닫기
        setTranslateX(Math.max(0, PIN_THRESHOLD + dx))
      } else {
        // 왼쪽 스와이프 → 삭제 버튼 노출
        setTranslateX(Math.max(dx, -SWIPE_CONFIRM - 20))
      }
    }
  }

  const onTouchEnd = () => {
    dragging.current = false
    const x = translateX

    if (x >= PIN_CONFIRM) {
      // 충분히 멀리 → 바로 고정 처리
      setTranslateX(0)
      setRevealedRight(false)
      onPin?.(todo.id)
    } else if (x >= PIN_THRESHOLD) {
      setTranslateX(PIN_THRESHOLD)
      setRevealedRight(true)
    } else if (x <= -SWIPE_CONFIRM) {
      setTranslateX(0)
      setRevealed(false)
      setConfirmOpen(true)
    } else if (x <= -SWIPE_THRESHOLD) {
      setTranslateX(-SWIPE_THRESHOLD)
      setRevealed(true)
    } else {
      setTranslateX(0)
      setRevealed(false)
      setRevealedRight(false)
    }
  }

  const closeSwipe = () => {
    setTranslateX(0)
    setRevealed(false)
    setRevealedRight(false)
  }

  const anyRevealed = revealed || revealedRight

  return (
    <>
      {/* Swipe wrapper */}
      <div
        className="relative overflow-hidden"
        style={{ borderBottom: isLast ? 'none' : '0.5px solid var(--color-separator)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={anyRevealed ? closeSwipe : undefined}
      >
        {/* 고정 배경 (오른쪽 스와이프 중) */}
        {translateX > 0 && (
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center"
            style={{ width: PIN_THRESHOLD, background: todo.pinned ? '#6b7280' : '#f59e0b' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* 삭제 배경 (왼쪽 스와이프 중) */}
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
          className="flex items-center gap-3 py-3 px-4 bg-card"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: dragging.current ? 'none' : 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
          }}
        >
          {/* Checkbox */}
          <button
            onClick={e => { e.stopPropagation(); if (anyRevealed) { closeSwipe(); return } handleToggle() }}
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
            onClick={e => { e.stopPropagation(); if (anyRevealed) { closeSwipe(); return } onEdit(todo) }}
          >
            <p className={`text-[16px] leading-snug tracking-[-0.2px] ${
              todo.completed ? 'line-through text-muted' : 'text-primary'
            }`}>
              {todo.pinned && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: 4, transform: 'translateY(0px)', color: '#f59e0b' }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
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
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* 복사 버튼 (onCopy 있을 때만) */}
          {onCopy && (
            <button
              onClick={e => { e.stopPropagation(); if (anyRevealed) { closeSwipe(); return } onCopy(todo) }}
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

        {/* 오른쪽 스와이프 — 고정 버튼 */}
        {revealedRight && (
          <button
            className="absolute inset-y-0 left-0 flex items-center justify-center text-white text-[13px] font-semibold"
            style={{ width: PIN_THRESHOLD, background: todo.pinned ? '#6b7280' : '#f59e0b' }}
            onClick={() => { closeSwipe(); onPin?.(todo.id) }}
          >
            {todo.pinned ? '해제' : '고정'}
          </button>
        )}

        {/* 왼쪽 스와이프 — 삭제 버튼 */}
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
