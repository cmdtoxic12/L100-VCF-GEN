# Level 100 VCF Contact Registry

A responsive contact registration site with a protected admin area, Neon PostgreSQL storage, and administrator-only VCF export. Built with React, Vite, Tailwind CSS v4, and Vercel serverless API functions.


## Features
- Public form: full name, Ghana WhatsApp number, locked Level 100 field.
- Ghana phone normalization: `0535679394`, `535679394`, and `+233535679394` are normalized to `+233535679394`.
- Name and phone duplicate detection (application checks plus database unique constraints).
- Registration capacity enforced server-side at 350 contacts. Registrations are serialized with a PostgreSQL advisory lock so concurrent requests cannot exceed the cap.
- Admin login with signed 8-hour HttpOnly cookie; admin APIs require authentication.
- Admin dashboard: current total, capacity progress, latest 10 contacts, search among those 10, edit, delete, periodic refresh every 5 seconds, and VCF download of all contacts.
- Login and submission rate limiting backed by PostgreSQL.
- VCF 3.0 output names contacts `Full Name L100`.

## Requirements
- Node.js 20+
- Neon PostgreSQL database
- Vercel account


## Local setup
1. Create a Neon project and copy its pooled or serverless connection string. Keep it private.
2. In Neon SQL Editor, execute all of `schema.sql`.
3. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD` (use a long, unique password; preferably 24+ characters)
   - `SESSION_SECRET` (32+ random characters)
   - `COOKIE_SECURE=0` for local HTTP development only. Use `1` on deployed HTTPS.
4. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
5. Open `http://localhost:5173`. Admin is at `/admin`.

> Vite's local dev server only serves the frontend. To test API routes locally, run with Vercel CLI (`npm i -g vercel`, `vercel dev`) after creating the local environment file. Vercel CLI serves the serverless functions and frontend together.


## Deploy to Vercel
1. Push the project to a GitHub repository.
2. In Vercel, import the repository.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Add these Environment Variables in Project Settings → Environment Variables:
   ```
   DATABASE_URL=your_neon_connection_string
   ADMIN_USERNAME=your_admin_login
   ADMIN_PASSWORD=your_unique_long_password
   SESSION_SECRET=your_random_32_plus_character_secret
   COOKIE_SECURE=1
   ```
5. Redeploy after adding variables.
6. Run `schema.sql` in the Neon SQL editor before testing registration.
7. Visit `/admin`, sign in, and verify the contact list and export.


## API routes
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/submit` | Public, rate-limited | Create a Level 100 contact |
| POST | `/api/admin/login` | Public, rate-limited | Authenticate administrator |
| GET | `/api/admin/session` | Public | Check whether current session is authenticated |
| DELETE | `/api/admin/session` | Session cookie | Sign out |
| GET | `/api/admin/contacts` | Admin | Latest 10 contacts and total count |
| PATCH | `/api/admin/contact/:id` | Admin | Edit contact |
| DELETE | `/api/admin/contact/:id` | Admin | Delete contact |
| GET | `/api/admin/export` | Admin | Download all contacts as VCF |

## Phone normalization rules
The server strips formatting and accepts a Ghana number with a local leading zero, the nine-digit national number, or the `233` country prefix. It validates that the resulting national portion is nine digits and stores it in `+233XXXXXXXXX` form. The front-end prefix is display-only; the server independently normalizes the submitted value.

## Contact VCF naming
Stored `full_name` is kept as submitted, normalized `phone` is international, `level` is `Level 100`, and `vcf_name` is `Full name L100`. The export uses `FN` and `N` fields to create the displayed contact name.

## Security notes
- Never commit `.env`, secrets, or database credentials.
- Rotate the admin password and session secret if they are ever shared.
- Use HTTPS in production (`COOKIE_SECURE=1`).
- Keep Neon credentials in Vercel Environment Variables; never put them in `src/` or expose them as `VITE_` variables.
- The public submission API intentionally returns no contact-list data.
- Rate limiting is database-backed; do not remove it without replacing it with a robust edge/API rate limiter.
- This project is a starter implementation. Before public production use, consider adding a CAPTCHA/Turnstile, monitoring/alerting, backups, and review the security configuration.

