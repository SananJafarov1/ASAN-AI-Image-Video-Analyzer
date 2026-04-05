# ASAN Visual AI — Vətəndaş Müraciət Analiz Sistemi

> AI-powered visual analysis layer for the **ASAN müraciət** citizen request management platform.
> Submission for the **ASAN AI Hub Challenge** by team **Kodsuz İntellekt**.

---

## Pipeline

```
Citizen uploads photo/video
        ↓
YOLOv8  — object & damage detection
        ↓
GPT-4 Vision — scene description + category + priority (Azerbaijani)
        ↓
Stored in PostgreSQL, media in MinIO
        ↓
Routed to relevant institution
        ↓
Institution uploads result photo
        ↓
CLIP — cosine similarity (before vs after)
YOLOv8 re-check — damage still present?
        ↓
resolved: true / false
        ↓
Alert system (staff dashboard)
```

---

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- OpenAI API key with GPT-4 Vision access

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set OPENAI_API_KEY at minimum
```

### 3. Start all services

```bash
docker-compose up -d
```

| Service | URL |
|---------|-----|
| FastAPI backend | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| React frontend | http://localhost:5173 |
| MinIO Console | http://localhost:9001 |

---

## API Reference

### `POST /api/analyze`

Upload a citizen image or video.

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@pothole.jpg"
```

**Response:**
```json
{
  "request_id": "req_abc123",
  "description_az": "Küçədə böyük çala mövcuddur...",
  "category": "yol_neqliyyat",
  "priority": "tecili",
  "detected_objects": ["pothole", "road"],
  "confidence": 0.91,
  "location_hint": "GPS: 40.4093, 49.8671"
}
```

---

### `POST /api/verify/{request_id}`

Institution uploads result image. Requires `X-Api-Key` header.

```bash
curl -X POST http://localhost:8000/api/verify/req_abc123 \
  -H "X-Api-Key: institution-secret-key" \
  -F "file=@result.jpg"
```

**Response:**
```json
{
  "request_id": "req_abc123",
  "resolved": false,
  "similarity_score": 0.61,
  "alert_triggered": true,
  "mismatch_reason": "Nəticə şəklində zədə hələ aşkar edilir: 'pothole'",
  "message_az": "Nəticə şəkli ilkin müraciətdəki problemin aradan qaldırıldığını təsdiqləmir."
}
```

---

### `GET /api/alerts`

Get all unacknowledged alerts. Requires `X-Api-Key` header.

```bash
curl http://localhost:8000/api/alerts \
  -H "X-Api-Key: institution-secret-key"
```

---

## ML Test Scripts

```bash
cd ml

# Test YOLO detection on a local image
python yolo_test.py sample_images/pothole.jpg

# Test CLIP similarity between two images
python clip_test.py sample_images/before.jpg sample_images/after.jpg
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Python 3.11 |
| Object detection | YOLOv8 (Ultralytics) |
| Scene analysis | GPT-4 Vision (OpenAI) |
| Similarity check | CLIP (open_clip / HuggingFace) |
| Database | PostgreSQL + SQLAlchemy async |
| Job queue | Redis (Celery-ready) |
| Media storage | MinIO (S3-compatible) |
| Frontend | React 18, Vite, TailwindCSS |
| Deployment | Docker Compose |

---

## Categories

| Code | Azerbaijani Label |
|------|-------------------|
| `kommunal` | Kommunal xidmətlər |
| `yol_neqliyyat` | Yol və nəqliyyat |
| `infrastruktur` | İnfrastruktur |
| `ekoloji` | Ekoloji problemlər |
| `diger` | Digər |

## Priority Levels

| Code | Label | Trigger |
|------|-------|---------|
| `tecili` | Təcili | Fire, gas leak, flooding, large pothole |
| `orta` | Orta | Damaged sidewalk, trash overflow, broken light |
| `asagi` | Aşağı | Graffiti, minor cosmetic damage |

---

## Security

- Media files stored in private MinIO bucket (UUID-keyed, no PII)
- Institution endpoints protected by API key (`X-Api-Key` header)
- HTTPS enforced in production
- Full audit trail in PostgreSQL

---

## Team

**Kodsuz İntellekt**
Stack: Python · FastAPI · React · OpenAI API · YOLOv8 · CLIP
Previous challenges: ASAN AI Hub (Aqrar Ticarət Platforması), Yonca agro-ecosystem AI assistant
