import { setTimeout as delay } from "node:timers/promises";

const branch = process.env.CF_PAGES_BRANCH;
const sha = process.env.CF_PAGES_COMMIT_SHA;
if (branch !== "main" || !/^[0-9a-f]{40}$/.test(sha ?? "")) {
  throw new Error("Production Pages builds require a full commit SHA on main.");
}

const api = "https://api.github.com/repos/yPinn/ProGrads";

async function github(path) {
  const response = await fetch(api + path, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status} for ${path}`);
  return response.json();
}

if (!process.argv.includes("--check-head")) {
  const query = new URLSearchParams({ event: "push", branch, head_sha: sha, per_page: "1" });
  const deadline = Date.now() + 15 * 60_000;
  let passed = false;
  while (Date.now() < deadline) {
    const { workflow_runs: runs } = await github(`/actions/workflows/ci.yml/runs?${query}`);
    const run = runs[0];
    if (run?.status === "completed") {
      if (run.conclusion !== "success") {
        throw new Error(`CI for ${sha} finished with ${run.conclusion}: ${run.html_url}`);
      }
      console.log(`CI passed for ${sha}: ${run.html_url}`);
      passed = true;
      break;
    }
    await delay(20_000);
  }
  if (!passed) throw new Error(`Timed out waiting for CI for ${sha}.`);
}

const { object } = await github("/git/ref/heads/main");
if (object.sha !== sha) throw new Error(`main advanced beyond ${sha}.`);
