import { Link, useLocation } from 'react-router-dom'
import { Users, Shield } from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">L100 Contacts</p>
              <p className="text-[11px] text-slate-500">College Registration</p>
            </div>
          </Link>

          <Link
            to={isAdmin ? '/' : '/admin'}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
          >
            <Shield size={14} />
            {isAdmin ? 'Public Form' : 'Admin'}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {children}
      </main>

      <footer className="pb-8 text-center text-xs text-slate-400">
        L100 Contact Collection · Works offline after first load
      </footer>
    </div>
  )
}
