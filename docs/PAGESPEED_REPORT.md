
# PageSpeed Report — GlassCode Academy (Desktop & Mobile)

## Overview
- URL: https://glasscode.academy
- Capture: 17 Oct 2025, 8:01 PM (GMT+10)
- Lighthouse: 12.8.2
- Run Context: Single page session, initial page load
- Environment (Desktop run): HeadlessChromium 137.0.7151.119 (lr), Emulated Desktop, 1350×940, DPR 1
- Throttling (Simulated): 40 ms TCP RTT, 10,240 kb/s throughput, CPU 1× slowdown
- UA (network): Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36
- Axe: 4.10.3
- Browser location: Asia

---

## Scores (Desktop)
- Performance: **—** (score not included in excerpt; metrics below)
- Accessibility: **89**
- Best Practices: **96**
- SEO: **100**

### Core Web Vitals (Desktop — Lab)
| Metric | Value |
| - | - |
| First Contentful Paint (FCP) | **0.3 s** |
| Largest Contentful Paint (LCP) | **0.7 s** |
| Total Blocking Time (TBT) | **40 ms** |
| Cumulative Layout Shift (CLS) | **0.098** |
| Speed Index (SI) | **1.8 s** |

> Values are estimated and can vary between runs.

---

## Key Diagnostics (Desktop)

### Reduce unused JavaScript
- Estimated savings: **62.3 KiB** (top offenders)
| Resource | Transfer | Est. Savings |
| - | - | - |
| `…/chunks/commons-8cccf685e476e08f.js` | 53.8 KiB | 37.2 KiB |
| `…/chunks/5660-30116a9e52fb981f.js` | 31.6 KiB | 25.1 KiB |

### Eliminate render‑blocking resources
- Estimated savings: **0 ms** (CSS still render‑blocking)
| Resource | Transfer | Duration |
| - | - | - |
| `glasscode.academy` (HTML) | 30.7 KiB | 570 ms |
| `…/css/a66115bc07394c23.css` | 19.5 KiB | 80 ms |
| `…/css/49cd4200fdb9a306.css` | 2.5 KiB | 120 ms |
| `…/css/c141c382771d9151.css` | 3.9 KiB | 120 ms |
| `…/css/ea99278d430a73eb.css` | 3.1 KiB | 120 ms |
| `…/css/1f080be9af03bc2e.css` | 1.6 KiB | 120 ms |

### Avoid serving legacy JavaScript to modern browsers
- Estimated savings: **~12 KiB** (Baseline features detected in bundles)
- Examples flagged: `Array.prototype.at`, `Array.prototype.flat`, `flatMap`, `Object.fromEntries`, `Object.hasOwn`, `String.prototype.trimStart/trimEnd`, Babel transforms for classes/regenerator.

### Avoid large layout shifts
- Largest shift: **0.098 CLS**
- Shifted element: **“Master Modern Web Development …”** within `<main id="main-content" …>`

### Avoid long main‑thread tasks
- Long tasks found: **4**
| URL | Start | Duration |
| - | - | - |
| `…/chunks/4bd1b696-ed6ff899239e9fe5.js` | 614 ms | 76 ms |
| `https://glasscode.academy` | 432 ms | 66 ms |
| `https://glasscode.academy` | 243 ms | 59 ms |
| `https://glasscode.academy` | 302 ms | 51 ms |

### Avoid non‑composited animations
- Elements:
  - `body.antialiased > div.flex > div.fixed` — background animation `gradientFlow` (unsupported property: `background-position-x`)
  - `div.hero-visual … path.learning-path` — animation `drawPath` (unsupported property: `stroke-dashoffset`)

### Critical Request Chains
- Maximum critical path latency: **1,316.334 ms**
- Initial navigation → multiple CSS files (`a66115bc…`, `c141c38…`, `49cd420…`, `1f080be…`, `ea99278…`).

### Largest Contentful Paint element
- Element: `<h1 class="text-3xl md:text-4xl lg:text-5xl …">Master Modern Web Development</h1>`
- LCP timing: **740 ms** (TTFB 160 ms = 22%, Render Delay 580 ms = 78%)

### Network payloads
- Total: **276 KiB** (first‑party: 240.6 KiB)
- Largest files:
  - `…/chunks/commons-8cccf685e476e08f.js` — 54.3 KiB
  - `…/chunks/4bd1b696-ed6ff899239e9fe5.js` — 52.5 KiB
  - `…/chunks/1684-2bd843ff62a08242.js` — 45.6 KiB
  - `…/chunks/5660-30116a9e52fb981f.js` — 32.0 KiB
  - `…/css/a66115bc07394c23.css` — 19.5 KiB

### Caching
- Efficient cache policy on static assets: **0 resources found** needing changes (per audit).

### DOM size
- Total DOM elements: **797**
- Max depth: **16**
- Max children (single parent): **26**

### JavaScript execution
- Total CPU time (JS): **723 ms**
  - Script eval: 207 ms
  - Parse: 26 ms
- Breakdown (all work): **0.8 s**
  - Other 377 ms, Script Eval 225 ms, Style & Layout 133 ms, Parse/Compile 55 ms, Rendering 33 ms, Parse HTML/CSS 5 ms

### Fonts and loading
- All text remains visible during webfont loads (`font-display` present).

### Third‑party usage
- Minimal; consider facades for any future embeds. No third‑party chains listed in this run.

### LCP image lazy‑loading
- Note: LCP image was **not** lazily loaded (advice: avoid lazy‑loading above‑the‑fold LCP).

---

## Accessibility (Desktop) — 89

### Notable issues
- Prohibited ARIA attributes on tier SVG circles.
- Incompatible ARIA roles on feature cards and buttons used as list items.
- Insufficient colour contrast on several badge elements (blue/green/purple/orange variants).
- `<select>` elements missing associated `<label>`.

> Manual checks recommended: keyboard focusability, DOM order matching visual order, landmark usage, offscreen hiding semantics, custom control labelling and roles.

### Passed highlights (partial)
- Roles and ARIA attributes generally valid, titles and `lang` present and valid, links and buttons named, touch targets adequate, heading order sequential, skip link focusable.

---

## Best Practices (Desktop) — 96

### Console errors (examples)
- `next-auth CLIENT_FETCH_ERROR`: JSON parse error during `json()` on Response.
- `/auth/session` 404 on fetch.

### Security headers to add (Trust & Safety)
- **CSP** (enforce, include Trusted Types where possible).
- **HSTS**.
- **COOP**.
- **X-Frame-Options** or CSP `frame-ancestors`.

### Passed highlights
- HTTPS, avoids deprecated APIs and third‑party cookies, allows paste, avoids permission prompts, correct image aspect/size, viewport meta, doctype, charset, valid source maps, no DevTools “Issues”.

---

## SEO (Desktop) — 100

- Passed: indexing allowed, title and meta description present, good link text, crawlable links, valid robots.txt, valid `hreflang`.
- Not applicable: image alts (covered elsewhere), canonical valid.

---

## Action Plan (Desktop)

1. **Trim unused JS** in `commons-*.js` and route chunks; prefer modern builds without legacy transforms/polyfills when targeting evergreen browsers.
2. **Inline critical CSS** for above‑the‑fold; defer non‑critical styles to reduce render blocking.
3. **Animations**: move long‑running background/line animations to compositor‑friendly properties (transform/opacity) or reduce on load.
4. **LCP**: ensure hero `<h1>` paint is not delayed by webfonts or layout; verify no `font-display: swap` flashes cause reflow; consider preloading critical assets.
5. **Accessibility**: fix ARIA misuses on SVG nodes and card links, add labels to `<select>`, and improve contrast on badges.
6. **Security headers**: roll out CSP (with Trusted Types where feasible), HSTS, COOP, and frame‑ancestors policy.
7. **Console noise**: resolve `next-auth` client fetch error and `/auth/session` 404.

---

## Mobile Report (Add your mobile run here)

> Paste values from a Mobile Lighthouse/PageSpeed run below to keep Desktop and Mobile side‑by‑side.

### Scores (Mobile)
- Performance: 
- Accessibility: 
- Best Practices: 
- SEO: 

### Core Web Vitals (Mobile — Lab)
| Metric | Value |
| - | - |
| First Contentful Paint (FCP) |  |
| Largest Contentful Paint (LCP) |  |
| Total Blocking Time (TBT) |  |
| Cumulative Layout Shift (CLS) |  |
| Speed Index (SI) |  |
| Interaction to Next Paint (INP) |  |

### Mobile Environment
- Device emulation: 
- Network/CPU throttling: 
- Viewport/DPR: 
- User agent: 

### Key Diagnostics (Mobile)
- Reduce unused JavaScript: 
- Eliminate render‑blocking resources: 
- Critical Request Chains: 
- LCP element and phase breakdown: 
- Network payloads: 
- DOM size and JS execution: 
- Accessibility issues (mobile‑specific): 
- Best Practices and Security: 
- SEO notes: 

### Action Plan (Mobile)
1. 
2. 
3. 

---

## Appendix
- Run Type: Single‑page session (lab data; not field/CrUX).
- Notes: Numbers do not directly determine the score outside the scoring model; refer to the Lighthouse calculator if needed.
