// tokens.json (DTCG, source of truth) → tokens.legacy.json (Tokens Studio legacy format).
// The plugin defaults to legacy; both yield identical Figma output. Run: node design/to-legacy.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "tokens.json");
const OUT = join(here, "tokens.legacy.json");

// DTCG $type → legacy type; group disambiguates the shared dimension/number types.
function legacyType(dtcgType, group) {
  const byGroup = {
    fontSize: "fontSizes",
    lineHeight: "lineHeights",
    letterSpacing: "letterSpacing",
    spacing: "spacing",
    radius: "borderRadius",
    fontFamily: "fontFamilies",
    fontWeight: "fontWeights",
    container: "sizing",
  };
  if (byGroup[group]) return byGroup[group];
  if (dtcgType === "typography") return "typography";
  if (dtcgType === "color") return "color";
  if (dtcgType === "number") return "number";
  return "other"; // duration, cubicBezier
}

const isToken = (node) => node && typeof node === "object" && "$value" in node;

// $value passes through as-is (hex, numbers, alias refs, composite typography objects).
// Leaf tokens inherit the nearest named group, not their own key (e.g. fontSize.body → fontSizes).
function convert(node, group) {
  if (isToken(node)) {
    const out = { value: node.$value, type: legacyType(node.$type, group) };
    if (node.$description) out.description = node.$description;
    return out;
  }
  const out = {};
  for (const [key, child] of Object.entries(node)) {
    if (key === "$description") continue;
    out[key] = convert(child, isToken(child) ? group : key);
  }
  return out;
}

// Every alias must resolve against the primitive set (Tokens Studio strips the set name from refs).
function validate(tokens) {
  const resolve = (ref) => {
    let node = tokens.primitive;
    for (const part of ref.replace(/[{}]/g, "").split(".")) node = node?.[part];
    return node;
  };
  const unresolved = [];
  let count = 0;
  const checkRef = (value, where) => {
    if (typeof value === "string" && /^\{.+\}$/.test(value)) {
      count++;
      const target = resolve(value);
      if (!target || target.$value === undefined) unresolved.push(`${where} -> ${value}`);
    }
  };
  (function walk(node, path) {
    if (!node || typeof node !== "object") return;
    if ("$value" in node) {
      const value = node.$value;
      if (typeof value === "string") checkRef(value, path);
      else if (value && typeof value === "object")
        for (const [k, v] of Object.entries(value)) checkRef(v, `${path}.${k}`);
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      walk(child, path ? `${path}.${key}` : key);
    }
  })(tokens, "");
  return { count, unresolved };
}

const tokens = JSON.parse(readFileSync(SRC, "utf8"));

const { count, unresolved } = validate(tokens);
if (unresolved.length) {
  console.error(`✗ ${unresolved.length} unresolved alias(es):\n  ${unresolved.join("\n  ")}`);
  process.exit(1);
}

// $metadata/$themes stay $-prefixed in both formats; only token leaves convert.
const result = { $metadata: tokens.$metadata, $themes: tokens.$themes };
for (const set of tokens.$metadata.tokenSetOrder) result[set] = convert(tokens[set], null);
writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");

const counts = {};
(function tally(node) {
  if (!node || typeof node !== "object") return;
  if ("type" in node && "value" in node) counts[node.type] = (counts[node.type] || 0) + 1;
  else for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) tally(v);
})(result);

console.log(
  `✓ tokens.json → tokens.legacy.json (${count} aliases, types: ${JSON.stringify(counts)})`,
);
