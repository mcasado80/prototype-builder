export type FocusPreset = 15 | 25 | 45 | 60;

export type FocusSession = {
  id: string;
  focusText: string;
  durationMinutes: FocusPreset;
  completedAt: string;
};

export const FOCUS_PRESETS: FocusPreset[] = [15, 25, 45, 60];

export const STORAGE_KEY = "focus-tracker-sessions";

export const DEFAULT_PRESET: FocusPreset = 25;
