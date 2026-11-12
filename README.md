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
