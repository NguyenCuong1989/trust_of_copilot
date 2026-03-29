const ghToken = process.env.GH_PAT;
const repoFull = process.env.GITHUB_REPOSITORY;
const [owner, repo] = repoFull.split("/");

async function gh(path, method = "GET", body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${ghToken}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

const sha = (await gh(`/repos/${owner}/${repo}/git/ref/heads/main`)).object.sha;
const branch = `notion/proposal-${Date.now()}`;

await gh(`/repos/${owner}/${repo}/git/refs`, "POST", {
  ref: `refs/heads/${branch}`,
  sha
});

const content = Buffer.from(`# Proposal\n\nGenerated from Notion sync.\n`).toString("base64");

await gh(`/repos/${owner}/${repo}/contents/proposals/auto-proposal.md`, "PUT", {
  message: "add proposal from notion",
  content,
  branch
});

const pr = await gh(`/repos/${owner}/${repo}/pulls`, "POST", {
  title: "Auto proposal from Notion",
  head: branch,
  base: "main",
  body: "Generated automatically from Notion."
});

console.log(`PR_CREATED ${pr.html_url}`);
