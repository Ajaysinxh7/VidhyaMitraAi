# ⚙️ VidyaMitra Local Setup Guide

Follow this guide to get VidyaMitra up and running on your local machine for development. Since the project uses a separated architecture, you'll need to run both the Backend (FastAPI) and Frontend (React/Vite) servers simultaneously.

---

## 📋 Prerequisites

Before you start, make sure you have the following installed:
- [Node.js](https://nodejs.org/en/) (Version 20+ Recommended) & `npm`
- [Python](https://www.python.org/downloads/) (Version 3.11+)
- A [Supabase](https://supabase.com/) Account & Project
- A [Groq](https://groq.com/) API Key for AI features

---

## Step 1: Backend Setup (FastAPI)

We recommend using a separate terminal window for the backend.

1. **Navigate to the backend directory**
   ```bash
   cd vidyamitra-backend
   ```

2. **Create and Activate a Virtual Environment**
   Because we use external packages, it's safest to contain them inside a virtual environment.
   - **Windows:**
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**
   Create your local environment file:
   ```bash
   copy .env.example .env
   # Or on Mac/Linux: cp .env.example .env
   ```
   Open the new `.env` file and fill it out:
   - `SUPABASE_URL` - Found in your Supabase Project Settings > API. Ensure it starts with `https://`.
   - `SUPABASE_SERVICE_ROLE_KEY` - The *Service Role Secret* for secure backend database access.
   - `GROQ_API_KEY` - Your active Groq API Key.

5. **Start the API Server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend should now be listening at **http://localhost:8000**.
   > *Tip: You can test the health by visiting `http://localhost:8000/docs` in your browser to see the auto-generated Swagger UI!*

---

## Step 2: Frontend Setup (React + Vite)

Open a **new** terminal window (leave the backend running!)

1. **Navigate to the frontend directory**
   ```bash
   cd vidyamitra-frontend
   ```

2. **Install Node Packages**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create your local environment file:
   ```bash
   copy .env.example .env
   # Or on Mac/Linux: cp .env.example .env
   ```
   Open the new `.env` file and configure it:
   - `VITE_API_URL` - Keep as `http://localhost:8000` (points to your running local backend).
   - `VITE_SUPABASE_URL` - Your Supabase project URL (must start with `https://`).
   - `VITE_SUPABASE_ANON_KEY` - Your public **Anon Key** from Supabase. *(Do NOT put the Service Role key here!)*

4. **Start the Vite Dev Server**
   ```bash
   npm run dev
   ```
   The frontend should now be running, typically at **http://localhost:5173**.

---

## 🛑 Common Troubleshooting

- **"ModuleNotFoundError / Uvicorn is completely missing"**: Make sure you activated your `.venv`! You should see `(.venv)` in your terminal prompt.
- **"Client.__init__() got an unexpected keyword argument 'proxy'"**: Make sure you have upgraded your PIP packages (`pip install -r requirements.txt --upgrade`) to fix package sync issues.
- **"Unhandled Error: supabaseUrl is required" or UI Crashes**: Ensure your Frontend `.env` file exists, starts with `VITE_` for your variables, and your Supabase URL strictly starts with `https://`. Always remember to **restart** `npm run dev` after changing frontend `.env` files.
- **"503 Service Unavailable" on AI Endpoints**: Double-check your `GROQ_API_KEY` hasn't been accidentally overwritten and is correctly saved in the backend `.env`. Remember, the backend `.env` values are erased if you accidentally run `copy .env.example .env` again!
