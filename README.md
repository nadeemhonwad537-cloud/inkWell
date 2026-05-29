# 🖊 Inkwell — A Journal
### Full-Stack Blogging Platform

A complete blogging platform with React frontend, Node.js/Express backend, and SQLite database.  
Matches the Inkwell design exactly: Cormorant Garamond typography, rust accents, editorial layout.

---

## 📁 Project Structure

```
inkwell/
├── package.json              ← Root scripts (run both servers)
├── .gitignore
│
├── backend/                  ← Node.js + Express API
│   ├── server.js             ← Entry point (port 5000)
│   ├── package.json
│   ├── .env                  ← Environment variables
│   ├── db/
│   │   └── database.js       ← SQLite setup + seed data
│   ├── middleware/
│   │   └── auth.js           ← JWT auth middleware
│   └── routes/
│       ├── auth.js           ← /api/auth/*
│       ├── posts.js          ← /api/posts/*
│       ├── comments.js       ← /api/comments/*
│       └── admin.js          ← /api/admin/*
│
└── frontend/                 ← React app (port 3000)
    ├── package.json
    ├── .env                  ← API URL + Anthropic key
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js          ← React entry point
        ├── index.css         ← Global styles (Inkwell design)
        ├── App.js            ← Router + providers
        ├── api.js            ← Axios API service
        ├── context/
        │   ├── AuthContext.js   ← User auth state
        │   └── ToastContext.js  ← Toast notifications
        ├── components/
        │   ├── Navbar.js     ← Top navigation
        │   ├── PostCard.js   ← Essay card
        │   └── Footer.js     ← Site footer
        └── pages/
            ├── Home.js       ← Homepage with hero + grid
            ├── Categories.js ← Browse by category
            ├── PostDetail.js ← Full article + comments
            ├── Editor.js     ← Write / edit essay + AI
            ├── SignIn.js     ← Login page
            ├── SignUp.js     ← Register page
            └── Admin.js      ← Admin dashboard
```

---

## ✅ Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Check |
|------|---------|-------|
| Node.js | v18 or higher | `node -v` |
| npm | v9 or higher | `npm -v` |
| VS Code | Latest | — |

**Install Node.js:** https://nodejs.org (choose LTS)

---

## 🚀 Setup — Step by Step

### Step 1 — Open the project in VS Code

```bash
# Open VS Code terminal: Ctrl+` (backtick)
cd path/to/inkwell
```

---

### Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

This installs: `express`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `nodemon`

---

### Step 3 — Install frontend dependencies

```bash
cd ../frontend
npm install
```

This installs: `react`, `react-router-dom`, `axios`, and all React tooling.

---

### Step 4 — Configure environment files

**Backend** — `backend/.env` (already created):
```
PORT=5000
JWT_SECRET=inkwell-super-secret-key-change-this-in-production
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend** — `frontend/.env` (edit this):
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

> 💡 Get your Anthropic API key at: https://console.anthropic.com  
> The AI Polish feature won't work without it (everything else will).

---

### Step 5 — Start the backend server

Open **Terminal 1** in VS Code:

```bash
cd backend
npm run dev
```

You should see:
```
✓ Database seeded with sample data
🖊  Inkwell API running at http://localhost:5000
   Health: http://localhost:5000/api/health
```

---

### Step 6 — Start the frontend

Open **Terminal 2** in VS Code (`Ctrl+Shift+5` to split terminal):

```bash
cd frontend
npm start
```

Your browser will open at **http://localhost:3000** automatically.

---

### Step 7 — Log in as Admin

Use these demo credentials on the Sign In page:

```
Email:    admin@inkwell.pub
Password: admin123
```

This gives you full admin access to the control panel.

---

## 🎯 Features Walkthrough

### For Readers (no account needed)
- Browse all published essays on the homepage
- Filter by category (Technology, Design, Culture, etc.)
- Search essays by title, excerpt, or body
- Read full articles

### For Subscribers (sign up required)
- Like / unlike essays
- Post comments / responses
- Write and publish your own essays
- Save drafts

### For Writers
- Rich essay editor with title, category, excerpt, body
- Save as draft or publish immediately
- Edit your own published essays
- AI Polish button — sends your draft to Claude AI for editorial feedback

### For Admins (admin@inkwell.pub)
- **Admin Panel** → `/admin`
- Stats dashboard (total posts, likes, comments, users)
- **Posts tab**: publish/unpublish/delete any essay
- **Comments tab**: approve, reject, or delete any comment
- **Users tab**: change user roles (reader/writer/admin), delete users

---

## 🗄️ Database

SQLite database is auto-created at `backend/inkwell.db` on first run.

**Tables:**
- `users` — name, email, hashed password, role
- `posts` — title, excerpt, body, category, status, author_id
- `comments` — post_id, author, body, status (approved/pending/rejected)
- `likes` — post_id + user_id pairs (unique constraint)

**Seeded with:**
- 1 admin user
- 3 sample essays
- 3 sample comments

To **reset the database**, just delete `backend/inkwell.db` and restart the server.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/signin` | Sign in, get JWT token |
| GET  | `/api/auth/me` | Get current user (auth required) |
| PUT  | `/api/auth/me` | Update profile (auth required) |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/posts` | List posts (supports ?search=, ?category=, ?page=) |
| GET  | `/api/posts/categories` | Get all categories |
| GET  | `/api/posts/:id` | Get single post |
| POST | `/api/posts` | Create post (auth required) |
| PUT  | `/api/posts/:id` | Update post (owner/admin) |
| DELETE | `/api/posts/:id` | Delete post (owner/admin) |
| POST | `/api/posts/:id/like` | Toggle like (auth required) |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/comments?post_id=X` | Get comments for post |
| GET  | `/api/comments/all` | All comments (admin only) |
| POST | `/api/comments` | Add comment |
| PUT  | `/api/comments/:id/status` | Moderate (admin only) |
| DELETE | `/api/comments/:id` | Delete comment |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/admin/stats` | Dashboard stats |
| GET  | `/api/admin/users` | All users |
| PUT  | `/api/admin/users/:id/role` | Change user role |
| DELETE | `/api/admin/users/:id` | Delete user |

---

## 🛠️ VS Code Tips

**Recommended Extensions:**
- **ESLint** — code linting
- **Prettier** — auto formatting
- **REST Client** — test API endpoints directly in VS Code
- **SQLite Viewer** — view the `inkwell.db` database visually

**Split terminals:** Use `Ctrl+Shift+5` (Windows/Linux) or `Cmd+Shift+5` (Mac) to run backend and frontend side by side.

---

## 🐛 Troubleshooting

**`better-sqlite3` fails to install:**
```bash
npm install --build-from-source better-sqlite3
```
Or install Python + node-gyp: `npm install -g node-gyp`

**Port 5000 already in use:**
```bash
# Change port in backend/.env
PORT=5001
# And update frontend/.env
REACT_APP_API_URL=http://localhost:5001/api
```

**Frontend shows "Network Error":**
- Make sure the backend is running on port 5000
- Check `frontend/.env` has the correct `REACT_APP_API_URL`
- Restart the frontend after changing `.env`

**AI Polish not working:**
- Add your Anthropic API key to `frontend/.env`
- Key must start with `sk-ant-`
- Restart the frontend after changing `.env`

---

## 📦 Build for Production

```bash
# Build frontend
cd frontend
npm run build

# The build/ folder can be served statically
# Or configure Express to serve it:
# app.use(express.static('../frontend/build'))
```

---

## 🔐 Security Notes (for production)

1. Change `JWT_SECRET` in `backend/.env` to a long random string
2. Use environment variables, never hardcode secrets
3. Move Anthropic API calls to the backend (never expose API keys in frontend)
4. Add rate limiting: `npm install express-rate-limit`
5. Use HTTPS in production
6. Replace SQLite with PostgreSQL for multi-server deployments

---

*Inkwell — Independent essays, published slowly.*
