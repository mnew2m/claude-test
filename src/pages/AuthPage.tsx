import { useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { SignUpForm } from '../components/auth/SignUpForm'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top spacer */}
      <div className="flex-1 max-flex-[2]" />

      <div className="px-6 pb-10 w-full mx-auto" style={{ maxWidth: '480px' }}>
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 rounded-[22px] mx-auto mb-4 flex items-center justify-center shadow-card"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="18" cy="18" r="10" stroke="white" strokeWidth="2.5"/>
              <path d="M13 18l4 4 7-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M26 32 C26 28 30 26 30 22 C31.5 24 33 26.5 33 29.5 C33 32.9 29.9 36 26 36 C22.1 36 19 32.9 19 29.5 C19 27.5 20 26 21 25 C21 27.5 22.5 30 26 32Z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-primary tracking-[-0.5px]">Flowday</h1>
          <p className="text-[15px] text-secondary mt-1">흐름 있는 하루를 만들어보세요</p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl overflow-hidden shadow-card"
          style={{ background: 'var(--color-card)' }}
        >
          {/* Tab */}
          <div
            className="flex"
            style={{ borderBottom: '0.5px solid var(--color-separator)' }}
          >
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-3.5 text-[15px] font-semibold transition-colors"
                style={{
                  color: mode === m ? 'var(--color-accent)' : 'var(--color-muted)',
                  borderBottom: mode === m ? '2px solid var(--color-accent)' : '2px solid transparent',
                  marginBottom: '-0.5px',
                }}
              >
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {mode === 'login'
              ? <LoginForm onSwitch={() => setMode('signup')} />
              : <SignUpForm onSwitch={() => setMode('login')} />
            }
          </div>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  )
}
