import type { PredictionLabel } from "@/lib/types/model";

export function LabelBadge({ label }: { label: PredictionLabel }) {
  const isSpam = label === "spam";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isSpam
          ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isSpam ? "bg-red-500" : "bg-emerald-500"}`}
        aria-hidden
      />
      {isSpam ? "Scam" : "Ham"}
    </span>
  );
}
