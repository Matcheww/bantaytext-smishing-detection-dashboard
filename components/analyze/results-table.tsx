import { MODEL_LIST } from "@/lib/models/metadata";
import type { MessagePrediction } from "@/lib/types/model";
import { LabelBadge } from "@/components/ui/label-badge";

function ModelResultCell({
  prediction,
}: {
  prediction: MessagePrediction["models"][keyof MessagePrediction["models"]];
}) {
  if (!prediction || prediction.label === null) {
    return (
      <span
        className="text-xs text-zinc-400 dark:text-zinc-600"
        title={prediction?.error ?? "No prediction available."}
      >
        {prediction?.error ? "Unavailable ⓘ" : "—"}
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <LabelBadge label={prediction.label} />
      <div className="flex gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        {prediction.probability !== null && (
          <span>{(prediction.probability * 100).toFixed(1)}% conf.</span>
        )}
        {prediction.latencyMs !== null && <span>{prediction.latencyMs.toFixed(0)} ms</span>}
      </div>
    </div>
  );
}

export function ResultsTable({ results }: { results: MessagePrediction[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <th className="px-4 py-2.5 font-medium">Message</th>
            {MODEL_LIST.map((m) => (
              <th key={m.id} className="px-4 py-2.5 font-medium">
                {m.shortName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id} className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-900">
              <td className="max-w-xs px-4 py-3 text-zinc-800 dark:text-zinc-200">
                <p className="line-clamp-3">{result.text}</p>
                {result.error && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{result.error}</p>
                )}
              </td>
              {MODEL_LIST.map((m) => (
                <td key={m.id} className="px-4 py-3">
                  <ModelResultCell prediction={result.models[m.id]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
