# CuSOC Event Booking System

A full-stack single-event ticket booking system built with React (Vite) + Node.js/Express + Supabase.

---

## 🏗️ Project Structure

```
good morning 2/
├── .gitignore
├── README.md
├── supabase/
│   └── schema.sql          ← Run once in Supabase SQL Editor
├── backend/                ← Node.js / Express API
│   ├── .env.example
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── server.js
└── frontend/               ← React / Vite app
    ├── .env.example
    └── src/
```

---

## ⚡ Quick Start (Local Development)

### 1 — Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. In SQL Editor, run the full `supabase/schema.sql` file
3. Get your keys from **Settings → API**:
   - Project URL → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_KEY` (starts with `eyJ...`)
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`

### 2 — Backend
```bash
cd backend
copy .env.example .env      # Windows
# fill in .env with your actual credentials
npm install
npm run dev                 # → http://localhost:5000
```

### 3 — Frontend
```bash
cd frontend
copy .env.example .env      # Windows
# fill in .env
npm install
npm run dev                 # → http://localhost:5173
```

---

## 🌍 Deployment Guide

### Part 1 — Push to GitHub

```bash
# 1. Open terminal in the project root ("good morning 2" folder)
git init
git add .
git commit -m "Initial commit: CuSOC Event Booking System"

# 2. Create a new repository on github.com (do NOT add README/gitignore there)
# 3. Copy the remote URL from GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

> ⚠️ Your `.env` files are in `.gitignore` — they will NOT be pushed. Good!  
> Only `.env.example` files are pushed as templates.

---

### Part 2 — Deploy Backend on Render (free)

Render is the easiest free host for Express.js backends.

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `cusoc-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free |

5. Click **Advanced → Add Environment Variables** and add ALL your backend `.env` values:

```
SUPABASE_URL          = https://xxxx.supabase.co
SUPABASE_SERVICE_KEY  = eyJhbGciOiJIUzI1NiIsInR5c...  (full JWT)
EMAIL_HOST            = smtp.gmail.com
EMAIL_PORT            = 587
EMAIL_USER            = your@gmail.com
EMAIL_PASS            = your-gmail-app-password
EMAIL_FROM            = your@gmail.com
PORT                  = 5000
FRONTEND_URL          = https://YOUR-FRONTEND.vercel.app   ← fill after Vercel deploy
ALLOWED_EMAIL_DOMAIN  = cuchd.in
OTP_EXPIRY_MINUTES    = 10
ADMIN_SECRET_KEY      = cusoc@admin2026
```

6. Click **Create Web Service**
7. Wait ~2 min. Your backend URL will be: `https://cusoc-backend.onrender.com`

> ⚠️ **Free tier sleeps after 15 min of inactivity** — first request after sleep takes ~30s.  
> To avoid this, upgrade to the $7/month plan or use Railway instead.

---

### Part 3 — Deploy Frontend on Vercel (free)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **New Project**
3. Import your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Under **Environment Variables**, add:

```
VITE_API_BASE_URL         = https://cusoc-backend.onrender.com
VITE_SUPABASE_URL         = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY    = eyJhbGciOiJIUzI1NiIsInR5c...  (anon key)
VITE_ALLOWED_EMAIL_DOMAIN = cuchd.in
```

6. Click **Deploy**
7. Your frontend URL will be: `https://cusoc-event.vercel.app` (or similar)

---

### Part 4 — Connect Frontend ↔ Backend

After both are deployed:

1. **Go to Render dashboard** → Your backend service → **Environment**
2. Update `FRONTEND_URL` to your actual Vercel URL:
   ```
   FRONTEND_URL = https://cusoc-event.vercel.app
   ```
3. **Redeploy** the backend (Render → Manual Deploy)

---

### Part 5 — Access Admin Panel (Production)

Visit: `https://cusoc-event.vercel.app/admin/login`  
Password: whatever you set in `ADMIN_SECRET_KEY`

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Example | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | `https://abc.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | Service role key (secret, never expose) |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP host |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | `you@gmail.com` | Gmail address |
| `EMAIL_PASS` | `xxxx xxxx xxxx xxxx` | Gmail App Password |
| `EMAIL_FROM` | `you@gmail.com` | From address in emails |
| `PORT` | `5000` | Server port |
| `FRONTEND_URL` | `http://localhost:5173` | For CORS (update to Vercel URL in prod) |
| `ALLOWED_EMAIL_DOMAIN` | `cuchd.in` | Only emails from this domain can register |
| `OTP_EXPIRY_MINUTES` | `10` | OTP validity period |
| `ADMIN_SECRET_KEY` | `cusoc@admin2026` | Admin panel password |

### Frontend (`frontend/.env`)
| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000` | Backend URL |
| `VITE_SUPABASE_URL` | `https://abc.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Anon/public key (safe to expose) |
| `VITE_ALLOWED_EMAIL_DOMAIN` | `cuchd.in` | For client-side email validation |

---

## 🗄️ Database (Supabase)

Run `supabase/schema.sql` **once** in your Supabase SQL Editor.

### Useful maintenance queries
```sql
-- Fix drifted seat count (if something goes wrong):
SELECT sync_booked_seats();

-- Check current event status:
SELECT title, total_seats, booked_seats FROM event;

-- Check registrations:
SELECT name, email, course, created_at FROM registrations ORDER BY created_at DESC;
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/event` | None | Get event details |
| `POST` | `/send-otp` | None | Send OTP to email |
| `POST` | `/verify-otp` | None | Verify OTP |
| `POST` | `/register` | None | Register for event |
| `GET` | `/health` | None | Health check |
| `POST` | `/admin/login` | None | Admin login |
| `GET` | `/admin/stats` | Admin | Registration stats |
| `GET` | `/admin/registrations` | Admin | List all registrations |
| `DELETE` | `/admin/registrations/:id` | Admin | Delete a registration |
| `GET` | `/admin/event` | Admin | Get event details |
| `PUT` | `/admin/event` | Admin | Update event details |

---

## 🛠️ Common Issues

| Problem | Fix |
|---------|-----|
| "Event Full" with 0 registrations | Run `SELECT sync_booked_seats();` in Supabase |
| Backend crashes on start | Check `.env` file has all variables filled in |
| OTP not received | Check Gmail App Password (not regular password) |
| CORS error on frontend | Set `FRONTEND_URL` in backend `.env` to your actual frontend URL |
| "fetch failed" in backend logs | Supabase URL or service key is wrong; check `SUPABASE_SERVICE_KEY` is the full `eyJ...` JWT |

---

## ✉️ Setting Up Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → **2-Step Verification** → Enable it
3. Security → **App passwords**
4. Select app: **Mail**, device: **Other** → type "CuSOC Backend"
5. Copy the 16-character password → use as `EMAIL_PASS`

---

*Built with ❤️ by Praveen Kumar — CuSOC, Chandigarh University*
