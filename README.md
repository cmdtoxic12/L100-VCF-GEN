# L100 Contacts

Contact collection for College Level 100 students.
**React + Vite + Tailwind + Neon (Postgres) + Vercel API routes**

## Features

- **Public form** – full name + Ghana WhatsApp number; level is fixed to `L100`.
- **Phone normalisation** – `0244 123 456`, `0244-123-456`, `+233 24 412 3456`,
  `233244123456` and `00233244123456` all become `0244123456`; exports use E.164.
- **Duplicate protection** – one row per phone number, enforced by a unique index
  (no check-then-insert race). Two classmates may share a name; the form warns instead.
- **Server-side admin auth** – HMAC-signed, HttpOnly, SameSite=Strict session cookie.
  The password never ships to the browser.
- **Admin dashboard** – paginated list (25/page), server-side search, inline edit,
  delete, and a one-click VCF export of **every** contact.
- **Spam controls** – hidden honeypot field, in-memory rate limiting, input length and
  format checks, and generic error messages (no database internals leaked).
- **Accessible UI** – labelled inputs, `role="alert"`/`role="status"` feedback,
  keyboard-friendly controls.

---

## Neon setup (one-time)

1. Create a free project at [neon.tech](https://neon.tech).
2. Open **SQL Editor** and run [`db/schema.sql`](db/schema.sql). It creates the table,
   the phone unique index, length/format checks, and the legacy migration notes.
3. Copy the connection string:
   Neon Console → Project → Connection Details → `postgresql://...?sslmode=require`

> Upgrading an old database? Follow the migration block at the bottom of
> `db/schema.sql` (fills `created_at`, drops the old unique-name index, normalises
> legacy numbers, then adds the format check).

---

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables, and in `.env` locally.
They are server-side only — **never** prefix them with `VITE_`.

| Name | Required | Purpose |
|------|----------|---------|
| `DATABASE_URL` | yes | Neon/Postgres connection string |
| `ADMIN_PASSWORD` | yes | Admin dashboard password (use a long passphrase) |
| `ADMIN_SECRET` | yes | Signs the session cookie; 32+ random bytes |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

If `ADMIN_PASSWORD` or `ADMIN_SECRET` is missing, `/api/admin/login` returns
`503` and the admin dashboard stays locked.

---

## Deploy to Vercel

1. Push the repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo → framework **Vite**.
3. Add the three environment variables above.
4. Deploy.

- Form: `https://your-app.vercel.app`
- Admin: `https://your-app.vercel.app/admin` — sign in with `ADMIN_PASSWORD`.

---

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, ADMIN_PASSWORD, ADMIN_SECRET

# Full stack (API + frontend)
npx vercel dev

# Frontend only (API calls fail until you use vercel dev)
npm run dev
```

API routes live in `/api` and only run under `vercel dev` or on Vercel.

### Checks

```bash
npm run lint     # oxlint
npm test         # vitest (phone + vCard unit tests)
npm run build    # production bundle
```

---

## API

All admin endpoints require the `l100_admin` session cookie and return `401` otherwise.
Every response is `Cache-Control: no-store`.

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/contacts` | public | Register a contact. Body: `{ full_name, whatsapp, website? }` (website is the honeypot). Returns `201` with the row and `nameWarning`. `409` on a duplicate number, `429` when rate-limited. |
| `GET` | `/api/contacts?limit=&offset=&q=` | admin | Paginated list. Response: `{ rows, total, limit, offset }`; `q` searches name and phone. |
| `PUT` | `/api/contacts/:id` | admin | Update name/number. UUID validated; `409` on duplicate number. |
| `DELETE` | `/api/contacts/:id` | admin | Remove a contact. |
| `GET` | `/api/contacts/export` | admin | Download all contacts as `L100_Contacts.vcf` (`text/vcard`), generated server-side, phones in E.164. |
| `GET` | `/api/admin/login` | public | Session probe: `{ authenticated, configured }`. |
| `POST` | `/api/admin/login` | public | Sign in. Body `{ password }`. Sets the HttpOnly cookie (8-hour session). `429` after 10 attempts / 5 min. |
| `DELETE` | `/api/admin/login` | public | Sign out; clears the cookie. |

---

## Project structure

```
L100-VCF-GEN/
├── api/
│   ├── _auth.js            ← HMAC cookie sessions + requireAdmin
│   ├── _db.js              ← cached Neon client
│   ├── _http.js            ← body parsing, sanitising, generic errors
│   ├── _phone.js           ← normalisePhone / toE164 / formatPhone
│   ├── _rate-limit.js      ← in-memory fixed-window limiter
│   ├── _vcf.js             ← escaped vCard 3.0 builder
│   ├── admin/login.js      ← probe / sign in / sign out
│   ├── contacts.js         ← public POST + admin paginated GET
│   └── contacts/
│       ├── [id].js         ← admin PUT / DELETE
│       └── export.js       ← admin full VCF download
├── db/schema.sql           ← canonical schema + migration notes
├── src/pages/              ← Home.jsx (public form), Admin.jsx (dashboard)
├── tests/                  ← phone + vCard unit tests
└── .env.example
```

---

## Security notes

- The session cookie is `HttpOnly`, `SameSite=Strict`, `Secure` on Vercel/production,
  and expires after 8 hours. Changing `ADMIN_SECRET` invalidates all sessions.
- The rate limiter is in-memory, so it is a speed bump rather than a hard guarantee on
  serverless. Put Vercel Firewall or Upstash/Redis in front if you expect abuse.
- Only the phone number is unique. If two people share a name, the API stores both and
  the public form shows a warning; an admin can remove duplicates.
- `/admin` and `/api/` are disallowed in `public/robots.txt` (politeness, not security).
