import type { Metadata } from "next";
import Link from "next/link";
import { MODEL_LIST } from "@/lib/models/metadata";
import { MetricComparisonChart } from "@/components/charts/metric-comparison-chart";
import { GroupedMetricsChart } from "@/components/charts/grouped-metrics-chart";

export const metadata: Metadata = {
  title: "Model Comparison — BantayText",
  description: "Side-by-side comparison of all four BantayText SMS scam detection models.",
};

export default function ComparisonPage() {
  const accuracyData = MODEL_LIST.map((m) => ({
    name: m.shortName,
    value: m.classificationReport.accuracy,
  }));

  const scamF1Data = MODEL_LIST.map((m) => ({
    name: m.shortName,
    value: m.classificationReport.scam.f1,
  }));

  const scamRecallData = MODEL_LIST.map((m) => ({
    name: m.shortName,
    value: m.classificationReport.scam.recall,
  }));

  // Teacher (mBERT, ~681 MB) is excluded here so the three much smaller
  // models remain visually distinguishable from one another.
  const sizeData = MODEL_LIST.filter((m) => m.id !== "teacher_mbert").map((m) => ({
    name: m.shortName,
    value: m.size.megabytes ?? 0,
  }));

  const groupedData = MODEL_LIST.map((m) => ({
    name: m.shortName,
    precision: m.classificationReport.scam.precision,
    recall: m.classificationReport.scam.recall,
    f1: m.classificationReport.scam.f1,
  }));

  const smallestSize = Math.min(...MODEL_LIST.filter((m) => m.size.megabytes).map((m) => m.size.megabytes!));
  const largestNeuralSize = Math.max(
    ...MODEL_LIST.filter((m) => m.id !== "teacher_mbert" && m.size.megabytes).map((m) => m.size.megabytes!)
  );
  const sizeRatio = (largestNeuralSize / smallestSize).toFixed(1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Model comparison</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          How do the four models compare?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Classification performance and deployment tradeoffs across the teacher, both lightweight neural
          students, and the traditional TF-IDF + Naive Bayes baseline, evaluated on the same 2,052-message
          held-out test set.
        </p>
      </div>

      {/* Summary table */}
      <section className="mb-10 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <th className="px-4 py-2.5 font-medium">Model</th>
              <th className="px-4 py-2.5 font-medium">Accuracy</th>
              <th className="px-4 py-2.5 font-medium">Scam F1</th>
              <th className="px-4 py-2.5 font-medium">Scam Recall</th>
              <th className="px-4 py-2.5 font-medium">Approx. size</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_LIST.map((m) => (
              <tr key={m.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/models/${m.slug}`}
                    className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
                  >
                    {m.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {(m.classificationReport.accuracy * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {m.classificationReport.scam.f1.toFixed(3)}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {m.classificationReport.scam.recall.toFixed(3)}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-zinc-700 dark:text-zinc-300">{m.size.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">Key finding: </span>
        TF-IDF + Naive Bayes outperforms both lightweight neural students on Scam F1 while being{" "}
        {sizeRatio}× smaller on disk than the neural student models — making it the most practical choice
        for on-device deployment, at some cost to accuracy relative to the mBERT teacher.
      </div>

      {/* Charts */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Accuracy
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <MetricComparisonChart
              data={accuracyData}
              domain={[0.9, 1]}
              valueFormat="percent"
              color="#3b82f6"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Scam F1-score
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <MetricComparisonChart data={scamF1Data} domain={[0.8, 1]} color="#10b981" />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Scam recall
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <MetricComparisonChart data={scamRecallData} domain={[0.8, 1]} color="#f59e0b" />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Model size (MB, log scale differences)
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <MetricComparisonChart data={sizeData} valueFormat="megabytes" color="#ef4444" />
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Teacher (mBERT) omitted from this chart at ~681 MB — its size dwarfs the other three models and
            would compress their bars to indistinguishable heights.
          </p>
        </section>
      </div>

      <section className="mb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Scam-class precision / recall / F1
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <GroupedMetricsChart data={groupedData} />
        </div>
      </section>
    </div>
  );
}
