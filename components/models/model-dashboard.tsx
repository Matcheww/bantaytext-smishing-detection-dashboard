import type { ReactNode } from "react";
import type { ModelMetadata } from "@/lib/types/model";
import { deriveConfusionMatrix } from "@/lib/models/metadata";
import { MetricCard } from "@/components/ui/metric-card";
import { ClassificationReportTable } from "@/components/ui/classification-report-table";
import { ConfusionMatrix } from "@/components/ui/confusion-matrix";

interface ModelDashboardProps {
  model: ModelMetadata;
  /** Optional extra section rendered after the classification report, for model-specific content. */
  extra?: ReactNode;
}

export function ModelDashboard({ model, extra }: ModelDashboardProps) {
  const matrix = deriveConfusionMatrix(model);
  const report = model.classificationReport;
  const testSetSize = report.ham.support + report.scam.support;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Model dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {model.name}
        </h1>
        <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{model.tagline}</p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{model.description}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Accuracy" value={`${(report.accuracy * 100).toFixed(2)}%`} />
        <MetricCard label="Scam F1-score" value={report.scam.f1.toFixed(3)} />
        <MetricCard label="Scam Recall" value={report.scam.recall.toFixed(3)} />
        <MetricCard label="Model size" value={model.size.label} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Architecture
        </h2>
        <ul className="space-y-1.5 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          {model.architecture.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-zinc-400 dark:text-zinc-600">—</span>
              {line}
            </li>
          ))}
        </ul>
        {model.parameterCount !== null && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {model.parameterCount.toLocaleString()} total parameters
          </p>
        )}
      </section>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Configuration
          </h2>
          <dl className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white text-sm dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-950">
            {model.configuration.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-zinc-500 dark:text-zinc-400">{row.label}</dt>
                <dd className="text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Confusion matrix (test set, n = {testSetSize})
          </h2>
          <ConfusionMatrix matrix={matrix} />
        </section>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Classification report
        </h2>
        <ClassificationReportTable report={report} />
      </section>

      {extra}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Saved artifacts
        </h2>
        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {model.artifacts.map((path) => (
            <li key={path} className="font-mono text-xs">
              {path}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
