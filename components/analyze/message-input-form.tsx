"use client";

import { useState } from "react";
import { parseMessages, MAX_MESSAGES } from "@/lib/analyze/parse-messages";
import type { MessagePrediction, PredictErrorResponse, PredictResponse } from "@/lib/types/model";
import { ResultsTable } from "@/components/analyze/results-table";

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; results: MessagePrediction[] }
  | { status: "not-configured"; detail?: string }
  | { status: "rate-limited"; detail?: string; retryAfterSeconds?: number }
  | { status: "error"; message: string };

const PLACEHOLDER = `Congratulations! You've won a P50,000 GCash raffle. Click bit.ly/claim-now to claim your prize before it expires.
Hi Ma'am, this is your OTP for BDO online banking: 482913. Do not share this with anyone.
Kuya, pwede pahiram ng 500? Babayaran ko bukas, promise.`;

export function MessageInputForm() {
  const [rawInput, setRawInput] = useState("");
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  const { messages, warnings } = parseMessages(rawInput);
  const canSubmit = messages.length > 0 && state.status !== "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setState({ status: "loading" });

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (response.status === 503) {
        const errorBody = (await response.json()) as PredictErrorResponse;
        setState({ status: "not-configured", detail: errorBody.detail });
        return;
      }

      if (response.status === 429) {
        const errorBody = (await response.json().catch(() => null)) as PredictErrorResponse | null;
        const retryAfterHeader = response.headers.get("Retry-After");
        setState({
          status: "rate-limited",
          detail: errorBody?.detail,
          retryAfterSeconds: retryAfterHeader ? Number(retryAfterHeader) : undefined,
        });
        return;
      }

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as PredictErrorResponse | null;
        setState({
          status: "error",
          message: errorBody?.detail ?? errorBody?.error ?? `Request failed (${response.status}).`,
        });
        return;
      }

      const data = (await response.json()) as PredictResponse;
      setState({ status: "success", results: data.results });
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Analyze SMS messages
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Paste one message, or several — one per line. Every model (mBERT, Distilled Student, Raw
          Student, TF-IDF + Naive Bayes) will classify each message independently for comparison.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={7}
          maxLength={MAX_MESSAGES * 1001}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {messages.length} message{messages.length === 1 ? "" : "s"} detected
            {messages.length > 0 && ` · up to ${MAX_MESSAGES} per submission`}
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {state.status === "loading" ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {warnings.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-amber-600 dark:text-amber-400">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </form>

      {state.status === "not-configured" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Inference backend not connected yet</p>
          <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">
            {state.detail ??
              "The four trained models need to be served by a backend before predictions can be shown here."}
          </p>
        </div>
      )}

      {state.status === "rate-limited" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Slow down a little</p>
          <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">
            {state.detail ?? "You've hit the request limit."}
            {state.retryAfterSeconds !== undefined &&
              ` Try again in about ${state.retryAfterSeconds}s.`}
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 text-red-800/90 dark:text-red-300/90">{state.message}</p>
        </div>
      )}

      {state.status === "success" && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Results
          </h2>
          <ResultsTable results={state.results} />
        </div>
      )}
    </div>
  );
}
