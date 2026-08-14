import type { Metadata } from "next";
import { MODELS } from "@/lib/models/metadata";
import { getTfidfVocabularyStats } from "@/lib/inference/inference-client";
import { ModelDashboard } from "@/components/models/model-dashboard";

export const metadata: Metadata = {
  title: "TF-IDF + Naive Bayes — BantayText",
  description: "Traditional ML baseline performance dashboard — the paper's recommended on-device model.",
};

// This page fetches live stats from the inference service on every request
// (not cached, not baked in at build time) so it reflects whichever model
// is actually loaded right now. Forced dynamic explicitly: if
// INFERENCE_API_URL is unset at build time, `getTfidfVocabularyStats()`
// short-circuits before calling `fetch()`, so Next can't auto-detect the
// dynamic data dependency and would otherwise statically freeze this page.
export const dynamic = "force-dynamic";

// The underlying fetch has its own 10s AbortSignal timeout
// (lib/inference/inference-client.ts); this gives a small safety margin
// above that so the function itself doesn't get killed first on Vercel's
// default 10s Hobby timeout.
export const maxDuration = 15;

const pipelineSteps = ["SMS", "TF-IDF", "Multinomial Naive Bayes", "Spam / Ham"];

export default async function TfidfNaiveBayesPage() {
  const vocabStats = await getTfidfVocabularyStats();

  return (
    <ModelDashboard
      model={MODELS.tfidf_nb}
      extra={
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Pipeline
            </h2>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              {pipelineSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                    {step}
                  </span>
                  {i < pipelineSteps.length - 1 && (
                    <span aria-hidden className="text-zinc-400 dark:text-zinc-600">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Vocabulary &amp; feature statistics
            </h2>
            {vocabStats ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Vocabulary size
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {vocabStats.vocabularySize.toLocaleString()} terms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      N-gram range
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {vocabStats.ngramRange[0]}–{vocabStats.ngramRange[1]}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
                      Most scam-indicative terms
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {vocabStats.topScamIndicativeTerms.map((term) => (
                        <li
                          key={term}
                          className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400"
                        >
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Most ham-indicative terms
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {vocabStats.topHamIndicativeTerms.map((term) => (
                        <li
                          key={term}
                          className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        >
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  Indicative terms are ranked by the difference in the Naive Bayes classifier&apos;s learned
                  log-probability between the scam and ham classes for each n-gram — a real statistic
                  extracted from the trained model, not an estimate.
                </p>
              </div>
            ) : (
              <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                Vocabulary statistics are unavailable — the inference service isn&apos;t reachable, or the
                TF-IDF + Naive Bayes model hasn&apos;t loaded. These stats are computed live from the running
                model, not cached, so they require the inference service to be up.
              </p>
            )}
          </section>
        </>
      }
    />
  );
}
