import { SENSITIVE_FILE_PATTERNS } from "../constants";
import { GitLabTreeItem } from "../gitlab";



export interface SensitiveFileResult {
  filePath: string;
  label: string;
}

export function scanSensitiveFiles(
  tree: GitLabTreeItem[],
): SensitiveFileResult[] {
  const results: SensitiveFileResult[] = [];

  for (const item of tree) {
    const fileName = item.path.split("/").pop() || "";
    const fullPath = item.path;

    for (const { pattern, label } of SENSITIVE_FILE_PATTERNS) {
      if (pattern.test(fileName) || pattern.test(fullPath)) {
        results.push({ filePath: item.path, label });
        break;
      }
    }
  }

  return results;
}
