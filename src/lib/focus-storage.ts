import {
  DEFAULT_PRESET,
  FOCUS_PRESETS,
  type FocusPreset,
  type FocusSession,
  STORAGE_KEY,
} from "./focus-types";

export function isFocusPreset(value: number): value is FocusPreset {
  return FOCUS_PRESETS.includes(value as FocusPreset);
}

let sessionsSnapshot: FocusSession[] = [];
let sessionsSnapshotRaw = "";

export function loadSessions(): FocusSession[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  if (raw === sessionsSnapshotRaw) {
    return sessionsSnapshot;
  }

  sessionsSnapshotRaw = raw;

  try {
    if (raw === "[]") {
      sessionsSnapshot = [];
      return sessionsSnapshot;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      sessionsSnapshot = [];
      return sessionsSnapshot;
    }

    sessionsSnapshot = parsed.filter(isValidSession);
    return sessionsSnapshot;
  } catch {
    sessionsSnapshot = [];
    return sessionsSnapshot;
  }
}

export function saveSessions(sessions: FocusSession[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(sessions);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  sessionsSnapshotRaw = serialized;
  sessionsSnapshot = sessions;
  window.dispatchEvent(new Event("focus-sessions-change"));
}

export function addSession(session: FocusSession): void {
  saveSessions([session, ...loadSessions()]);
}

export function loadPreset(): FocusPreset {
  if (typeof window === "undefined") {
    return DEFAULT_PRESET;
  }

  const raw = window.localStorage.getItem("focus-tracker-preset");
  const parsed = raw ? Number(raw) : DEFAULT_PRESET;
  return isFocusPreset(parsed) ? parsed : DEFAULT_PRESET;
}

export function savePreset(preset: FocusPreset): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("focus-tracker-preset", String(preset));
  window.dispatchEvent(new Event("focus-preset-change"));
}

function isValidSession(value: unknown): value is FocusSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<FocusSession>;
  return (
    typeof session.id === "string" &&
    typeof session.focusText === "string" &&
    typeof session.completedAt === "string" &&
    typeof session.durationMinutes === "number" &&
    isFocusPreset(session.durationMinutes)
  );
}

export function formatLocalDate(iso: string): string {
  const date = new Date(iso);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isToday(iso: string, now = new Date()): boolean {
  return formatLocalDate(iso) === formatLocalDate(now.toISOString());
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function calculateStreak(
  sessions: FocusSession[],
  now = new Date(),
): number {
  if (sessions.length === 0) {
    return 0;
  }

  const daysWithSessions = new Set(
    sessions.map((session) => formatLocalDate(session.completedAt)),
  );

  const today = formatLocalDate(now.toISOString());
  let cursor = today;

  if (!daysWithSessions.has(today)) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    cursor = formatLocalDate(yesterday.toISOString());

    if (!daysWithSessions.has(cursor)) {
      return 0;
    }
  }

  let streak = 0;
  const walk = new Date(`${cursor}T12:00:00`);

  while (daysWithSessions.has(formatLocalDate(walk.toISOString()))) {
    streak += 1;
    walk.setDate(walk.getDate() - 1);
  }

  return streak;
}

export function getTodaySessions(
  sessions: FocusSession[],
  now = new Date(),
): FocusSession[] {
  return sessions.filter((session) => isToday(session.completedAt, now));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
