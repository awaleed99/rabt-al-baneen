# Rabt Al-Baneen — Boys Management & Tracking System

A production-ready, full-stack web application for managing and tracking a group of boys. Built with Next.js 15, Supabase, TypeScript, and Tailwind CSS.

---

## Features

- 🔐 **Secure Authentication** — Email/password login via Supabase Auth
- 👥 **Role-Based Access Control** — Admin and User roles enforced server-side and at DB level
- 📋 **Boys Management** — Full CRUD: create, view, edit, delete boy profiles
- 🖼️ **Profile Images** — Upload and display photos via Supabase Storage
- 📅 **Visit Tracking** — Record check-ins/visits with date, time, and notes
- 📜 **Historical Records** — All visits are preserved; history is never overwritten
- ⚡ **Real-Time Updates** — Supabase Realtime subscriptions keep all users in sync instantly
- 📊 **Dashboard** — Live stats calculated from real DB records
- 🌙 **Dark/Light Mode** — System default with manual toggle
- 📱 **Fully Responsive** — Works beautifully on mobile, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI | Custom components + shadcn/ui patterns |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Hosting | Vercel |

---

## Prerequisites

- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com) account (free tier is sufficient)
- A [Vercel](https://vercel.com) account (for deployment)

---

## Local Setup

### 1. Clone and Install

```bash
cd rabt-al-baneen
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a name, region, and strong database password
3. Wait for the project to be ready (~1 minute)

### 3. Run the Database Migration

1. In your Supabase Dashboard, go to **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy the entire content and paste it into the SQL Editor
4. Click **Run** — this creates all tables, RLS policies, triggers, and the storage bucket

### 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```env
# From Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Your local URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Days without a visit before a boy is flagged as "overdue" (default: 30)
NEXT_PUBLIC_OVERDUE_DAYS=30
```

> ⚠️ **Never commit `.env.local` to git.** The `SUPABASE_SERVICE_ROLE_KEY` is a secret and must never be exposed to the browser.

### 5. Create Your First Admin Account

1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Sign up using Supabase Dashboard → Authentication → Users → Invite User (or create manually)
4. After the user signs up, run this SQL in Supabase SQL Editor to promote them to admin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Storage Setup

The SQL migration creates the `boy-images` bucket automatically. If you need to create it manually:

1. Supabase Dashboard → Storage → New bucket
2. Name: `boy-images`
3. Public: **Yes** (images are served via public URLs)
4. File size limit: `5242880` (5 MB)
5. Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`

---

## Deployment on Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/rabt-al-baneen
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)

### 3. Configure Environment Variables on Vercel

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_OVERDUE_DAYS` | `30` |

> ✅ Set `SUPABASE_SERVICE_ROLE_KEY` as **Server-only** (not exposed to browser).

### 4. Deploy

Click **Deploy**. Vercel will build and deploy the app.

### 5. Update Supabase Auth Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/**`

---

## Project Structure

```
rabt-al-baneen/
├── app/
│   ├── (auth)/login/           ← Login page
│   ├── (dashboard)/            ← Protected routes
│   │   ├── layout.tsx          ← Dashboard layout with sidebar
│   │   ├── page.tsx            ← Dashboard
│   │   ├── boys/               ← Boys list, add, profile, edit
│   │   ├── admin/              ← Admin panel (admin only)
│   │   └── settings/           ← User settings
│   ├── api/admin/              ← Server API routes (create/delete user)
│   └── globals.css             ← Design system CSS
├── components/
│   ├── boys/                   ← BoyCard, BoyForm, CheckInModal, etc.
│   ├── dashboard/              ← Stat cards, activity feed
│   ├── admin/                  ← User management table
│   ├── layout/                 ← Sidebar, ThemeProvider, Settings
│   └── ui/                     ← Button, Input, Avatar, Badge, etc.
├── lib/
│   ├── actions/                ← Server Actions (auth, boys, check-ins, users)
│   ├── supabase/               ← Client, server, middleware helpers
│   ├── types/                  ← TypeScript interfaces
│   └── utils/                  ← Date formatting, class helpers
├── middleware.ts                ← Route protection
└── supabase/migrations/        ← SQL migration files
```

---

## User Roles

| Feature | Admin | User |
|---|---|---|
| View boys | ✅ | ✅ |
| Add/edit/delete boys | ✅ | ❌ |
| Upload profile images | ✅ | ❌ |
| Record check-ins | ✅ | ✅ |
| Delete check-ins | ✅ | ❌ |
| View visit history | ✅ | ✅ |
| Manage users | ✅ | ❌ |
| Access Admin Panel | ✅ | ❌ |

---

## Security

- **Authentication**: JWT tokens stored in HTTP-only cookies via Supabase SSR
- **Authorization**: Every Server Action and API route re-verifies the session and role
- **Row Level Security**: DB-level policies prevent unauthorized data access even if the API is bypassed
- **Service Role Key**: Only used in server-side API routes — never exposed to the browser
- **Image Validation**: Server validates file type (allowlist) and size (max 5 MB)
- **Input Validation**: All form inputs are sanitized server-side
- **Destructive Actions**: Require confirmation dialogs
- **Self-Protection**: Admins cannot delete or deactivate their own accounts

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | App URL (used in API calls, e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_OVERDUE_DAYS` | ❌ | Days threshold for "overdue" flag (default: 30) |

---

## Troubleshooting

### "Invalid login credentials"
- Make sure the user exists in Supabase Auth (Dashboard → Authentication → Users)
- Confirm their email is verified
- Try resetting the password from Supabase Dashboard

### Images not loading
- Check that the `boy-images` storage bucket is set to **public**
- Verify the storage policies were created by the migration SQL

### "Account inactive" on login
- An admin must activate the account in the Admin Panel

### Admin Panel not accessible
- Make sure your profile has `role = 'admin'` in the `profiles` table
- Run: `UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';`

### Real-time not working
- Enable Realtime for the `boys` and `check_ins` tables in Supabase Dashboard → Database → Replication

---

## License

MIT
