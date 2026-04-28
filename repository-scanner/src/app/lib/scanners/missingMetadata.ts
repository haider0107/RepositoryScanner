import { GitLabTreeItem } from "../gitlab";

export interface MetadataResult {
  missing: string[];
}

const REQUIRED_FILES = [
  {
    label: "README",
    patterns: ["README.md", "README.txt", "README.rst", "README", "readme.md"],
  },
  {
    label: "LICENSE",
    patterns: ["LICENSE", "LICENSE.md", "LICENSE.txt", "LICENCE", "licence.md"],
  },
];

export function scanMissingMetadata(tree: GitLabTreeItem[]): MetadataResult {
  const filePaths = new Set(tree.map((item) => item.path.toLowerCase()));
  const rootFiles = new Set(
    tree
      .filter((item) => !item.path.includes("/"))
      .map((item) => item.path.toLowerCase()),
  );

  const missing: string[] = [];

  for (const { label, patterns } of REQUIRED_FILES) {
    const found = patterns.some(
      (p) => rootFiles.has(p.toLowerCase()) || filePaths.has(p.toLowerCase()),
    );
    if (!found) {
      missing.push(label);
    }
  }

  return { missing };
}
