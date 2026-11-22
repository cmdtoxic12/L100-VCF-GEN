import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  Download,
  Loader2,
  LogOut,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react'

const PAGE_SIZE = 25

export default function Admin() {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [contacts, setContacts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ full_name: '', whatsapp: '' })
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [exporting, setExporting] = useState(false)

  /* ── Session probe ───────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('/api/admin/login')
        const data = await res.json().catch(() => ({}))
        if (!cancelled) setAuthenticated(Boolean(data.authenticated))
      } catch {
        if (!cancelled) setLoginError('Could not reach the server.')
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  /* ── Data loading ────────────────────────────────────────────────── */

  const load = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      setError('')
      if (append) setLoadingMore(true)
      else setLoading(true)

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        })
        if (query) params.set('q', query)

        const res = await fetch(`/api/contacts?${params.toString()}`)
        if (res.status === 401) {
          setAuthenticated(false)
          return
        }

        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to load contacts')

        const rows = Array.isArray(data.rows) ? data.rows : []
        setContacts((current) => (append ? [...current, ...rows] : rows))
        setTotal(Number(data.total ?? 0))
      } catch (err) {
        setError(err.message || 'Failed to load contacts')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [query],
  )

  useEffect(() => {
    // Loading from the API is the external-system case effects exist for;
    // load() flips its loading flag before awaiting the request.
    // oxlint-disable-next-line react/set-state-in-effect
    if (authenticated) void load()
  }, [authenticated, load])

  // Debounce the search box, then query the API (not just the loaded page).
  const searchTimer = useRef(null)

  useEffect(
    () => () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    },
    [],
  )

  function handleSearchChange(value) {
    setSearch(value)
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => setQuery(value.trim()), 300)
  }

  /* ── Auth ────────────────────────────────────────────────────────── */

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    setLoggingIn(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 401) {
        setLoginError('Incorrect password.')
        return
      }
      if (!res.ok) {
        setLoginError(data.error || 'Could not sign in.')
        return
      }

      setPassword('')
      setAuthenticated(true)
    } catch {
      setLoginError('Could not reach the server.')
    } finally {
      setLoggingIn(false)
    }
  }

  async function handleLogout() {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    try {
      await fetch('/api/admin/login', { method: 'DELETE' })
    } catch {
      // The cookie may already be gone; reset the UI either way.
    }
    setAuthenticated(false)
    setContacts([])
    setTotal(0)
    setSearch('')
    setQuery('')
    setEditingId(null)
    setNotice('')
    setError('')
  }

  /* ── Row actions ─────────────────────────────────────────────────── */

  function startEdit(contact) {
    setEditingId(contact.id)
    setEditForm({ full_name: contact.full_name, whatsapp: contact.whatsapp })
    setNotice('')
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ full_name: '', whatsapp: '' })
  }

  async function saveEdit(id) {
    setSavingId(id)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editForm.full_name.trim(),
          whatsapp: editForm.whatsapp.trim(),
        }),
      })
      if (res.status === 401) {
        setAuthenticated(false)
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Update failed')

      setContacts((current) =>
        current.map((contact) =>
          contact.id === id
            ? { ...contact, full_name: data.full_name, whatsapp: data.whatsapp }
            : contact,
        ),
      )
      setEditingId(null)
      setNotice('Contact updated.')
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setSavingId(null)
    }
  }

  async function deleteContact(contact) {
    if (!window.confirm(`Remove ${contact.full_name} from the class list?`)) return

    setDeletingId(contact.id)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' })
      if (res.status === 401) {
        setAuthenticated(false)
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not remove the contact')

      setContacts((current) => current.filter((item) => item.id !== contact.id))
      setTotal((current) => Math.max(0, current - 1))
      setNotice(`${contact.full_name} was removed.`)
    } catch (err) {
      setError(err.message || 'Could not remove the contact')
    } finally {
      setDeletingId(null)
    }
  }

  async function exportAll() {
    setExporting(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/contacts/export')
      if (res.status === 401) {
        setAuthenticated(false)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Export failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'L100_Contacts.vcf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setNotice(`Exported ${total} contact${total === 1 ? '' : 's'}.`)
    } catch (err) {
      setError(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  /* ── Login screen ────────────────────────────────────────────────── */

  if (checking) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Checking your session…
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldAlert size={22} aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Admin access</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to view and export the class contact list.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="sr-only">
                Admin password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setLoginError('')
                }}
                placeholder="Password"
                autoComplete="current-password"
                autoFocus
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {loginError && (
              <p role="alert" className="text-center text-sm text-red-600">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loggingIn && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Sign in
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Dashboard ───────────────────────────────────────────────────── */

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="text-sm text-slate-500">
            Newest first · export includes every registered contact
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportAll}
            disabled={exporting || total === 0}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            ) : (
              <Download size={15} aria-hidden="true" />
            )}
            Export all ({total})
          </button>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="flex items-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Users size={16} aria-hidden="true" />
            <span className="text-xs font-medium">Registered</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Search size={16} aria-hidden="true" />
            <span className="text-xs font-medium">Showing</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{contacts.length}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <label htmlFor="contact-search" className="sr-only">
          Search contacts by name or number
        </label>
        <input
          id="contact-search"
          type="search"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search all contacts by name or number…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && contacts.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        ) : contacts.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            {query
              ? `No contacts match “${query}”.`
              : 'No contacts yet. Share the public form link.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <li key={contact.id} className="px-4 py-3.5 sm:px-5">
                {editingId === contact.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label htmlFor={`name-${contact.id}`} className="sr-only">
                      Full name
                    </label>
                    <input
                      id={`name-${contact.id}`}
                      value={editForm.full_name}
                      onChange={(event) =>
                        setEditForm((form) => ({ ...form, full_name: event.target.value }))
                      }
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      placeholder="Full name"
                      maxLength={100}
                    />

                    <label htmlFor={`phone-${contact.id}`} className="sr-only">
                      WhatsApp number
                    </label>
                    <input
                      id={`phone-${contact.id}`}
                      value={editForm.whatsapp}
                      onChange={(event) =>
                        setEditForm((form) => ({ ...form, whatsapp: event.target.value }))
                      }
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      placeholder="0244 123 456"
                      inputMode="tel"
                    />

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => saveEdit(contact.id)}
                        disabled={savingId === contact.id}
                        aria-label={`Save changes to ${contact.full_name}`}
                        className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {savingId === contact.id ? (
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Check size={16} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        aria-label="Cancel editing"
                        className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{contact.full_name}</p>
                      <p className="text-sm text-slate-500">
                        L100 · {contact.whatsapp}
                        <span className="ml-2 text-xs text-slate-400">
                          {new Date(contact.created_at).toLocaleDateString()}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(contact)}
                        aria-label={`Edit ${contact.full_name}`}
                        title="Edit"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteContact(contact)}
                        disabled={deletingId === contact.id}
                        aria-label={`Delete ${contact.full_name}`}
                        title="Delete"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === contact.id ? (
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 size={16} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {contacts.length > 0 && contacts.length < total && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => load({ offset: contacts.length, append: true })}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            Load more ({total - contacts.length} remaining)
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        Exports are generated on the server and include every contact in E.164 format.
      </p>
    </div>
  )
}
