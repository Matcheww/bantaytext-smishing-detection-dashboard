# BantayText Inference Service

A small FastAPI service that loads the four models trained in
`BantayText_Refactored.ipynb` and exposes them behind a single
`POST /predict` endpoint, matching the contract the Next.js app expects
(`lib/types/model.ts`).

This is kept as a **separate service** from the Next.js frontend on
purpose — per the project architecture, the frontend never runs PyTorch
models directly.

## 1. Add the trained model artifacts

Copy the four files produced by the notebook into `artifacts/`:

```
inference-service/artifacts/
├── fine_tuned_teacher_model/          # directory, from trainer.save_model()
├── best_distilled_student_model.pth
├── best_raw_student_model.pth
└── traditional_spam_classifier.joblib
```

These are **not** included in this repo — they're large binary model
files produced by running the notebook end-to-end. If a file is missing,
that model is simply marked unavailable at startup (`GET /health` shows
which ones loaded) and `/predict` returns `null` for it rather than a
fabricated result.

You can override the artifact locations instead of copying files, via
environment variables — see `app/config.py`:

```bash
export BANTAYTEXT_ARTIFACTS_DIR=/path/to/artifacts
# or individually:
export TEACHER_MODEL_DIR=/path/to/fine_tuned_teacher_model
export DISTILLED_STUDENT_CHECKPOINT=/path/to/best_distilled_student_model.pth
export RAW_STUDENT_CHECKPOINT=/path/to/best_raw_student_model.pth
export TRADITIONAL_MODEL_PATH=/path/to/traditional_spam_classifier.joblib
```

## 2. Install dependencies

```bash
cd inference-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Run the service

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Check `http://localhost:8000/health` — it reports which of the four
models loaded successfully.

## 4. Point the Next.js app at it

In the Next.js project root, set:

```bash
# .env.local
INFERENCE_API_URL=http://localhost:8000
```

Restart `next dev`, and the Analyze page's `/api/predict` route will
proxy to this service instead of returning the "not configured" message.

## Security

- **CORS**: defaults to allowing only `http://localhost:3000` /
  `http://127.0.0.1:3000`. Set `ALLOWED_ORIGINS` (comma-separated) to your
  actual deployed frontend origin(s) before deploying anywhere else.
- **Shared secret**: set `INFERENCE_SERVICE_SECRET` to the same random
  value on both this service and the Next.js app's `INFERENCE_SERVICE_SECRET`
  env var to require a matching `X-Inference-Secret` header on `/predict`
  and `/models/tfidf-nb/vocabulary`. Unset by default so local dev doesn't
  need extra setup — this matters once the service might be reachable
  beyond `localhost`.
- **Rate limiting** happens on the Next.js side (`/api/predict`), not here
  — this service has no built-in rate limiting of its own, since it's not
  meant to be exposed directly to end users.

## Notes

- **Latency** reported by `/predict` is measured per model, per batch —
  i.e. the wall-clock time to run all submitted messages through that
  model at once, not an isolated single-message timing. This is the
  number that's actually measured (not fabricated); see the comment in
  `app/main.py`.
- **Confidence** is the softmax probability of the predicted class for
  the neural models, and `predict_proba` for the Naive Bayes pipeline.
- The student model class definitions in `app/models/student.py` are
  transcribed verbatim from the notebook — do not edit their layer
  shapes/names without also retraining, or the saved checkpoints will
  fail to load.
