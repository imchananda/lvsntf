import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminHub from './pages/AdminHub.tsx'
import AdminLogin from './pages/AdminLogin.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import PasswordGate from './components/PasswordGate.tsx'

const ADMIN_AUTH_KEY = 'ntf_admin_auth'

function isAdminRoute(hash: string): boolean {
  return (
    hash.startsWith('#/admin') ||
    hash === '#/admin-prada-calc' ||
    hash === '#/admin-levis-calc' ||
    hash === '#/admin-calc' ||
    hash === '#/admin-data'
  )
}

function Root() {
  const [hash, setHash] = useState(() => window.location.hash)
  const [isAdminAuth, setIsAdminAuth] = useState(
    () => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  )

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // ─── Admin Route Handling ─────────────────────────────────────────────────
  if (isAdminRoute(hash)) {
    if (!isAdminAuth) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
            setIsAdminAuth(true)
          }}
        />
      )
    }

    const initialTab = hash.includes('calc') ? 'calc' : 'data'
    return (
      <AdminHub
        initialTab={initialTab}
        onLogout={() => {
          sessionStorage.removeItem(ADMIN_AUTH_KEY)
          setIsAdminAuth(false)
        }}
      />
    )
  }

  // ─── Public Fan Portal Route ──────────────────────────────────────────────
  return (
    <PasswordGate>
      <ErrorBoundary>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ErrorBoundary>
    </PasswordGate>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
