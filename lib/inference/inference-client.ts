import type { PredictRequest, PredictResponse, TfidfVocabularyStats } from "@/lib/types/model";

/**
 * The Next.js app never runs the PyTorch/mBERT/TF-IDF models directly — per
 * the project's architecture, inference happens in a separate backend
 * service that has the actual exported model artifacts
 * (fine_tuned_teacher_model/, best_distilled_student_model.pth,
 * best_raw_student_model.pth, traditional_spam_classifier.joblib) loaded.
 *
 * That service is expected to expose a POST /predict endpoint matching the
 * PredictRequest / PredictResponse contract in `lib/types/model.ts`.
 *
 * INFERENCE_API_URL is intentionally unset until that service exists and is
 * deployed alongside the model files — see /api/predict/route.ts for how the
 * "not configured" case is surfaced to the UI instead of fabricating results.
 */

export class InferenceNotConfiguredError extends Error {
  constructor() {
    super("INFERENCE_API_URL is not configured.");
    this.name = "InferenceNotConfiguredError";
  }
}

export class InferenceServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "InferenceServiceError";
  }
}

export async function callInferenceService(request: PredictRequest): Promise<PredictResponse> {
  const baseUrl = process.env.INFERENCE_API_URL;

  if (!baseUrl) {
    throw new InferenceNotConfiguredError();
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: buildInferenceHeaders(),
      body: JSON.stringify(request),
      // Model inference (especially mBERT) can be slow; give it room.
      signal: AbortSignal.timeout(30_000),
    });
  } catch (cause) {
    throw new InferenceServiceError(
      `Could not reach the inference service at ${baseUrl}: ${(cause as Error).message}`
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new InferenceServiceError(
      `Inference service returned ${response.status}: ${body || response.statusText}`,
      response.status
    );
  }

  return (await response.json()) as PredictResponse;
}

/**
 * Fetch real TF-IDF vocabulary statistics from the inference service.
 * Returns null (never throws) if the service isn't configured, unreachable,
 * or the stats aren't available — callers should render a graceful
 * "not available" fallback rather than an error state, since this is
 * supplementary dashboard content, not a user-initiated action.
 */
export async function getTfidfVocabularyStats(): Promise<TfidfVocabularyStats | null> {
  const baseUrl = process.env.INFERENCE_API_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models/tfidf-nb/vocabulary`, {
      method: "GET",
      headers: buildInferenceHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as TfidfVocabularyStats;
  } catch {
    return null;
  }
}

/**
 * Shared-secret header sent on every request to the inference service.
 * Cheap defense-in-depth: if the inference service is ever reachable
 * beyond localhost (misconfigured firewall, moved to a shared network,
 * etc.), this stops it from serving arbitrary callers who don't know the
 * secret. Only applied when INFERENCE_SERVICE_SECRET is actually set —
 * unset by default so local dev works without extra configuration; the
 * FastAPI side mirrors this (see inference-service/app/main.py).
 */
function buildInferenceHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.INFERENCE_SERVICE_SECRET;
  if (secret) {
    headers["X-Inference-Secret"] = secret;
  }
  return headers;
}