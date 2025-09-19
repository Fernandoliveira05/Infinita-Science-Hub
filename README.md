# Infinita Science Hub

DeSci Builders Hackathon — **Verification & Audit Trails for Science**

A professional workspace to publish, review, fork, cite, license, and fund scientific work—built to run inside Infinita/Próspera. Frontend + backend ready, clean code, and clear hooks for blockchain and AI.

## Why it fits the category

Science needs reproducibility with verifiable provenance. Here, every research artifact is a first-class object with visible hashes, timestamps, and authorship signals. The interface is designed for **audit trails** and **proof blocks** (visual, ordered steps) that can be anchored to IPFS/Arweave and on-chain systems later. Funding flows, consent checkpoints, and authorship badges are treated as product features—not afterthoughts.

## Tech stack

* **Frontend**: React + TypeScript + Vite + TailwindCSS
* **Backend**: FastAPI (Python)
* **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
* **AI**: model-driven validation, metadata extraction, similarity search (embeddings with pgvector on Supabase), and reviewer-style summaries

Directory layout: two top-level folders only — `frontend/` and `backend/`.

## AI impact (built-in)

* **Proof validation**: check internal consistency, missing controls, and stats red flags.
* **Metadata & refs**: extract structured citations from PDFs, normalize entities (assay, organism, reagent).
* **Similarity & prior art**: embeddings-backed search to find related work and duplicates.
* **Reviewer assist**: suggested “Methods” summaries, BibTeX drafts, and reproducibility notes.
* **Risk/consent hints**: highlight likely IRB/consent checkpoints based on content.
* **Quality signals**: non-authorable scores (completeness, clarity, novelty hint, data sanity).

All AI calls live behind a thin service layer so providers can be swapped (OpenAI, Gemini, Together, local).

## UX overview

* **Landing**: hero, tagline, call to action.
* **Login**: MetaMask button (UI only for now, wallet binding later).
* **Explore**: cards with title, author, date, hash, status, forks, donations.
* **Repository**: tabs **Blocks | References | License | Discussions** with quick actions **Fork, Cite, License, Donate**.
* **Editor**: n8n-style drag-and-drop proof blocks (Text, Image, Video, Audio, Reference) with connectors and ordering.
* **Profile**: avatar, bio, metrics, repos.

**Design system**

* Colors: Primary green `#22C55E` (hover `#16A34A`, light `#BBF7D0`), neutrals gray 900/500/100/white, accents blue `#3B82F6`, yellow `#FACC15`, red `#EF4444`.
* Typography: Inter (UI), JetBrains Mono (hashes).
* Buttons: Primary (green), Secondary (outline), Ghost (transparent), Danger (red).
* Cards: white, radius 12px, subtle shadow.
* Tags: green *validated*, yellow *in review*, blue *free license*, red *error*.
* Dark mode: bg gray-900, text white, green highlights.
* Motion: subtle hover highlights, smooth dragging, toast fades.


## Getting started

### Prereqs

* Node 18+
* Python 3.11+
* Supabase project (URL + anon/service keys)
* (Optional) AI provider key

### Environment

`frontend/.env`

```
VITE_API_BASE=http://localhost:8000
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`backend/.env`

```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
OPENAI_API_KEY=YOUR_MODEL_KEY
EMBEDDINGS_MODEL=text-embedding-3-small
COMPLETION_MODEL=gpt-4o-mini
ALLOW_ORIGINS=http://localhost:5173
```

### Install

```bash
# Frontend
cd frontend
pnpm install   # or: npm install / yarn

# Backend
cd ../backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### Run (dev)

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
uvicorn app.main:app --reload
```

Defaults: frontend on `http://localhost:5173`, backend on `http://localhost:8000`.

---

## Scripts

**frontend/package.json (excerpt)**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint --ext .ts,.tsx src"
  }
}
```

**backend/requirements.txt (minimal)**

```
fastapi
uvicorn[standard]
python-dotenv
httpx
pydantic
pydantic-settings
supabase
pgvector
numpy
```


## Security baseline

* Supabase RLS for per-owner data; public-read for published repos only.
* CORS restricted via `ALLOW_ORIGINS`.
* AI endpoints provide suggestions with trace metadata; they don’t mutate state automatically.
* Hashes are surfaced next to content participating in audit trails.
* License and consent tabs are visible, versioned, and auditable.


## Roadmap (short)

* Editor connectors + keyboard affordances.
* DOI resolver and BibTeX import/export.
* SPDX presets and on-chain proof of license acceptance.
* IPFS pinning + optional Arweave anchoring.
* Reviewer-style AI summary and “missing controls” checks.
* Hybrid search (lexical + vector + rerank).


## Contributing

* Keep PRs focused and documented.
* Preserve type safety and Tailwind tokens.
* Add small integration tests for routes and services where applicable.


## License

Code under MIT. Scientific content and datasets are licensed per repository; see the **License** tab inside each published project.


## Team

Infinita Science Hub — built for **DeSci Builders Hackathon**.
**React + FastAPI + Supabase + AI models**, designed for researchers who actually ship.
