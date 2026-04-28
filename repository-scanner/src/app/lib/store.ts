import { ScanReport } from "./report";

// Simple in-memory store to share scan results between API routes
// In production, replace this with Redis or a database

type ScanStatus = "idle" | "scanning" | "done" | "error";

interface ScanStore {
  status: ScanStatus;
  report: ScanReport | null;
  error: string | null;
  startedAt: string | null;
}

const store: ScanStore = {
  status: "idle",
  report: null,
  error: null,
  startedAt: null,
};

export function getStore() {
  return store;
}

export function setScanning() {
  store.status = "scanning";
  store.report = null;
  store.error = null;
  store.startedAt = new Date().toISOString();
}

export function setDone(report: ScanReport) {
  store.status = "done";
  store.report = report;
  store.error = null;
}

export function setError(message: string) {
  store.status = "error";
  store.error = message;
  store.report = null;
}
