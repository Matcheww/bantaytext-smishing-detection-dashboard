/**
 * Shared type definitions for BantayText model metadata and metrics.
 *
 * All numeric values referenced by pages must originate from
 * `lib/models/metadata.ts`, which is the single source of truth
 * transcribed from the executed `BantayText_Refactored.ipynb` notebook.
 * Do not hardcode metrics in individual page components.
 */

export type ModelId =
  | "teacher_mbert"
  | "distilled_student"
  | "raw_student"
  | "tfidf_nb";

export interface ClassMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface ClassificationReport {
  ham: ClassMetrics;
  scam: ClassMetrics;
  accuracy: number;
  macroAvg: Omit<ClassMetrics, "support">;
  weightedAvg: Omit<ClassMetrics, "support">;
  /**
   * Number of significant decimal digits present in the notebook's printed
   * classification_report for this model. The teacher report was printed
   * with `digits=6`; the other three were printed with the sklearn default
   * (2 decimals). This is used to decide whether a confusion matrix can be
   * safely derived from the reported precision/recall without misleading
   * rounding error (see `deriveConfusionMatrix`).
   */
  reportDigits: 2 | 6;
}

export interface ModelSize {
  label: string;
  megabytes: number | null; // null when only an approximate label is available (e.g. teacher's "~680 MB")
  approximate?: boolean;
}

export interface ModelMetadata {
  id: ModelId;
  slug: string; // used for the /models/[slug] route segment
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  architecture: string[];
  parameterCount: number | null;
  size: ModelSize;
  classificationReport: ClassificationReport;
  /** Additional configuration specific to this model, rendered as key/value rows. */
  configuration: Array<{ label: string; value: string }>;
  artifacts: string[];
}

export interface ConfusionMatrix {
  truePositive: number; // scam correctly identified as scam
  trueNegative: number; // ham correctly identified as ham
  falsePositive: number; // ham incorrectly flagged as scam
  falseNegative: number; // scam incorrectly missed as ham
  /** Whether these counts are exact or derived/rounded from a 2-decimal classification report. */
  exact: boolean;
}

/* -------------------------------------------------------------------------- */
/* Prediction API contract                                                    */
/* -------------------------------------------------------------------------- */

export interface PredictRequestMessage {
  id: number;
  text: string;
}

export interface PredictRequest {
  messages: PredictRequestMessage[];
}

export type PredictionLabel = "spam" | "ham";

export interface ModelPrediction {
  label: PredictionLabel | null;
  probability: number | null;
  latencyMs: number | null;
  /**
   * Explains why this model has no prediction: either it wasn't loaded on
   * the inference service at startup, or inference failed for this
   * specific request. Null when the prediction succeeded.
   */
  error: string | null;
}

export interface MessagePrediction {
  id: number;
  text: string;
  models: Record<ModelId, ModelPrediction>;
  error?: string;
}

export interface PredictResponse {
  results: MessagePrediction[];
}

export interface PredictErrorResponse {
  error: string;
  detail?: string;
}

/* -------------------------------------------------------------------------- */
/* TF-IDF vocabulary stats (real, extracted from the loaded pipeline)          */
/* -------------------------------------------------------------------------- */

export interface TfidfVocabularyStats {
  vocabularySize: number;
  ngramRange: [number, number];
  topScamIndicativeTerms: string[];
  topHamIndicativeTerms: string[];
}
