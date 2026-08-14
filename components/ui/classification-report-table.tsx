import type { ClassificationReport } from "@/lib/types/model";

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function fmt3(n: number) {
  return n.toFixed(3);
}

export function ClassificationReportTable({ report }: { report: ClassificationReport }) {
  const rows: Array<{ label: string; precision: number; recall: number; f1: number; support: string }> = [
    { label: "Ham", precision: report.ham.precision, recall: report.ham.recall, f1: report.ham.f1, support: String(report.ham.support) },
    { label: "Scam", precision: report.scam.precision, recall: report.scam.recall, f1: report.scam.f1, support: String(report.scam.support) },
    { label: "Macro avg", precision: report.macroAvg.precision, recall: report.macroAvg.recall, f1: report.macroAvg.f1, support: "—" },
    { label: "Weighted avg", precision: report.weightedAvg.precision, recall: report.weightedAvg.recall, f1: report.weightedAvg.f1, support: "—" },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <th className="px-4 py-2 font-medium">Class</th>
            <th className="px-4 py-2 font-medium">Precision</th>
            <th className="px-4 py-2 font-medium">Recall</th>
            <th className="px-4 py-2 font-medium">F1-score</th>
            <th className="px-4 py-2 font-medium">Support</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
            >
              <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">{row.label}</td>
              <td className="px-4 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">{fmt3(row.precision)}</td>
              <td className="px-4 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">{fmt3(row.recall)}</td>
              <td className="px-4 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">{fmt3(row.f1)}</td>
              <td className="px-4 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">{row.support}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50" colSpan={4}>
              Overall accuracy
            </td>
            <td className="px-4 py-2 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {pct(report.accuracy)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
