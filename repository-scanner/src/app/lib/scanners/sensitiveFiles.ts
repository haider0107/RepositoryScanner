import { GitLabTreeItem } from "../gitlab";

const SENSITIVE_FILE_PATTERNS = [
  { pattern: /^\.env$/, label: ".env" },
  {
    pattern: /^\.env\.(local|production|staging|development)$/,
    label: ".env.*",
  },
  { pattern: /\.pem$/, label: "*.pem (certificate)" },
  { pattern: /id_rsa$/, label: "id_rsa (SSH private key)" },
  { pattern: /id_dsa$/, label: "id_dsa (SSH private key)" },
  { pattern: /id_ecdsa$/, label: "id_ecdsa (SSH private key)" },
  { pattern: /id_ed25519$/, label: "id_ed25519 (SSH private key)" },
  { pattern: /\.key$/, label: "*.key (private key)" },
  { pattern: /\.p12$/, label: "*.p12 (certificate)" },
  { pattern: /\.pfx$/, label: "*.pfx (certificate)" },
  { pattern: /secrets\.ya?ml$/, label: "secrets.yml" },
  { pattern: /credentials\.ya?ml$/, label: "credentials.yml" },
  { pattern: /database\.ya?ml$/, label: "database.yml" },
  { pattern: /config\.json$/, label: "config.json" },
  { pattern: /\.htpasswd$/, label: ".htpasswd" },
  { pattern: /\.netrc$/, label: ".netrc" },
  { pattern: /\.aws\/credentials$/, label: "AWS credentials file" },
  {
    pattern: /google.*credentials.*\.json$/i,
    label: "Google credentials JSON",
  },
  { pattern: /service[-_]?account.*\.json$/i, label: "Service account JSON" },
  { pattern: /terraform\.tfvars$/, label: "terraform.tfvars" },
  { pattern: /\.kubeconfig$/, label: "kubeconfig" },
  { pattern: /kubeconfig$/, label: "kubeconfig" },
];

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
