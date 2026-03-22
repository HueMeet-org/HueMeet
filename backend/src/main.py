import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.aura import router as aura_router
from src.security import APIKeyMiddleware


app = FastAPI(
    title="HueMeet API",
    description="Backend API for HueMeet",
    version="0.0.1",
    docs_url=None if os.getenv("HIDE_DOCS", "false").lower() == "true" else "/docs",
    redoc_url=None if os.getenv("HIDE_DOCS", "false").lower() == "true" else "/redoc",
)

app.add_middleware(APIKeyMiddleware)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-API-Key"],
)

app.include_router(aura_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to HueMeet API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
