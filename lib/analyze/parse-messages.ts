import type { PredictRequestMessage } from "@/lib/types/model";

export const MAX_MESSAGES = 50;
export const MAX_MESSAGE_LENGTH = 1000;

export interface ParseMessagesResult {
  messages: PredictRequestMessage[];
  warnings: string[];
}

/**
 * Parse raw textarea input into individual SMS messages.
 *
 * Convention: one message per line. Blank lines are ignored. This keeps the
 * single input window usable for both a single message (one line) and many
 * messages (one per line) without requiring a separate UI mode, per the
 * "one input window, no separate single/multiple pages" requirement.
 */
export function parseMessages(rawInput: string): ParseMessagesResult {
  const warnings: string[] = [];

  const lines = rawInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let usableLines = lines;
  if (lines.length > MAX_MESSAGES) {
    warnings.push(
      `Only the first ${MAX_MESSAGES} messages were kept (${lines.length} were submitted).`
    );
    usableLines = lines.slice(0, MAX_MESSAGES);
  }

  const messages: PredictRequestMessage[] = usableLines.map((text, index) => {
    if (text.length > MAX_MESSAGE_LENGTH) {
      warnings.push(`Message ${index + 1} was truncated to ${MAX_MESSAGE_LENGTH} characters.`);
    }
    return {
      id: index + 1,
      text: text.slice(0, MAX_MESSAGE_LENGTH),
    };
  });

  return { messages, warnings };
}
