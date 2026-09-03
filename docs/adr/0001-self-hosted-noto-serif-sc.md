# 0001. Self-hosted Noto Serif SC

## Status

Accepted

## Context

Kraft Paper is a Typora theme for long-form Chinese with interleaved code and a little English, mainly on Windows. The previous body stack led with Tiempos and Source Serif 4, so machines without those brand fonts dropped Simplified Chinese onto system Songti. Export also pulled Google Fonts, which blocked offline, weak, and mainland networks. Vertical rhythm on #write felt tight for long Chinese paragraphs.

Whole-element strong { font-family: Microsoft YaHei } would fix CJK faux-bold mush, but it would also steal Latin glyphs from the serif. Bundling Tiempos / Source Serif 4 / WenKai / Sarasa is out of scope.

## Decision

1. Self-hosted Noto (自托管字族). Ship SIL OFL Noto Serif SC 400 and 700 as kraft-paper/*.woff2 next to the two CSS monofiles. @font-face uses relative url("kraft-paper/....woff2") and font-display: swap. English and Chinese body text both use this family; Tiempos is not bundled.
2. Zero network. Delete @include-when-export, Google Fonts, and any other http(s) font requests from structure and both monofiles. Missing kraft-paper/ must fail open (system fallback), not crash or blank the editor.
3. Emphasis split (强调分族) via unicode-range. Register a separate Kraft Paper Strong family: Latin unicode-range points at Noto 700; CJK unicode-range points at local() Microsoft YaHei / PingFang. Do not swap strong/b to Microsoft YaHei as a whole element. Headings stay on the body serif (正文衬线) at weight 600-700.
4. Vertical rhythm (垂直节奏). #write line-height 1.7, paragraph margin 0.95em, heading top ~1.55rem, letter-spacing 0.02em, font-kerning: normal. code / kbd / fences reset letter-spacing to 0. Fences stay 0.9em / line-height 1.65 with slightly larger vertical margin than paragraphs.
5. Stacks. --font-ui remains Segoe UI + Microsoft YaHei and does not take Noto. --font-mono is ui-monospace / Cascadia Code / Consolas / Microsoft YaHei; Sarasa Mono SC is not packed and not in the stack. Light and dark font-family tokens stay identical.

## Consequences

Install copies CSS and the kraft-paper/ directory together. The theme CSS is MIT; Noto Serif SC remains SIL OFL and is declared separately. No heti-addon DOM spacing and no punctuation squeeze. Color tokens, 768px column, chrome, and print-to-light-paper are unchanged.
