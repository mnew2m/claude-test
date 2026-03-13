import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme, ACCENT_COLORS } from '../context/ThemeContext'
import { useCategories } from '../hooks/useCategories'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category } from '../types'

const PRESET_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#db2777', '#0891b2']
const PRESET_ICONS  = ['🏠', '💼', '📚', '🏋️', '🎨', '🍎', '✈️', '🎯', '💡', '🎵']

interface SortableRowProps {
  cat: Category
  index: number
  total: number
  onEdit: () => void
  onDelete: () => void
  isEditing: boolean
  editForm: React.ReactNode
}

function SortableCategoryRow({ cat, index, total, onEdit, onDelete, isEditing, editForm }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        borderBottom: index < total - 1 ? '0.5px solid var(--color-separator)' : 'none',
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      {isEditing ? (
        <div className="px-3 py-3 bg-card">{editForm}</div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 bg-card">
          {/* 드래그 핸들 */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 flex flex-col gap-[3px] px-0.5 py-1 touch-none cursor-grab active:cursor-grabbing"
            style={{ color: 'var(--color-muted)' }}
          >
            <span className="block w-4 h-[1.5px] rounded" style={{ background: 'currentColor' }} />
            <span className="block w-4 h-[1.5px] rounded" style={{ background: 'currentColor' }} />
            <span className="block w-4 h-[1.5px] rounded" style={{ background: 'currentColor' }} />
          </button>

          {/* 아이콘 */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
            style={{ background: cat.color + '22' }}
          >
            {cat.icon}
          </div>

          {/* 이름 */}
          <span className="flex-1 text-[15px] text-primary">{cat.name}</span>

          {/* 컬러 도트 */}
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />

          {/* 수정 버튼 */}
          <button
            onClick={onEdit}
            className="ml-2 text-[13px] font-medium transition-opacity active:opacity-50"
            style={{ color: 'var(--color-accent)' }}
          >
            수정
          </button>

          {/* 삭제 버튼 */}
          <button
            onClick={onDelete}
            className="ml-2 text-[13px] font-medium text-red-500 transition-opacity active:opacity-50"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}

function SettingRow({ label, children, first, last }: { label: string; children: React.ReactNode; first?: boolean; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-card"
      style={{
        borderBottom: last ? 'none' : '0.5px solid var(--color-separator)',
        borderRadius: first && last ? '12px' : first ? '12px 12px 0 0' : last ? '0 0 12px 12px' : '0',
      }}
    >
      <span className="text-[16px] text-primary">{label}</span>
      {children}
    </div>
  )
}

interface CatFormProps {
  initial?: Category
  onSave: (data: { name: string; color: string; icon: string }) => void
  onCancel: () => void
}

function CategoryForm({ initial, onSave, onCancel }: CatFormProps) {
  const [name,  setName]  = useState(initial?.name  ?? '')
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])
  const [icon,  setIcon]  = useState(initial?.icon  ?? PRESET_ICONS[0])

  return (
    <div className="rounded-xl overflow-hidden shadow-card mb-3">
      <div className="px-4 py-3 bg-card space-y-3">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="카테고리 이름"
          className="w-full px-3 py-2.5 rounded-lg text-[15px] text-primary placeholder:text-muted outline-none"
          style={{ background: 'var(--color-fill)', border: 'none' }}
        />
        <div>
          <p className="text-[11px] text-secondary mb-1.5">아이콘</p>
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_ICONS.map(i => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all active:scale-90"
                style={icon === i ? { background: 'var(--color-accent)' } : { background: 'var(--color-fill)' }}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] text-secondary mb-1.5">색상</p>
          <div className="flex gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-transform active:scale-90"
                style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-[14px] text-secondary border transition-opacity active:opacity-50"
            style={{ borderColor: 'var(--color-separator)' }}
          >
            취소
          </button>
          <button
            onClick={() => { if (name.trim()) onSave({ name: name.trim(), color, icon }) }}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-40"
            style={{ background: 'var(--color-accent)' }}
          >
            {initial ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { user, signOut }    = useAuth()
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useCategories()

  const [signOutConfirm, setSignOutConfirm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm]   = useState(false)
  const [editingId,   setEditingId]     = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)
    reorderCategories(arrayMove(categories, oldIndex, newIndex))
  }

  const handleAdd = async (data: { name: string; color: string; icon: string }) => {
    await addCategory(data)
    setShowAddForm(false)
  }

  const handleUpdate = async (id: string, data: { name: string; color: string; icon: string }) => {
    await updateCategory(id, data)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await deleteCategory(id)
    setDeleteConfirmId(null)
  }

  const deleteTarget = categories.find(c => c.id === deleteConfirmId)

  return (
    <div className="pt-safe">
      <div className="px-5 pt-3 pb-4">
        <h1 className="text-[34px] font-bold text-primary tracking-[-0.5px] leading-tight">설정</h1>
      </div>

      <div className="px-4 space-y-6 pb-8">
        {/* 프로필 */}
        <section>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-secondary mb-2 px-1">계정</p>
          <div className="rounded-xl overflow-hidden shadow-card">
            <div className="flex items-center gap-3 px-4 py-3 bg-card">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-semibold flex-shrink-0"
                style={{ background: 'var(--color-accent)' }}
              >
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-primary truncate">{user?.email}</p>
                <p className="text-[12px] text-secondary">로그인됨</p>
              </div>
            </div>
          </div>
        </section>

        {/* 테마 */}
        <section>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-secondary mb-2 px-1">화면</p>
          <div className="rounded-xl overflow-hidden shadow-card">
            <SettingRow label="테마" first>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all active:opacity-70"
                    style={
                      theme === t
                        ? { background: 'var(--color-accent)', color: 'white' }
                        : { background: 'var(--color-fill)', color: 'var(--color-secondary)' }
                    }
                  >
                    {t === 'light' ? '☀️ 라이트' : '🌙 다크'}
                  </button>
                ))}
              </div>
            </SettingRow>
            <div className="px-4 py-3 bg-card" style={{ borderTop: '0.5px solid var(--color-separator)', borderRadius: '0 0 12px 12px' }}>
              <p className="text-[16px] text-primary mb-3">대표 색상</p>
              <div className="flex gap-3 flex-wrap">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setAccentColor(c.value)}
                    className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: c.value, boxShadow: accentColor === c.value ? `0 0 0 2px var(--color-card), 0 0 0 4px ${c.value}` : 'none' }}
                    >
                      {accentColor === c.value && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7l3.5 3.5 5.5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-[11px]" style={{ color: accentColor === c.value ? c.value : 'var(--color-secondary)' }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 카테고리 */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-secondary">카테고리</p>
            {!showAddForm && !editingId && (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-[13px] font-medium transition-opacity active:opacity-50"
                style={{ color: 'var(--color-accent)' }}
              >
                + 추가
              </button>
            )}
          </div>

          {/* 추가 폼 */}
          {showAddForm && (
            <CategoryForm
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* 카테고리 목록 */}
          <div className="rounded-xl overflow-hidden shadow-card">
            {categories.length === 0 ? (
              <div className="px-4 py-5 bg-card text-center">
                <p className="text-[14px] text-muted">카테고리가 없어요</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {categories.map((cat, i) => (
                    <SortableCategoryRow
                      key={cat.id}
                      cat={cat}
                      index={i}
                      total={categories.length}
                      isEditing={editingId === cat.id}
                      onEdit={() => { setEditingId(cat.id); setShowAddForm(false) }}
                      onDelete={() => setDeleteConfirmId(cat.id)}
                      editForm={
                        <CategoryForm
                          key={cat.id}
                          initial={cat}
                          onSave={data => handleUpdate(cat.id, data)}
                          onCancel={() => setEditingId(null)}
                        />
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>

        {/* 앱 정보 */}
        <section>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-secondary mb-2 px-1">앱 정보</p>
          <div className="rounded-xl overflow-hidden shadow-card">
            <SettingRow label="버전" first>
              <span className="text-[15px] text-secondary">0.0.1</span>
            </SettingRow>
            <SettingRow label="앱 이름" last>
              <span className="text-[15px] text-secondary">Flowday</span>
            </SettingRow>
          </div>
        </section>

        {/* 로그아웃 */}
        <button
          onClick={() => setSignOutConfirm(true)}
          className="w-full py-3.5 rounded-xl text-[16px] font-medium text-red-500 shadow-card transition-opacity active:opacity-70"
          style={{ background: 'var(--color-card)' }}
        >
          로그아웃
        </button>
      </div>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        title="카테고리 삭제"
        message={`"${deleteTarget?.name}"을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        danger
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* 로그아웃 확인 */}
      <ConfirmDialog
        open={signOutConfirm}
        title="로그아웃"
        message="정말 로그아웃하시겠습니까?"
        confirmLabel="로그아웃"
        danger
        onConfirm={() => { signOut(); setSignOutConfirm(false) }}
        onCancel={() => setSignOutConfirm(false)}
      />
    </div>
  )
}
