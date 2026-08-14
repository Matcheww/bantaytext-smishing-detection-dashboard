import type { Metadata } from "next";
import { MODELS } from "@/lib/models/metadata";
import { ModelDashboard } from "@/components/models/model-dashboard";

export const metadata: Metadata = {
  title: "mBERT — BantayText",
  description: "Teacher model performance dashboard for BantayText's fine-tuned mBERT classifier.",
};

export default function MbertPage() {
  return <ModelDashboard model={MODELS.teacher_mbert} />;
}
