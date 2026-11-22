import { useState } from 'react'
import { User, Phone, GraduationCap, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const normalizePhone = (phone) =>
    phone.trim().replace(/\s+/g, '').replace(/^\+233/, '0')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = fullName.trim()
    const phone = normalizePhone(whatsapp)

    if (!name || !phone) return

    setStatus('loading')
    setErrorMsg('')

    try {
      // ── Duplicate check: phone (exact) and name (case-insensitive) ──
      const [phoneRes, nameRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, full_name, whatsapp')
          .eq('whatsapp', phone)
          .limit(1),
        supabase
          .from('contacts')
          .select('id, full_name, whatsapp')
          .ilike('full_name', name)
          .limit(1),
      ])

      if (phoneRes.error) throw phoneRes.error
      if (nameRes.error) throw nameRes.error

      const phoneMatch = phoneRes.data?.[0]
      const nameMatch = nameRes.data?.[0]

      if (phoneMatch && nameMatch && phoneMatch.id === nameMatch.id) {
        throw new Error('This name and number are already registered.')
      }
      if (phoneMatch) {
        throw new Error(
          `This WhatsApp number is already registered under "${phoneMatch.full_name}".`
        )
      }
      if (nameMatch) {
        throw new Error(
          `The name "${name}" is already registered with a different number.`
        )
      }

      // ── Insert ──
      const { error } = await supabase.from('contacts').insert({
        full_name: name,
        whatsapp: phone,
        level: 'L100',
      })

      if (error) throw error

      setStatus('success')
      setFullName('')
      setWhatsapp('')
    } catch (err) {
      console.error(err)
      setStatus('error')
      setErrorMsg(err.message || 'Could not save. Check Supabase setup.')
    }
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Submitted!</h2>
          <p className="mt-2 text-slate-600">
            Your contact has been recorded successfully.
          </p>
          <button
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
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <GraduationCap size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          L100 Contact Form
        </h1>
        <p className="mt-2 text-slate-500">
          Register your details so your classmates and class leaders can reach you easily.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ama Serwaa Mensah"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. 0244123456"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Use the number linked to your WhatsApp
            </p>
          </div>

          {/* Level (locked) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Level
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value="L100"
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3 pl-10 pr-4 text-sm font-medium text-slate-600"
              />
            </div>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking…
              </>
            ) : (
              'Submit Contact'
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Your details are only visible to authorised class administrators.
      </p>
    </div>
  )
}
