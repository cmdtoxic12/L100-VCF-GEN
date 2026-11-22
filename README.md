# L100 Contacts

Professional contact collection form for College Level 100 students.  
React + Vite + Tailwind + Supabase · Admin dashboard · VCF export · Duplicate protection.

## Features

- **Duplicate protection**: Blocks registration if the same name *or* WhatsApp number already exists
- **Public Form**: Full Name · WhatsApp Number · Level locked to L100
- **Supabase storage**: All submissions saved to a `contacts` table
- **Admin Dashboard** (password protected):
  - View last 10 entries
  - Inline edit of name & number
  - Download `.vcf` (only admin can do this)
- VCF content: `Full Name` + `L100 · number`

---

## Deploy to Vercel (recommended)

### 1. Push to GitHub
```bash
cd l100-contacts
git init
git add .
git commit -m "L100 Contacts app"
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/l100-contacts.git
git push -u origin main
```

### 2. Import on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the GitHub repository
3. Framework Preset: **Vite** (auto-detected)
4. Add Environment Variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon public key |

5. Click **Deploy**

Your site will be live at `https://l100-contacts-xxx.vercel.app`

### 3. Admin route
After deploy, open: `https://your-app.vercel.app/admin`  
Default password: **`l100admin`** (change it in `src/pages/Admin.jsx`)

---

## Local development

```bash
npm install
cp .env.example .env
# edit .env with your Supabase keys
npm run dev
```

---

## Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:

```sql
create table contacts (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  whatsapp text not null,
  level text not null default 'L100',
  created_at timestamptz default now()
);

alter table contacts enable row level security;

create policy "Anyone can insert" on contacts for insert with check (true);
create policy "Anyone can read"   on contacts for select using (true);
create policy "Anyone can update" on contacts for update using (true);

-- Optional but recommended: unique constraints
create unique index contacts_whatsapp_unique on contacts (whatsapp);
create unique index contacts_fullname_unique on contacts (lower(full_name));
```

3. Copy **Project URL** and **anon public** key into `.env` / Vercel env vars

---

## Admin Password

Default: `l100admin`  
Change it in `src/pages/Admin.jsx` → `ADMIN_PASSWORD`

---

## Project structure

```
l100-contacts/
├── public-demo.html     ← instant demo (no build needed)
├── src/
│   ├── pages/
│   │   ├── Home.jsx     ← public form + duplicate check
│   │   └── Admin.jsx    ← dashboard + VCF download
│   ├── components/
│   │   └── Layout.jsx
│   └── lib/
│       ├── supabase.js
│       └── vcf.js
├── vercel.json          ← SPA routing for /admin
└── .env.example
```
