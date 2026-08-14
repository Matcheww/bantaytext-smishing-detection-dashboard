"""
Loads the four trained BantayText models once at process startup and
exposes a uniform `predict_batch(texts) -> list[(label, probability)]`
interface for each, so `app/main.py` can treat them interchangeably.

This module deliberately does NOT fabricate anything: if an artifact file
is missing, that model is marked unavailable and `/predict` returns `null`
for it rather than a made-up prediction (see `app/main.py`).
"""

import logging
import os
import time
from dataclasses import dataclass
from typing import Optional

import joblib
import torch
import torch.nn.functional as F
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.config import (
    DISTILLED_STUDENT_CHECKPOINT,
    MAX_SEQ_LENGTH,
    RAW_STUDENT_CHECKPOINT,
    TEACHER_MODEL_DIR,
    TOKENIZER_SOURCE,
    TRADITIONAL_MODEL_PATH,
)
from app.models.student import RawStudentNN, SelfContainedStudentNN

logger = logging.getLogger("bantaytext.registry")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


@dataclass
class BatchPrediction:
    labels: list[str]  # "spam" | "ham", one per input text
    probabilities: list[Optional[float]]  # confidence of the predicted class
    latency_ms: float  # wall-clock time for the whole batch call


class ModelRegistry:
    """Lazily-initialized singleton holding all loaded models."""

    def __init__(self) -> None:
        self.tokenizer: Optional[AutoTokenizer] = None
        self.teacher_model = None
        self.distilled_student: Optional[SelfContainedStudentNN] = None
        self.raw_student: Optional[RawStudentNN] = None
        self.traditional_pipeline = None
        self.availability: dict[str, bool] = {
            "teacher_mbert": False,
            "distilled_student": False,
            "raw_student": False,
            "tfidf_nb": False,
        }

    def load_all(self) -> None:
        self._load_tokenizer_and_teacher()
        self._load_students()
        self._load_traditional()
        logger.info("Model availability: %s", self.availability)

    def _load_tokenizer_and_teacher(self) -> None:
        if not os.path.isdir(TEACHER_MODEL_DIR):
            logger.warning("Teacher model directory not found at %s — mBERT and both student "
                            "models (which share its tokenizer) will be unavailable.", TEACHER_MODEL_DIR)
            return
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_SOURCE)
            self.teacher_model = AutoModelForSequenceClassification.from_pretrained(TEACHER_MODEL_DIR)
            self.teacher_model.to(DEVICE)
            self.teacher_model.eval()
            self.availability["teacher_mbert"] = True
        except Exception:
            logger.exception("Failed to load teacher model / tokenizer from %s", TEACHER_MODEL_DIR)

    def _load_students(self) -> None:
        if self.tokenizer is None:
            return  # students depend on the teacher's tokenizer/vocab

        vocab_size = self.tokenizer.vocab_size

        if os.path.isfile(DISTILLED_STUDENT_CHECKPOINT):
            try:
                model = SelfContainedStudentNN(vocab_size=vocab_size)
                model.load_state_dict(torch.load(DISTILLED_STUDENT_CHECKPOINT, map_location=DEVICE))
                model.to(DEVICE)
                model.eval()
                self.distilled_student = model
                self.availability["distilled_student"] = True
            except Exception:
                logger.exception("Failed to load distilled student checkpoint at %s", DISTILLED_STUDENT_CHECKPOINT)
        else:
            logger.warning("Distilled student checkpoint not found at %s", DISTILLED_STUDENT_CHECKPOINT)

        if os.path.isfile(RAW_STUDENT_CHECKPOINT):
            try:
                model = RawStudentNN(vocab_size=vocab_size)
                model.load_state_dict(torch.load(RAW_STUDENT_CHECKPOINT, map_location=DEVICE))
                model.to(DEVICE)
                model.eval()
                self.raw_student = model
                self.availability["raw_student"] = True
            except Exception:
                logger.exception("Failed to load raw student checkpoint at %s", RAW_STUDENT_CHECKPOINT)
        else:
            logger.warning("Raw student checkpoint not found at %s", RAW_STUDENT_CHECKPOINT)

    def _load_traditional(self) -> None:
        if not os.path.isfile(TRADITIONAL_MODEL_PATH):
            logger.warning("Traditional model not found at %s", TRADITIONAL_MODEL_PATH)
            return
        try:
            self.traditional_pipeline = joblib.load(TRADITIONAL_MODEL_PATH)
            self.availability["tfidf_nb"] = True
        except Exception:
            logger.exception("Failed to load traditional model at %s", TRADITIONAL_MODEL_PATH)

    # -- Inference -----------------------------------------------------------

    def predict_teacher(self, texts: list[str]) -> BatchPrediction:
        start = time.perf_counter()
        tokens = self.tokenizer(
            texts, padding=True, truncation=True, max_length=MAX_SEQ_LENGTH, return_tensors="pt"
        ).to(DEVICE)
        with torch.no_grad():
            logits = self.teacher_model(**tokens).logits
        probs = F.softmax(logits, dim=1)
        predicted_classes = torch.argmax(probs, dim=1)
        confidences = probs.gather(1, predicted_classes.unsqueeze(1)).squeeze(1)
        latency_ms = (time.perf_counter() - start) * 1000

        labels = ["spam" if c.item() == 1 else "ham" for c in predicted_classes]
        return BatchPrediction(labels=labels, probabilities=confidences.tolist(), latency_ms=latency_ms)

    def _predict_student(self, model: torch.nn.Module, texts: list[str]) -> BatchPrediction:
        start = time.perf_counter()
        tokens = self.tokenizer(
            texts, padding=True, truncation=True, max_length=MAX_SEQ_LENGTH, return_tensors="pt"
        ).to(DEVICE)
        with torch.no_grad():
            logits = model(tokens["input_ids"], tokens["attention_mask"])
        probs = F.softmax(logits, dim=1)
        predicted_classes = torch.argmax(probs, dim=1)
        confidences = probs.gather(1, predicted_classes.unsqueeze(1)).squeeze(1)
        latency_ms = (time.perf_counter() - start) * 1000

        labels = ["spam" if c.item() == 1 else "ham" for c in predicted_classes]
        return BatchPrediction(labels=labels, probabilities=confidences.tolist(), latency_ms=latency_ms)

    def predict_distilled_student(self, texts: list[str]) -> BatchPrediction:
        return self._predict_student(self.distilled_student, texts)

    def predict_raw_student(self, texts: list[str]) -> BatchPrediction:
        return self._predict_student(self.raw_student, texts)

    def predict_traditional(self, texts: list[str]) -> BatchPrediction:
        start = time.perf_counter()
        predicted_classes = self.traditional_pipeline.predict(texts)
        # MultinomialNB exposes predict_proba; use it for a real confidence score
        # rather than reporting `None` when it's available.
        probabilities: list[Optional[float]]
        if hasattr(self.traditional_pipeline, "predict_proba"):
            proba_matrix = self.traditional_pipeline.predict_proba(texts)
            probabilities = [float(row[cls]) for row, cls in zip(proba_matrix, predicted_classes)]
        else:
            probabilities = [None] * len(texts)
        latency_ms = (time.perf_counter() - start) * 1000

        labels = ["spam" if c == 1 else "ham" for c in predicted_classes]
        return BatchPrediction(labels=labels, probabilities=probabilities, latency_ms=latency_ms)

    def get_traditional_vocabulary_stats(self, top_n: int = 15) -> Optional[dict]:
        """
        Real, measured statistics pulled directly from the loaded TF-IDF +
        Naive Bayes pipeline — not fabricated. Returns None if the pipeline
        isn't loaded or doesn't expose the expected sklearn attributes.

        "Top indicative terms" are derived from the classifier's actual
        learned `feature_log_prob_` (the log-probability of each feature
        given each class) — the difference in log-probability between the
        scam and ham classes for a given n-gram is a standard, principled
        measure of how strongly that n-gram pushes Naive Bayes toward one
        class over the other. This is a legitimate model-derived statistic,
        not an invented one.
        """
        if self.traditional_pipeline is None:
            return None

        try:
            vectorizer = self.traditional_pipeline.named_steps.get("tfidf")
            classifier = self.traditional_pipeline.named_steps.get("classifier")
            if vectorizer is None or classifier is None:
                return None

            vocabulary_size = len(vectorizer.vocabulary_)
            feature_names = vectorizer.get_feature_names_out()

            classes = list(classifier.classes_)
            if 1 not in classes or 0 not in classes:
                return {
                    "vocabularySize": vocabulary_size,
                    "ngramRange": list(vectorizer.ngram_range),
                    "topScamIndicativeTerms": [],
                    "topHamIndicativeTerms": [],
                }
            spam_idx = classes.index(1)
            ham_idx = classes.index(0)

            # feature_log_prob_ shape: (n_classes, n_features)
            log_prob_diff = classifier.feature_log_prob_[spam_idx] - classifier.feature_log_prob_[ham_idx]
            top_scam_indices = log_prob_diff.argsort()[::-1][:top_n]
            top_ham_indices = log_prob_diff.argsort()[:top_n]

            return {
                "vocabularySize": vocabulary_size,
                "ngramRange": list(vectorizer.ngram_range),
                "topScamIndicativeTerms": [str(feature_names[i]) for i in top_scam_indices],
                "topHamIndicativeTerms": [str(feature_names[i]) for i in top_ham_indices],
            }
        except Exception:
            logger.exception("Failed to compute TF-IDF vocabulary stats")
            return None


registry = ModelRegistry()
