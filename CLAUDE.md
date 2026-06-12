# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Hexo static site for 2027 Sichuan University MEM (Master of Engineering Management) exam preparation. Provides interactive practice questions for "199 Management Comprehensive" (管综199 — math & logic) and "English 2" (英语二 — vocabulary, cloze, reading), plus knowledge articles in Chinese.

- **URL**: https://factoryenergy.site
- **Deploy**: Vercel (auto-deploys from `main` branch via GitHub Actions)
- **Theme**: Custom `mem-practice` theme at `themes/mem-practice/`
- **Hexo version**: 8.1.2

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the site (hexo generate), output to `public/` |
| `npm run clean` | Clean generated artifacts |
| `npm run server` | Local dev server with live reload |
| `npm run deploy` | Deploy via git (check `deploy.repo` in `_config.yml` first) |

Always run `npm run build` before committing to verify no errors.

## Architecture

### Configuration Files

- `_config.yml` — Root Hexo config (site title, URL, theme selection, deployment settings)
- `themes/mem-practice/_config.yml` — Custom theme config (nav menu items, footer)
- `vercel.json` — Vercel build config (build command: `npm run build`, output: `public/`)

### Custom Theme (`themes/mem-practice/`)

Minimal Hexo theme purpose-built for the practice site, replacing the former Butterfly blog theme.

- `layout/layout.ejs` — Main document shell: `<head>` with meta/CSS links, fixed nav bar, full-width `<main>` content area, footer, mobile hamburger toggle, global `<script>` include for `mem-practice.js`
- `layout/index.ejs` — Homepage renderer (passes content through without extra wrappers)
- `layout/page.ejs` — Static page renderer (article wrapper with title header)
- `layout/post.ejs` — Blog post renderer (article with title and date)
- `source/css/style.css` — Base reset, nav bar, footer, typography, responsive mobile breakpoints

### Content (`source/`)

- `source/_posts/` — Long-form blog posts (Markdown with front matter)
- `source/_data/head.ejs` — (empty, was used by Butterfly for CSS injection; now handled by theme layout)
- `source/_data/en.yml` — Theme i18n overrides (legacy)
- Subject pages: `source/english2/`, `source/mba199/` (index pages, knowledge subtopics)
- Practice pages: `source/practice/english2/`, `source/practice/mba199/`, `source/practice/wrong/`

### Practice App (Vanilla JS)

The interactive practice system lives in two files:

- `source/js/mem-practice.js` — All logic for the question-bank practice app:
  - **renderPracticeApp()**: Reads `#practice-app` data attributes (`data-subject`, `data-category`, `data-questions`) to fetch the question JSON, renders one question at a time with submit/prev/next navigation, validates answers, shows explanations
  - **renderWrongReview()**: Renders the wrong-answer review page (`#wrong-review-app`)
  - **Progress tracking**: Uses `localStorage` keys `mem-practice:history` (answer history), `mem-practice:wrong-bank` (wrong answers), and `mem-practice:session:*` (current position per page)
  - **updateProgressCards()**: Updates `[data-progress-subject]` stat cards on the homepage
- `source/css/mem-practice.css` — Custom styles for the practice UI (home page, practice shell, wrong review, subject cards)

### Exam Data (`source/exam-data/`)

Question banks are flat JSON arrays. Each question object:

```json
{
  "id": "mba199-math-0001",
  "subject": "mba199",
  "category": "math",
  "type": "single",
  "stem": "题目文本",
  "options": [{ "key": "A", "text": "选项" }, ...],
  "answer": ["C"],
  "explanation": "解析文本",
  "difficulty": "easy|medium|hard",
  "source": "manual",
  "tags": ["数学", "方程"]
}
```

Existing banks:
- `exam-data/english2/vocabulary.json`
- `exam-data/english2/cloze.json`
- `exam-data/english2/reading.json`
- `exam-data/mba199/math.json`
- `exam-data/mba199/logic.json`

### Generated Output (`public/`)

`hexo generate` produces the full static site here. Pages and JSON files under `public/` mirror the site structure. Do not edit files under `public/` directly — they are overwritten on build.

### CI/CD (`.github/workflows/vercel.yml`)

Push to `main` triggers: checkout → Node 24 → npm install → `npm run build` → Vercel deploy (uses `VERCEL_TOKEN`, `ORG_ID`, `PROJECT_ID` secrets).

### How Practice Pages Work

Each practice page is a Markdown file with an HTML `<div id="practice-app">` carrying data attributes:
```
<div id="practice-app"
     data-subject="mba199"
     data-category="math"
     data-questions="/exam-data/mba199/math.json">
```
The JS fetches the JSON, renders a single-question UI, and handles answer submission/validation/navigation entirely client-side. All user progress is stored in `localStorage`.

### Key Patterns

- **Adding a new question category**: Create the JSON file in `source/exam-data/`, create a practice page in `source/practice/` with the appropriate `#practice-app` data attributes, and add navigation links on the homepage (`source/index.md`) and subject index pages
- **No test framework** exists — validate changes with `npm run build` and manual review via `npm run server`
