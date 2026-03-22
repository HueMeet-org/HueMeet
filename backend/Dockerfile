# ──────────────────────────────────────────────────────────────
# HueMeet API – Dockerfile for HuggingFace Spaces (Docker SDK)
# ──────────────────────────────────────────────────────────────

# Use a slim Python image; pin the minor version for reproducibility
FROM python:3.11-slim

# HuggingFace Spaces runs containers as a non-root user (UID 1000)
RUN useradd -m -u 1000 appuser

WORKDIR /app

# ── System dependencies ───────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ───────────────────────────────────────
# Copy requirements first so Docker layer-caching avoids re-installing
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────
COPY . .

# Make sure the unprivileged user owns everything
RUN chown -R appuser:appuser /app
USER appuser

# HuggingFace Spaces expects the app to listen on port 7860
ENV PORT=7860

# API_SECRET_KEY and ALLOWED_ORIGINS are injected by HF as Space Secrets.
# Do NOT hard-code them here.

EXPOSE 7860

# Entry-point: `app:app` maps to backend/app.py → FastAPI instance
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
