export interface SecretMatch {
  line: number;
  pattern: string;
  filePath: string;
}

interface SecretPattern {
  label: string;
  regex: RegExp;
}

const SECRET_PATTERNS: SecretPattern[] = [
  { label: "AWS Access Key ID", regex: /AKIA[0-9A-Z]{16}/g },
  {
    label: "AWS Secret Access Key",
    regex:
      /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*=\s*['"]?[A-Za-z0-9/+=]{40}['"]?/g,
  },
  { label: "GitHub Personal Access Token", regex: /ghp_[a-zA-Z0-9]{36}/g },
  { label: "GitHub OAuth Token", regex: /gho_[a-zA-Z0-9]{36}/g },
  { label: "GitHub App Token", regex: /ghs_[a-zA-Z0-9]{36}/g },
  { label: "GitLab Personal Access Token", regex: /glpat-[a-zA-Z0-9_-]{20}/g },
  { label: "Stripe Secret Key", regex: /sk_live_[0-9a-zA-Z]{24}/g },
  { label: "Stripe Publishable Key", regex: /pk_live_[0-9a-zA-Z]{24}/g },
  {
    label: "Slack Bot Token",
    regex: /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/g,
  },
  { label: "Slack OAuth Token", regex: /xoxp-[0-9]+-[0-9]+-[0-9]+-[a-f0-9]+/g },
  { label: "Google API Key", regex: /AIza[0-9A-Za-z_-]{35}/g },
  {
    label: "Firebase Database URL",
    regex: /https:\/\/[a-z0-9-]+\.firebaseio\.com/g,
  },
  {
    label: "Hardcoded Password",
    regex: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{6,}['"]/gi,
  },
  {
    label: "Hardcoded API Key",
    regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/gi,
  },
  {
    label: "Hardcoded Secret",
    regex: /(?:secret|secret_key|secretkey)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
  },
  { label: "Bearer Token", regex: /Bearer\s+[a-zA-Z0-9_\-\.=]{20,}/g },
  {
    label: "Private Key Block",
    regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
  },
  { label: "Twilio API Key", regex: /SK[0-9a-fA-F]{32}/g },
  {
    label: "SendGrid API Key",
    regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
  },
  { label: "JWT Token", regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]+/g },
  {
    label: "Heroku API Key",
    regex:
      /[hH]eroku.*[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/g,
  },
  {
    label: "NPM Auth Token",
    regex: /\/\/registry\.npmjs\.org\/:_authToken=[a-zA-Z0-9_-]+/g,
  },
  {
    label: "Database Connection String",
    regex: /(?:mongodb|postgres|mysql|redis):\/\/[a-zA-Z0-9_\-]+:[^@\s]{6,}@/gi,
  },
];

// File extensions to skip (binary/irrelevant)
const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".bin",
  ".exe",
  ".dll",
  ".so",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".mp3",
  ".lock",
  ".sum",
]);

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
