import type { ConfusionMatrix as ConfusionMatrixType } from "@/lib/types/model";

export function ConfusionMatrix({ matrix }: { matrix: ConfusionMatrixType }) {
  const { truePositive, trueNegative, falsePositive, falseNegative, exact } = matrix;

  const cellClass =
    "flex flex-col items-center justify-center rounded-lg p-4 text-center";

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-xs">
        <div />
        <div className="pb-1 text-center font-medium text-zinc-500 dark:text-zinc-400">
          Predicted Ham
        </div>
        <div className="pb-1 text-center font-medium text-zinc-500 dark:text-zinc-400">
          Predicted Scam
        </div>

        <div className="flex items-center justify-center pr-1 font-medium text-zinc-500 dark:text-zinc-400 [writing-mode:vertical-rl]">
          Actual Ham
        </div>
        <div className={`${cellClass} border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950`}>
          <span className="text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {trueNegative}
          </span>
          <span className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70">True Negative</span>
        </div>
        <div className={`${cellClass} border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950`}>
          <span className="text-xl font-semibold tabular-nums text-red-700 dark:text-red-400">
            {falsePositive}
          </span>
          <span className="text-[11px] text-red-700/70 dark:text-red-400/70">False Positive</span>
        </div>

        <div className="flex items-center justify-center pr-1 font-medium text-zinc-500 dark:text-zinc-400 [writing-mode:vertical-rl]">
          Actual Scam
        </div>
        <div className={`${cellClass} border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950`}>
          <span className="text-xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
            {falseNegative}
          </span>
          <span className="text-[11px] text-amber-700/70 dark:text-amber-400/70">False Negative</span>
        </div>
        <div className={`${cellClass} border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950`}>
          <span className="text-xl font-semibold tabular-nums text-blue-700 dark:text-blue-400">
            {truePositive}
          </span>
          <span className="text-[11px] text-blue-700/70 dark:text-blue-400/70">True Positive</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        {exact
          ? "Derived exactly from the notebook's classification report (printed with 6 decimal digits of precision)."
          : "Approximate — derived from a classification report printed with 2 decimal digits of precision. Counts may be off by a few messages due to rounding."}
      </p>
    </div>
  );
}
