"""
Request/response schemas for the BantayText inference service.

These mirror `lib/types/model.ts` in the Next.js app exactly. If you change
a field here, update that file too (and vice versa) — the two are the
contract boundary between the frontend and this service.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field

ModelId = Literal["teacher_mbert", "distilled_student", "raw_student", "tfidf_nb"]
PredictionLabel = Literal["spam", "ham"]


class PredictRequestMessage(BaseModel):
    id: int
    text: str = Field(min_length=1, max_length=1000)


class PredictRequest(BaseModel):
    messages: list[PredictRequestMessage] = Field(min_length=1, max_length=50)


class ModelPrediction(BaseModel):
    """
    Always present per model in a response — never a bare `null`. When a
    model is unavailable (not loaded at startup) or inference failed for
    this specific request, `label`/`probability`/`latencyMs` are null and
    `error` explains why, so the UI can distinguish "model unavailable"
    from "model failed on this input" instead of showing an unexplained gap.
    """

    label: Optional[PredictionLabel] = None
    probability: Optional[float] = None
    latencyMs: Optional[float] = None  # noqa: N815 (camelCase to match the TS contract)
    error: Optional[str] = None


class MessagePrediction(BaseModel):
    id: int
    text: str
    models: dict[ModelId, ModelPrediction]
    error: Optional[str] = None


class PredictResponse(BaseModel):
    results: list[MessagePrediction]


class TfidfVocabularyStats(BaseModel):
    """Real statistics extracted from the loaded TF-IDF + Naive Bayes pipeline."""

    vocabularySize: int  # noqa: N815
    ngramRange: list[int]  # noqa: N815
    topScamIndicativeTerms: list[str]  # noqa: N815
    topHamIndicativeTerms: list[str]  # noqa: N815
