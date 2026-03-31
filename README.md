# 💰 SpendAI — AI-Powered Expense Tracker

A full-stack MERN application with Groq AI integration for intelligent expense tracking, spending analysis, and financial insights.

> **Resume-ready project** — covers React, Node.js, Express, MongoDB, REST APIs, JWT Auth, and AI integration.

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router v6, Recharts |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB Atlas (free tier)           |
| Auth       | JWT (JSON Web Tokens) + bcryptjs    |
| AI         | Groq AI — Llama 3 (**FREE**)        |
| Styling    | Custom CSS Design System (no UI lib)|

---

## 🤖 Free AI API — Groq

This project uses **Groq AI** with Llama 3 models — completely free with no credit card required. Groq is extremely fast thanks to its custom LPU hardware.

**Get your free API key:**
1. Go to → https://console.groq.com
2. Sign up with your Google/GitHub account
3. Click **"API Keys"** → **"Create API Key"**
4. Copy the key → paste it in `backend/.env` as `GROQ_API_KEY`

**Free tier limits:** ~14,400 requests/day — much more generous than most free AI APIs.

**Model fallback chain** — the app automatically tries the next model if one hits its quota:
1. `llama-3.1-8b-instant` — fastest, highest limits
2. `llama3-8b-8192` — fallback
3. `mixtral-8x7b-32768` — large context fallback

---

## 📁 Project Structure

```
ai-expense-tracker/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (bcrypt password hashing)
│   │   └── Expense.js       # Expense schema with categories
│   ├── routes/
│   │   ├── auth.js          # Register, Login, Profile
│   │   ├── expenses.js      # CRUD + Analytics aggregation
│   │   └── ai.js            # Groq: analyze, categorize, chat
│   ├── middleware/
│   │   └── auth.js          # JWT protect middleware
│   ├── server.js            # Express app entry point
│   ├── .env.example         # Environment variables template
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── context/
        │   └── AuthContext.jsx   # Global auth state
        ├── utils/
        │   └── api.js            # Axios config + all API calls
        ├── components/
        │   └── Layout.jsx        # Sidebar navigation
        ├── pages/
        │   ├── Login.jsx         # Auth page
        │   ├── Register.jsx      # Auth page
        │   ├── Dashboard.jsx     # Charts + stats
        │   ├── Expenses.jsx      # CRUD table + AI categorize
        │   └── AIInsights.jsx    # Groq analysis + chat
        ├── App.jsx               # Router + protected routes
        ├── index.js
        └── index.css             # Full design system
```

---

## ⚙️ Step-by-Step Setup

### Step 1 — Clone & Install

```bash
# Clone the repo
git clone https://github.com/yourusername/ai-expense-tracker.git
cd ai-expense-tracker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Set Up MongoDB Atlas (Free)

1. Go to → https://cloud.mongodb.com
2. Create a free account → click **"Build a Database"**
3. Choose **M0 Free** tier → select any region → click **Create**
4. Under **Security → Database Access**: create a user with a password
5. Under **Security → Network Access**: click **"Add IP Address"** → **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Under **Database → Connect**: click **"Connect"** → **"Drivers"** → copy the connection string
7. Replace `<password>` in the string with your actual password

---

### Step 3 — Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

```env
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/expense-tracker
JWT_SECRET=pick_any_long_random_string_here_abc123xyz789
GROQ_API_KEY=your_groq_api_key_from_console.groq.com
PORT=5000
FRONTEND_URL=http://localhost:3000
```

---

### Step 4 — Run the App

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Server running on port 5000
# → MongoDB connected
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# → Opens http://localhost:3000
```

---

### Step 5 — Test the App

1. Open http://localhost:3000
2. Click **"Create Account"** → register with your name, email, password, and monthly budget
3. Add a few expenses on the **Expenses** page
4. Try the **🤖 AI button** on an expense to auto-detect its category
5. Go to **AI Insights** → click **"Analyze My Spending"** → get Groq-powered analysis
6. Chat with the AI assistant about your finances

---

## 🌐 Deployment (Free)

### Deploy Backend → Railway or Render

**Railway (recommended):**
1. Go to → https://railway.app → sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repo → set **root directory** to `backend`
4. Add environment variables (same as your `.env`)
5. Deploy → copy the generated URL (e.g. `https://your-app.railway.app`)

**Render:**
1. Go to → https://render.com → **"New Web Service"**
2. Connect GitHub → set root to `backend`, build command `npm install`, start command `node server.js`
3. Add env vars → Deploy

---

### Deploy Frontend → Vercel

1. Go to → https://vercel.com → import your GitHub repo
2. Set **root directory** to `frontend`
3. Add environment variable: `REACT_APP_API_URL=https://your-backend-url.railway.app`
4. Update `frontend/src/utils/api.js` — change `baseURL` to use env var:
   ```js
   baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api',
   ```
5. Also update backend `FRONTEND_URL` env var to your Vercel URL
6. Deploy → you get a live URL like `https://your-app.vercel.app`

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔐 JWT Auth | Secure register/login, token stored in localStorage |
| 📊 Dashboard | Bar chart (6-month trend), pie chart (by category), stat cards |
| 📝 Expense CRUD | Add, edit, delete with filters and search |
| 🤖 AI Auto-Categorize | Groq detects category from expense title |
| 📈 AI Spending Analysis | Budget health score, tips, smart insights |
| 💬 AI Finance Chat | Conversational assistant with spending context |
| 📱 Responsive | Works on desktop and mobile |

---

## 🎯 Resume Talking Points

When asked about this project in an interview, highlight:

**Architecture:**
> "Built a full-stack MERN application with a RESTful API backend. Used JWT for stateless authentication with bcrypt password hashing. Implemented MongoDB aggregation pipelines for real-time analytics."

**AI Integration:**
> "Integrated Groq AI with Llama 3 models for three AI features: automatic expense categorization, monthly spending analysis with a budget health score, and a context-aware conversational finance assistant. Implemented a model fallback chain so the app automatically switches models if one hits its rate limit."

**Frontend:**
> "Built the entire UI without a component library — custom CSS design system with CSS variables for theming. Used React Context for global auth state, React Router v6 for protected routes, and Recharts for interactive data visualizations."

**Problem Solved:**
> "Users often don't know where their money goes. The AI analyzes spending patterns and gives personalized, data-driven tips — not generic advice."

---

## 🔒 Security Best Practices Used

- Passwords hashed with bcryptjs (salt rounds: 12)
- JWT tokens expire after 30 days
- Protected routes with middleware on every private endpoint
- Input validation with express-validator
- CORS configured to allow only the frontend origin
- `.env` excluded from git via `.gitignore`

---

## 📦 API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile/budget |

### Expenses (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List with filters & pagination |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/analytics/summary` | Monthly stats, trends, categories |

### AI (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze` | Full spending analysis with score |
| POST | `/api/ai/categorize` | Auto-detect category from title |
| POST | `/api/ai/chat` | Conversational finance assistant |