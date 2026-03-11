import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full animate-slide-up max-h-[92dvh] flex flex-col rounded-t-[20px] overflow-hidden safe-bottom"
        style={{ maxWidth: '480px' }}
        style={{
          background: 'var(--color-background)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-muted)', opacity: 0.4 }} />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-1 pb-3 flex-shrink-0"
            style={{ borderBottom: '0.5px solid var(--color-separator)' }}
          >
            <h2 className="text-base font-semibold text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity active:opacity-50"
              style={{ background: 'var(--color-fill)', color: 'var(--color-secondary)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 scroll-ios">
          {children}
        </div>
      </div>
    </div>
  )
}
