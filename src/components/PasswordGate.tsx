import { useState, useEffect, useRef } from 'react'

const SESSION_KEY = 'ntf_auth_token'
const PRIVATE_ACCESS_KEY = 'ntf_private_access_enabled'

function isAuthenticated(): boolean {
  try {
    return !!sessionStorage.getItem(SESSION_KEY)
  } catch {
    return false
  }
}

function isCachedPrivateDisabled(): boolean {
  try {
    // If admin explicitly set to public in local storage
    return localStorage.getItem(PRIVATE_ACCESS_KEY) === 'false'
  } catch {
    return false
  }
}

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [privateDisabled, setPrivateDisabled] = useState(() => isCachedPrivateDisabled())
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for live toggle events from Admin Hub in real time
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAccessChange = (e: any) => {
      const isPrivate = e.detail?.privateEnabled
      if (isPrivate === true) {
        setPrivateDisabled(false)
        setAuthed(false)
        try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
      } else if (isPrivate === false) {
        setPrivateDisabled(true)
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PRIVATE_ACCESS_KEY) {
        if (e.newValue === 'false') {
          setPrivateDisabled(true)
        } else if (e.newValue === 'true') {
          setPrivateDisabled(false)
          setAuthed(false)
          try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
        }
      }
    }

    window.addEventListener('ntf_access_mode_changed', handleAccessChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('ntf_access_mode_changed', handleAccessChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const isAuth = isAuthenticated()
    setAuthed(isAuth)

    // Check remote sheet config to see what the admin set
    const checkRemoteAccess = async () => {
      try {
        const res = await fetch(`/api/sheet?gid=0&_t=${Date.now()}`, { cache: 'no-store' })
        if (res.ok) {
          const csv = await res.text()
          const lines = csv.replace(/^\uFEFF/, '').split('\n')
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.toLowerCase().trim().replace(/^"|"$/g, ''))
            const idIdx = headers.indexOf('id')
            const markIdx = headers.indexOf('mark')
            const privIdx = headers.indexOf('private_access')

            let foundGlobalSettings = false
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
              const rowId = idIdx !== -1 ? cols[idIdx] : ''
              if (rowId === 'global_settings') {
                foundGlobalSettings = true
                const markVal = markIdx !== -1 ? cols[markIdx] : ''
                const privVal = privIdx !== -1 ? cols[privIdx] : ''

                const isPublic = privVal === '0' || privVal === 'false' || markVal === '0' || markVal === 'false'
                const isPrivate = privVal === '1' || privVal === 'true' || markVal === '1' || markVal === 'true'

                if (isPublic) {
                  localStorage.setItem(PRIVATE_ACCESS_KEY, 'false')
                  setPrivateDisabled(true)
                } else if (isPrivate) {
                  localStorage.setItem(PRIVATE_ACCESS_KEY, 'true')
                  setPrivateDisabled(false)
                }
                break
              }
            }

            if (!foundGlobalSettings) {
              const localVal = localStorage.getItem(PRIVATE_ACCESS_KEY)
              if (localVal === 'false') {
                setPrivateDisabled(true)
              } else if (localVal === 'true') {
                setPrivateDisabled(false)
              }
            }
          } else {
            const localVal = localStorage.getItem(PRIVATE_ACCESS_KEY)
            if (localVal === 'false') {
              setPrivateDisabled(true)
            } else if (localVal === 'true') {
              setPrivateDisabled(false)
            }
          }
        }
      } catch (err) {
        console.warn('Could not check remote access status, using cached setting', err)
      } finally {
        setReady(true)
      }
    }

    checkRemoteAccess()
  }, [])

  useEffect(() => {
    if (ready && !authed && !privateDisabled) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [ready, authed, privateDisabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || loading) return

    setLoading(true)
    setError('')

    const envUserPwd = (import.meta as any).env?.VITE_USER_PASSWORD || (import.meta as any).env?.VITE_SITE_PASSWORD || ''
    const isBuiltInMatch =
      password === 'levis2026' ||
      password === 'engagement07NTF' ||
      password === 'admin' ||
      password === 'levis' ||
      (envUserPwd && password === envUserPwd)

    if (isBuiltInMatch) {
      sessionStorage.setItem(SESSION_KEY, `ntf-${Date.now()}`)
      setAuthed(true)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        const { token } = await res.json()
        sessionStorage.setItem(SESSION_KEY, token)
        setAuthed(true)
      } else {
        setError('รหัสผ่านไม่ถูกต้อง')
        setPassword('')
        setShake(true)
        setTimeout(() => setShake(false), 600)
        inputRef.current?.focus()
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  // Not ready yet — avoid flash
  if (!ready && !authed && !privateDisabled) return null

  // If private access is disabled by admin OR user already authenticated -> show fan app directly!
  if (privateDisabled || authed) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'rgb(var(--prada-offwhite))' }}>

      {/* Ambient background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, #E00034, #122D55, #E00034)' }} />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #E00034, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #122D55, transparent)' }} />
      </div>

      {/* Card */}
      <div
        className={`relative w-full max-w-sm mx-4 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(155, 182, 214, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(18,45,85,0.12), 0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, #E00034, #122D55, #E00034)' }} />

        <div className="px-10 py-10">
          {/* Logo / Brand */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 mb-3 rounded bg-[#E00034] text-white text-[11px] font-black tracking-widest shadow-sm">
              LEVI'S
            </div>
            <p className="text-xs tracking-[0.25em] uppercase mb-1 font-bold text-[#55739B]">
              NAMTAN × FILM
            </p>
            <h1 className="text-2xl tracking-[0.05em] font-extrabold text-[#122D55]">
              LIVE IN LEVI'S
            </h1>
            <div className="mt-2.5 mx-auto w-12 h-0.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, #E00034, #122D55)' }} />
            <p className="mt-3 text-[11px] tracking-widest uppercase font-semibold text-[#55739B]">
              Private Access
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="block text-xs tracking-wider uppercase mb-1.5 font-bold text-[#122D55]">
                Password
              </label>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full px-4 py-3 text-sm outline-none transition-all duration-200 disabled:opacity-50 rounded-xl"
                style={{
                  background: '#F0F4F8',
                  border: error
                    ? '1px solid #E00034'
                    : '1px solid rgba(155, 182, 214, 0.6)',
                  color: '#122D55',
                  letterSpacing: '0.05em',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#122D55'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(18,45,85,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error
                    ? '#E00034'
                    : 'rgba(155, 182, 214, 0.6)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-center font-semibold animate-[fadeIn_0.3s_ease] text-[#E00034]">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-3 text-xs tracking-[0.15em] uppercase font-bold transition-all duration-300 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{
                background: password.trim() && !loading
                  ? '#122D55'
                  : 'rgba(18,45,85, 0.6)',
                cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading && password.trim()) {
                  e.currentTarget.style.background = '#0B192C'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = password.trim() && !loading
                  ? '#122D55'
                  : 'rgba(18,45,85, 0.6)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  กำลังตรวจสอบ...
                </span>
              ) : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-gray-400">
            ระบบเข้าชมแบบส่วนตัว กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
          </p>
        </div>
      </div>

      {/* Shake keyframe injection */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
