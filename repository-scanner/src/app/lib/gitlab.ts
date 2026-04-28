const GITLAB_API = "https://gitlab.com/api/v4";
const TOKEN = process.env.GITLAB_TOKEN;

const headers: HeadersInit = TOKEN ? { "PRIVATE-TOKEN": TOKEN } : {};

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  default_branch: string;
  visibility: string;
}

export interface GitLabTreeItem {
  id: string;
  name: string;
  type: "blob" | "tree";
  path: string;
}

export interface GitLabFileContent {
  content: string; // base64 encoded
  encoding: string;
}

export async function getPublicProjects(
  username: string,
): Promise<GitLabProject[]> {
  const allProjects: GitLabProject[] = [];
  let page = 1;

  // Try user endpoint first, then group endpoint
  while (true) {
    const url = `${GITLAB_API}/users/${encodeURIComponent(username)}/projects?visibility=public&per_page=100&page=${page}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      // Try groups endpoint
      const groupUrl = `${GITLAB_API}/groups/${encodeURIComponent(username)}/projects?visibility=public&per_page=100&page=${page}`;
      const groupRes = await fetch(groupUrl, { headers });
      if (!groupRes.ok)
        throw new Error(
          `User/group "${username}" not found or has no public repos.`,
        );
      const data: GitLabProject[] = await groupRes.json();
      allProjects.push(...data);
      if (data.length < 100) break;
      page++;
      continue;
    }

    const data: GitLabProject[] = await res.json();
    allProjects.push(...data);
    if (data.length < 100) break;
    page++;
  }

  return allProjects;
}

export async function getRepoTree(
  projectId: number,
  branch: string,
): Promise<GitLabTreeItem[]> {
  const allItems: GitLabTreeItem[] = [];
  let page = 1;

  while (true) {
    const url = `${GITLAB_API}/projects/${projectId}/repository/tree?recursive=true&per_page=100&page=${page}&ref=${encodeURIComponent(branch)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return allItems;

    const data: GitLabTreeItem[] = await res.json();
    allItems.push(...data.filter((item) => item.type === "blob"));
    if (data.length < 100) break;
    page++;
  }

  return allItems;
}

export async function getFileContent(
  projectId: number,
  filePath: string,
  branch: string,
): Promise<string | null> {
  const url = `${GITLAB_API}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.text();
}
