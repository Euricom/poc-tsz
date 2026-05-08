This is a monorepo with TypeScript and C#

# Important Notes

- The monorepo is powered by bun, do not use npm or pnpm
- For C# conventions, see `docs/agents/conventions-csharp.md`
- For TypeScript conventions, see `docs/agents/conventions-typescript.md`

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` and `docs/adr/` at the repo root (created lazily). See `docs/agents/domain.md`.