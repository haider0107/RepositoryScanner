"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { ProjectReport, ScanReport, Severity } from "../lib/report";

interface Props {
  report: ScanReport;
}

const severityColor: Record<
  Severity | "Clean",
  "error" | "warning" | "info" | "success"
> = {
  High: "error",
  Medium: "warning",
  Low: "info",
  Clean: "success",
};

// ─── Summary Cards ───────────────────────────────────────────────────────────

function SummaryCards({ report }: { report: ScanReport }) {
  const highCount = report.projects.filter(
    (p) => p.overallSeverity === "High",
  ).length;
  const mediumCount = report.projects.filter(
    (p) => p.overallSeverity === "Medium",
  ).length;
  const cleanCount = report.projects.filter(
    (p) => p.overallSeverity === "Clean",
  ).length;

  const cards = [
    {
      label: "Repositories Scanned",
      value: report.totalProjects,
      color: "text.primary",
    },
    {
      label: "Total Issues Found",
      value: report.totalIssues,
      color: "error.main",
    },
    { label: "High Risk", value: highCount, color: "error.main" },
    { label: "Medium Risk", value: mediumCount, color: "warning.main" },
    { label: "Clean", value: cleanCount, color: "success.main" },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card) => (
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={card.label}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
              <Typography
                variant="h5"
                style={{ fontWeight: 600 }}
                color={card.color}
              >
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ─── Issues Modal ─────────────────────────────────────────────────────────────

function IssuesModal({
  project,
  open,
  onClose,
}: {
  project: ProjectReport | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!project) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Modal Header */}
      <DialogTitle>
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h6" style={{ fontWeight: 700 }}>
              {project.projectName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {project.namespace}
            </Typography>
          </Box>
          <Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Chip
              label={project.overallSeverity}
              color={severityColor[project.overallSeverity]}
              size="small"
              variant="outlined"
            />
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Modal Body */}
      <DialogContent dividers>
        {project.issues.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            style={{ textAlign: "center", padding: 24 }}
          >
            No issues detected
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="caption" style={{ fontWeight: 600 }}>
                    Type
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" style={{ fontWeight: 600 }}>
                    Detail
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="caption" style={{ fontWeight: 600 }}>
                    Severity
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.issues.map((issue, i) => (
                <TableRow key={i} hover>
                  <TableCell style={{ whiteSpace: "nowrap" }}>
                    <Typography variant="caption">{issue.type}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {issue.detail}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={issue.severity}
                      color={severityColor[issue.severity]}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function IssueRow({
  project,
  onRowClick,
}: {
  project: ProjectReport;
  onRowClick: (project: ProjectReport) => void;
}) {
  const hasIssues = project.issues.length > 0;

  return (
    <TableRow
      hover
      onClick={() => hasIssues && onRowClick(project)}
      style={{ cursor: hasIssues ? "pointer" : "default" }}
    >
      {/* Project name + link */}
      <TableCell>
        <Box style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Typography variant="body2" style={{ fontWeight: 600 }}>
            {project.projectName}
          </Typography>
          <Tooltip title="Open in GitLab">
            <IconButton
              size="small"
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              component="a"
              onClick={(e) => e.stopPropagation()} // prevent modal from opening
            >
              <OpenInNewIcon style={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {project.namespace}
        </Typography>
      </TableCell>

      {/* Issue chips */}
      <TableCell>
        {hasIssues ? (
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {project.highCount > 0 && (
              <Chip
                label={`${project.highCount} High`}
                color="error"
                size="small"
              />
            )}
            {project.mediumCount > 0 && (
              <Chip
                label={`${project.mediumCount} Medium`}
                color="warning"
                size="small"
              />
            )}
            {project.lowCount > 0 && (
              <Chip
                label={`${project.lowCount} Low`}
                color="info"
                size="small"
              />
            )}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No issues detected
          </Typography>
        )}
      </TableCell>

      {/* Overall severity */}
      <TableCell align="center">
        <Chip
          label={project.overallSeverity}
          color={severityColor[project.overallSeverity]}
          size="small"
          variant="outlined"
        />
      </TableCell>

      {/* Click hint */}
      <TableCell align="center">
        {hasIssues && (
          <Typography variant="caption" color="text.secondary">
            Click to view
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsTable({ report }: Props) {
  const [selectedProject, setSelectedProject] = useState<ProjectReport | null>(
    null,
  );

  const sorted = [...report.projects].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2, Clean: 3 };
    return order[a.overallSeverity] - order[b.overallSeverity];
  });

  return (
    <Box>
      <SummaryCards report={report} />

      <Box
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Typography variant="h6">
          Results for{" "}
          <Typography
            component="span"
            color="primary"
            style={{ fontWeight: 700 }}
          >
            @{report.username}
          </Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Scanned at {new Date(report.scannedAt).toLocaleString()}
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2">Project</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Issues</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2">Severity</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2">Details</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((project) => (
              <IssueRow
                key={project.namespace}
                project={project}
                onRowClick={setSelectedProject}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Issues Modal */}
      <IssuesModal
        project={selectedProject}
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </Box>
  );
}
