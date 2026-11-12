# CivicConnect

CivicConnect is a modern AI-powered community problem-solving platform for reporting civic issues, coordinating volunteers, and tracking resolution progress.

## Architecture

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI
- Data layer: MongoDB-ready models with demo-mode fallback data for local hackathon use
- AI: Demo classification and duplicate detection API endpoints
- Mapping: Leaflet + OpenStreetMap
- Visuals: Recharts
- Auth: JWT-ready demo login and registration endpoints

## Folder structure

- `frontend/` — React application
- `backend/` — FastAPI API server
- `.env.example` — environment configuration template
- `render.yaml` — Render API deployment blueprint
- `.github/workflows/deploy-pages.yml` — automated GitHub Pages build and deployment

## Public deployment (GitHub Pages + Render)

1. In GitHub repository **Settings → Pages**, choose **GitHub Actions** as the source.
2. Push to `main` or run **Deploy CivicConnect to GitHub Pages** from the Actions tab. The public website URL is `https://kstaniya847-a11y.github.io/civic-connect/` after a successful deployment.
3. Optionally deploy the FastAPI API from `render.yaml` using Render Blueprint. Set the repository Actions variable `VITE_API_BASE_URL` to the full Render API URL and rerun the Pages deployment to enable API-backed features.

GitHub Pages serves the frontend only. Without a deployed API, the website can be viewed but login/reporting will not persist. The free Render API may sleep when idle and currently uses in-memory demo data.

## Quick start

### 1. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### 2. Backend

```bash
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Environment

Copy the sample env file and update values:

```bash
copy .env.example .env
```

## Demo flow

1. Sign in as a citizen.
2. Upload a civic issue image or description.
3. AI classifies the issue, checks for duplicates, and suggests a priority.
4. The issue appears on the interactive map.
5. A volunteer accepts the task and updates progress.
6. An admin tracks the issue lifecycle and resolution.

## API endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/issues`
- `POST /api/issues/report`
- `POST /api/ai/classify`
- `GET /api/dashboard/stats`
- `GET /api/volunteers`
- `POST /api/issues/{issue_id}/status`

## Notes

This project uses realistic sample data for a demo environment and can be connected to MongoDB by configuring `MONGO_URI` when the database is available.
