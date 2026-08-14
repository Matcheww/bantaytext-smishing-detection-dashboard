import type { Metadata } from "next";
import Link from "next/link";
import { MODELS } from "@/lib/models/metadata";
import { ModelDashboard } from "@/components/models/model-dashboard";

export const metadata: Metadata = {
  title: "Raw Student — BantayText",
  description: "Non-distilled baseline neural network performance dashboard.",
};

export default function RawStudentPage() {
  const teacherF1 = MODELS.distilled_student.classificationReport.scam.f1;
  const rawF1 = MODELS.raw_student.classificationReport.scam.f1;
  const delta = (teacherF1 - rawF1).toFixed(2);

  return (
    <ModelDashboard
      model={MODELS.raw_student}
      extra={
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Distillation baseline
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <p>
              This model shares the exact same architecture as the{" "}
              <Link href="/models/distilled-student" className="font-medium underline underline-offset-2">
                Distilled Student
              </Link>
              , but is trained only on ground-truth hard labels via standard cross-entropy — no teacher
              supervision. Comparing the two isolates the effect of knowledge distillation: the distilled
              variant scores {delta} higher on Scam F1 ({teacherF1.toFixed(2)} vs. {rawF1.toFixed(2)}) under
              an identical training regimen (same max epochs, early-stopping patience, and learning rate).
            </p>
          </div>
        </section>
      }
    />
  );
}
