"""
BantayText inference service.

Loads the four trained models (mBERT teacher, distilled student, raw
student, TF-IDF + Naive Bayes) once at startup and exposes a single
POST /predict endpoint that runs all available models on the submitted
messages.

Run with:
    uvicorn app.main:app --host 0.0.0.0 --port 8000

The Next.js app should then be pointed at it via:
    INFERENCE_API_URL=http://localhost:8000
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.registry import registry
from app.schemas import (
    MessagePrediction,
    ModelPrediction,
    PredictRequest,
    PredictResponse,
    TfidfVocabularyStats,
)

# Explicit here (not just relying on app.config's own load_dotenv() call)
# so INFERENCE_SERVICE_SECRET / ALLOWED_ORIGINS below are correct regardless
# of import order. Safe to call twice — python-dotenv no-ops if vars are
# already set.
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bantaytext.main")

# Shared secret expected on requests to the "real" endpoints (/predict and
# the vocabulary stats endpoint). Mirrors INFERENCE_SERVICE_SECRET on the
# Next.js side (see lib/inference/inference-client.ts). Unset by default so
# local dev works without extra setup — only enforced when configured, which
# you should do before this service is reachable beyond localhost.
INFERENCE_SERVICE_SECRET = os.environ.get("INFERENCE_SERVICE_SECRET")


def require_shared_secret(x_inference_secret: str | None = Header(default=None)) -> None:
    if INFERENCE_SERVICE_SECRET is None:
        return  # not configured — secret check disabled (local dev default)
    if x_inference_secret != INFERENCE_SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Missing or invalid X-Inference-Secret header.")


MODEL_PREDICT_FUNCS = {
    "teacher_mbert": lambda texts: registry.predict_teacher(texts),
    "distilled_student": lambda texts: registry.predict_distilled_student(texts),
    "raw_student": lambda texts: registry.predict_raw_student(texts),
    "tfidf_nb": lambda texts: registry.predict_traditional(texts),
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading BantayText models...")
    registry.load_all()
    yield


app = FastAPI(title="BantayText Inference Service", lifespan=lifespan)

# The Next.js dev server and any deployed frontend origin need CORS access.
# Set ALLOWED_ORIGINS (comma-separated) in production. Defaults to the
# standard local Next.js dev origins only — NOT "*" — so this service isn't
# open to arbitrary websites out of the box. Update this for your actual
# deployed frontend domain(s) before going to production.
_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS")
_allowed_origins = (
    _allowed_origins_env.split(",") if _allowed_origins_env else ["http://localhost:3000", "http://127.0.0.1:3000"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "bantaytext-inference", "status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok", "models": registry.availability}


@app.get("/models/tfidf-nb/vocabulary", response_model=TfidfVocabularyStats, dependencies=[Depends(require_shared_secret)])
def tfidf_vocabulary():
    stats = registry.get_traditional_vocabulary_stats()
    if stats is None:
        raise HTTPException(status_code=404, detail="TF-IDF + Naive Bayes model not loaded or stats unavailable.")
    return stats


@app.post("/predict", response_model=PredictResponse, dependencies=[Depends(require_shared_secret)])
def predict(request: PredictRequest) -> PredictResponse:
    texts = [m.text for m in request.messages]

    # model_id -> (BatchPrediction | None, error message | None)
    batch_results: dict[str, tuple] = {}
    for model_id, predict_func in MODEL_PREDICT_FUNCS.items():
        if not registry.availability.get(model_id):
            batch_results[model_id] = (None, "Model not loaded on the inference service (missing artifact).")
            continue
        try:
            batch_results[model_id] = (predict_func(texts), None)
        except Exception as exc:
            logger.exception("Inference failed for model '%s'", model_id)
            batch_results[model_id] = (None, f"Inference failed: {exc}")

    results: list[MessagePrediction] = []
    for i, message in enumerate(request.messages):
        model_predictions: dict[str, ModelPrediction] = {}
        for model_id, (batch, error) in batch_results.items():
            if batch is None:
                model_predictions[model_id] = ModelPrediction(error=error)
                continue
            model_predictions[model_id] = ModelPrediction(
                label=batch.labels[i],
                probability=batch.probabilities[i],
                # Reported at batch granularity: this is the wall-clock time
                # for the whole submitted batch through this model, not an
                # isolated per-message measurement. Batching is what makes
                # multi-message requests efficient (see registry.py).
                latencyMs=batch.latency_ms,
            )

        results.append(
            MessagePrediction(
                id=message.id,
                text=message.text,
                models=model_predictions,
            )
        )

    return PredictResponse(results=results)
