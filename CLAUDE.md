@AGENTS.md
# BantayText — Claude Code Instructions

## Project Overview

BantayText is an SMS scam-detection web application built around four trained machine-learning models.

The application allows users to submit one or multiple SMS messages, runs all four models on the same messages, and presents their predictions for comparison.

The project is intended to demonstrate **machine learning, data analytics, model evaluation, and full-stack application development**.

The existing Next.js project should be extended rather than rebuilt.

---

## Core Requirements

### Main Analysis Page

The main page is the primary user-facing feature.

Provide **one SMS text input window** that supports:

- A single SMS message
- Multiple SMS messages

Do not create separate input pages for single and multiple messages.

The submitted text should be:

1. Cleaned and preprocessed according to the ML notebook.
2. Parsed into individual messages when multiple messages are provided.
3. Structured into JSON.
4. Sent to the inference backend.
5. Classified by **all four models**.

Conceptual structure:

```json
{
  "messages": [
    {
      "id": 1,
      "text": "Example SMS"
    }
  ]
}
```

After inference, show the prediction from all four models on the same page.

Each result should clearly indicate:

- Spam/Ham classification
- Confidence/probability when available
- Model name
- Inference latency when available

For multiple messages, use a clear table or expandable result layout.

Do not fabricate predictions, confidence scores, or latency values.

---

## Model Pages

Create exactly four model-specific pages:

```text
/models/mbert
/models/distilled-student
/models/raw-student
/models/tfidf-naive-bayes
```

Each page must contain **statistics and visualizations relevant to that model only**.

Do not turn individual model pages into general comparison dashboards.

### mBERT

Focus on the Teacher/mBERT model.

Relevant content includes, where supported by the notebook:

- Architecture
- Model size
- Accuracy
- Precision
- Recall
- F1
- Confusion matrix
- Classification results
- Prediction/confidence distributions

### Distilled Student

Focus on the knowledge-distilled neural network.

Relevant content includes:

- Architecture
- Distillation configuration
- Accuracy
- Precision
- Recall
- F1
- Confusion matrix
- Model size
- Relevant performance visualizations

Notebook configuration:

```text
Embedding dimension: 128
Hidden dimension: 128
Classes: 2
Temperature: 3.0
KD alpha: 0.7
```

### Raw Student

Focus on the neural network trained without knowledge distillation.

Relevant content includes:

- Architecture
- Accuracy
- Precision
- Recall
- F1
- Confusion matrix
- Model size
- Relevant performance visualizations

### TF-IDF + Naive Bayes

Focus on the traditional ML pipeline:

```text
SMS
 ↓
TF-IDF
 ↓
Multinomial Naive Bayes
 ↓
Spam / Ham
```

Relevant content includes:

- Accuracy
- Precision
- Recall
- F1
- Confusion matrix
- Model size
- TF-IDF-related statistics
- Vocabulary/feature information when supported by the exported model

Do not fabricate feature importance or vocabulary statistics.

---

## Model Comparison Page

Create one dedicated comparison page:

```text
/models/comparison
```

This page should focus exclusively on comparing the four models.

Compare:

- Accuracy
- Precision
- Recall
- F1
- Model size
- Other relevant performance/deployment metrics supported by the notebook

Use appropriate comparative visualizations such as:

- Accuracy comparison
- F1 comparison
- Recall comparison
- Model-size comparison
- Performance comparison tables

Reported results:

| Model | Accuracy | Scam F1 | Scam Recall | Approx. Size |
|---|---:|---:|---:|---:|
| Teacher — mBERT | 98.4% | 0.970 | 0.966 | ~680 MB |
| Distilled Student | 97.0% | 0.943 | 0.917 | 58.45 MB |
| Raw Student | 96.3% | 0.931 | 0.926 | 58.45 MB |
| TF-IDF + Naive Bayes | 97.6% | 0.954 | 0.928 | 3.63 MB |

The comparison page should answer:

> How do the four models compare in classification performance and deployment tradeoffs?

---

## ML Models

The four actual models are:

1. Teacher — mBERT
2. Distilled Student — Neural Network
3. Raw Student — Neural Network
4. TF-IDF + Multinomial Naive Bayes

Relevant exported artifacts include:

```text
fine_tuned_teacher_model/
best_distilled_student_model.pth
best_raw_student_model.pth
traditional_spam_classifier.joblib

mobile_distilled_student_classifier.pt
mobile_distilled_student_classifier_quantized.pt
mobile_raw_student_classifier.pt
mobile_raw_student_classifier_quantized.pt
```

Before implementing inference:

- Inspect the actual model files.
- Determine how each model was saved.
- Determine the required tokenizer/preprocessing.
- Follow the notebook's inference procedure.
- Verify that the application is using the actual exported models.

Do not replace the models with another pretrained model or mock implementation.

---

## ML Data

The notebook is the **source of truth** for model preprocessing, evaluation metrics, dataset statistics, and research visualizations.

Important dataset information:

```text
Total messages: 10,258
Scam:           2,776
Ham:            7,482

Train:          7,180 (70%)
Validation:     1,026 (10%)
Test:           2,052 (20%)
```

Transformer/student models use:

```text
MAX_SEQ_LENGTH = 128
```

Follow the notebook's preprocessing rather than inventing a new preprocessing pipeline.

---

## Architecture

The frontend and ML inference should remain separated.

Preferred architecture:

```text
Next.js Frontend
       ↓
Inference API / Backend
       ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ mBERT        │ Distilled NN │ Raw Student  │ TF-IDF + NB │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Do not execute large Python/PyTorch models directly in the browser.

Do not expose model files through the public frontend.

Models should be loaded once where practical rather than reloaded for every request.

For multiple messages, use batched inference where appropriate.

---

## API

Maintain a clean typed inference boundary.

Conceptual endpoint:

```text
POST /api/predict
```

Conceptual request:

```json
{
  "messages": [
    {
      "id": 1,
      "text": "Example SMS"
    }
  ]
}
```

Conceptual response:

```json
{
  "results": [
    {
      "id": 1,
      "text": "Example SMS",
      "models": {
        "teacher_mbert": {
          "label": "spam",
          "probability": 0.98
        },
        "distilled_student": {
          "label": "spam",
          "probability": 0.95
        },
        "raw_student": {
          "label": "spam",
          "probability": 0.92
        },
        "tfidf_nb": {
          "label": "spam",
          "probability": 0.96
        }
      }
    }
  ]
}
```

Adapt this contract to the actual backend implementation.

Use TypeScript types for request and response structures.

---

## UI Guidelines

The application should feel like a **professional ML/data analytics platform**.

Prioritize:

- Clear information hierarchy
- Dashboard-style layouts
- Data visualization
- Metric cards
- Tables
- Responsive design
- Accessibility
- Clean typography
- Restrained animations

Avoid excessive:

- Gradients
- Glassmorphism
- Marketing-style hero sections
- Decorative animations

The purpose of the UI is to communicate **model predictions, model performance, and analytical insights**.

---

## Navigation

Use a structure similar to:

```text
BantayText

Analyze
Models
  ├── mBERT
  ├── Distilled Student
  ├── Raw Student
  ├── TF-IDF + Naive Bayes
  └── Comparison
About
```

Follow existing project conventions where applicable.

---

## Data Visualization Rules

Use the project's existing charting solution when possible.

If a charting library is not already available, use a lightweight library such as Recharts.

Only visualize data that is:

- Directly provided by the notebook/model evaluation, or
- Reliably derived from existing data.

Never create fabricated statistics simply to fill dashboard space.

---

## Engineering Rules

- Inspect the existing codebase before making changes.
- Reuse existing components and conventions where appropriate.
- Avoid unnecessary rewrites.
- Use TypeScript throughout the frontend.
- Avoid unnecessary `any`.
- Centralize model metadata instead of duplicating it.
- Keep model binaries out of public/static directories.
- Do not unnecessarily log raw SMS content.
- Handle loading, validation, API errors, and model failures gracefully.
- If one model fails, preserve successful results from the other models.
- Keep components reusable where there is genuine reuse.
- Prefer simple solutions over unnecessary abstraction.

---

## Development Workflow

Before implementing a feature:

1. Inspect the relevant existing code.
2. Understand how the current application works.
3. Determine whether existing components or utilities can be reused.
4. Make the smallest appropriate change.
5. Run the relevant checks.
6. Fix any resulting errors.

After implementation:

- Run linting.
- Run TypeScript/type checks.
- Run the production build.
- Verify the affected pages.
- Verify that actual model inference is being used.

---

## Important Constraints

### Never

- Fabricate model predictions.
- Fabricate confidence scores.
- Fabricate latency.
- Fabricate evaluation metrics.
- Fabricate graphs or research statistics.
- Replace the actual four models with another model.
- Expose model binaries publicly.
- Rebuild the application unnecessarily.

### Always

- Use the actual exported models.
- Follow the notebook's preprocessing and evaluation methodology.
- Treat the notebook as the source of truth for research data.
- Keep frontend and inference responsibilities separate.
- Keep each model page focused on its own model.
- Keep the comparison page focused on comparing all four models.
- Preserve the existing project's architecture unless there is a clear reason to change it.

---

## Definition of Done

The application should have:

```text
/
└── SMS Analysis
    ├── One input window
    ├── Single or multiple SMS support
    ├── Cleaning/preprocessing
    ├── JSON structuring
    └── Four-model predictions

/models/mbert
└── mBERT-specific dashboard

/models/distilled-student
└── Distilled Student-specific dashboard

/models/raw-student
└── Raw Student-specific dashboard

/models/tfidf-naive-bayes
└── TF-IDF + Naive Bayes-specific dashboard

/models/comparison
└── Four-model comparison dashboard
```

The core user experience is:

> **Enter one or multiple SMS messages → preprocess and structure them → run all four BantayText models → display their Spam/Ham predictions side by side → explore each model individually → compare all four models on a dedicated comparison page.**