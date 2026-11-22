# L100 Contacts

Professional contact collection for College Level 100 students.  
**React + Vite + Tailwind + Neon (Postgres) + Vercel API routes**

## Features

- **Duplicate protection** – blocks same name *or* WhatsApp number
- **Public form** – Full Name · WhatsApp · Level locked to L100
- **Neon Postgres** – data stored securely (connection string never exposed to browser)
- **Admin dashboard** (password) – last 10 entries · inline edit · VCF download only for admin
- VCF content: Full Name + `L100 · number`

---

## Neon setup (one-time)

1. Create a free project at [neon.tech](https://neon.tech)
2. Open **SQL Editor** and run:

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'L100',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX contacts_whatsapp_unique ON contacts (whatsapp);
CREATE UNIQUE INDEX contacts_fullname_unique ON contacts (lower(full_name));
```

3. Copy the **connection string**  
   Neon Console → Project → Connection Details →  
   `postgresql://...@ep-xxx...neon.tech/neondb?sslmode=require`

---

## Deploy to Vercel

### 1. Push to GitHub
```bash
cd l100-contacts
git init
git add .
git commit -m "L100 Contacts with Neon"
git remote add origin https://github.com/YOUR_USERNAME/l100-contacts.git
git branch -M main
git push -u origin main
```

### 2. Import on Vercel
1. [vercel.com/new](https://vercel.com/new) → Import repo
2. Framework: **Vite**
3. **Environment Variable** (server-side only):

| Name | Value |
|------|-------|
| `DATABASE_URL` | your Neon connection string |

4. Deploy

### 3. Open the app
- Form: `https://your-app.vercel.app`
- Admin: `https://your-app.vercel.app/admin`  
  Password: **`l100admin`** (change in `src/pages/Admin.jsx`)

---

## Local development

```bash
npm install
cp .env.example .env
# put DATABASE_URL in .env

# Option A – full stack (API + frontend)
npx vercel dev

# Option B – frontend only (API calls will fail until you use vercel dev)
npm run dev
```

> API routes live in `/api` and only run under `vercel dev` or on Vercel.

---

## Project structure

```
l100-contacts/
├── api/
│   ├── _db.js              ← Neon connection helper
│   ├── contacts.js         ← GET list + POST create (+ duplicate check)
│   └── contacts/[id].js    ← PUT update
├── src/
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── Admin.jsx
│   └── lib/vcf.js
├── vercel.json
└── .env.example            ← DATABASE_URL only
```

## Admin password

Default: `l100admin`  
Edit: `src/pages/Admin.jsx` → `ADMIN_PASSWORD`
