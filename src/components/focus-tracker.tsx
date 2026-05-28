"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import {
  addSession,
  calculateStreak,
  formatDuration,
  formatTime,
  getTodaySessions,
  loadPreset,
  loadSessions,
  savePreset,
} from "@/lib/focus-storage";
import {
  DEFAULT_PRESET,
  FOCUS_PRESETS,
  type FocusPreset,
  type FocusSession,
} from "@/lib/focus-types";

type TimerStatus = "idle" | "running" | "paused" | "complete";

function subscribeToSessions(onStoreChange: () => void) {
  window.addEventListener("focus-sessions-change", onStoreChange);
  return () => {
    window.removeEventListener("focus-sessions-change", onStoreChange);
  };
}

function subscribeToPreset(onStoreChange: () => void) {
  window.addEventListener("focus-preset-change", onStoreChange);
  return () => {
    window.removeEventListener("focus-preset-change", onStoreChange);
  };
}

export function FocusTracker() {
  const sessions = useSyncExternalStore(
    subscribeToSessions,
    loadSessions,
    () => [] as FocusSession[],
  );
  const storedPreset = useSyncExternalStore(
    subscribeToPreset,
    loadPreset,
    () => DEFAULT_PRESET,
  );

  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_PRESET * 60);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [showLogModal, setShowLogModal] = useState(false);
  const [focusText, setFocusText] = useState("");
  const [completedDuration, setCompletedDuration] = useState<FocusPreset>(
    DEFAULT_PRESET,
  );
  const [ready, setReady] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const presetRef = useRef(preset);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    queueMicrotask(() => {
      setPreset(storedPreset);
      setRemainingSeconds(storedPreset * 60);
      setReady(true);
    });
  }, [storedPreset]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status !== "running") {
      clearTimerInterval();
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearTimerInterval();
          queueMicrotask(() => {
            setStatus("complete");
            setShowLogModal(true);
            setCompletedDuration(presetRef.current);
          });
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return clearTimerInterval;
  }, [status, clearTimerInterval]);

  const handlePresetChange = (next: FocusPreset) => {
    if (status === "running") {
      return;
    }

    setPreset(next);
    savePreset(next);
    setRemainingSeconds(next * 60);
    setStatus("idle");
  };

  const handleStart = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(preset * 60);
    }
    setStatus("running");
  };

  const handlePause = () => {
    setStatus("paused");
  };

  const handleReset = () => {
    clearTimerInterval();
    setRemainingSeconds(preset * 60);
    setStatus("idle");
    setShowLogModal(false);
    setFocusText("");
  };

  const dismissModal = useCallback(() => {
    setShowLogModal(false);
    setFocusText("");
    setRemainingSeconds(preset * 60);
    setStatus("idle");
  }, [preset]);

  useEffect(() => {
    if (!showLogModal) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissModal();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLogModal, dismissModal]);

  const handleLogSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = focusText.trim();
    if (!trimmed) {
      return;
    }

    addSession({
      id: crypto.randomUUID(),
      focusText: trimmed,
      durationMinutes: completedDuration,
      completedAt: new Date().toISOString(),
    });

    dismissModal();
  };

  const todaySessions = getTodaySessions(sessions);
  const streak = calculateStreak(sessions);
  const totalMinutesToday = todaySessions.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );
  const timerRunning = status === "running";
  const canChangePreset = status === "idle" || status === "paused";
  const totalSeconds = preset * 60;
  const progress =
    totalSeconds > 0
      ? Math.min(1, Math.max(0, (totalSeconds - remainingSeconds) / totalSeconds))
      : 0;
  const progressDegrees = progress * 360;

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 rounded-lg bg-zinc-200" />
          <div className="h-48 rounded-2xl bg-zinc-100" />
          <div className="h-32 rounded-2xl bg-zinc-100" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-4 py-8">
        <header className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Focus Tracker
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Deep work, one session at a time
          </h1>
        </header>

        <section
          aria-label="Focus timer"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 space-y-3">
            <p className="text-sm font-medium text-zinc-500">Session length</p>
            <div className="flex flex-wrap gap-2">
              {FOCUS_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  disabled={!canChangePreset}
                  onClick={() => handlePresetChange(minutes)}
                  aria-pressed={preset === minutes}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    preset === minutes
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-auto mb-2 flex h-56 w-56 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full transition-[background] duration-1000"
              style={{
                background: `conic-gradient(#059669 ${progressDegrees}deg, #e4e4e7 ${progressDegrees}deg)`,
              }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalSeconds}
              aria-valuenow={totalSeconds - remainingSeconds}
              aria-label="Session progress"
            />
            <div className="absolute inset-2 rounded-full bg-white" aria-hidden="true" />
            <p
              className="relative text-center font-mono text-6xl font-semibold tabular-nums tracking-tight text-zinc-900"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatDuration(remainingSeconds)}
            </p>
          </div>
          <p className="mb-6 text-center text-sm text-zinc-500">
            {timerRunning
              ? "Stay with it — you're in focus mode"
              : status === "paused"
                ? "Paused — resume when you're ready"
                : "Ready when you are"}
          </p>

          <div className="flex gap-3">
            {timerRunning ? (
              <button
                type="button"
                onClick={handlePause}
                className="flex-1 rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="flex-1 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                {status === "paused" ? "Resume" : "Start focus"}
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-zinc-200 px-5 py-3.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-amber-900">Current streak</p>
            <p className="text-xs text-amber-800/80">
              Consecutive days with focus logged
            </p>
          </div>
          <p className="text-3xl font-bold tabular-nums text-amber-900">
            {streak}
            <span className="ml-1 text-base font-semibold">
              {streak === 1 ? "day" : "days"}
            </span>
          </p>
        </section>

        <section className="space-y-4" aria-label="Today's sessions">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Today</h2>
            <div className="text-right text-sm text-zinc-500">
              <p>
                {todaySessions.length}{" "}
                {todaySessions.length === 1 ? "session" : "sessions"}
              </p>
              {totalMinutesToday > 0 ? (
                <p className="font-medium text-emerald-700">
                  {totalMinutesToday} min focused
                </p>
              ) : null}
            </div>
          </div>

          {todaySessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center">
              <p className="text-base font-medium text-zinc-800">
                No focus sessions yet today
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Pick a preset, hit Start, and log what you worked on when the
                timer ends. Even one session counts toward your streak.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todaySessions.map((session) => (
                <li
                  key={session.id}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                >
                  <p className="font-medium text-zinc-900">{session.focusText}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {session.durationMinutes} min · {formatTime(session.completedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="pb-4 text-center text-xs text-zinc-500">
          Tip: log every completed session to keep your streak alive.
        </footer>
      </div>

      {showLogModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-modal-title"
          onClick={dismissModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="log-modal-title"
              className="text-xl font-semibold text-zinc-900"
            >
              What did you focus on?
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Session complete — {completedDuration} minutes done. What did you
              work on?
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleLogSubmit}>
              <label className="block">
                <span className="sr-only">Focus description</span>
                <input
                  autoFocus
                  value={focusText}
                  onChange={(event) => setFocusText(event.target.value)}
                  placeholder="e.g. Wrote API docs for auth flow"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!focusText.trim()}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Log session
                </button>
                <button
                  type="button"
                  onClick={dismissModal}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Skip (no streak)
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
