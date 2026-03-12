import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useTodos } from '../hooks/useTodos'
import { useCategories } from '../hooks/useCategories'
import { TodoList } from '../components/todo/TodoList'
import { CalendarView } from '../components/todo/CalendarView'
import { TodoForm } from '../components/todo/TodoForm'
import { Modal } from '../components/common/Modal'
import { isToday, isFuture, isPast, parseISO, format, parse } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Todo } from '../types'

type Filter = 'today' | 'all' | 'upcoming' | 'someday' | 'done'
type ViewMode = 'list' | 'calendar'

const MONTH_LABELS_SHORT = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function RangeMonthPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => parseInt(value.substring(0, 4), 10))
  const date = parse(value, 'yyyy-MM', new Date())
  const selectedYear  = parseInt(value.substring(0, 4), 10)
  const selectedMonth = parseInt(value.substring(5, 7), 10) - 1
  const today = new Date()

  const handleOpen = () => { setPickerYear(selectedYear); setOpen(true) }
  const handleSelect = (monthIndex: number) => {
    onChange(format(new Date(pickerYear, monthIndex, 1), 'yyyy-MM'))
    setOpen(false)
  }

  return (
    <div>
      <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--color-muted)' }}>{label}</p>
      {/* 선택된 값 표시 버튼 */}
      <button
        onClick={handleOpen}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-opacity active:opacity-70"
        style={{ background: 'var(--color-fill)' }}
      >
        <span className="text-[15px] font-semibold text-primary">
          {format(date, 'yyyy년 M월', { locale: ko })}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 인라인 년월 그리드 */}
      {open && (
        <div className="mt-2 p-3 rounded-xl space-y-3" style={{ background: 'var(--color-card)', border: '0.5px solid var(--color-separator)' }}>
          {/* 연도 네비 */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPickerYear(y => y - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
              style={{ background: 'var(--color-fill)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-[15px] font-semibold text-primary">{pickerYear}년</span>
            <button
              onClick={() => setPickerYear(y => y + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
              style={{ background: 'var(--color-fill)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {/* 월 그리드 */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_LABELS_SHORT.map((lbl, i) => {
              const isSelected = pickerYear === selectedYear && i === selectedMonth
              const isThisMonth = pickerYear === today.getFullYear() && i === today.getMonth()
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className="py-2 rounded-lg text-[13px] font-medium transition-all active:scale-95"
                  style={{
                    background: isSelected ? 'var(--color-accent)' : isThisMonth ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'var(--color-fill)',
                    color: isSelected ? 'white' : isThisMonth ? 'var(--color-accent)' : 'var(--color-primary)',
                    fontWeight: isSelected || isThisMonth ? 600 : 400,
                  }}
                >
                  {lbl}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const FILTERS: { id: Filter; label: string; icon: string }[] = [
  { id: 'today',    label: '오늘',   icon: '☀️' },
  { id: 'all',      label: '전체',   icon: '📋' },
  { id: 'upcoming', label: '예정',   icon: '📅' },
  { id: 'someday',  label: '언젠가', icon: '🌙' },
  { id: 'done',     label: '완료',   icon: '✅' },
]

export function TodosPage() {
  const { todos, loading, addTodo, updateTodo, completeTodo, uncompleteTodo, deleteTodo, togglePin } = useTodos()
  const { categories } = useCategories()
  const [filter, setFilter]       = useState<Filter>('today')
  const [viewMode, setViewMode]   = useState<ViewMode>('list')
  const [formOpen, setFormOpen]   = useState(false)
  const [editTodo, setEditTodo]   = useState<Todo | null>(null)
  const [sessionCompleted, setSessionCompleted] = useState<Set<string>>(new Set())
  const [doneSortKey, setDoneSortKey] = useState<'completedAt' | 'dueDate'>('completedAt')
  const [doneSortDir, setDoneSortDir] = useState<'desc' | 'asc'>('desc')
  const currentYM = format(new Date(), 'yyyy-MM')
  const [doneRangeStart, setDoneRangeStart] = useState(currentYM)
  const [doneRangeEnd,   setDoneRangeEnd]   = useState(currentYM)
  const [doneNoDate,     setDoneNoDate]      = useState(false)
  const [doneRangeOpen,  setDoneRangeOpen]  = useState(false)
  const [tmpStart,   setTmpStart]   = useState(currentYM)
  const [tmpEnd,     setTmpEnd]     = useState(currentYM)
  const [tmpNoDate,  setTmpNoDate]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [copySource, setCopySource] = useState<Todo | null>(null)

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
      case 'done': {
        const done = todos.filter(t => {
          if (!t.completed) return false
          const dateVal = doneSortKey === 'completedAt' ? t.completedAt : t.dueDate
          if (!dateVal) return doneNoDate
          const ym = dateVal.substring(0, 7)
          const s = doneRangeStart <= doneRangeEnd ? doneRangeStart : doneRangeEnd
          const e = doneRangeStart <= doneRangeEnd ? doneRangeEnd : doneRangeStart
          return ym >= s && ym <= e
        })
        const dir = doneSortDir === 'desc' ? 1 : -1
        return [...done].sort((a, b) => {
          const va = (doneSortKey === 'completedAt' ? a.completedAt : a.dueDate) ?? ''
          const vb = (doneSortKey === 'completedAt' ? b.completedAt : b.dueDate) ?? ''
          return vb.localeCompare(va) * dir
        })
      }
      default:
        return todos
    }
  }, [todos, filter, todayStr, sessionCompleted, doneSortKey, doneSortDir, doneRangeStart, doneRangeEnd, doneNoDate])

  const pinSort = (a: typeof filtered[0], b: typeof filtered[0]) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)

  const categoryGroups = useMemo(() => {
    if (filtered.length === 0) return []
    const groups: { cat?: typeof categories[0]; todos: typeof filtered }[] = []
    for (const cat of categories) {
      const catTodos = filtered.filter(t => t.categoryId === cat.id)
      if (catTodos.length > 0) groups.push({ cat, todos: [...catTodos].sort(pinSort) })
    }
    const noCategory = filtered.filter(t => !t.categoryId)
    if (noCategory.length > 0) groups.push({ todos: [...noCategory].sort(pinSort) })
    return groups
  }, [filtered, categories])

  const doneGroups = useMemo(() => {
    if (filter !== 'done') return []
    const groups: { label: string; todos: Todo[] }[] = []
    const map = new Map<string, Todo[]>()
    for (const t of filtered) {
      const dateStr = doneSortKey === 'completedAt' ? t.completedAt : t.dueDate
      const key = dateStr ? dateStr.substring(0, 7) : '날짜 없음'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    for (const [key, todos] of map) {
      const label = key === '날짜 없음'
        ? '날짜 없음'
        : format(parse(key, 'yyyy-MM', new Date()), 'yyyy년 M월', { locale: ko })
      groups.push({ label, todos })
    }
    return groups
  }, [filtered, filter, doneSortKey])

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

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return todos.filter(t => {
      if (t.title.toLowerCase().includes(q)) return true
      if (t.description?.toLowerCase().includes(q)) return true
      if (t.tags.some(tag => tag.toLowerCase().includes(q))) return true
      const cat = categories.find(c => c.id === t.categoryId)
      if (cat?.name.toLowerCase().includes(q)) return true
      return false
    })
  }, [todos, categories, searchQuery])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setSearchQuery('')
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [])

  const [prefilledDate, setPrefilledDate] = useState<string | undefined>()
  const filterScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = filterScrollRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.deltaY !== 0) { e.preventDefault(); el.scrollLeft += e.deltaY }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const openAdd = (date?: string) => {
    setEditTodo(null)
    setCopySource(null)
    setPrefilledDate(date ?? (filter === 'today' ? format(new Date(), 'yyyy-MM-dd') : undefined))
    setFormOpen(true)
  }

  const handleCopy = (todo: Todo) => {
    setEditTodo(null)
    setCopySource(todo)
    setPrefilledDate(undefined)
    setFormOpen(true)
  }

  return (
    <div className="pt-safe">
      {/* 헤더 */}
      <div className="px-5 pt-3 pb-2">
        {searchOpen ? (
          /* 검색 모드 헤더 */
          <div className="flex items-center gap-2 py-1">
            <div
              className="flex-1 flex items-center gap-2 px-3 h-10 rounded-xl"
              style={{ background: 'var(--color-fill)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="할일 검색..."
                className="flex-1 bg-transparent text-[15px] text-primary placeholder-muted outline-none"
                style={{ color: 'var(--color-primary)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="flex-shrink-0 active:opacity-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="var(--color-muted)" opacity="0.4"/>
                    <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={closeSearch}
              className="text-[15px] font-medium flex-shrink-0 active:opacity-50"
              style={{ color: 'var(--color-accent)' }}
            >
              취소
            </button>
          </div>
        ) : (
          /* 일반 헤더 */
          <>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-[34px] font-bold text-primary tracking-[-0.5px] leading-tight">할일</h1>
                {overdueCount > 0 && (
                  <p className="text-[13px] text-red-500 mt-0.5">기한 초과 {overdueCount}개</p>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1">
                {/* 검색 버튼 */}
                <button
                  onClick={openSearch}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:opacity-60"
                  style={{ background: 'var(--color-fill)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

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

                {/* 추가 버튼 (캘린더뷰, 완료탭에서는 숨김) */}
                {viewMode === 'list' && filter !== 'done' && (
                  <button
                    onClick={() => openAdd()}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 active:opacity-70 shadow-card"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 3v12M3 9h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* 리스트 뷰일 때만 필터 표시 (검색 중엔 숨김) */}
        {viewMode === 'list' && !searchOpen && (
          <div ref={filterScrollRef} className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map(f => {
              const count =
                f.id === 'done'    ? todos.filter(t => t.completed).length :
                f.id === 'today'   ? todos.filter(t => !t.completed && t.dueDate && t.dueDate.startsWith(todayStr)).length :
                f.id === 'someday' ? todos.filter(t => !t.completed && !t.dueDate).length :
                null
              return (
                <button
                  key={f.id}
                  onClick={() => { setFilter(f.id); setSessionCompleted(new Set()) }}
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
        {/* 완료 탭 정렬 + 범위 필터 */}
        {viewMode === 'list' && filter === 'done' && !searchOpen && (
          <>
            <div className="flex gap-2 mt-2 px-0">
              {([
                { id: 'completedAt', label: '완료 한 날짜순' },
                { id: 'dueDate',     label: '계획 한 날짜순' },
              ] as const).map(s => {
                const isActive = doneSortKey === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (isActive) setDoneSortDir(d => d === 'desc' ? 'asc' : 'desc')
                      else { setDoneSortKey(s.id); setDoneSortDir('desc') }
                    }}
                    className="flex items-center gap-1 text-[12px] font-medium px-3 py-1 rounded-full transition-all active:scale-95"
                    style={
                      isActive
                        ? { background: 'var(--color-accent)', color: 'white' }
                        : { background: 'var(--color-fill)', color: 'var(--color-secondary)' }
                    }
                  >
                    {s.label}
                    {isActive && (
                      <svg
                        width="10" height="10" viewBox="0 0 24 24" fill="none"
                        className={`transition-transform ${doneSortDir === 'asc' ? 'rotate-180' : ''}`}
                      >
                        <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            {/* 범위 표시 버튼 */}
            <button
              onClick={() => {
                setTmpStart(doneRangeStart)
                setTmpEnd(doneRangeEnd)
                setTmpNoDate(doneNoDate)
                setDoneRangeOpen(true)
              }}
              className="flex items-center gap-1.5 mt-2 text-[12px] font-medium px-3 py-1 rounded-full transition-all active:scale-95"
              style={{ background: 'var(--color-fill)', color: 'var(--color-secondary)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {(() => {
                const s = doneRangeStart <= doneRangeEnd ? doneRangeStart : doneRangeEnd
                const e = doneRangeStart <= doneRangeEnd ? doneRangeEnd : doneRangeStart
                const fmt = (ym: string) => {
                  const d = parse(ym, 'yyyy-MM', new Date())
                  return format(d, 'yyyy년 M월', { locale: ko })
                }
                const label = s === e ? fmt(s) : `${fmt(s)} ~ ${fmt(e)}`
                return doneNoDate ? `${label} + 날짜 없음` : label
              })()}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-muted)' }}>
                <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* 콘텐츠 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-[2.5px] border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : searchOpen ? (
        <div className="px-4">
          {searchQuery.trim() === '' ? (
            <p className="text-center text-[14px] py-16" style={{ color: 'var(--color-muted)' }}>검색어를 입력해주세요</p>
          ) : (
            <TodoList
              todos={searchResults}
              categories={categories}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              onDelete={deleteTodo}
              onEdit={handleEdit}
              onAdd={openAdd}
              onCopy={handleCopy}
              emptyIcon="🔍"
              emptyTitle="검색 결과가 없어요"
              emptyDescription={`'${searchQuery}'에 해당하는 할일이 없습니다`}
            />
          )}
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
      ) : filter === 'done' ? (
        <div className="px-4 space-y-4">
          {doneGroups.length === 0 ? (
            <TodoList
              todos={[]}
              categories={categories}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              onDelete={deleteTodo}
              onEdit={handleEdit}
              onAdd={openAdd}
              hideAddAction
              emptyIcon="🎉"
              emptyTitle="완료한 할일이 없어요"
              emptyDescription="이 기간에 완료한 할일이 없습니다"
            />
          ) : (
            doneGroups.map(group => {
              const catGroups: { cat?: typeof categories[0]; todos: typeof group.todos }[] = []
              for (const cat of categories) {
                const catTodos = group.todos.filter(t => t.categoryId === cat.id)
                if (catTodos.length > 0) catGroups.push({ cat, todos: [...catTodos].sort(pinSort) })
              }
              const noCategory = group.todos.filter(t => !t.categoryId)
              if (noCategory.length > 0) catGroups.push({ todos: [...noCategory].sort(pinSort) })
              return (
                <div key={group.label}>
                  <p className="text-[13px] font-semibold mb-2 px-1" style={{ color: 'var(--color-secondary)' }}>
                    {group.label}
                  </p>
                  <div className="space-y-3">
                    {catGroups.map(cg => (
                      <div key={cg.cat?.id ?? 'none'}>
                        <div className="flex items-center gap-1.5 mb-1.5 px-1">
                          {cg.cat ? (
                            <span className="text-[12px] font-semibold" style={{ color: cg.cat.color }}>
                              {cg.cat.icon} {cg.cat.name}
                            </span>
                          ) : (
                            <span className="text-[12px] font-semibold" style={{ color: 'var(--color-muted)' }}>
                              카테고리 없음
                            </span>
                          )}
                        </div>
                        <TodoList
                          todos={cg.todos}
                          categories={categories}
                          onComplete={handleComplete}
                          onUncomplete={handleUncomplete}
                          onDelete={deleteTodo}
                          onEdit={handleEdit}
                          onAdd={openAdd}
                          onPin={togglePin}
                          hideAddAction
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="px-4">
          {categoryGroups.length === 0 ? (
            <TodoList
              todos={[]}
              categories={categories}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              onDelete={deleteTodo}
              onEdit={handleEdit}
              onAdd={openAdd}
              emptyIcon={filter === 'someday' ? '🌙' : '✅'}
              emptyTitle={filter === 'someday' ? '언젠가 할 일이 없어요' : '할일이 없어요'}
              emptyDescription={filter === 'someday' ? '마감일 없이 할일을 추가하면 여기에 모여요' : '새 할일을 추가해보세요'}
            />
          ) : (
            <div className="space-y-4">
              {categoryGroups.map(group => (
                <div key={group.cat?.id ?? 'none'}>
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    {group.cat ? (
                      <span className="text-[12px] font-semibold" style={{ color: group.cat.color }}>
                        {group.cat.icon} {group.cat.name}
                      </span>
                    ) : (
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--color-muted)' }}>
                        카테고리 없음
                      </span>
                    )}
                  </div>
                  <TodoList
                    todos={group.todos}
                    categories={categories}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    onDelete={deleteTodo}
                    onEdit={handleEdit}
                    onAdd={openAdd}
                    onPin={togglePin}
                    hideAddAction
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TodoForm
        key={editTodo?.id ?? (copySource ? `copy_${copySource.id}` : (prefilledDate ?? 'new'))}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTodo(null); setCopySource(null); setPrefilledDate(undefined) }}
        onSubmit={handleFormSubmit}
        categories={categories}
        initialValues={
          editTodo
            ? editTodo
            : copySource
            ? { title: copySource.title, description: copySource.description, categoryId: copySource.categoryId, tags: copySource.tags, recurrence: copySource.recurrence }
            : prefilledDate
            ? { dueDate: prefilledDate }
            : undefined
        }
        isEditing={!!editTodo}
        somedayMode={!editTodo && !copySource && filter === 'someday'}
      />

      {/* 완료 탭 범위 선택 모달 */}
      <Modal open={doneRangeOpen} onClose={() => setDoneRangeOpen(false)} title="기간 선택">
        <div className="px-4 pt-3 pb-6 space-y-5">
          {/* 시작 월 */}
          <RangeMonthPicker label="시작 월" value={tmpStart} onChange={setTmpStart} />
          {/* 종료 월 */}
          <RangeMonthPicker label="종료 월" value={tmpEnd} onChange={setTmpEnd} />
          {/* 날짜 없음 토글 */}
          <button
            onClick={() => setTmpNoDate(v => !v)}
            className="flex items-center justify-between w-full py-3 px-4 rounded-xl transition-all active:opacity-70"
            style={{ background: 'var(--color-fill)' }}
          >
            <span className="text-[14px] font-medium text-primary">날짜 없음 포함</span>
            <div
              className="w-12 h-7 rounded-full flex items-center px-1 transition-all"
              style={{ background: tmpNoDate ? 'var(--color-accent)' : 'var(--color-border)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: tmpNoDate ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </div>
          </button>
          {/* 초기화 */}
          <button
            onClick={() => { setTmpStart(currentYM); setTmpEnd(currentYM); setTmpNoDate(false) }}
            className="w-full py-3 rounded-xl text-[14px] font-medium border transition-opacity active:opacity-50"
            style={{ borderColor: 'var(--color-separator)', color: 'var(--color-secondary)' }}
          >
            이번 달로 초기화
          </button>
          {/* 확인 */}
          <button
            onClick={() => {
              setDoneRangeStart(tmpStart)
              setDoneRangeEnd(tmpEnd)
              setDoneNoDate(tmpNoDate)
              setDoneRangeOpen(false)
            }}
            className="w-full py-3 rounded-xl text-[15px] font-semibold transition-opacity active:opacity-70"
            style={{ background: 'var(--color-accent)', color: 'white' }}
          >
            확인
          </button>
        </div>
      </Modal>
    </div>
  )
}
