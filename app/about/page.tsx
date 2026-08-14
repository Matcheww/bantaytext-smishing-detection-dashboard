import type { Metadata } from "next";
import { DATASET_TOTAL, DATASET_HAM, DATASET_SCAM, TRAIN_SIZE, VAL_SIZE } from "@/lib/models/metadata";

export const metadata: Metadata = {
  title: "About — BantayText",
  description: "About the BantayText SMS scam detection research project.",
};

export default function AboutPage() {
  const testSize = DATASET_TOTAL - TRAIN_SIZE - VAL_SIZE;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        About BantayText
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        A comparative study identifying the optimal lightweight SMS scam-detection model for the Philippine
        context, where Filipino-English code-switching (Taglish) complicates detection for models trained
        only on monolingual data.
      </p>

      <div className="space-y-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        <p>
          Four models were trained and evaluated on the same merged dataset of Filipino, English, and
          Taglish SMS messages: a fine-tuned mBERT teacher, a knowledge-distilled lightweight neural
          network, an architecturally identical neural network trained without distillation, and a
          traditional TF-IDF + Multinomial Naive Bayes pipeline. Details for each model, including
          architecture, training configuration, and test-set performance, are available on their
          respective{" "}
          <a href="/models/comparison" className="font-medium underline underline-offset-2">
            model pages
          </a>
          .
        </p>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">Dataset</p>
          <p>
            {DATASET_TOTAL.toLocaleString()} total messages ({DATASET_SCAM.toLocaleString()} scam /{" "}
            {DATASET_HAM.toLocaleString()} ham), split into {TRAIN_SIZE.toLocaleString()} training (70%),{" "}
            {VAL_SIZE.toLocaleString()} validation (10%), and {testSize.toLocaleString()} test (20%)
            messages using stratified sampling.
          </p>
        </div>

        <p>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">Note on dataset drift: </span>
          One of the source Kaggle datasets was updated after the original BantayText paper was published.
          The metrics shown throughout this dashboard reflect a later re-run of the training notebook on
          the refreshed merged dataset, and may differ slightly from the numbers reported in the published
          paper.
        </p>

        <p>
          All metrics displayed in this application are transcribed directly from the executed notebook
          (<code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
            BantayText_Refactored.ipynb
          </code>
          ) — nothing here is fabricated or estimated beyond what is explicitly noted (e.g. approximate
          confusion matrix counts derived from rounded classification reports).
        </p>
      </div>
    </div>
  );
}
