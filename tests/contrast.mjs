// WCAG contrast of every foreground token against the surface it sits on,
// read from the real theme file. Body text needs 4.5:1, large text 3:1.
import { themes } from "/mnt/data1/OSSPREY/OSSPREY-FrontEnd-Server/src/plugins/vuetify/theme.js";
import assert from "assert";

const lum = hex => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

let failures = 0;
for (const mode of ["light", "dark"]) {
  const c = themes[mode].colors;
  console.log(`\n--- ${mode} (surface ${c.surface}, background ${c.background}) ---`);
  const checks = [
    ["heading on surface", c.heading, c.surface, 4.5],
    ["link on surface", c.link, c.surface, 4.5],
    ["body on surface", c["on-surface"], c.surface, 4.5],
    ["net-label on surface", c["net-label"], c.surface, 4.5],
    ["net-stroke on surface", c["net-stroke"], c.surface, 3.0],
    ["chip text on chip", c["chip-on-surface"], c["chip-surface"], 4.5],
    ["body on background", c["on-background"], c.background, 4.5],
  ];
  for (const [label, fg, bg, min] of checks) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label.padEnd(24)} ${fg} on ${bg}  ${r.toFixed(2)}:1 (need ${min})`);
  }
  // surfaces must be distinguishable from the page behind them
  // Only meaningful in dark mode: light cards are separated by elevation shadows,
  // dark ones have to do it with lightness.
  const sep = ratio(c.surface, c.background);
  console.log(`  ${sep >= 1.12 ? "PASS" : "FAIL"}  surface/background separation      ${sep.toFixed(2)}:1 (need 1.12)`);
  if (mode === "dark" && sep < 1.12) failures++;
}
console.log();
assert.strictEqual(failures, 0, failures + " contrast checks failed");
console.log("all contrast checks pass");
