import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const DOMAINS = [
  'gmail.com',
  'naver.com',
  'kakao.com',
  'daum.net',
  'hanmail.net',
  'nate.com',
  'icloud.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
]

interface EmailInputProps {
  value: string
  onChange: (email: string) => void
}

export function EmailInput({ value, onChange }: EmailInputProps) {
  const [localPart, setLocalPart]   = useState(() => value.split('@')[0] ?? '')
  const [domainInput, setDomainInput] = useState(() => value.split('@')[1] ?? '')
  const [open, setOpen]             = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const localRef   = useRef<HTMLInputElement>(null)
  const domainRef  = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = domainInput
    ? DOMAINS.filter(d => d.startsWith(domainInput.toLowerCase()))
    : DOMAINS

  useEffect(() => {
    onChange(localPart && domainInput ? `${localPart}@${domainInput}` : '')
  }, [localPart, domainInput, onChange])

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const updatePosition = () => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const w  = Math.max(rect.width, 200)
    const vw = window.innerWidth
    const vh = window.innerHeight
    const left = Math.min(rect.left, vw - w - 10)
    const fitsBelow = rect.bottom + 300 < vh - 10
    setDropdownStyle({
      position: 'fixed',
      top: fitsBelow ? rect.bottom + 4 : rect.top - 300 - 4,
      left: Math.max(10, left),
      width: w,
      zIndex: 9999,
    })
  }

  const handleDomainFocus = () => {
    updatePosition()
    setOpen(true)
    setHighlighted(0)
  }

  const handleDomainChange = (val: string) => {
    setDomainInput(val)
    setHighlighted(0)
    const matches = DOMAINS.filter(d => d.startsWith(val.toLowerCase()))
    if (val.length > 0 && matches.length === 1) {
      // 매칭이 하나뿐이면 자동완성
      setDomainInput(matches[0])
      setOpen(false)
    } else if (matches.length > 1) {
      updatePosition()
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const selectDomain = (d: string) => {
    setDomainInput(d)
    setOpen(false)
  }

  // 아이디 입력 Tab → 도메인으로 포커스
  const handleLocalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      domainRef.current?.focus()
    }
  }

  // 도메인 입력 키보드 네비게이션
  const handleDomainKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlighted]) selectDomain(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Tab') {
      if (filtered.length === 1) selectDomain(filtered[0])
      else if (filtered[highlighted]) selectDomain(filtered[highlighted])
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center" style={{ background: 'transparent' }}>
      {/* 아이디 */}
      <input
        ref={localRef}
        type="text"
        value={localPart}
        onChange={e => setLocalPart(e.target.value.replace(/[@\s]/g, ''))}
        onKeyDown={handleLocalKeyDown}
        placeholder="아이디"
        required
        className="w-[35%] min-w-0 px-4 py-3 text-[16px] text-primary placeholder:text-muted outline-none"
        style={{ background: 'transparent' }}
      />

      {/* @ */}
      <span className="text-[16px] font-medium text-muted select-none">@</span>

      {/* 도메인 */}
      <div ref={wrapperRef} className="flex flex-1 items-center min-w-0">
        <input
          ref={domainRef}
          type="text"
          value={domainInput}
          onChange={e => handleDomainChange(e.target.value)}
          onFocus={handleDomainFocus}
          onKeyDown={handleDomainKeyDown}
          placeholder="도메인 선택"
          autoComplete="off"
          className="flex-1 min-w-0 px-3 py-3 text-[16px] text-primary placeholder:text-muted outline-none"
          style={{ background: 'transparent' }}
        />
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 mr-3 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-muted)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          onClick={() => { domainRef.current?.focus(); handleDomainFocus() }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* 드롭다운 */}
      {open && filtered.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          className="rounded-xl overflow-hidden animate-alert-pop"
          style={{
            ...dropdownStyle,
            background: 'var(--color-card)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            border: '0.5px solid var(--color-separator)',
          }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
            {filtered.map((d, i) => (
              <button
                key={d}
                type="button"
                onMouseDown={e => { e.preventDefault(); selectDomain(d) }}
                className="w-full text-left px-4 py-2.5 text-[15px] transition-opacity active:opacity-50"
                style={{
                  color: i === highlighted ? 'var(--color-accent)' : 'var(--color-primary)',
                  fontWeight: i === highlighted ? 600 : 400,
                  background: i === highlighted ? 'var(--color-fill)' : 'transparent',
                  borderBottom: i < filtered.length - 1 ? '0.5px solid var(--color-separator)' : 'none',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
