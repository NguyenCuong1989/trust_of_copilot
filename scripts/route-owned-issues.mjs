import fs from "fs";
const repoFull = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repoFull) throw new Error("Missing GITHUB_REPOSITORY");
if (!token) throw new Error("Missing GITHUB_TOKEN");
const [owner, repo] = repoFull.split("/");
const mesh = JSON.parse(fs.readFileSync(".mcp/mesh.json", "utf8"));
const primaryEmail = mesh.identities.primary.email;
const secondaryEmail = mesh.identities.secondary.email;
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
async function ensureLabel(name) {
  try {
    await gh(`/repos/${owner}/${repo}/labels/${encodeURIComponent(name)}`);
  } catch {
    await gh(`/repos/${owner}/${repo}/labels`, "POST", { name });
  }
}
function chooseOwner(issue) {
  const text = `${issue.title}\n${issue.body || ""}`.toLowerCase();
  if (text.includes(primaryEmail.toLowerCase())) return primaryEmail;
  if (text.includes(secondaryEmail.toLowerCase())) return secondaryEmail;
  if (text.includes("ops") || text.includes("fallback")) return secondaryEmail;
  return primaryEmail;
}
const issues = await gh(`/repos/${owner}/${repo}/issues?state=all&per_page=100`);
for (const issue of issues) {
  const labels = (issue.labels || []).map(l => l.name);
  if (!labels.includes("notion-sync")) continue;
  const ownerEmail = chooseOwner(issue);
  const ownerLabel = `owner:${ownerEmail}`;
  await ensureLabel(ownerLabel);
  const nextLabels = Array.from(new Set([...labels.filter(x => !x.startsWith("owner:")), ownerLabel])).sort();
  const prevLabels = [...labels].sort();
  if (JSON.stringify(prevLabels) !== JSON.stringify(nextLabels)) {
    await gh(`/repos/${owner}/${repo}/issues/${issue.number}`, "PATCH", { labels: nextLabels });
    console.log(`OWNER_ROUTED #${issue.number} -> ${ownerEmail}`);
  } else {
    console.log(`OWNER_OK #${issue.number} -> ${ownerEmail}`);
  }
}
