# VidyaMitra

Split stack:

- **`vidyamitra-frontend`** — React + Vite
- **`vidyamitra-backend`** — FastAPI

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+

## Run locally

### Backend

```bash
cd vidyamitra-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GROQ_API_KEY` for full AI features. The API still starts without them; endpoints that need keys return `503` until configured.

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- API: `http://localhost:8000`
- Health: `GET http://localhost:8000/`

### Frontend

```bash
cd vidyamitra-frontend
npm install
copy .env.example .env
npm run dev
```

App: `http://localhost:5173` (default Vite port).

Set `VITE_API_URL=http://localhost:8000` in `vidyamitra-frontend/.env`.

## Security

- Do not commit `.env` files (already in `.gitignore`).
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` only in the backend environment.
- Frontend may use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only (public anon key).
