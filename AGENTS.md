## Communication

- Do not mention search tools or fallbacks
- Do not mention rg, grep, find, sed, or any shell/search tools
- Do not describe how files are discovered or searched
- Only report results, decisions, and relevant findings

- Prefer IDE/project context over shell-based file discovery

---

## Repository structure

- Vue code is under `vue-port`
- Legacy code is under `app` and is reference-only
- Do not modify files under `app`

---

## Vue migration (React → Ionic Vue)

- Work only in `vue-port` unless explicitly instructed otherwise
- Use legacy code in `app` only for reference when needed
- Do not scan the entire repository unless required by the task

## Source of Truth

- Rules → docs/RULES.md
- Code style → docs/CODE-STYLE.md
- Migration status → docs/MIGRATION-STATUS.md
