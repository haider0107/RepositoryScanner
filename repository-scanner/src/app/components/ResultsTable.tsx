"use client";

import {
  Card,
  CardContent,
  Chip,
  Collapse,
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
} from "@mui/material";
import { useState } from "react";

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
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                gutterBottom
              >
                {card.label}
              </Typography>
              <Typography variant="h4" fontWeight={700} color={card.color}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function IssueRow({ project }: { project: ProjectReport }) {
  const [open, setOpen] = useState(false);
  const hasIssues = project.issues.length > 0;

  return (
    <>
      <TableRow
        hover
        sx={{
          "& > *": { borderBottom: hasIssues && open ? "unset" : undefined },
        }}
      >
        <TableCell sx={{ width: 48 }}>
          {hasIssues && (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>

        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight={600}>
              {project.projectName}
            </Typography>
            <Tooltip title="Open in GitLab">
              <IconButton
                size="small"
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                component="a"
              >
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {project.namespace}
          </Typography>
        </TableCell>

        <TableCell>
          {hasIssues ? (
            <Box display="flex" gap={1} flexWrap="wrap">
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

        <TableCell align="center">
          <Chip
            label={project.overallSeverity}
            color={severityColor[project.overallSeverity]}
            size="small"
            variant="outlined"
          />
        </TableCell>
      </TableRow>

      {hasIssues && (
        <TableRow>
          <TableCell colSpan={4} sx={{ py: 0 }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ py: 2, px: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detected Issues
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Typography variant="caption" fontWeight={600}>
                          Type
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontWeight={600}>
                          Detail
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" fontWeight={600}>
                          Severity
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.issues.map((issue, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Typography variant="caption">
                            {issue.type}
                          </Typography>
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
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function ResultsTable({ report }: Props) {
  const sorted = [...report.projects].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2, Clean: 3 };
    return order[a.overallSeverity] - order[b.overallSeverity];
  });

  return (
    <Box>
      <SummaryCards report={report} />

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="h6">
          Results for{" "}
          <Typography component="span" color="primary" fontWeight={700}>
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
              <TableCell sx={{ width: 48 }} />
              <TableCell>
                <Typography variant="subtitle2">Project</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Issues</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2">Severity</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((project) => (
              <IssueRow key={project.namespace} project={project} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
