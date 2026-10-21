# Known Review False Positives

Review findings that look like defects but are by design. The review workflow
reads this file before raising any candidate finding: if a candidate matches an
entry here (or is the same defect on a different path), drop it.

Entries are added by the `/false-positive` command, which also leaves a pointer
comment in the code. Format — unnumbered bullets, no line numbers:

```md
- **<Summary>** (`<file>`, `<condition/branch>`)

  Reported as: "<finding Explanation verbatim>"

  Why it is by design: <reason>. See <Section> of `docs/ARCHITECTURE.md` for the full invariant.
```

---

<!-- Entries are appended below this line. -->
