<div align="center">

# SalesMind AI

**Enterprise-grade AI Sales Copilot — powered by Groq LLaMA 3.3 70B**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase)](https://supabase.com/)
[![Deploy on Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com/)
[![Deploy on Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com/)

SalesMind AI is an intelligent revenue operating system that acts as an AI-powered copilot for modern sales teams. Analyze leads, receive real-time coaching from **Nexus AI**, automate follow-up emails, and close more deals — all from one premium interface.

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Nexus AI Chat** | Conversational copilot powered by Groq LLaMA 3.3 70B + RAG knowledge base |
| 📊 **Lead Intelligence** | AI lead scoring, sentiment analysis, and intent classification |
| 🎙️ **Voice Interface** | Speech-to-text via OpenAI Whisper + ElevenLabs TTS responses |
| 📧 **Smart Follow-ups** | AI-generated, context-aware follow-up emails via Resend |
| 📈 **Analytics Dashboard** | Pipeline funnel, sentiment trends, and revenue forecasting |
| 🧠 **Knowledge Base** | Upload PDFs/docs → RAG-indexed into ChromaDB for contextual answers |
| 🔐 **Auth** | Supabase-powered email authentication with protected routes |

---

## 🛠️ Tech Stack

### Frontend — `frontend/`
- **Framework:** Next.js 16 (React 19, App Router)
- **Styling:** Tailwind CSS 4 with custom design system
- **Animations:** Framer Motion
- **UI Primitives:** Radix UI + Lucide Icons
- **State:** Zustand + TanStack Query
- **Auth:** Supabase JS client

### Backend — `backend/`
- **API:** FastAPI 0.115 + Uvicorn
- **AI / LLMs:** LangChain + Groq (LLaMA 3.3 70B / LLaMA 3.1 8B)
- **Vector Store:** ChromaDB + Sentence Transformers
- **ML:** Scikit-learn, Pandas, NumPy (lead scoring, sentiment)
- **Database & Auth:** Supabase (PostgreSQL)
- **Voice:** OpenAI Whisper (STT) + ElevenLabs (TTS)
- **Email:** Resend

---

## 📁 Project Structure

```
SalesMind AI/
├── frontend/               # Next.js 16 web app
│   ├── app/                # App Router pages
│   │   ├── dashboard/      # Protected dashboard routes
│   │   │   ├── chat/       # Nexus AI chat
│   │   │   ├── leads/      # Lead management
│   │   │   ├── analytics/  # Pipeline insights
│   │   │   ├── knowledge/  # Knowledge base
│   │   │   ├── followup/   # Email automation
│   │   │   └── voice/      # Voice interface
│   │   ├── login/
│   │   └── forgot-password/
│   ├── components/         # Reusable UI components
│   ├── lib/                # API client + Supabase auth helpers
│   ├── next.config.ts      # API proxy rewrite config
│   ├── vercel.json         # Vercel deploy config
│   └── .env.example        # Frontend env var template
│
├── backend/                # FastAPI Python API
│   ├── routers/            # API route handlers
│   ├── agents/             # LangChain AI agents
│   ├── rag/                # RAG pipeline (ChromaDB)
│   ├── ml/                 # ML models (lead scoring, sentiment)
│   ├── memory/             # Conversation memory
│   ├── database/           # Supabase client
│   ├── main.py             # FastAPI app entry point
│   ├── config.py           # Settings via pydantic-settings
│   ├── render.yaml         # Render Blueprint deploy config
│   └── .env.example        # Backend env var template
│
├── .gitignore
└── README.md
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/your-username/salesmind-ai.git
cd salesmind-ai
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Copy the env template and fill in your keys:
```bash
cp .env.example .env
```

```env
# Required
GROQ_API_KEY=your-groq-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SECRET_KEY=your-random-secret-minimum-32-chars

# Optional (voice features)
OPENAI_API_KEY=your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key

# Optional (email automation)
RESEND_API_KEY=your-resend-key
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```
API docs available at → `http://localhost:8000/api/docs`

---

### 3. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
```

Copy the env template:
```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
BACKEND_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```
App available at → `http://localhost:3000`

---

## ☁️ Deployment

### Backend → Render

The `backend/render.yaml` Blueprint handles everything automatically.

1. Push repo to GitHub
2. Go to [Render](https://render.com) → **New → Blueprint** → connect repo
3. Render detects `render.yaml` and creates the service
4. Add your secrets in **Render → Environment**:

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `SUPABASE_URL` | Supabase dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) |
| `SECRET_KEY` | Auto-generated by Render ✅ |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) |
| `ALLOWED_ORIGINS` | Your Vercel URL (set after frontend deploy) |

5. Copy your Render service URL (e.g. `https://salesmind-api.onrender.com`)

> **Note:** Free tier uses `/tmp/chroma_db` (ephemeral — resets on restart). Upgrade to Render Starter + Disk for persistent knowledge base.

---

### Frontend → Vercel

1. Go to [Vercel](https://vercel.com) → **Add New Project** → import your repo
2. Set **Root Directory** to `frontend`
3. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://salesmind-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `BACKEND_URL` | `https://salesmind-api.onrender.com` |

4. Click **Deploy**
5. After deploy, update `ALLOWED_ORIGINS` in Render to include your Vercel URL:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```

---

## 🔑 Environment Variables Reference

| Variable | Required | Service | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ | Backend | Groq LLaMA inference API |
| `SUPABASE_URL` | ✅ | Both | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Both | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Backend | Supabase admin key |
| `SECRET_KEY` | ✅ | Backend | JWT signing secret (32+ chars) |
| `OPENAI_API_KEY` | ⬜ | Backend | Whisper STT |
| `ELEVENLABS_API_KEY` | ⬜ | Backend | ElevenLabs TTS |
| `RESEND_API_KEY` | ⬜ | Backend | Email automation |
| `ALLOWED_ORIGINS` | ✅ | Backend | Comma-separated CORS origins |
| `BACKEND_URL` | ✅ | Frontend | Render URL (server-side rewrite) |
| `NEXT_PUBLIC_API_URL` | ✅ | Frontend | Render URL (client-side axios) |

---

## 🧠 Design Philosophy

SalesMind AI embraces a **dark, cinematic, and premium** design aesthetic — layered glass surfaces, micro-animations, sophisticated typography (Inter), and an interface engineered to feel like a world-class AI enterprise product.

---

<div align="center">
  <sub>Built with ❤️ using Next.js, FastAPI, Groq, and Supabase</sub>
</div>
