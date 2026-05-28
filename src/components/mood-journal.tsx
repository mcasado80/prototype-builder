"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  MOOD_EMOJIS,
  MOOD_LABELS,
  MOOD_TINTS,
  type MoodEntry,
  type MoodLevel,
} from "@/lib/mood-types";
import { saveMoodEntry, useMoodEntries } from "@/lib/mood-storage";

const NOTE_MAX = 200;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function moodTint(level: MoodLevel | undefined) {
  return level === undefined ? undefined : MOOD_TINTS[level];
}

export function MoodJournal() {
  const entries = useMoodEntries();
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const savedToday = entries[todayKey];

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [sheetDate, setSheetDate] = useState<Date | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const showForm = !savedToday || isEditing;

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMonth]);

  const monthHasEntries = useMemo(
    () =>
      monthDays.some(
        (day) => isSameMonth(day, viewMonth) && entries[dateKey(day)],
      ),
    [entries, monthDays, viewMonth],
  );

  const sheetEntry = sheetDate ? entries[dateKey(sheetDate)] : undefined;
  const viewingCurrentMonth = isSameMonth(viewMonth, today);

  useEffect(() => {
    if (!sheetDate) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSheetDate(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetDate]);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timer = window.setTimeout(() => setSaveMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  function beginEdit() {
    if (!savedToday) {
      return;
    }
    setSelectedMood(savedToday.mood);
    setNote(savedToday.note);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setSelectedMood(null);
    setNote("");
  }

  function handleSave() {
    if (selectedMood === null) {
      return;
    }

    const entry: MoodEntry = {
      mood: selectedMood,
      note: note.trim(),
    };

    saveMoodEntry(todayKey, entry);
    setIsEditing(false);
    setSelectedMood(null);
    setNote("");
    setSaveMessage("Saved for today");
    setViewMonth(startOfMonth(today));
  }

  function openDaySheet(day: Date) {
    const key = dateKey(day);
    if (!entries[key]) {
      return;
    }
    setSheetDate(day);
  }

  return (
    <div className="journal-shell mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-8 pt-6">
      <header className="mb-6">
        <p className="journal-kicker mb-1 text-sm font-medium tracking-wide text-[var(--journal-muted)]">
          Personal check-in
        </p>
        <h1 className="journal-title text-3xl font-semibold leading-tight text-[var(--journal-ink)]">
          Mood Journal
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--journal-muted)]">
          One emoji, one line — a gentle record of how you felt.
        </p>
      </header>

      <p
        aria-live="polite"
        className={`mb-4 text-center text-sm font-medium text-[var(--journal-accent)] transition-opacity ${
          saveMessage ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {saveMessage ?? " "}
      </p>

      <section
        aria-labelledby="today-heading"
        className="journal-card mb-8 rounded-3xl p-5 shadow-sm"
      >
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2
            id="today-heading"
            className="text-lg font-semibold text-[var(--journal-ink)]"
          >
            Today
          </h2>
          <time
            dateTime={todayKey}
            className="text-sm text-[var(--journal-muted)]"
          >
            {format(today, "EEEE, MMM d")}
          </time>
        </div>

        {showForm ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-[var(--journal-ink)]">
                How are you feeling?
              </legend>
              <div className="flex justify-between gap-1">
                {MOOD_EMOJIS.map((emoji, index) => {
                  const level = index as MoodLevel;
                  const selected = selectedMood === level;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={MOOD_LABELS[level]}
                      aria-pressed={selected}
                      onClick={() => setSelectedMood(level)}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-all ${
                        selected
                          ? "scale-105 bg-[var(--journal-accent-soft)] ring-2 ring-[var(--journal-accent)]"
                          : "bg-[var(--journal-surface)] hover:bg-[var(--journal-accent-soft)]"
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--journal-ink)]">
                What&apos;s on your mind?
              </span>
              <textarea
                value={note}
                maxLength={NOTE_MAX}
                rows={3}
                placeholder="A quick note about your day..."
                onChange={(event) => setNote(event.target.value)}
                className="w-full resize-none rounded-2xl border border-[var(--journal-border)] bg-[var(--journal-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--journal-ink)] outline-none transition focus:border-[var(--journal-accent)] focus:ring-2 focus:ring-[var(--journal-accent-soft)]"
              />
              <span className="mt-1 block text-right text-xs text-[var(--journal-muted)]">
                {note.length}/{NOTE_MAX}
              </span>
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={selectedMood === null}
                className="flex-1 rounded-2xl bg-[var(--journal-accent)] px-4 py-3 text-sm font-semibold text-white transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Save today
              </button>
              {isEditing ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-2xl border border-[var(--journal-border)] px-4 py-3 text-sm font-medium text-[var(--journal-muted)] transition hover:bg-[var(--journal-surface)]"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : savedToday ? (
          <div
            className="rounded-2xl border border-[var(--journal-border)] bg-[var(--journal-surface)] p-4"
            style={{ borderColor: moodTint(savedToday.mood) }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ background: moodTint(savedToday.mood) }}
                aria-hidden
              >
                {MOOD_EMOJIS[savedToday.mood]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--journal-ink)]">
                  {MOOD_LABELS[savedToday.mood]}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--journal-muted)]">
                  {savedToday.note || "No note added."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={beginEdit}
              className="mt-4 text-sm font-semibold text-[var(--journal-accent)] underline-offset-2 hover:underline"
            >
              Edit
            </button>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="calendar-heading" className="journal-card rounded-3xl p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2
            id="calendar-heading"
            className="text-lg font-semibold text-[var(--journal-ink)]"
          >
            {format(viewMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth((month) => subMonths(month, 1))}
              className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--journal-border)] px-3 text-sm text-[var(--journal-muted)] transition hover:bg-[var(--journal-surface)]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setViewMonth(startOfMonth(today))}
              className="flex h-11 items-center justify-center rounded-xl border border-[var(--journal-border)] px-4 text-sm font-medium text-[var(--journal-ink)] transition hover:bg-[var(--journal-surface)]"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth((month) => addMonths(month, 1))}
              className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--journal-border)] px-3 text-sm text-[var(--journal-muted)] transition hover:bg-[var(--journal-surface)]"
            >
              →
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {MOOD_EMOJIS.map((emoji, index) => (
            <span
              key={emoji}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-[var(--journal-muted)]"
              style={{ background: MOOD_TINTS[index as MoodLevel] }}
            >
              <span aria-hidden>{emoji}</span>
              {MOOD_LABELS[index as MoodLevel]}
            </span>
          ))}
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-medium uppercase tracking-wide text-[var(--journal-muted)]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const key = dateKey(day);
            const entry = entries[key];
            const inMonth = isSameMonth(day, viewMonth);
            const tint = entry ? moodTint(entry.mood) : undefined;

            return (
              <button
                key={key}
                type="button"
                disabled={!entry}
                aria-label={
                  entry
                    ? `${format(day, "MMMM d")}, mood logged`
                    : `${format(day, "MMMM d")}, no entry`
                }
                onClick={() => openDaySheet(day)}
                className={`flex h-11 w-full items-center justify-center rounded-xl text-lg transition ${
                  inMonth
                    ? "text-[var(--journal-ink)]"
                    : "text-[var(--journal-faded)]"
                } ${
                  entry
                    ? "cursor-pointer hover:brightness-95"
                    : "cursor-default bg-[var(--journal-surface)]"
                } ${isToday(day) ? "ring-2 ring-[var(--journal-accent)] ring-offset-1 ring-offset-[var(--journal-card)]" : ""}`}
                style={tint ? { background: tint } : undefined}
              >
                {entry ? (
                  <span className="relative flex h-full w-full flex-col items-center justify-center" aria-hidden>
                    <span className="text-lg leading-none">{MOOD_EMOJIS[entry.mood]}</span>
                    <span className="mt-0.5 text-[10px] font-semibold leading-none opacity-70">
                      {format(day, "d")}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs font-medium">{format(day, "d")}</span>
                )}
              </button>
            );
          })}
        </div>

        {!monthHasEntries && viewingCurrentMonth ? (
          <p className="mt-4 rounded-2xl bg-[var(--journal-surface)] px-4 py-3 text-center text-sm text-[var(--journal-muted)]">
            Tap a mood above to log today.
          </p>
        ) : null}

        {!monthHasEntries && !viewingCurrentMonth ? (
          <p className="mt-4 rounded-2xl bg-[var(--journal-surface)] px-4 py-3 text-center text-sm text-[var(--journal-muted)]">
            No moods logged this month.
          </p>
        ) : null}

        {monthHasEntries ? (
          <p className="mt-4 text-center text-xs text-[var(--journal-muted)]">
            Tap a colored day to read your note.
          </p>
        ) : null}
      </section>

      {sheetDate && sheetEntry ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4"
          onClick={() => setSheetDate(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="journal-sheet journal-card w-full max-w-md rounded-3xl p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-1 flex items-start justify-between gap-3">
              <h3
                id="sheet-title"
                className="text-base font-semibold text-[var(--journal-ink)]"
              >
                {format(sheetDate, "EEEE, MMMM d, yyyy")}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSheetDate(null)}
                className="rounded-lg px-2 py-1 text-sm text-[var(--journal-muted)] hover:bg-[var(--journal-surface)]"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ background: moodTint(sheetEntry.mood) }}
                aria-hidden
              >
                {MOOD_EMOJIS[sheetEntry.mood]}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--journal-ink)]">
                  {MOOD_LABELS[sheetEntry.mood]}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--journal-muted)]">
                  {sheetEntry.note || "No note added."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
