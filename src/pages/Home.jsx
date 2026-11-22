import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Phone,
  User,
} from 'lucide-react'

export default function Home() {
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('') // honeypot — humans never see it
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [nameWarning, setNameWarning] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const name = fullName.trim()
    const phone = whatsapp.trim()
    if (!name || !phone) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, whatsapp: phone, website }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Could not save your contact.')
      }

      setNameWarning(Boolean(data.nameWarning))
      setStatus('success')
      setFullName('')
      setWhatsapp('')
      setWebsite('')
    } catch (err) {
      console.error(err)
      setStatus('error')
      setErrorMsg(err.message || 'Could not save. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Submitted!</h2>
          <p className="mt-2 text-slate-600" role="status">
            Your contact has been recorded.
          </p>

          {nameWarning && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              A classmate with the same name is already on the list. If that is you,
              ask an admin to remove the duplicate — otherwise, adding a middle name
              next time will help tell you apart.
            </p>
          )}

          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <GraduationCap size={28} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          L100 Contact Form
        </h1>
        <p className="mt-2 text-slate-500">
          Register your details so your classmates and class leaders can reach you.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="full-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="full-name"
                name="full_name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g. Ama Serwaa Mensah"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="whatsapp"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="e.g. 0244 123 456"
                required
                inputMode="tel"
                autoComplete="tel"
                aria-describedby="whatsapp-hint"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <p id="whatsapp-hint" className="mt-1.5 text-xs text-slate-400">
              The number linked to your WhatsApp. 0244 123 456, +233 24 412 3456 and
              0244-123-456 are all accepted.
            </p>
          </div>

          <div>
            <label
              htmlFor="level"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Level
            </label>
            <div className="relative">
              <GraduationCap
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="level"
                type="text"
                value="L100"
                readOnly
                disabled
                aria-describedby="level-hint"
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3 pl-10 pr-4 text-sm font-medium text-slate-600"
              />
            </div>
            <p id="level-hint" className="mt-1.5 text-xs text-slate-400">
              Level is fixed for this form.
            </p>
          </div>

          {/* Honeypot: hidden from people, irresistible to bots. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {status === 'error' && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking…
              </>
            ) : (
              'Submit Contact'
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        Your name and WhatsApp number are used only for the L100 class contact list.
        Class admins can view and export the list; ask an admin to remove your entry
        at any time.
      </p>
    </div>
  )
}
