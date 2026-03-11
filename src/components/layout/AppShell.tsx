import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-grouped-bg)' }}>
      <main
        className="mx-auto pb-[calc(56px+env(safe-area-inset-bottom,8px))] min-h-screen w-full"
        style={{
          maxWidth: '480px',
          background: 'var(--color-background)',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
