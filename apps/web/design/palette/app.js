// ProGrads palette preview — render logic. Reads window.SCHEMES (schemes.js) and
// builds a real token stylesheet: each scheme/variant/mode becomes a CSS rule that
// declares the --token custom properties. Switching only flips data-scheme /
// data-variant on .stage; the cascade does the rest (no inline element styles).

// Two contracts: SCHEME_VARS = brand + neutrals, per-theme (schemes.js); STATUS_KEYS = the FIXED
// highlighter set (window.STATUS), shared by every scheme so status never re-tints per theme.
// KEY = header-strip subset; ROWS = per-scheme table order.
const SCHEME_VARS = [
  "bg",
  "card",
  "elevated",
  "border",
  "ink",
  "muted",
  "dim",
  "primary",
  "primary-deep",
  "on-primary",
  "accent",
  "accent-ink",
  "accent-soft",
  "board",
  "board-ink",
  "d1",
  "d2",
  "d3",
  "d4",
  "d5",
  "shadow",
];
const STATUS_KEYS = [
  "success",
  "warning",
  "error",
  "info",
  "success-ink",
  "warning-ink",
  "error-ink",
  "info-ink",
];
const KEY = ["primary", "accent", "bg", "card", "ink", "board"];
const ROWS = [
  "primary",
  "primary-deep",
  "accent",
  "accent-ink",
  "board",
  "bg",
  "card",
  "border",
  "ink",
  "muted",
];

// --- TUNED pass: RAW + small hue-preserving contrast/elevation tune ---
const hx = (h) =>
  h
    .replace("#", "")
    .match(/../g)
    .map((x) => parseInt(x, 16));
const toHex = (a) =>
  "#" +
  a
    .map((n) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
const mix = (h, t, a) => {
  const A = hx(h),
    B = hx(t);
  return toHex(A.map((v, i) => v + (B[i] - v) * a));
};
const SH_L = "0 1px 2px rgba(30,24,12,.05), 0 6px 18px rgba(30,24,12,.07)";
const SH_D = "0 1px 2px rgba(0,0,0,.30), 0 8px 22px rgba(0,0,0,.34)";
// Light: cleaner paper + deeper gold text for AA. Dark: lift card/border/text/brand off
// the base so panels read clearly (RAW dark is often muddy). All hue-preserving.
const tune = (raw, mode) =>
  mode === "light"
    ? {
        ...raw,
        bg: mix(raw.bg, "#ffffff", 0.22),
        ink: mix(raw.ink, "#000000", 0.1),
        "accent-ink": mix(raw["accent-ink"], "#000000", 0.16),
        shadow: SH_L,
      }
    : {
        ...raw,
        card: mix(raw.card, "#ffffff", 0.08),
        elevated: mix(raw.elevated, "#ffffff", 0.12),
        border: mix(raw.border, "#ffffff", 0.16),
        ink: mix(raw.ink, "#ffffff", 0.12),
        muted: mix(raw.muted, "#ffffff", 0.14),
        dim: mix(raw.dim, "#ffffff", 0.12),
        primary: mix(raw.primary, "#ffffff", 0.1),
        accent: mix(raw.accent, "#ffffff", 0.08),
        shadow: SH_D,
      };

const S = window.SCHEMES || [];
const STATUS = window.STATUS || { light: {}, dark: {} };

// Dev-time guard: each scheme/mode must declare exactly SCHEME_VARS, and STATUS each mode must
// declare STATUS_KEYS — else the generated CSS silently emits `--x:undefined`. Warns by id.
function validate() {
  const want = new Set(SCHEME_VARS);
  for (const s of S)
    for (const mode of ["light", "dark"]) {
      const got = new Set(Object.keys(s[mode] || {}));
      const missing = SCHEME_VARS.filter((k) => !got.has(k));
      const extra = [...got].filter((k) => !want.has(k));
      if (missing.length || extra.length)
        console.warn(`[palette] ${s.id}·${mode} — missing:[${missing}] extra:[${extra}]`);
    }
  for (const mode of ["light", "dark"]) {
    const missing = STATUS_KEYS.filter((k) => !(k in (STATUS[mode] || {})));
    if (missing.length) console.warn(`[palette] STATUS·${mode} — missing:[${missing}]`);
  }
}

// Resolve raw+tuned for both modes once per scheme; reused by the sheet and the table.
const VM = S.map((s) => ({
  raw: { light: s.light, dark: s.dark },
  tuned: { light: tune(s.light, "light"), dark: tune(s.dark, "dark") },
}));

// --- token stylesheet ---
const declare = (obj, keys) => keys.map((k) => `--${k}:${obj[k]}`).join(";");
// Per-scheme brand/neutral vars (change with scheme + RAW/TUNED).
const rule = (id, variant, mode, m) =>
  `.stage[data-scheme="${id}"][data-variant="${variant}"] .${mode}{${declare(m, SCHEME_VARS)}}`;
// FIXED status vars — one rule per mode for every panel; disjoint var set from the scheme rules.
const statusRule = (mode) => `.stage .${mode}{${declare(STATUS[mode] || {}, STATUS_KEYS)}}`;
function buildTokenSheet() {
  const scheme = S.flatMap((s, i) =>
    ["raw", "tuned"].flatMap((variant) =>
      ["light", "dark"].map((mode) => rule(s.id, variant, mode, VM[i][variant][mode])),
    ),
  ).join("\n");
  const status = ["light", "dark"].map(statusRule).join("\n");
  const el = document.createElement("style");
  el.id = "scheme-tokens";
  el.textContent = status + "\n" + scheme;
  document.head.appendChild(el);
}

// --- static panel markup (structure only; colours via CSS vars) ---
const panelHTML = (mode, tag) => {
  const sw = (k) =>
    `<div class="s"><span class="nm">${k}</span><div class="box" style="background:var(--${k})"></div><code data-var="${k}"></code></div>`;
  return `<div class="panel-head"><span class="logo"><span class="mark">P</span><b>ProGrads</b></span><span class="mode-tag">${tag}</span></div>
    <div class="body">
      <p class="eyebrow">Graduate Exam Prep · 研究所備考</p>
      <h2 class="display">研究所備考作戰中心</h2>
      <p class="lede">把散落各校的備考資訊收攏於一處，讓備考的每一步都有依據。</p>
      <div class="cta-row"><button class="btn btn-primary">前往考古題 →</button><button class="btn btn-ghost">報名資訊</button><a class="gold-link" href="#">招生日程</a></div>
      <div class="form-row"><input class="field" type="text" placeholder="搜尋考科、學校、年度…" /><select class="field"><option>資訊聯招</option><option>電機甲組</option><option>光電所</option></select></div>
      <nav class="nav">
        <div class="nav-grid">
          <a href="#"><span class="en">Question Bank</span><h3>考古題 <span class="ar">→</span></h3><p>依考科、學校、年度、題型檢索歷屆考題。</p></a>
          <a href="#"><span class="en">Admissions</span><h3>報名資訊 <span class="ar">→</span></h3><p>名額、報名/錄取、採計考科與佔分、簡章。</p></a>
          <a href="#"><span class="en">Schedule</span><h3>招生日程 <span class="ar">→</span></h3><p>報名起訖、筆試、面試與放榜。</p></a>
          <a href="#"><span class="en">Faculty</span><h3>師資陣容 <span class="ar">→</span></h3><p>研究方向、實驗室、最高學歷與著作。</p></a>
        </div>
      </nav>
      <div class="tags"><span class="tag" style="--r:var(--primary)">資訊聯招</span><span class="tag" style="--r:var(--accent)">甄試</span><span class="tag" style="--r:var(--success)">報名中</span><span class="tag" style="--r:var(--warning)">即將截止</span><span class="tag" style="--r:var(--error)">已額滿</span></div>
      <div class="board-band"><div class="k">Deadline · 報名倒數</div><div class="v">臺大 電機所 甲組 — 還有 <span class="d">9 天</span></div></div>
      <p class="fixed-note">狀態燈號 · 固定螢光筆（不隨主題 · 語意靠圖示＋墨字）</p>
      <div class="alert" style="--r:var(--error)"><div class="alert-title">簡章尚未公告</div><div class="alert-body">此系所本年度招生簡章尚未釋出，資料暫以去年為準。</div></div>
      <div class="status"><span><i style="background:var(--success)"></i>報名中</span><span><i style="background:var(--warning)"></i>即將截止</span><span><i style="background:var(--error)"></i>已截止</span><span><i style="background:var(--info)"></i>資訊</span></div>
      <div class="ink-tiers"><p class="t-ink">Ink 墨 · 研究所備考資訊平台 Aa 123</p><p class="t-muted">Muted 次要 · 研究所備考資訊平台 Aa 123</p><p class="t-dim">Dim 提示 · 研究所備考資訊平台 Aa 123</p></div>
      <div class="data"><div class="lh">報名趨勢 · 主色階</div><div class="ramp"><span style="background:var(--d1)"></span><span style="background:var(--d2)"></span><span style="background:var(--d3)"></span><span style="background:var(--d4)"></span><span style="background:var(--d5)"></span></div></div>
      <div class="swatch">${sw("primary")}${sw("accent")}${sw("bg")}${sw("ink")}${sw("board")}</div>
    </div>
    <div class="panel-foot"><span>${mode === "light" ? "Light" : "Dark"}</span><span class="vmode">RAW</span></div>`;
};

let idx = 0,
  variant = "raw";
const stage = document.getElementById("stage");
const elL = document.getElementById("p-light"),
  elD = document.getElementById("p-dark");
elL.innerHTML = panelHTML("light", "☀️ Light");
elD.innerHTML = panelHTML("dark", "🌙 Dark");

const sel = document.getElementById("scheme");
sel.innerHTML = S.map((s, i) => `<option value="${i}">${s.id}</option>`).join("");
sel.onchange = () => {
  idx = +sel.value;
  apply();
};

// Read the resolved token from the cascade (proves the CSS structure works).
const readVar = (el, k) =>
  getComputedStyle(el)
    .getPropertyValue("--" + k)
    .trim();
const fillReadouts = (el) =>
  el.querySelectorAll("[data-var]").forEach((c) => {
    c.textContent = readVar(el, c.dataset.var);
  });

function buildTable(vm) {
  const lr = vm.raw.light,
    lt = vm.tuned.light,
    dr = vm.raw.dark,
    dt = vm.tuned.dark;
  const chip = (c) => `<span class="chip" style="background:${c}"></span>`;
  document.getElementById("vt-body").innerHTML = ROWS.map((k) => {
    const lc = lr[k].toLowerCase() !== lt[k].toLowerCase(),
      dc = dr[k].toLowerCase() !== dt[k].toLowerCase();
    return (
      `<tr><td><code>--${k}</code></td>` +
      `<td>${chip(lr[k])}<code>${lr[k]}</code></td>` +
      `<td class="${lc ? "changed" : "same"}">${chip(lt[k])}<code>${lt[k]}</code></td>` +
      `<td>${chip(dr[k])}<code>${dr[k]}</code></td>` +
      `<td class="${dc ? "changed" : "same"}">${chip(dt[k])}<code>${dt[k]}</code></td></tr>`
    );
  }).join("");
}

function apply() {
  const s = S[idx];
  stage.dataset.scheme = s.id; // switch tokens via the cascade, not inline styles
  stage.dataset.variant = variant;
  fillReadouts(elL);
  fillReadouts(elD);
  document.getElementById("strip").innerHTML = KEY.map(
    (k) =>
      `<div class="a"><span class="c" style="background:${s.light[k]}"></span><code>${k}</code><small>${s.light[k]}</small></div>`,
  ).join("");
  document.querySelectorAll(".vmode").forEach((e) => (e.textContent = variant.toUpperCase()));
  document.getElementById("now").textContent = `${s.id} · ${variant.toUpperCase()}`;
  buildTable(VM[idx]);
}

function setVariant(v) {
  variant = v;
  document.getElementById("btn-raw").classList.toggle("on", v === "raw");
  document.getElementById("btn-tuned").classList.toggle("on", v === "tuned");
  apply();
}
window.setVariant = setVariant;

const FORM = /^(INPUT|SELECT|TEXTAREA|BUTTON)$/;
document.addEventListener("keydown", (e) => {
  if (FORM.test(document.activeElement?.tagName)) return; // let focused controls keep their keys
  if (e.code === "Space") {
    e.preventDefault();
    setVariant(variant === "raw" ? "tuned" : "raw");
  } else if (e.code === "ArrowRight") {
    idx = (idx + 1) % S.length;
    sel.value = idx;
    apply();
  } else if (e.code === "ArrowLeft") {
    idx = (idx - 1 + S.length) % S.length;
    sel.value = idx;
    apply();
  }
});

validate();
buildTokenSheet();
apply();
