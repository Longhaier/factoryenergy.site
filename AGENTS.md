# Repository Guidelines

## Project Structure & Module Organization
This repository is a Hexo static site. Root config lives in [`_config.yml`](/home/zhanghaitaonas/factoryenergy.site/_config.yml) and theme-specific settings live in [`_config.butterfly.yml`](/home/zhanghaitaonas/factoryenergy.site/_config.butterfly.yml). Site content is under `source/`: long-form posts in `source/_posts/`, standalone pages such as `about`, `privacy`, and `terms` in `source/*/index.md`, and template overrides in `source/_data/`. Small build-time extensions belong in `scripts/`. `scaffolds/` defines templates for new posts and pages.

## Build, Test, and Development Commands
Install dependencies with `npm install`.
Run a local preview with `npm run server`; Hexo serves the site with live reload for content and config changes.
Create a production build with `npm run build`, which runs `hexo generate` and writes output to `public/`.
Clean generated artifacts with `npm run clean`.
Deploy with `npm run deploy` only after verifying `deploy.repo` in `_config.yml`.

## Coding Style & Naming Conventions
Use 2-space indentation in YAML, JSON, and EJS to match the current files. Write Markdown with clear front matter and kebab-case filenames, for example `factory-rooftop-solar-2026.md`. Keep page directories path-based, such as `source/about/index.md`. Prefer concise Chinese copy for user-facing pages unless a file is explicitly English. Avoid adding theme customizations directly under `themes/`; use `source/_data/` or root config overrides first.

## Testing Guidelines
There is no automated test suite yet. Treat `npm run build` as the required validation step for every change, and use `npm run server` for manual checks on navigation, search, and rendered Markdown. When editing SEO or injected scripts, confirm the generated HTML in `public/` matches expectations.

## Commit & Pull Request Guidelines
Follow the existing history: short, descriptive commits in imperative style, often with scope or date context, such as `新增文章: HVAC优化 (2026-03-17)` or `Add SEO: robots.txt, structured data`. Keep one logical change per commit. Pull requests should include a brief summary, affected paths, screenshots for visible UI changes, and any deployment or config impact. Link the related issue or task when one exists.

## Security & Configuration Tips
Do not commit secrets, API keys, or production-only credentials. Review injected snippets in `source/_data/head.ejs` and the root config before publishing. If site metadata changes, update `title`, `description`, `keywords`, and `url` together.
