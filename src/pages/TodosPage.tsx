import { useState, useMemo } from 'react'
import { useTodos } from '../hooks/useTodos'
import { useCategories } from '../hooks/useCategories'
import { TodoList } from '../components/todo/TodoList'
import { CalendarView } from '../components/todo/CalendarView'
import { TodoForm } from '../components/todo/TodoForm'
import { isToday, isFuture, isPast, parseISO, format } from 'date-fns'
import type { Todo } from '../types'

type Filter = 'today' | 'all' | 'upcoming' | 'someday' | 'done'
type ViewMode = 'list' | 'calendar'

const FILTERS: { id: Filter; label: string; icon: string }[] = [
  { id: 'today',    label: '오늘',   icon: '☀️' },
  { id: 'all',      label: '전체',   icon: '📋' },
  { id: 'upcoming', label: '예정',   icon: '📅' },
  { id: 'someday',  label: '언젠가', icon: '🌙' },
  { id: 'done',     label: '완료',   icon: '✅' },
]

export function TodosPage() {
  const { todos, loading, addTodo, updateTodo, completeTodo, uncompleteTodo, deleteTodo } = useTodos()
  const { categories } = useCategories()
  const [filter, setFilter]       = useState<Filter>('today')
  const [viewMode, setViewMode]   = useState<ViewMode>('list')
  const [formOpen, setFormOpen]   = useState(false)
  const [editTodo, setEditTodo]   = useState<Todo | null>(null)
  const [sessionCompleted, setSessionCompleted] = useState<Set<string>>(new Set())

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const filtered = useMemo(() => {
    const show = (t: Todo) => !t.completed || sessionCompleted.has(t.id)
    switch (filter) {
      case 'today':
        return todos.filter(t => show(t) && t.dueDate && t.dueDate.startsWith(todayStr))
      case 'all':
        return todos.filter(t => show(t))
      case 'upcoming':
        return todos.filter(t => show(t) && t.dueDate && isFuture(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)))
      case 'someday':
        return todos.filter(t => show(t) && !t.dueDate)
      case 'done':
        return todos.filter(t => t.completed)
      default:
        return todos
    }
  }, [todos, filter, todayStr, sessionCompleted])

  const overdueCount = todos.filter(t =>
    !t.completed && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
  ).length

  const handleComplete = (id: string) => {
    completeTodo(id)
    setSessionCompleted(prev => new Set([...prev, id]))
  }

  const handleUncomplete = (id: string) => {
    uncompleteTodo(id)
    setSessionCompleted(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const handleEdit = (todo: Todo) => { setEditTodo(todo); setFormOpen(true) }

  const handleFormSubmit = async (data: Parameters<typeof addTodo>[0]) => {
    if (editTodo) await updateTodo(editTodo.id, data)
    else await addTodo(data)
    setEditTodo(null)
  }

  const [prefilledDate, setPrefilledDate] = useState<string | undefined>()

  const openAdd = (date?: string) => {
    setEditTodo(null)
    setPrefilledDate(date ?? (filter === 'today' ? format(new Date(), 'yyyy-MM-dd') : undefined))
    setFormOpen(true)
  }

  return (
    <div className="pt-safe">
      {/* 헤더 */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[34px] font-bold text-primary tracking-[-0.5px] leading-tight">할일</h1>
            {overdueCount > 0 && (
              <p className="text-[13px] text-red-500 mt-0.5">기한 초과 {overdueCount}개</p>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1">
            {/* 뷰 전환 토글 */}
            <div
              className="flex p-0.5 rounded-lg"
              style={{ background: 'var(--color-fill)' }}
            >
              <button
                onClick={() => setViewMode('list')}
                className="w-8 h-8 flex items-center justify-center rounded-md transition-all active:opacity-60"
                style={viewMode === 'list'
                  ? { background: 'var(--color-card)', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                  : { color: 'var(--color-muted)' }
                }
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className="w-8 h-8 flex items-center justify-center rounded-md transition-all active:opacity-60"
                style={viewMode === 'calendar'
                  ? { background: 'var(--color-card)', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                  : { color: 'var(--color-muted)' }
                }
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* 추가 버튼 */}
            <button
              onClick={() => openAdd()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 active:opacity-70 shadow-card"
              style={{ background: 'var(--color-accent)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 리스트 뷰일 때만 필터 표시 */}
        {viewMode === 'list' && (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map(f => {
              const count =
                f.id === 'done'    ? todos.filter(t => t.completed).length :
                f.id === 'today'   ? todos.filter(t => !t.completed && t.dueDate && t.dueDate.startsWith(todayStr)).length :
                f.id === 'someday' ? todos.filter(t => !t.completed && !t.dueDate).length :
                null
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[14px] font-medium transition-all active:scale-95"
                  style={
                    filter === f.id
                      ? { background: 'var(--color-accent)', color: 'white' }
                      : { background: 'var(--color-fill)', color: 'var(--color-secondary)' }
                  }
                >
                  {f.icon} {f.label}
                  {count !== null && count > 0 && (
                    <span
                      className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                      style={{
                        background: filter === f.id ? 'rgba(255,255,255,0.25)' : 'var(--color-accent)',
                        color: 'white',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-[2.5px] border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView
          todos={todos}
          categories={categories}
          onComplete={handleComplete}
          onUncomplete={handleUncomplete}
          onDelete={deleteTodo}
          onEdit={handleEdit}
          onAdd={openAdd}
        />
      ) : (
        <div className="px-4">
          <TodoList
            todos={filtered}
            categories={categories}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            onDelete={deleteTodo}
            onEdit={handleEdit}
            onAdd={openAdd}
            emptyIcon={filter === 'someday' ? '🌙' : filter === 'done' ? '🎉' : '✅'}
            emptyTitle={filter === 'someday' ? '언젠가 할 일이 없어요' : filter === 'done' ? '완료한 할일이 없어요' : '할일이 없어요'}
            emptyDescription={filter === 'someday' ? '마감일 없이 할일을 추가하면 여기에 모여요' : '새 할일을 추가해보세요'}
          />
        </div>
      )}

      <TodoForm
        key={editTodo?.id ?? (prefilledDate ?? 'new')}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTodo(null); setPrefilledDate(undefined) }}
        onSubmit={handleFormSubmit}
        categories={categories}
        initialValues={editTodo ?? (prefilledDate ? { dueDate: prefilledDate } : undefined)}
        isEditing={!!editTodo}
      />
    </div>
  )
}
