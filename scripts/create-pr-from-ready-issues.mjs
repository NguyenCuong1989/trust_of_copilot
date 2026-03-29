const repoFull = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repoFull) throw new Error("Missing GITHUB_REPOSITORY");
if (!token) throw new Error("Missing GITHUB_TOKEN");
const [owner, repo] = repoFull.split("/");
async function gh(path, method = "GET", body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}
function slugify(s = "") {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 40);
}
const issues = await gh(`/repos/${owner}/${repo}/issues?state=open&per_page=100`);
for (const issue of issues) {
  const labels = (issue.labels || []).map(x => x.name);
  if (!labels.includes("status:ready-for-pr")) continue;
  if (!labels.includes("notion-sync")) continue;
  const baseRef = await gh(`/repos/${owner}/${repo}/git/ref/heads/main`);
  const baseSha = baseRef.object.sha;
  const branch = `auto/pr-${issue.number}-${slugify(issue.title)}`;
  try {
    await gh(`/repos/${owner}/${repo}/git/refs`, "POST", { ref: `refs/heads/${branch}`, sha: baseSha });
  } catch (e) {
    if (!String(e.message).includes("Reference already exists")) throw e;
  }
  const proposal = [
    `# Proposal for Issue #${issue.number}`,
    ``,
    `Source issue: #${issue.number}`,
    `Title: ${issue.title}`,
    ``,
    `## Summary`,
    issue.body || "(no body)",
    ``,
    `## Proposed implementation`,
    `- Review the Notion-backed issue`,
    `- Validate connector routing`,
    `- Implement requested change`,
    `- Update docs/tests if needed`
  ].join("\n");
  let existingFileSha = null;
  try {
    const existingFile = await gh(`/repos/${owner}/${repo}/contents/proposals/issue-${issue.number}.md?ref=${branch}`);
    existingFileSha = existingFile.sha;
  } catch {}
  await gh(`/repos/${owner}/${repo}/contents/proposals/issue-${issue.number}.md`, "PUT", {
    message: `proposal: issue #${issue.number}`,
    content: Buffer.from(proposal).toString("base64"),
    branch,
    ...(existingFileSha ? { sha: existingFileSha } : {})
  });
  const prs = await gh(`/repos/${owner}/${repo}/pulls?state=open&head=${owner}:${branch}`);
  if (prs.length === 0) {
    const pr = await gh(`/repos/${owner}/${repo}/pulls`, "POST", {
      title: `Draft: ${issue.title}`,
      head: branch,
      base: "main",
      body: `Auto-generated draft PR for issue #${issue.number}.`,
      draft: true
    });
    console.log(`CREATED_DRAFT_PR #${pr.number} from issue #${issue.number}`);
  } else {
    console.log(`PR_ALREADY_EXISTS issue #${issue.number} -> PR #${prs[0].number}`);
  }
}
