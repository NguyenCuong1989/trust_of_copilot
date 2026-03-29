import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const owner = process.env.GITHUB_REPOSITORY.split("/")[0];
const repo = process.env.GITHUB_REPOSITORY.split("/")[1];
const ghToken = process.env.GH_PAT;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!ghToken) throw new Error("Missing GH_PAT");
if (!process.env.NOTION_API_KEY) throw new Error("Missing NOTION_API_KEY");
if (!databaseId) throw new Error("Missing NOTION_DATABASE_ID");

const headers = {
  "Authorization": `Bearer ${ghToken}`,
  "Accept": "application/vnd.github+json",
  "Content-Type": "application/json"
};

function richTextToString(arr = []) {
  return arr.map(x => x.plain_text || "").join("").trim();
}

function getTitle(page) {
  const props = page.properties || {};
  for (const key of Object.keys(props)) {
    if (props[key]?.type === "title") {
      return richTextToString(props[key].title);
    }
  }
  return "";
}

function getStatus(page) {
  const props = page.properties || {};
  for (const key of Object.keys(props)) {
    if (props[key]?.type === "status") {
      return props[key].status?.name || "";
    }
    if (props[key]?.type === "select" && /status/i.test(key)) {
      return props[key].select?.name || "";
    }
  }
  return "";
}

function getBody(page) {
  const props = page.properties || {};
  const lines = [];
  lines.push(`Notion Page ID: ${page.id}`);
  lines.push(`Notion URL: ${page.url}`);
  for (const [key, value] of Object.entries(props)) {
    if (value?.type === "rich_text") {
      const text = richTextToString(value.rich_text);
      if (text) lines.push(`${key}: ${text}`);
    }
    if (value?.type === "select" && value.select?.name) {
      lines.push(`${key}: ${value.select.name}`);
    }
    if (value?.type === "status" && value.status?.name) {
      lines.push(`${key}: ${value.status.name}`);
    }
  }
  return lines.join("\n");
}

async function gh(path, method = "GET", body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function findExistingIssueByPageId(pageId) {
  const issues = await gh(`/repos/${owner}/${repo}/issues?state=all&per_page=100`);
  return issues.find(issue => (issue.body || "").includes(`Notion Page ID: ${pageId}`));
}

const query = await notion.databases.query({
  database_id: databaseId
});

for (const page of query.results) {
  const title = getTitle(page);
  const status = getStatus(page).toLowerCase();
  if (!title) continue;
  if (status && ["done", "complete", "completed", "archived"].includes(status)) continue;

  const body = getBody(page);
  const existing = await findExistingIssueByPageId(page.id);

  if (!existing) {
    const created = await gh(`/repos/${owner}/${repo}/issues`, "POST", {
      title: `[Notion] ${title}`,
      body
    });
    console.log(`CREATED_ISSUE #${created.number} ${title}`);
  } else {
    const normalizedExisting = `${existing.title}\n${existing.body || ""}`.trim();
    const normalizedNext = `[Notion] ${title}\n${body}`.trim();
    if (normalizedExisting !== normalizedNext) {
      await gh(`/repos/${owner}/${repo}/issues/${existing.number}`, "PATCH", {
        title: `[Notion] ${title}`,
        body
      });
      console.log(`UPDATED_ISSUE #${existing.number} ${title}`);
    } else {
      console.log(`NO_CHANGE #${existing.number} ${title}`);
    }
  }
}
