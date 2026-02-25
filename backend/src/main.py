from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.aura import router as aura_router


app = FastAPI(
    title="HueMeet API",
    description="Backend API for HueMeet",
    version="0.0.1"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(aura_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to HueMeet API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
