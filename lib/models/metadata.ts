import type { ModelMetadata, ModelId, ConfusionMatrix } from "@/lib/types/model";

/**
 * Source of truth for all model metrics shown in the dashboard.
 *
 * Every number below is transcribed verbatim from the executed cell outputs
 * of `BantayText_Refactored.ipynb` (the notebook re-run after the Kaggle
 * source dataset was updated post-publication). Do not edit these values
 * without re-running the notebook and updating the corresponding cell
 * reference in the comment above each block.
 *
 * Test set: 2,052 messages (1,497 ham / 555 scam), held out from a merged
 * dataset of 10,258 messages (7,482 ham / 2,776 scam).
 */

export const TEST_SET_SIZE = 2052;
export const TEST_SET_HAM = 1497;
export const TEST_SET_SCAM = 555;

export const DATASET_TOTAL = 10258;
export const DATASET_HAM = 7482;
export const DATASET_SCAM = 2776;
export const TRAIN_SIZE = 7180;
export const VAL_SIZE = 1026;

export const MODELS: Record<ModelId, ModelMetadata> = {
  // Notebook cell 21: teacher_trainer.predict(...) -> classification_report(..., digits=6)
  teacher_mbert: {
    id: "teacher_mbert",
    slug: "mbert",
    name: "Teacher — mBERT",
    shortName: "mBERT",
    tagline: "Fine-tuned multilingual transformer, the high-accuracy reference model",
    description:
      "bert-base-multilingual-cased fine-tuned for 5 epochs on the merged Taglish/English/Filipino SMS dataset. Pretrained on 104 languages, giving it strong contextual understanding of code-switched text. Serves as both the accuracy benchmark and the source of soft labels for the distilled student.",
    architecture: [
      "bert-base-multilingual-cased backbone (12 layers, 768 hidden size)",
      "Sequence classification head (2 classes)",
      "Fine-tuned 5 epochs, batch size 16, warmup 100 steps, weight decay 0.01",
      "Max sequence length: 128 tokens",
    ],
    parameterCount: 177_854_978,
    size: { label: "681.28 MB", megabytes: 681.28 },
    classificationReport: {
      ham: { precision: 0.987350, recall: 0.990648, f1: 0.988996, support: TEST_SET_HAM },
      scam: { precision: 0.974545, recall: 0.965766, f1: 0.970136, support: TEST_SET_SCAM },
      accuracy: 0.983918,
      macroAvg: { precision: 0.980948, recall: 0.978207, f1: 0.979566 },
      weightedAvg: { precision: 0.983887, recall: 0.983918, f1: 0.983895 },
      reportDigits: 6,
    },
    configuration: [
      { label: "Base model", value: "bert-base-multilingual-cased" },
      { label: "Epochs", value: "5 (early stopping on eval_f1)" },
      { label: "Batch size", value: "16" },
      { label: "Warmup steps", value: "100" },
      { label: "Weight decay", value: "0.01" },
      { label: "Max sequence length", value: "128 tokens" },
    ],
    artifacts: ["fine_tuned_teacher_model/"],
  },

  // Notebook cell 27: classification_report on test set (sklearn default digits=2)
  distilled_student: {
    id: "distilled_student",
    slug: "distilled-student",
    name: "Distilled Student",
    shortName: "Distilled Student",
    tagline: "Lightweight neural network trained via knowledge distillation from mBERT",
    description:
      "A self-contained neural network (SelfContainedStudentNN) trained to mimic the teacher's soft output distribution in addition to the ground-truth labels. Uses a custom 128-dim embedding layer and attention-masked mean pooling, eliminating the need for the teacher at inference time.",
    architecture: [
      "Embedding layer (vocab_size × 128-dim), reusing mBERT's tokenizer vocabulary",
      "Attention-masked mean pooling over token embeddings",
      "Linear(128 → 128) → ReLU → Dropout(0.3)",
      "Linear(128 → 2) classification head",
    ],
    parameterCount: 15_318_786,
    size: { label: "58.45 MB (58.41 MB quantized)", megabytes: 58.45 },
    classificationReport: {
      ham: { precision: 0.97, recall: 0.99, f1: 0.98, support: TEST_SET_HAM },
      scam: { precision: 0.97, recall: 0.92, f1: 0.94, support: TEST_SET_SCAM },
      accuracy: 0.97,
      macroAvg: { precision: 0.97, recall: 0.95, f1: 0.96 },
      weightedAvg: { precision: 0.97, recall: 0.97, f1: 0.97 },
      reportDigits: 2,
    },
    configuration: [
      { label: "Embedding dimension", value: "128" },
      { label: "Hidden dimension", value: "128" },
      { label: "Classes", value: "2" },
      { label: "Distillation temperature (T)", value: "3.0" },
      { label: "KD alpha", value: "0.7" },
      { label: "Learning rate", value: "1e-4" },
      { label: "Batch size", value: "16" },
      { label: "Max epochs / early-stop patience", value: "30 / 5" },
    ],
    artifacts: [
      "best_distilled_student_model.pth",
      "mobile_distilled_student_classifier.pt",
      "mobile_distilled_student_classifier_quantized.pt",
    ],
  },

  // Notebook cell 31: classification_report on test set (sklearn default digits=2)
  raw_student: {
    id: "raw_student",
    slug: "raw-student",
    name: "Raw Student",
    shortName: "Raw Student",
    tagline: "Identical neural network trained from scratch, without teacher supervision",
    description:
      "Architecturally identical to the distilled student, but trained only on ground-truth hard labels with standard cross-entropy loss. This baseline isolates exactly how much knowledge distillation improved performance.",
    architecture: [
      "Embedding layer (vocab_size × 128-dim)",
      "Attention-masked mean pooling over token embeddings",
      "Linear(128 → 128) → ReLU → Dropout(0.3)",
      "Linear(128 → 2) classification head",
    ],
    parameterCount: 15_318_786,
    size: { label: "58.45 MB (58.41 MB quantized)", megabytes: 58.45 },
    classificationReport: {
      ham: { precision: 0.97, recall: 0.98, f1: 0.97, support: TEST_SET_HAM },
      scam: { precision: 0.94, recall: 0.93, f1: 0.93, support: TEST_SET_SCAM },
      accuracy: 0.96,
      macroAvg: { precision: 0.95, recall: 0.95, f1: 0.95 },
      weightedAvg: { precision: 0.96, recall: 0.96, f1: 0.96 },
      reportDigits: 2,
    },
    configuration: [
      { label: "Embedding dimension", value: "128" },
      { label: "Hidden dimension", value: "128" },
      { label: "Classes", value: "2" },
      { label: "Training signal", value: "Cross-entropy on hard labels only (no distillation)" },
      { label: "Learning rate", value: "1e-4" },
      { label: "Batch size", value: "32" },
      { label: "Max epochs / early-stop patience", value: "30 / 5" },
    ],
    artifacts: [
      "best_raw_student_model.pth",
      "mobile_raw_student_classifier.pt",
      "mobile_raw_student_classifier_quantized.pt",
    ],
  },

  // Notebook cell 35: classification_report on test set (sklearn default digits=2)
  tfidf_nb: {
    id: "tfidf_nb",
    slug: "tfidf-naive-bayes",
    name: "TF-IDF + Naive Bayes",
    shortName: "TF-IDF + NB",
    tagline: "Classic ML pipeline — the paper's most efficient deployable model",
    description:
      "A scikit-learn Pipeline chaining TF-IDF vectorization (unigrams + bigrams) with Multinomial Naive Bayes. Despite its simplicity, it outperforms both neural student models while being over 16x smaller on disk, making it the most practical candidate for on-device deployment.",
    architecture: [
      "TfidfVectorizer(stop_words='english', lowercase=True, ngram_range=(1, 2))",
      "MultinomialNB(alpha=0.1)",
      "Wrapped in a single sklearn Pipeline (vectorizer fit only on training data)",
    ],
    parameterCount: null,
    size: { label: "3.63 MB", megabytes: 3.63 },
    classificationReport: {
      ham: { precision: 0.97, recall: 0.99, f1: 0.98, support: TEST_SET_HAM },
      scam: { precision: 0.98, recall: 0.93, f1: 0.95, support: TEST_SET_SCAM },
      accuracy: 0.98,
      macroAvg: { precision: 0.98, recall: 0.96, f1: 0.97 },
      weightedAvg: { precision: 0.98, recall: 0.98, f1: 0.98 },
      reportDigits: 2,
    },
    configuration: [
      { label: "Vectorizer", value: "TF-IDF, unigrams + bigrams" },
      { label: "Stop words", value: "English" },
      { label: "Smoothing (alpha)", value: "0.1" },
      { label: "Classifier", value: "Multinomial Naive Bayes" },
    ],
    artifacts: ["traditional_spam_classifier.joblib"],
  },
};

export const MODEL_LIST: ModelMetadata[] = [
  MODELS.teacher_mbert,
  MODELS.distilled_student,
  MODELS.raw_student,
  MODELS.tfidf_nb,
];

export function getModelBySlug(slug: string): ModelMetadata | undefined {
  return MODEL_LIST.find((m) => m.slug === slug);
}

/**
 * Derive an approximate confusion matrix from a classification report's
 * per-class recall and support.
 *
 * recall_scam = TP / (TP + FN) = TP / support_scam  =>  TP = recall_scam * support_scam
 * recall_ham  = TN / (TN + FP) = TN / support_ham   =>  TN = recall_ham  * support_ham
 *
 * When the source report was printed with only 2 decimal digits of
 * precision (sklearn's default), the derived counts carry rounding error
 * of roughly +/-3-6 messages and are flagged `exact: false` so the UI can
 * label them as approximate rather than presenting them as ground truth.
 * The teacher's report was printed with digits=6, so its derived matrix
 * is treated as exact.
 */
export function deriveConfusionMatrix(model: ModelMetadata): ConfusionMatrix {
  const { ham, scam, reportDigits } = model.classificationReport;

  const truePositive = Math.round(scam.recall * scam.support);
  const falseNegative = scam.support - truePositive;
  const trueNegative = Math.round(ham.recall * ham.support);
  const falsePositive = ham.support - trueNegative;

  return {
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
    exact: reportDigits === 6,
  };
}
