import { TodoItem } from './TodoItem'
import { EmptyState } from '../common/EmptyState'
import type { Todo, Category } from '../../types'

interface TodoListProps {
  todos: Todo[]
  categories: Category[]
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onAdd: () => void
  onCopy?: (todo: Todo) => void
  onPin?: (id: string) => void
  hideAddAction?: boolean
  emptyIcon?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyCompact?: boolean
}

export function TodoList({ todos, categories: _categories, onComplete, onUncomplete, onDelete, onEdit, onAdd, onCopy, onPin, hideAddAction, emptyIcon = '✅', emptyTitle = '할일이 없어요', emptyDescription = '새 할일을 추가해보세요', emptyCompact }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={hideAddAction ? undefined : { label: '할일 추가', onClick: onAdd }}
        compact={emptyCompact}
      />
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden shadow-card"
      style={{ background: 'var(--color-card)' }}
    >
      {todos.map((todo, i) => (
        <div key={todo.id}>
          <TodoItem
            todo={todo}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onDelete={onDelete}
            onEdit={onEdit}
            onCopy={onCopy}
            onPin={onPin}
            isLast={i === todos.length - 1}
          />
        </div>
      ))}
    </div>
  )
}
