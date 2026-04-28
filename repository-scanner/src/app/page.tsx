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
import DownloadIcon from "@mui/icons-material/Download";
import SecurityIcon from "@mui/icons-material/Security";
import ResultsTable from "@/components/ResultsTable";
import { ScanReport } from "@/lib/report";

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
        setProgress(PROGRESS_MESSAGES[Math.min(Math.floor(pollCount / 4), PROGRESS_MESSAGES.length - 1)]);

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

  function handleExportJSON() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gitlab-scan-${report.username}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box mb={5}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <SecurityIcon color="primary" />
          <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>
            GitLab Security Scanner
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Repository Risk Scanner
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={500}>
          Scan public GitLab repositories for exposed secrets, sensitive files, and missing metadata.
        </Typography>
      </Box>

      {/* Input card */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          GitLab Username or Group
        </Typography>

        <Box display="flex" gap={2} mb={2}>
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
            startIcon={state === "scanning" ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            sx={{ whiteSpace: "nowrap", minWidth: 120 }}
          >
            {state === "scanning" ? "Scanning..." : "Scan"}
          </Button>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          {SCAN_CATEGORIES.map(({ label, color }) => (
            <Chip key={label} label={label} color={color} size="small" variant="outlined" />
          ))}
        </Box>
      </Paper>

      {/* Scanning progress */}
      {state === "scanning" && (
        <Paper variant="outlined" sx={{ p: 4, mb: 4, textAlign: "center" }}>
          <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {progress}
          </Typography>
          <Typography variant="caption" color="text.disabled" display="block" mt={1}>
            This may take a moment depending on how many repositories exist
          </Typography>
        </Paper>
      )}

      {/* Error */}
      {state === "error" && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {state === "done" && report && (
        <>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportJSON}
            >
              Export JSON
            </Button>
          </Box>
          <ResultsTable report={report} />
        </>
      )}
    </Container>
  );
}