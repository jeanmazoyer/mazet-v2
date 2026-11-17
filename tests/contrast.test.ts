import { readFileSync } from "node:fs";
import path from "node:path";
import { parse, wcagContrast } from "culori";
import { describe, expect, it } from "vitest";

// Contraste WCAG AA (4,5:1 pour le texte courant) sur chaque couple texte / fond,
// en mode clair et en mode sombre. Lit les valeurs directement dans globals.css.
const css = readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");

function block(startMarker: string): string {
  const start = css.indexOf(startMarker);
  if (start < 0) throw new Error(`bloc introuvable : ${startMarker}`);
  const open = css.indexOf(":root", start);
  return css.slice(open, css.indexOf("}", open));
}

const THEMES = {
  clair: block(":root {"),
  sombre: block("@media (prefers-color-scheme: dark)"),
};

function color(theme: string, name: string) {
  const m = theme.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`token introuvable : ${name}`);
  const parsed = parse(m[1].trim());
  if (!parsed) throw new Error(`couleur illisible : ${name} = ${m[1]}`);
  return parsed;
}

const PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "card"],
  ["muted-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["sidebar-foreground", "sidebar"],
  ["muted-foreground", "sidebar"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["status-red", "card"],
  ["status-green", "card"],
  ["status-amber", "card"],
  ["status-blue", "card"],
  ["status-red", "background"],
  ["status-green", "muted"],
  ["status-amber", "muted"],
  ["status-blue", "muted"],
];

for (const [themeName, theme] of Object.entries(THEMES)) {
  describe(`contraste AA du thème ${themeName}`, () => {
    for (const [fg, bg] of PAIRS) {
      it(`${fg} sur ${bg} >= 4,5:1`, () => {
        const ratio = wcagContrast(color(theme, fg), color(theme, bg));
        expect(ratio, `${fg} / ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
}
