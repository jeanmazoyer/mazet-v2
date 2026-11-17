import { readFileSync } from "node:fs";
import path from "node:path";
import { parse, wcagContrast } from "culori";
import { describe, expect, it } from "vitest";

// Contraste WCAG AA (4,5:1 pour le texte courant) sur chaque couple texte / fond
// du thème. Lit les valeurs directement dans globals.css.
const css = readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
const root = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));

function color(name: string) {
  const parsed = parse(token(name));
  if (!parsed) throw new Error(`couleur illisible : ${name}`);
  return parsed;
}

function token(name: string): string {
  const m = root.match(new RegExp(`--${name}:\\s*(oklch\\([^)]*\\))`));
  if (!m) throw new Error(`token introuvable : ${name}`);
  return m[1];
}

const PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["accent-foreground", "accent"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ["sidebar-primary-foreground", "sidebar-primary"],
];

describe("contraste AA du thème", () => {
  for (const [fg, bg] of PAIRS) {
    it(`${fg} sur ${bg} >= 4,5:1`, () => {
      const ratio = wcagContrast(color(fg), color(bg));
      expect(ratio, `${fg} / ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    });
  }
});
