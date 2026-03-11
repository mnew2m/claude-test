import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth,
  isToday, addMonths, subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { Modal } from './Modal'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const HOURS    = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES  = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

interface DatePickerSheetProps {
  open: boolean
  onClose: () => void
  value: string          // 'yyyy-MM-dd' (date) or ISO string (datetime) or ''
  onChange: (v: string) => void
  mode?: 'date' | 'datetime'
  title?: string
}

export function DatePickerSheet({
  open, onClose, value, onChange, mode = 'date', title,
}: DatePickerSheetProps) {
  const parsed = value ? new Date(value) : null

  const [month,    setMonth]    = useState(() => parsed ?? new Date())
  const [selected, setSelected] = useState<Date | null>(parsed)
  const [hour,     setHour]     = useState(() => parsed ? String(parsed.getHours()).padStart(2, '0') : '09')
  const [minute,   setMinute]   = useState(() => parsed ? String(parsed.getMinutes()).padStart(2, '0') : '00')

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end:   endOfWeek(endOfMonth(month),     { weekStartsOn: 0 }),
  })

  const handleConfirm = () => {
    if (!selected) { onClose(); return }
    if (mode === 'datetime') {
      const d = new Date(selected)
      d.setHours(parseInt(hour), parseInt(minute), 0, 0)
      onChange(d.toISOString())
    } else {
      onChange(format(selected, 'yyyy-MM-dd'))
    }
    onClose()
  }

  const handleClear = () => { onChange(''); onClose() }

  const selectStyle = {
    background: 'var(--color-fill)',
    color: 'var(--color-primary)',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '18px',
    fontWeight: 600,
    outline: 'none',
    WebkitAppearance: 'none' as const,
    appearance: 'none' as const,
    textAlign: 'center' as const,
    cursor: 'pointer',
  }

  return (
    <Modal open={open} onClose={onClose} title={title ?? (mode === 'datetime' ? '날짜 & 시간' : '날짜 선택')}>
      <div className="px-4 pb-6 space-y-4">

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonth(m => subMonths(m, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
            style={{ background: 'var(--color-fill)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={() => setMonth(new Date())}
            className="text-[17px] font-semibold text-primary tracking-[-0.3px] transition-opacity active:opacity-60"
          >
            {format(month, 'yyyy년 M월', { locale: ko })}
          </button>

          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity active:opacity-50"
            style={{ background: 'var(--color-fill)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Calendar */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-fill)' }}
        >
          {/* Day labels */}
          <div className="grid grid-cols-7 px-1 pt-2 pb-1">
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className="text-center text-[12px] font-semibold py-1"
                style={{ color: i === 0 ? '#ef4444' : i === 6 ? 'var(--color-accent)' : 'var(--color-secondary)' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-1 pb-2 gap-y-0.5">
            {days.map(day => {
              const isSelected  = selected ? isSameDay(day, selected) : false
              const isTodayDay  = isToday(day)
              const isThisMonth = isSameMonth(day, month)
              const dow         = day.getDay()

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelected(day)}
                  className="flex items-center justify-center transition-all active:scale-90"
                  style={{ height: 40, opacity: isThisMonth ? 1 : 0.25 }}
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded-full text-[15px] font-medium transition-all"
                    style={{
                      background: isSelected
                        ? 'var(--color-accent)'
                        : isTodayDay
                        ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                        : 'transparent',
                      color: isSelected
                        ? 'white'
                        : isTodayDay
                        ? 'var(--color-accent)'
                        : dow === 0
                        ? '#ef4444'
                        : dow === 6
                        ? 'var(--color-accent)'
                        : 'var(--color-primary)',
                      fontWeight: isSelected || isTodayDay ? 700 : 400,
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time picker */}
        {mode === 'datetime' && (
          <div
            className="flex items-center justify-center gap-2 py-4 rounded-2xl"
            style={{ background: 'var(--color-fill)' }}
          >
            <select value={hour} onChange={e => setHour(e.target.value)} style={selectStyle}>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-[22px] font-bold text-primary">:</span>
            <select value={minute} onChange={e => setMinute(e.target.value)} style={selectStyle}>
              {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {/* Selected display */}
        {selected && (
          <p className="text-center text-[14px] font-medium" style={{ color: 'var(--color-accent)' }}>
            {mode === 'datetime'
              ? `${format(selected, 'yyyy년 M월 d일 (E)', { locale: ko })} ${hour}:${minute}`
              : format(selected, 'yyyy년 M월 d일 (E)', { locale: ko })}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="flex-1 py-3 rounded-xl text-[15px] font-medium text-secondary border transition-opacity active:opacity-50"
            style={{ borderColor: 'var(--color-separator)' }}
          >
            초기화
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-[2] py-3 rounded-xl text-[15px] font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-40"
            style={{ background: 'var(--color-accent)' }}
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  )
}
