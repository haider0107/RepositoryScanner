import { getFileContent, getPublicProjects, getRepoTree } from "@/app/lib/gitlab";
import { buildProjectReport, buildScanReport } from "@/app/lib/report";
import { scanForSecrets, shouldScanFile } from "@/app/lib/scanners/exposedSecrets";
import { scanMissingMetadata } from "@/app/lib/scanners/missingMetadata";
import { scanSensitiveFiles } from "@/app/lib/scanners/sensitiveFiles";
import { setDone, setError, setScanning } from "@/app/lib/store";
import { NextRequest, NextResponse } from "next/server";

// POST /api/scan
// Body: { username: string }
// Triggers the scan in the background and returns 202 immediately.
// Poll GET /api/report to get status + results.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    // Mark as scanning immediately so /api/report reflects status right away
    setScanning();

    // Fire and forget — don't await so we return 202 instantly
    runScan(username.trim());

    return NextResponse.json(
      { message: "Scan started.", username: username.trim() },
      { status: 202 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function runScan(username: string) {
  try {
    const projects = await getPublicProjects(username);

    if (projects.length === 0) {
      setError(`No public repositories found for "${username}".`);
      return;
    }

    const projectReports = await Promise.all(
      projects.map(async (project) => {
        try {
          const branch = project.default_branch || "main";
          const tree = await getRepoTree(project.id, branch);

          // 1. Sensitive files
          const sensitiveFiles = scanSensitiveFiles(tree);

          // 2. Exposed secrets — scan file contents
          const secretMatches: { filePath: string; line: number; pattern: string }[] = [];
          const filesToScan = tree
            .filter((item) => shouldScanFile(item.path))
            .slice(0, 50);

          await Promise.all(
            filesToScan.map(async (item) => {
              const content = await getFileContent(project.id, item.path, branch);
              if (content) {
                const matches = scanForSecrets(content, item.path);
                secretMatches.push(...matches);
              }
            })
          );

          // 3. Missing metadata
          const { missing } = scanMissingMetadata(tree);

          return buildProjectReport(
            project.name,
            project.web_url,
            project.path_with_namespace,
            sensitiveFiles,
            secretMatches,
            missing
          );
        } catch {
          // Single project failure — include with no issues rather than crashing the whole scan
          return buildProjectReport(
            project.name,
            project.web_url,
            project.path_with_namespace,
            [],
            [],
            []
          );
        }
      })
    );

    const report = buildScanReport(username, projectReports);
    setDone(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Scan failed unexpectedly.";
    setError(message);
  }
}