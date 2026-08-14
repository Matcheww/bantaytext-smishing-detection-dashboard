"""
Configuration for the BantayText inference service.

Paths are overridable via environment variables so the artifacts directory
can live outside the repo (e.g. mounted in a container) without code
changes. Defaults assume the four exported files from the notebook are
placed directly under `inference-service/artifacts/`.
"""

import os

from dotenv import load_dotenv

# Loads `inference-service/.env` into the process environment, if present.
# This runs before any os.environ.get() calls below, and before main.py
# reads INFERENCE_SERVICE_SECRET / ALLOWED_ORIGINS, since this module is
# imported first. Safe to call even if no .env file exists (no-op then) —
# so `python -m uvicorn app.main:app --port 8000` picks up .env
# automatically, without needing the `--env-file` flag.
load_dotenv()

ARTIFACTS_DIR = os.environ.get("BANTAYTEXT_ARTIFACTS_DIR", os.path.join(os.path.dirname(__file__), "..", "artifacts"))

TEACHER_MODEL_DIR = os.environ.get(
    "TEACHER_MODEL_DIR", os.path.join(ARTIFACTS_DIR, "fine_tuned_teacher_model")
)
DISTILLED_STUDENT_CHECKPOINT = os.environ.get(
    "DISTILLED_STUDENT_CHECKPOINT", os.path.join(ARTIFACTS_DIR, "best_distilled_student_model.pth")
)
RAW_STUDENT_CHECKPOINT = os.environ.get(
    "RAW_STUDENT_CHECKPOINT", os.path.join(ARTIFACTS_DIR, "best_raw_student_model.pth")
)
TRADITIONAL_MODEL_PATH = os.environ.get(
    "TRADITIONAL_MODEL_PATH", os.path.join(ARTIFACTS_DIR, "traditional_spam_classifier.joblib")
)

# Must match the notebook's MAX_SEQ_LENGTH exactly — the student and teacher
# models were trained/evaluated with this truncation length.
MAX_SEQ_LENGTH = 128

# Same tokenizer/vocab used to train and fine-tune the teacher; the student
# models reuse it (see notebook Section 9.1 "Load the saved fine-tuned
# teacher for logit extraction").
TOKENIZER_SOURCE = TEACHER_MODEL_DIR
