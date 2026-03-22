# HuggingFace Spaces entry point.
# HF Spaces runs: uvicorn app:app --host 0.0.0.0 --port 7860
# We simply re-export the FastAPI instance from src/main.py.

from src.main import app  # noqa: F401  (re-export)
