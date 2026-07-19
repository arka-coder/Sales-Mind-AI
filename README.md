# SalesMind AI 🚀 (Revenue OS)

SalesMind AI is an intelligent revenue operating system designed to act as an AI-powered copilot for sales teams. It analyzes leads, provides real-time coaching via "Nexus AI," and automates intelligent follow-ups to help close more deals with precision.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (React 19)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) & Lucide Icons
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI & LLMs:** [LangChain](https://python.langchain.com/), Groq, OpenAI
- **Vector Database:** [ChromaDB](https://www.trychroma.com/)
- **Machine Learning:** Scikit-learn, Pandas, Numpy
- **Authentication & DB:** [Supabase](https://supabase.com/)
- **Email Delivery:** [Resend](https://resend.com/)

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/salesmind-ai.git
cd salesmind-ai
```

### 2. Backend Setup
Navigate to the backend directory, create a virtual environment, and install dependencies.
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# API Keys
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
```

Run the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000`.*

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory.
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the Next.js development server:
```bash
npm run dev
```
*The web app will be available at `http://localhost:3000`.*

---

## 🚀 Deployment Guide

### 1. Deploying the Frontend (Vercel)
Vercel is the recommended hosting platform for Next.js applications.

1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select your GitHub repository.
4. Set the **Framework Preset** to `Next.js`.
5. Set the **Root Directory** to `frontend`.
6. Add the following Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (Set this to your deployed backend URL, e.g., `https://api.salesmind.ai`)
7. Click **Deploy**.

### 2. Deploying the Backend (Render / Railway)
Render or Railway are great choices for deploying FastAPI applications.

#### Option A: Deploying on Render
1. Log in to [Render](https://render.com/) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. Set the **Build Command** to:
   ```bash
   pip install -r requirements.txt
   ```
5. Set the **Start Command** to:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Add your Environment Variables (from your backend `.env` file).
7. Click **Create Web Service**.

#### Option B: Deploying on Railway
1. Log in to [Railway](https://railway.app/) and create a **New Project**.
2. Select **Deploy from GitHub repo**.
3. Railway should automatically detect the Python environment. If not, specify the Root Directory to `backend` in the settings.
4. Go to the **Variables** tab and add all your backend environment variables.
5. In the **Settings** tab, set a custom start command if necessary:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### 3. Setting up Supabase
1. Create a new project on [Supabase](https://supabase.com/).
2. Enable **Email Authentication** in Authentication > Providers.
3. (Optional but recommended) Map your custom domain and SMTP settings to use Resend for sending Auth emails to avoid rate limits.
4. Run your SQL schemas in the SQL Editor to generate the necessary tables (Profiles, Leads, etc.).

### 4. Setting up Resend (Email Automation)
1. Log in to [Resend](https://resend.com/).
2. Verify your custom domain in the Domains tab.
3. Generate an API Key and add it to your backend (`RESEND_API_KEY`).
4. (If configuring Supabase SMTP) Go to Settings > SMTP in Resend to grab the credentials and input them into Supabase Auth settings.

---

## 🧠 Design Philosophy
SalesMind AI embraces a dark, cinematic, and premium "Liquid Glass" design aesthetic. We prioritize micro-animations, layered surfaces, sophisticated typography (Inter), and an interface that feels alive. It is engineered to look like a world-class AI enterprise product.
