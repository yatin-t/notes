# Unique Notes App

Lightweight notes-taking app (Node + Express + MongoDB) with versioning, tags, and quick full-text search.

Requirements
- Node.js 16+
- MongoDB running locally or remote

Setup (Windows PowerShell)

1. Install dependencies

```powershell
cd "d:\yatin\app dev lab\notes-taking"
npm install
```

2. Copy env

```powershell
cp .env.example .env
# then edit .env to point to your MongoDB
```

3. Run

```powershell
npm run dev
# or npm start
```

Open http://localhost:4000 in your browser.

API
- POST /api/notes - create
- GET /api/notes - list (query: q, tag)
- GET /api/notes/:id - get
- PUT /api/notes/:id - update (pushes previous version)
- DELETE /api/notes/:id - delete
- POST /api/notes/:id/restore - body { versionIndex }

Next improvements
- Add user auth and per-user notes
- Fuzzy search and highlighting
- Offline-first with IndexedDB sync
- Mobile-friendly UI and Markdown support
