# Kraft Paper — domain glossary

Terms for this theme system. Use them when changing source or docs.

## Product

| Term | Meaning |
| --- | --- |
| **Kraft Paper** | The light Typora theme; monofile `kraft-paper.css`. |
| **Kraft Paper Dark** | The dark Typora theme; monofile `kraft-paper-dark.css`. |
| **Monofile** | A single self-contained CSS file Typora can load from its themes folder. Build *outputs* monofiles; source is modular. |

## Design language

| Term | Meaning |
| --- | --- |
| **Paper surface** | Main reading background (`--bg-color`); warm off-white (light) or warm charcoal (dark). |
| **Sidebar** | File tree / outline chrome (`--side-bar-bg-color`), half-step deeper than paper. |
| **Terracotta accent** | Interactive emphasis (`--accent-color`); links, caret, checks, focus, active file. |
| **On-accent** | Foreground on solid accent (`--on-accent-color`); checkmark stroke, active chips. |
| **Measure** | Content column max-width **768px** on `#write` (claude.ai chat-aligned). |
| **Body / UI / Strong / Mono stacks** | `--font-body`, `--font-ui`, `--font-strong`, `--font-mono`. |

## Source architecture

| Term | Meaning |
| --- | --- |
| **Tokens** | `:root` custom properties in `src/tokens/{light,dark}.css` — the mode-specific palette and elevation. |
| **Structure** | Shared layout and typography rules in `src/structure/*` — mode-agnostic; only `var(...)`. |
| **Host adapter** | Typora-specific extras; currently `src/host/dark-only.css` (scrollbar + source-mode tokens). |
| **Print light fallback** | Dark monofile injects light color tokens inside `@media print` so PDF export is light paper. |

## Content vs chrome

| Term | Meaning |
| --- | --- |
| **`#write` content** | Markdown body; all reading typography is scoped here. |
| **Chrome** | Sidebar, quick open, search, menus, preferences — UI chrome, not document content. |
| **Edit chrome (tables)** | Typora’s hover table tools (`.md-table-edit`, `.md-grid-board`, `.md-table-resize`); must not receive content table styles. |

## Workflow

| Term | Meaning |
| --- | --- |
| **Build** | `npm run build` → monofiles + README palette sync. |
| **Check** | `npm test` / `npm run check` — token parity, no hardcoded colors in structure, structure equality, print injection. |
