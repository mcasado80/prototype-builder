export type MoodLevel = 0 | 1 | 2 | 3 | 4;

export interface MoodEntry {
  mood: MoodLevel;
  note: string;
}

export type MoodEntries = Record<string, MoodEntry>;

export const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"] as const;

export const MOOD_LABELS = [
  "Rough",
  "Low",
  "Okay",
  "Good",
  "Great",
] as const;

export const MOOD_TINTS = [
  "var(--mood-0)",
  "var(--mood-1)",
  "var(--mood-2)",
  "var(--mood-3)",
  "var(--mood-4)",
] as const;

export function isMoodLevel(value: unknown): value is MoodLevel {
  return typeof value === "number" && value >= 0 && value <= 4;
}

export function normalizeEntry(value: unknown): MoodEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<MoodEntry>;
  if (!isMoodLevel(candidate.mood)) {
    return null;
  }

  return {
    mood: candidate.mood,
    note: typeof candidate.note === "string" ? candidate.note.slice(0, 200) : "",
  };
}
