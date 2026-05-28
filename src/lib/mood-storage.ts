"use client";

import { useSyncExternalStore } from "react";
import { normalizeEntry, type MoodEntries, type MoodEntry } from "./mood-types";

const STORAGE_KEY = "mood-journal";

const EMPTY_ENTRIES: MoodEntries = {};

let cachedRaw: string | null = null;
let cachedSnapshot: MoodEntries = EMPTY_ENTRIES;

const listeners = new Set<() => void>();

function readEntries(): MoodEntries {
  if (typeof window === "undefined") {
    return EMPTY_ENTRIES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_ENTRIES;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return EMPTY_ENTRIES;
    }

    const entries: MoodEntries = {};
    for (const [key, value] of Object.entries(parsed)) {
      const entry = normalizeEntry(value);
      if (entry) {
        entries[key] = entry;
      }
    }
    return entries;
  } catch {
    return EMPTY_ENTRIES;
  }
}

function getSnapshot(): MoodEntries {
  if (typeof window === "undefined") {
    return cachedSnapshot;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  cachedSnapshot = readEntries();
  return cachedSnapshot;
}

function getServerSnapshot(): MoodEntries {
  return EMPTY_ENTRIES;
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cachedRaw = null;
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function emitChange() {
  cachedRaw = null;
  listeners.forEach((listener) => listener());
}

export function saveMoodEntry(dateKey: string, entry: MoodEntry) {
  const entries = { ...readEntries(), [dateKey]: entry };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  emitChange();
}

export function useMoodEntries() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
