export type Severity = "High" | "Medium" | "Low";

export interface ScanIssue {
  type: "Sensitive File" | "Exposed Secret" | "Missing Metadata";
  detail: string;
  severity: Severity;
}

export interface ProjectReport {
  projectName: string;
  projectUrl: string;
  namespace: string;
  issues: ScanIssue[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
  overallSeverity: Severity | "Clean";
}

export interface ScanReport {
  username: string;
  scannedAt: string;
  totalProjects: number;
  totalIssues: number;
  projects: ProjectReport[];
}

export function buildProjectReport(
  projectName: string,
  projectUrl: string,
  namespace: string,
  sensitiveFiles: { filePath: string; label: string }[],
  exposedSecrets: { filePath: string; line: number; pattern: string }[],
  missingMetadata: string[],
): ProjectReport {
  const issues: ScanIssue[] = [];

  for (const file of sensitiveFiles) {
    issues.push({
      type: "Sensitive File",
      detail: `Found: ${file.label} at ${file.filePath}`,
      severity: "High",
    });
  }

  for (const secret of exposedSecrets) {
    issues.push({
      type: "Exposed Secret",
      detail: `${secret.pattern} detected in ${secret.filePath}:${secret.line}`,
      severity: "High",
    });
  }

  for (const meta of missingMetadata) {
    issues.push({
      type: "Missing Metadata",
      detail: `Missing ${meta} file`,
      severity: "Low",
    });
  }

  const highCount = issues.filter((i) => i.severity === "High").length;
  const mediumCount = issues.filter((i) => i.severity === "Medium").length;
  const lowCount = issues.filter((i) => i.severity === "Low").length;

  let overallSeverity: Severity | "Clean" = "Clean";
  if (highCount > 0) overallSeverity = "High";
  else if (mediumCount > 0) overallSeverity = "Medium";
  else if (lowCount > 0) overallSeverity = "Low";

  return {
    projectName,
    projectUrl,
    namespace,
    issues,
    highCount,
    mediumCount,
    lowCount,
    overallSeverity,
  };
}

export function buildScanReport(
  username: string,
  projects: ProjectReport[],
): ScanReport {
  return {
    username,
    scannedAt: new Date().toISOString(),
    totalProjects: projects.length,
    totalIssues: projects.reduce((sum, p) => sum + p.issues.length, 0),
    projects,
  };
}
