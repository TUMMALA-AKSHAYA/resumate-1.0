# Deploying Resumate (MVP)

The app has **three runtimes**: React (static/Vite), Node (Express API), Python (FastAPI), plus **MongoDB** and **durable object storage** for uploads/exports in real production.

## 1. Environment variables

| Service | Variable | Purpose |
|---------|----------|--------|
| Backend | `MONGODB_URI` | Mongo connection string (use **Atlas** in prod) |
| Backend | `JWT_SECRET` | Long random string for signing tokens |
| Backend | `AI_SERVICE_URL` | Internal URL of FastAPI (e.g. `http://ai:8000`) |
| Backend | `CORS_ORIGIN` | Frontend origin(s), e.g. `https://app.example.com` |
| Backend | `UPLOAD_DIR` | Writable directory for resume binaries (ephemeral disk OK only for demos) |
| Frontend | `VITE_API_URL` | Public API base, e.g. `https://api.example.com/api` |
| AI | `OPENAI_API_KEY` | Optional; improves `/assist` quality |

## 2. Pattern A: split PaaS (typical)

1. **Database**: Create a MongoDB Atlas cluster; allow inbound from backend host IPs or use VPC peering.
2. **AI service**: Deploy `ai-service/` (Dockerfile runs **uvicorn** + **Starlette**).
3. **Backend**: Deploy `backend/` with the same providers; set `AI_SERVICE_URL` to the AI service **private** URL if the platform supports internal networking; otherwise use public HTTPS URL.
4. **Frontend**: Build Vite (`npm run build`) and host on **Vercel** or **Netlify**; set `VITE_API_URL` at build time.
5. **Files**: For anything beyond a demo, point uploads at **S3**, **R2**, or **Cloudinary** and replace local `UPLOAD_DIR` usage with pre-signed uploads (not fully wired in this MVP—plan an adapter in `backend`).

## 3. Pattern B: Docker / VPS + Nginx

1. Build images from `backend/Dockerfile`, `ai-service/Dockerfile`, and a static `frontend` image (add a small `nginx` stage that serves `frontend/dist`).
2. Run **MongoDB** as a container or managed service.
3. Put **Nginx** in front: TLS termination, `proxy_pass` to Node and Python, rate limits on `/api/auth` and upload routes.
4. Persist `./uploads` (or object storage) across deploys.

## 4. CI

`.github/workflows/ci.yml` runs install + build on pull requests. Extend with tests and deploy jobs (`workflow_dispatch` recommended until stable).

## 5. Checklist before go-live

- [ ] Rotate `JWT_SECRET`; never commit secrets.
- [ ] Restrict CORS to real frontend origin(s).
- [ ] Enable HTTPS everywhere.
- [ ] Move uploads off container disk.
- [ ] Set up database backups and monitoring.

## 6. Git

If this directory was created without `git` (some sandboxed environments block `.git`), run locally:

```bash
git init
git remote add origin https://github.com/Chevva-Bhavanica/Resumate-project.git
git add .
git commit -m "Initial Resumate MVP monorepo"
git push -u origin main
```
