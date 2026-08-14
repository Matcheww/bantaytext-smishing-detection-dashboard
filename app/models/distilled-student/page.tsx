import type { Metadata } from "next";
import { MODELS } from "@/lib/models/metadata";
import { ModelDashboard } from "@/components/models/model-dashboard";

export const metadata: Metadata = {
  title: "Distilled Student — BantayText",
  description: "Knowledge-distilled student model performance dashboard.",
};

export default function DistilledStudentPage() {
  return (
    <ModelDashboard
      model={MODELS.distilled_student}
      extra={
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Knowledge distillation
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <p className="mb-3">
              The student is trained against a combined loss that blends the teacher&apos;s
              temperature-scaled soft predictions with standard cross-entropy on the ground-truth labels:
            </p>
            <p className="mb-3 rounded bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              L_total = α · L_KD(T) + (1 − α) · L_CE, with T = 3.0, α = 0.7
            </p>
            <p>
              L_KD is the KL-divergence between the temperature-scaled student and teacher output
              distributions, scaled by T². L_CE is standard cross-entropy against hard labels. A higher α
              weights the teacher&apos;s soft signal more heavily than the ground-truth labels alone.
            </p>
          </div>
        </section>
      }
    />
  );
}
