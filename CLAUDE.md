# Project Rules for jira-stats

Always read this file before making any edits to this codebase.

---

## Tech Stack

- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- Recharts for charts, Sonner for toasts
- No icon libraries — use inline SVG components (see existing pattern in `components/cycletime/CycleTimeTopIssues.tsx`)
- No animation libraries — use Tailwind `transition-colors` for hover states
- Jira host: `sixt-cloud.atlassian.net`

---

## Rule 1 — Issue Keys Are Always Hyperlinks

Whenever an issue key (e.g. `RBW-146`, `CART-12`) is displayed anywhere in the UI, it **must** be rendered as a clickable anchor that opens the Jira issue in a new tab.

**Required pattern:**
```tsx
<a
  href={`https://sixt-cloud.atlassian.net/browse/${issue.key}`}
  target="_blank"
  rel="noopener noreferrer"
  className="font-mono text-sm font-bold text-blue-600 hover:underline"
>
  {issue.key}
</a>
```

This applies in: tables, modals, cards, tooltips, list items — everywhere a key is shown as text.

---

## Rule 2 — Tech Debt Issues Use a Distinct Row Highlight

When rendering a table row that contains a Jira issue, check whether the issue is a tech/tech-debt item. If it is, apply a light blue background to the entire row to visually distinguish it from product work.

**Row class pattern:**
```tsx
<tr className={`hover:bg-accent/50 transition-colors ${isTech ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
```

**How to determine if an issue is tech:**

For `JiraIssue` objects (which have `fields.labels`), use the existing `isTechIssue()` helper from `components/dashboard/ChartDetailsModal.tsx`. It checks whether any label on the issue matches the configured `techLabels` array (case-insensitive substring match):

```ts
function isTechIssue(issue: JiraIssue, techLabels?: string[]): boolean {
  const labels = techLabels?.length ? techLabels : ['tech', 'tech-debt', 'tech_debt', 'technical'];
  return issue.fields.labels?.some(label =>
    labels.some(tech => label.toLowerCase().includes(tech.toLowerCase()))
  ) || false;
}
```

For lighter data types (e.g. `CycleTimeIssueData`) that don't carry labels, check `issuetype` — if it contains "tech" (case-insensitive), treat it as tech debt.

---

## Rule 3 — Chart Data Point Clicks Open a Detail Modal

Every clickable data point in any chart **must** open a modal that explains what that data point is made of.

**What to show in the modal:**
- **Title**: include the chart name and the data point label (e.g. "Sprint 12 — Completed Issues")
- **Context line**: one sentence explaining what the data point represents (e.g. "12 issues completed in this sprint with a median cycle time of 5.2 days")
- **Detail table**: the individual records that make up the data point (issues, engineers, etc.)

**Modal table requirements (all must be present):**
1. **Paginated** — 20 rows per page with Prev/Next controls and a "Showing X–Y of Z" counter
2. **Searchable** — a text input that filters across key, summary, assignee, and labels
3. **Sortable** — clicking any column header toggles asc/desc sort; show ▲/▼ indicator on the active column
4. **Issue keys as links** — follow Rule 1 (hyperlink, new tab)
5. **Tech debt highlighting** — follow Rule 2 (row background)
6. **Escape key closes** the modal

**Reference implementation:** `components/dashboard/ChartDetailsModal.tsx` is the canonical modal for `JiraIssue[]` data. Reuse it where the data type matches. For other data types (e.g. cycle time issues, engineer breakdowns), create a purpose-built modal that follows the same table structure and UX conventions.

---

## Rule 4 — No Raw `null` Returns from Recharts Custom Dot Functions

Recharts `dot` prop functions must return a React element, not `null`. Return `<g />` (empty SVG group) when the dot should be invisible:

```tsx
// ✅ correct
if (cx == null || cy == null) return <g />;

// ❌ wrong — causes TypeScript error
if (cx == null || cy == null) return null;
```

---

## Rule 5 — Always Respect `ignoreIssueKeys` in API Routes

Any API route that processes Jira issues must filter out keys listed in the `ignoreIssueKeys` setting. This setting is passed as a comma-separated `ignoreIssueKeys` query parameter.

```ts
const ignoreSet = new Set(
  (searchParams.get('ignoreIssueKeys') || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean)
);
// then filter before processing:
.filter(i => !ignoreSet.has(i.key.toUpperCase()))
```

The `buildCycleTimeQuery()` / `buildDeveloperQuery()` helpers in `app/page.tsx` are responsible for injecting this param. Cache keys must include `ignoreIssueKeys` to avoid stale results.

---

## Rule 6 — Never Assume Single vs Multi-Select for Filters

Before implementing any filter control that lets the user select from a list (engineers, sprints, labels, boards, etc.), always confirm whether it should be **single-select** (radio/dropdown, one value at a time) or **multi-select** (checkboxes, multiple values allowed).

**Do not default to single-select just because it is simpler.** The right choice depends on the use case:
- Single-select: when only one value makes sense (e.g. "active sprint", "target board")
- Multi-select: when the user benefits from comparing or combining multiple values (e.g. engineers, sprints, labels)

If the requirement is ambiguous, ask before implementing.

When changing an existing filter from single to multi-select (or vice versa), update **all** of the following together:
1. The filter component's props (`selectedX` type changes from `T | null` to `T[]`)
2. The parent component's state
3. Any fetch functions that consume the selection
4. Any downstream components that display per-selection data (e.g. summary cards that show stats for a single engineer must be hidden or adapted when multiple are selected)

---

## Existing Patterns to Reuse

| Need | Where to look |
|------|---------------|
| Issue detail modal (search + sort + paginate) | `components/dashboard/ChartDetailsModal.tsx` |
| Tech issue detection | `isTechIssue()` in `components/dashboard/ChartDetailsModal.tsx` |
| Toast notifications | `lib/toast.ts` — `showSuccess`, `showError`, `showLoading` |
| 5-minute API cache | `lib/cache.ts` — `cache.get / cache.set` |
| Chart color palette (8 engineers) | `components/velocity/EngineerVelocityChart.tsx` |
| Inline SVG chevron pattern | `components/cycletime/CycleTimeTopIssues.tsx` |
