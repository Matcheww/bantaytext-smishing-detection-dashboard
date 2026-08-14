import { NextResponse } from "next/server";
import { unstable_checkRateLimit as checkVercelRateLimit } from "@vercel/firewall";
import type { PredictRequest, PredictRequestMessage } from "@/lib/types/model";
import {
  callInferenceService,
  InferenceNotConfiguredError,
  InferenceServiceError,
} from "@/lib/inference/inference-client";
import { MAX_MESSAGES, MAX_MESSAGE_LENGTH } from "@/lib/analyze/parse-messages";
import { checkRateLimit as checkLocalRateLimit, getClientIp } from "@/lib/rate-limit/rate-limiter";

// Vercel serverless functions run as independent, short-lived instances —
// an in-memory counter (lib/rate-limit/rate-limiter.ts) does NOT share state
// across them, so it's not a reliable defense on Vercel. This ID must match
// a Rate Limiting rule configured in the Vercel dashboard (Firewall tab):
// condition "Rate Limit" -> ID "predict-api". See inference-service/README.md
// and the Next.js README for setup steps.
const VERCEL_RATE_LIMIT_ID = "predict-api";

// Inference (especially mBERT) is compute-expensive per call, so this limit
// is intentionally tighter than a typical read endpoint. Tune via env vars
// if your deployment's traffic patterns warrant it. Only used as the
// fallback path (local dev, or a non-Vercel deployment) — see
// checkPredictRateLimit below.
const RATE_LIMIT = Number(process.env.PREDICT_RATE_LIMIT ?? 10);
const RATE_LIMIT_WINDOW_MS = Number(process.env.PREDICT_RATE_LIMIT_WINDOW_MS ?? 60_000);

// Vercel Hobby's hard maximum is 60s; Pro/Enterprise can go higher (up to
// 300s / 900s respectively). 60 is a safe default that works everywhere —
// raise it if you're on Pro/Enterprise and see real inference timeouts.
export const maxDuration = 60;

interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
  /** Which layer actually made the decision — useful in logs while debugging setup. */
  source: "vercel-firewall" | "in-memory-fallback";
}

async function checkPredictRateLimit(request: Request): Promise<RateLimitDecision> {
  // @vercel/firewall has a hardcoded dev-mode shortcut: when
  // NODE_ENV !== "production" and no `firewallHostForDevelopment` option is
  // given, it ALWAYS returns { rateLimited: false } with no error field —
  // indistinguishable from a genuine "allowed" result. Trusting that would
  // silently disable rate limiting during `next dev`. So we replicate that
  // same condition here and skip straight to the in-memory limiter outside
  // production, which is what you actually want locally anyway.
  if (process.env.NODE_ENV === "production") {
    try {
      const result = await checkVercelRateLimit(VERCEL_RATE_LIMIT_ID, { request });

      if (result.error === "blocked") {
        // Already blocked by the firewall for another reason (e.g. a WAF rule).
        return { allowed: false, retryAfterSeconds: 60, source: "vercel-firewall" };
      }
      if (!result.error) {
        // A matching rule exists and was evaluated — this is real, globally
        // consistent rate limiting via Vercel's edge infrastructure.
        return {
          allowed: !result.rateLimited,
          retryAfterSeconds: result.rateLimited ? 60 : 0,
          source: "vercel-firewall",
        };
      }
      // result.error === "not-found": no matching rule configured in the
      // Vercel dashboard yet, OR this is a non-Vercel production deployment
      // (e.g. self-hosted `next start`) where the Vercel Firewall endpoint
      // simply doesn't exist — fall through to the local limiter either way.
    } catch {
      // The check itself failed outright — e.g. a self-hosted production
      // deployment where the Vercel Firewall endpoint isn't reachable at all.
    }
  }

  const clientIp = getClientIp(request);
  const localResult = checkLocalRateLimit(`predict:${clientIp}`, {
    limit: RATE_LIMIT,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  return { allowed: localResult.allowed, retryAfterSeconds: localResult.retryAfterSeconds, source: "in-memory-fallback" };
}

function isValidMessage(value: unknown): value is PredictRequestMessage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.text === "string" &&
    candidate.text.trim().length > 0 &&
    candidate.text.length <= MAX_MESSAGE_LENGTH
  );
}

function validateRequest(body: unknown): { messages: PredictRequestMessage[] } | { error: string } {
  if (typeof body !== "object" || body === null || !("messages" in body)) {
    return { error: "Request body must be a JSON object with a 'messages' array." };
  }

  const { messages } = body as PredictRequest;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: "'messages' must be a non-empty array." };
  }

  if (messages.length > MAX_MESSAGES) {
    return { error: `A maximum of ${MAX_MESSAGES} messages can be submitted per request.` };
  }

  if (!messages.every(isValidMessage)) {
    return {
      error: `Each message must have a numeric 'id' and non-empty 'text' of at most ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  return { messages };
}

export async function POST(request: Request) {
  const rateLimitDecision = await checkPredictRateLimit(request);

  if (!rateLimitDecision.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests.",
        detail:
          rateLimitDecision.source === "vercel-firewall"
            ? "Rate limit exceeded. Try again shortly."
            : `Rate limit exceeded (${RATE_LIMIT} requests per ${RATE_LIMIT_WINDOW_MS / 1000}s). Try again shortly.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimitDecision.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validated = validateRequest(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const result = await callInferenceService({ messages: validated.messages });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof InferenceNotConfiguredError) {
      // Deliberately not fabricating predictions here. The four trained
      // models (mBERT, distilled student, raw student, TF-IDF+NB) must be
      // served by a real inference backend before this endpoint can return
      // results — see lib/inference/inference-client.ts.
      return NextResponse.json(
        {
          error: "Inference service not configured.",
          detail:
            "No INFERENCE_API_URL is set. Predictions require a running backend that has loaded the actual exported model artifacts (fine_tuned_teacher_model/, best_distilled_student_model.pth, best_raw_student_model.pth, traditional_spam_classifier.joblib).",
        },
        { status: 503 }
      );
    }

    if (err instanceof InferenceServiceError) {
      return NextResponse.json(
        { error: "Inference service error.", detail: err.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Unexpected server error.", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
