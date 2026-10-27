#!/usr/bin/env node
/**
 * Production smoke: hits the running container. Used by CI after docker compose up.
 * Exit 0 only if health, pages, and cover all succeed.
 */
const base = process.argv[2] ?? "http://127.0.0.1:3000";

const checks = [
  { path: "/api/health", expect: 200, contains: '"ok":true' },
  { path: "/", expect: 200, contains: "Don’t Wishlist" },
  { path: "/login", expect: 200, contains: "Log in" },
  { path: "/register", expect: 200, contains: "Create account" },
  { path: "/api/cover?title=Celeste", expect: 200, contains: "<svg" },
  { path: "/library", expect: [307, 308, 200] },
];

async function hit(url) {
  const res = await fetch(url, { redirect: "manual" });
  const body = await res.text();
  return { status: res.status, body };
}

const failures = [];
for (const check of checks) {
  const url = `${base}${check.path}`;
  try {
    const { status, body } = await hit(url);
    const allowed = Array.isArray(check.expect) ? check.expect : [check.expect];
    if (!allowed.includes(status)) {
      failures.push(`${check.path} status ${status}, expected ${allowed.join("|")}`);
      continue;
    }
    if (check.contains && !body.includes(check.contains)) {
      failures.push(`${check.path} missing ${JSON.stringify(check.contains)}`);
    }
  } catch (err) {
    failures.push(`${check.path} ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (failures.length) {
  console.error("SMOKE FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log(`SMOKE OK against ${base} (${checks.length} checks)`);
