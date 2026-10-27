/** Deterministic palette from title — stable covers without an asset CDN. */
export function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function coverInitials(title: string): string {
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

export function renderCoverSvg(title: string): string {
  const safe = title.trim() || "Game";
  const hue = hashHue(safe.toLowerCase());
  const initials = coverInitials(safe);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${escapeXml(safe)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 62% 42%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 45% 18%)"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="14" fill="url(#g)"/>
  <text x="64" y="72" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#e8eef5" opacity="0.92">${escapeXml(initials)}</text>
</svg>`;
}
