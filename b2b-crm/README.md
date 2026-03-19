# B2B CRM — Team Platform

A full-stack CRM platform for field directors, built for insurance teams running on the Biz to Biz acquisition model.

---

## What's included

- **3 role levels**: Agent, Director, Upline — each sees the right data
- **Lead pipeline** — track every lead from first contact to closed case
- **Recruit pipeline** — manage recruits from prospect through licensed agent
- **Team production** — log team AP, auto-calculate 25% override income
- **Referral partner tracker** — manage your $200-300 referral fee network
- **Weekly activity goals** — hold yourself and your team accountable
- **Director overview** — bird's-eye view of your whole team in one dashboard
- **Upline org view** — full visibility across all directors and agents

---

## Tech stack (all free)

| Layer | Tool | Cost |
|---|---|---|
| Frontend | React + Vite | Free |
| Database + Auth | Supabase | Free tier |
| Hosting | Vercel | Free |

---

## Setup — Step by step

### Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New project**, give it a name like `b2b-crm`
3. Choose a region close to you, set a database password, click **Create**
4. Wait ~2 minutes for it to spin up

### Step 2 — Run the database schema

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase_schema.sql` from this folder
4. Copy the entire contents and paste it into the SQL editor
5. Click **Run** — you should see "Success" for each statement
6. This creates all your tables, security rules, and auto-profile trigger

### Step 3 — Get your API keys

1. In Supabase, go to **Settings → API**
2. Copy your **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy your **anon public** key (long string starting with `eyJ...`)

### Step 4 — Set up environment variables

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and fill in your keys:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
   ```

### Step 5 — Run locally (optional, to test first)

```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 6 — Deploy to Vercel (your live website)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub (free)
2. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/b2b-crm.git
   git push -u origin main
   ```
3. In Vercel, click **Add New Project**, import your GitHub repo
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy** — Vercel gives you a live URL like `https://b2b-crm.vercel.app`

That's it. Your platform is live.

---

## How to invite your team

1. Share your Vercel URL with your agents and upline
2. They click **Sign up** and create an account, selecting their role
3. To link an agent to your director account:
   - Go to Supabase → **Table Editor → profiles**
   - Find the agent's row
   - Set their `director_id` to your profile's `id` (copy from your own row)
4. That agent's data now shows in your Director overview

> **Tip**: In a future update you can add an invite-by-email flow so agents auto-link to you on signup.

---

## Customizing the override rate

Open `src/components.jsx` and change:
```js
export const OVERRIDE_RATE = 0.25; // 25% override
export const PERSONAL_RATE = 0.75; // 75% personal contract
export const CASHFLOW_GOAL = 50000; // $50k acquisition goal
```

---

## File structure

```
b2b-crm/
├── src/
│   ├── App.jsx              # Root app, auth, routing, nav
│   ├── main.jsx             # React entry point
│   ├── supabase.js          # Supabase client
│   ├── components.jsx       # Shared UI components + constants
│   ├── LoginPage.jsx        # Sign in / sign up page
│   ├── LeadsTab.jsx         # Lead pipeline CRM
│   ├── RecruitsTab.jsx      # Recruit management
│   ├── TeamTab.jsx          # Team production + override tracker
│   ├── OtherTabs.jsx        # Partners tab + Goals tab
│   ├── DirectorOverview.jsx # Director bird's-eye dashboard
│   └── UplineView.jsx       # Upline org-wide view
├── supabase_schema.sql      # Run this in Supabase SQL Editor
├── index.html
├── vite.config.js
├── package.json
├── .env.example             # Copy to .env and fill in your keys
└── README.md
```

---

## Questions?

This platform was built around your specific setup:
- 75% personal contract rate
- 25% override on team production
- $50k cashflow acquisition goal
- IUL, Term, and Annuity products
- Referral fee of $250/conversion

Everything is customizable in `src/components.jsx`.
