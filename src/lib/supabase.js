import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// SETUP: Replace these with your own Supabase project values
// 1. Go to https://supabase.com → New Project
// 2. Project Settings → API → copy URL and anon public key
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Table SQL (run this once in Supabase SQL Editor):
/*
create table contacts (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  whatsapp text not null,
  level text not null default 'L100',
  created_at timestamptz default now()
);

-- Optional: enable RLS and allow public insert + authenticated read
alter table contacts enable row level security;

create policy "Anyone can insert"
  on contacts for insert
  with check (true);

create policy "Anyone can read"
  on contacts for select
  using (true);

create policy "Anyone can update"
  on contacts for update
  using (true);
*/
