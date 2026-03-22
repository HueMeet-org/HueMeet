---
title: HueMeet API
emoji: 🌈
colorFrom: purple
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# HueMeet API

FastAPI backend for [HueMeet](https://github.com/HueMeet-org/HueMeet).

> **All endpoints (except `/` and `/health`) require authentication.**
> Pass your key in the request header: `X-API-Key: <your-secret>`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (public) |
| POST | `/api/v1/aura/analyze` | Analyse text toxicity & emotion |
| GET | `/api/v1/aura/health` | Aura sub-system health check |