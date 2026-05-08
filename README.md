# Resumate (MVP)

AI-assisted recruitment platform: **React** frontend, **Express** API, **Starlette** (ASGI) AI service, **MongoDB**.

## Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB (local or Docker)
- Optional: `OPENAI_API_KEY` for enhanced resume assists (rule-based fallback works without it)

## Quick start (three terminals)

1. **MongoDB** (or use Docker only for DB):

   ```bash
   docker compose up mongo -d
   ```

2. **AI service** (`http://localhost:8000`):

   ```bash
   cd ai-service
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   (Implemented with **Starlette** — lightweight ASGI — for broad Python version compatibility; endpoints are the same REST shape as a FastAPI service.)

3. **Backend** (`http://localhost:4000`):

   ```bash
   cd backend
   cp ../.env.example .env  # edit MONGODB_URI, JWT_SECRET, etc.
   npm install
   npm run dev
   ```

4. **Frontend** (`http://localhost:5173`):

   ```bash
   cd frontend
   echo 'VITE_API_URL=http://localhost:4000/api' > .env
   npm install
   npm run dev
   ```

   From the **repo root**, you can use npm workspaces: `npm install` then `npm run build` (builds the Vite app) or `npm run dev:frontend` / `npm run dev:backend`.

Create an account as **candidate** or **recruiter**. For an **admin** user, register then update `role` to `admin` in MongoDB (MVP) or use `npm run seed:admin` from `backend` if configured.

## Docker (API + AI + Mongo)

```bash
cp .env.example .env
# Set JWT_SECRET; optionally OPENAI_API_KEY
docker compose up --build
```

Run frontend locally with `VITE_API_URL=http://localhost:4000/api`.

## Project layout

- `frontend/` — Vite, React, Tailwind, Redux Toolkit
- `backend/` — Express, Mongoose, JWT, local file uploads
- `ai-service/` — Resume parse, ATS scoring, TF–IDF match, AI assists, PDF/DOCX export (**Starlette** + **uvicorn**)
- `docs/deploy.md` — Production deployment notes

## Git

If `git` is unavailable in your environment, initialize locally:

```bash
git init
git remote add origin https://github.com/Chevva-Bhavanica/Resumate-project.git
```
