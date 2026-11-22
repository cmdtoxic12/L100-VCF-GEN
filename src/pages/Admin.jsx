import { useState, useEffect, useCallback } from 'react'
import {
  Download,
  RefreshCw,
  Pencil,
  X,
  Check,
  Loader2,
  Users,
  ShieldAlert,
  Search,
} from 'lucide-react'
import { downloadVCF } from '../lib/vcf'

// Simple password gate (change this!)
const ADMIN_PASSWORD = 'l100admin'

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ full_name: '', whatsapp: '' })
  const [search, setSearch] = useState('')

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load contacts')
      setContacts(data || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated) fetchContacts()
  }, [authenticated, fetchContacts])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setPassword('')
      setError('')
    } else {
      setError('Incorrect password')
    }
  }

  const startEdit = (contact) => {
    setEditingId(contact.id)
    setEditForm({ full_name: contact.full_name, whatsapp: contact.whatsapp })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ full_name: '', whatsapp: '' })
  }

  const saveEdit = async (id) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editForm.full_name.trim(),
          whatsapp: editForm.whatsapp.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setEditingId(null)
      fetchContacts()
    } catch (err) {
      alert('Update failed: ' + err.message)
    }
  }

  const handleDownload = () => {
    if (contacts.length === 0) return
    downloadVCF(contacts, `L100_Contacts_${contacts.length}.vcf`)
  }

  const filtered = contacts.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsapp.includes(search)
  )

  // ── Login Screen ──
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldAlert size={22} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Admin Access</h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter the admin password to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              autoFocus
            />
            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Dashboard ──
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">
            Last 10 entries · Only you can download VCF
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchContacts}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleDownload}
            disabled={contacts.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <Download size={15} />
            Download VCF
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Users size={16} />
            <span className="text-xs font-medium">Showing</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {contacts.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Download size={16} />
            <span className="text-xs font-medium">Export ready</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-indigo-600">
            {contacts.length > 0 ? 'Yes' : '—'}
          </p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or number…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && contacts.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            No contacts yet. Share the public form link.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <li key={c.id} className="px-4 py-3.5 sm:px-5">
                {editingId === c.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      value={editForm.full_name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      placeholder="Full name"
                    />
                    <input
                      value={editForm.whatsapp}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, whatsapp: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      placeholder="WhatsApp"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => saveEdit(c.id)}
                        className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {c.full_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        L100 · {c.whatsapp}
                      </p>
                    </div>
                    <button
                      onClick={() => startEdit(c)}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        VCF export includes Full Name + L100 + number for each contact.
      </p>
    </div>
  )
}
