import { SECRET_PATTERNS, SKIP_EXTENSIONS } from "../constants";

export interface SecretMatch {
  line: number;
  pattern: string;
  filePath: string;
}

export function shouldScanFile(filePath: string): boolean {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return !SKIP_EXTENSIONS.has(ext);
}

export function scanForSecrets(
  content: string,
  filePath: string,
): SecretMatch[] {
  const results: SecretMatch[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { label, regex } of SECRET_PATTERNS) {
      regex.lastIndex = 0;
      if (regex.test(line)) {
        results.push({
          line: i + 1,
          pattern: label,
          filePath,
        });
      }
    }
  }

  return results;
}
