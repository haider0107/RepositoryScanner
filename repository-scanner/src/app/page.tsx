"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  LinearProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import { ScanReport } from "./lib/report";
import ResultsTable from "./components/ResultsTable";

type ScanState = "idle" | "scanning" | "done" | "error";

const SCAN_CATEGORIES = [
  { label: "Sensitive Files", color: "error" as const },
  { label: "Exposed Secrets", color: "warning" as const },
  { label: "Missing Metadata", color: "info" as const },
];

const PROGRESS_MESSAGES = [
  "Fetching repositories...",
  "Analyzing file trees...",
  "Scanning for sensitive files...",
  "Checking for exposed secrets...",
  "Inspecting metadata...",
  "Almost done...",
];

export default function Home() {
  const [username, setUsername] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  async function handleScan() {
    if (!username.trim()) return;
    setState("scanning");
    setError("");
    setReport(null);
    setProgress("Starting scan...");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start scan.");
      }

      await pollReport();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  async function pollReport() {
    const POLL_INTERVAL = 1500;
    const MAX_POLLS = 120;
    let pollCount = 0;

    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        pollCount++;
        setProgress(
          PROGRESS_MESSAGES[
            Math.min(Math.floor(pollCount / 4), PROGRESS_MESSAGES.length - 1)
          ],
        );

        if (pollCount > MAX_POLLS) {
          clearInterval(interval);
          reject(new Error("Scan timed out. Try a smaller account."));
          return;
        }

        try {
          const res = await fetch("/api/report");
          const data = await res.json();

          if (data.status === "done") {
            clearInterval(interval);
            setReport(data.report);
            setState("done");
            resolve();
          } else if (data.status === "error") {
            clearInterval(interval);
            reject(new Error(data.error || "Scan failed."));
          }
        } catch {
          // Network hiccup — keep polling
        }
      }, POLL_INTERVAL);
    });
  }

  return (
    <Container maxWidth="lg" style={{ paddingTop: 48, paddingBottom: 48 }}>
      {/* Header */}
      <Box style={{ marginBottom: 40 }}>
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <SecurityIcon color="primary" />
          <Typography
            variant="overline"
            color="primary"
            style={{ fontWeight: 700, letterSpacing: 2 }}
          >
            GitLab Security Scanner
          </Typography>
        </Box>
        <Typography variant="h4" style={{ fontWeight: 800 }} gutterBottom>
          Repository Risk Scanner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Scan public GitLab repositories for exposed secrets, sensitive files,
          and missing metadata.
        </Typography>
      </Box>

      {/* Input card */}
      <Paper variant="outlined" style={{ padding: 24, marginBottom: 32 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          GitLab Username or Group
        </Typography>

        <Box style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. gitlab-org"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            disabled={state === "scanning"}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">@</InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleScan}
            disabled={state === "scanning" || !username.trim()}
            startIcon={
              state === "scanning" ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SearchIcon />
              )
            }
            style={{ whiteSpace: "nowrap", minWidth: 120 }}
          >
            {state === "scanning" ? "Scanning..." : "Scan"}
          </Button>
        </Box>

        <Box style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SCAN_CATEGORIES.map(({ label, color }) => (
            <Chip
              key={label}
              label={label}
              color={color}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </Paper>

      {/* Scanning progress */}
      {state === "scanning" && (
        <Paper
          variant="outlined"
          style={{ padding: 32, marginBottom: 32, textAlign: "center" }}
        >
          <LinearProgress style={{ marginBottom: 16, borderRadius: 4 }} />
          <Typography variant="body2" color="text.secondary">
            {progress}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            style={{ marginTop: 8, display: "block" }}
          >
            This may take a moment depending on how many repositories exist
          </Typography>
        </Paper>
      )}

      {/* Error */}
      {state === "error" && (
        <Alert severity="error" style={{ marginBottom: 32 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {state === "done" && report && (
        <>
          <Box
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            {/* <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
            >
              Export JSON
            </Button> */}
          </Box>
          <ResultsTable report={report} />
        </>
      )}
    </Container>
  );
}
