# Cycle Time & Developer Metrics

This document explains the **Cycle Time** and **Developer** tabs in the Jira Stats dashboard, including how metrics are calculated and what insights they provide.

---

## Overview

Both tabs align with **Sixt's Evidence-Based Performance Analysis (EBPA)** framework, specifically **Metric #2: Workitem Cycle Time (Median)**.

### Core Philosophy

These metrics are designed to **understand system health and team productivity**, not to compare or rank individuals. They help teams:
- Identify bottlenecks in the development workflow
- Track improvement trends over time
- Make data-driven decisions about process optimization
- Enable individual engineers to self-assess their contribution patterns

---

## Cycle Time Tab

The **Cycle Time** tab measures how long work items take to move through your development pipeline, from when work starts to when it's delivered.

### What You See

1. **Team Cycle Time Trend Chart** (main)
   - **X-axis**: Sprint names
   - **Y-axis**: Cycle time in days
   - **Primary line** (solid): Median cycle time per sprint
   - **P85 line** (dashed): 85th percentile — the threshold where 85% of issues complete faster
   - **Average line** (dotted): Overall average cycle time (toggle on/off)
   - **Clickable dots**: Click any sprint point to view the individual issues that completed in that sprint

2. **Sprint Statistics Table**
   - Row per sprint showing: **Median | Avg | P85 | Min | Max | Issue Count**
   - Helps identify sprints with anomalies (e.g., one sprint much slower than others)

3. **Engineer Cycle Time Chart** (optional, when engineers selected)
   - One line per selected engineer showing their median cycle time per sprint
   - Helps identify if certain engineers consistently have longer/shorter cycle times
   - Not a performance ranking — variations are normal and reflect issue complexity, not individual capability

### Key Metrics

#### **Median Cycle Time** (Primary Metric)

**Definition**: The middle value of all cycle times in a sprint. Half the issues complete faster, half slower.

**Computation**:
1. For each **completed issue** in the sprint:
   - Find the **first** status transition TO "In Progress"
   - Find the **last** status transition TO "Done" / "Closed" / "Resolved"
   - Calculate days between these two timestamps (calendar days, including weekends)
2. Sort all cycle times in ascending order
3. Return the middle value (for 10 issues, it's the 5th or average of 5th & 6th)

**Why median?**
- Resistant to outliers (unlike average)
- Represents a "typical" issue completion time
- Better reflects actual system behavior

**Example**:
- 5 issues with cycle times: [2, 3, 5, 8, 50] days
- **Median = 5 days** (middle value, unaffected by the 50-day outlier)
- **Average = 13.6 days** (skewed by outlier)

#### **P85 (85th Percentile)**

**Definition**: The cycle time below which 85% of issues complete.

**Computation**: Sort cycle times, take the value at position `0.85 × n`

**Use**: Helps identify the "threshold of slowness" — if 85% of your issues complete in 8 days, but your median is 5, there's a tail of slower issues worth investigating.

#### **Average Cycle Time**

**Definition**: Sum of all cycle times divided by the count.

**Computation**: `(sum of all cycle times) / (number of issues)`

**Use**: Provides context for variability. If average and median differ significantly, there are outlier issues affecting overall speed.

#### **Min & Max**

**Definition**: The fastest and slowest cycle times in the sprint.

**Computation**: Direct min/max from the dataset

**Use**: Identifies best-case and worst-case scenarios. High max values warrant investigation (blocked issues, dependencies).

#### **Issue Count**

**Definition**: Number of completed issues with measurable cycle time.

**Computation**: Count of issues that transitioned through "In Progress" → "Done" (issues without "In Progress" transition are excluded, as cycle time cannot be measured per EBPA definition)

---

### Filters

#### **Sprint Name Pattern** (Regex)
Filters sprints before any data is fetched. Useful for separating teams on the same board.

**Examples**:
- `^Cart` — Matches sprints starting with "Cart" (e.g., "Cart Sprint 12")
- `^sort` — Matches sprints starting with "sort" (case-insensitive, e.g., "Sort-Sprint-1")
- `Sprint-[0-9]{2}$` — Matches sprints ending with two digits

**Validation**: Invalid regex shows a red border and prevents API calls.

#### **Timeline Modes**

**Last N Sprints** (default)
- Shows the most recent N closed sprints (max 50)
- Useful for: current trend analysis, recent performance

**Date Range**
- Shows all closed sprints with complete dates within a date range
- Useful for: quarter-level analysis, comparing specific time periods
- Quick buttons: "Last 1/3/6/12 months"

#### **Engineer Selection**
- Multi-select engineers to see their individual cycle time trends
- Shows if certain engineers have systematically different cycle times
- **Important**: Variations are normal and don't indicate performance issues

---

## Developer Tab

The **Developer** tab provides a **self-assessment view** for individual engineers, combining velocity and cycle time metrics in one focused dashboard.

### What You See

1. **Summary Stats Card**
   - **Total issues completed**: Sum across all visible sprints
   - **Avg velocity / sprint**: Story points per sprint (only sprints where engineer contributed)
   - **Median cycle time**: Overall median across all their completed work
   - **Sprints active**: Number of sprints where engineer had contributions

2. **Velocity Chart** (sprint-on-sprint)
   - Story points completed per sprint
   - Shows throughput trends over time

3. **Cycle Time Chart** (sprint-on-sprint)
   - Median cycle time per sprint
   - Shows efficiency trends (lower = faster delivery)

### Use Cases

**For Engineers**:
- Self-assess productivity trends (velocity increasing/decreasing?)
- Understand personal cycle time trends (getting faster or slower?)
- Identify their most productive sprints
- Track improvement over time

**For Teams**:
- Understand individual contribution patterns (who completes what volume of work?)
- Correlate velocity and cycle time (is someone fast because they work on small tasks, or truly efficient?)
- Celebrate improvements

### Key Metrics (Same as Cycle Time Tab)

The Developer tab reuses the same **Median Cycle Time** and **Velocity** calculations from the Cycle Time and Velocity tabs, just filtered to a single engineer.

#### **Velocity Per Sprint**

**Definition**: Total story points of completed issues in a sprint.

**Computation**:
1. For each completed issue assigned to the engineer
2. Extract story points (checks multiple custom field names for compatibility)
3. Default to 3 points if no story points found
4. Sum all points

**Example**: If an engineer completed [5pts, 3pts, 8pts] = 13 pts velocity

#### **Average Velocity Per Sprint**

**Definition**: Total velocity across visible sprints ÷ number of sprints with contributions

**Computation**: `(sum of velocity) / (sprints with at least one completed issue)`

**Use**: Represents typical throughput per sprint.

---

## Important Notes

### What's Excluded

- **Issues without "In Progress" transition**: If an issue moves directly to "Done" without hitting "In Progress", it's excluded from cycle time calculations (as per EBPA definition — cycle time requires a measurable start point)
- **Incomplete issues**: Only issues in "Done"/"Closed"/"Resolved" status are included

### Status Recognition

The system recognizes these completed statuses (case-insensitive):
- "Done"
- "Closed"
- "Resolved"

And uses this in-progress status:
- "In Progress"

If your team uses different status names, the calculations may be inaccurate. Contact your team to verify status names match.

### Accuracy Considerations

1. **Changelog accuracy**: Relies on Jira's change history. If issues are bulk-transitioned or status changes are manually edited, timeline may be inaccurate.
2. **Multiple transitions**: If an issue is moved back from "Done" to "In Progress" and back to "Done", the cycle time uses the *first* "In Progress" and *last* "Done" — reflecting the full duration.
3. **Time zones**: Dates are computed in UTC from Jira's timestamps. All times are in calendar days.

---

## EBPA Alignment

Both tabs implement **Metric #2** from Sixt's Evidence-Based Performance Analysis framework:

| Aspect | EBPA Definition | Implementation |
|--------|-----------------|-----------------|
| **Metric** | Workitem Cycle Time (Median) | ✅ Median computed correctly |
| **Start** | When story moves to "In Progress" | ✅ First transition to "In Progress" |
| **End** | Until it moves to "Done" | ✅ Last transition to Done/Closed/Resolved |
| **Unit** | Time in days | ✅ Calendar days |
| **Purpose** | Understand system health, not rank individuals | ✅ Team-level (Cycle Time tab) and self-assessment (Developer tab) |
| **Frequency** | Bi-weekly review | ✅ No enforced frequency; review as needed |

**Key EBPA Principles Honored**:
- ✅ "Not meant for comparing individuals or teams against each other"
- ✅ "Help us work together towards our common goals"
- ✅ "Enable transparency of the teams' work to take right decisions"

---

## Best Practices

1. **Review trends, not absolutes**: A single sprint's cycle time is less meaningful than a 5-sprint trend.
2. **Correlate with events**: When cycle time spikes, investigate what was different (deployments, holidays, big feature).
3. **Sprint name regex**: Use regex filtering to isolate specific team data if multiple teams share a board.
4. **P85 vs Median**: When P85 is significantly higher than median, investigate the tail of slow issues.
5. **Self-assessment focus**: Use the Developer tab for personal reflection and goal-setting, not manager reviews.

---

## Example Scenarios

### Scenario 1: Cycle Time Increased from 5 to 10 Days

**Possible causes**:
- More complex issues in recent sprints
- Team context-switching (visible if velocity also decreased)
- Deployment or review delays (visible in multiple P85/Max values)

**Action**: Review recent sprints' issues — are they genuinely more complex, or is there a process bottleneck?

### Scenario 2: Engineer A Has 3-Day Cycle Time, Engineer B Has 8-Day Cycle Time

**This is normal and expected.** Possible explanations:
- Engineer A works on smaller, well-defined issues
- Engineer B tackles complex features or infrastructure work
- Different issue assignments, not different capability

**Action**: Don't use this for performance comparison. Use it for workload balancing (are workloads distributed fairly?).

### Scenario 3: P85 is 15 Days, but Median is 5 Days

**Interpretation**: 85% of issues complete in 15 days, but the median is 5. There's a significant tail of slow issues.

**Action**: Investigate the slow outliers. Are they blocked? Waiting for dependencies? Blocked by reviews? Fix the systemic issue, not the individuals.

---

## Troubleshooting

### "No data shown"
- Ensure board is selected and "Apply" button clicked
- Check that closed sprints exist (future/active sprints won't show)
- Verify sprint name pattern regex is valid

### "0 issues count"
- Issues may not have gone through "In Progress" status
- All issues may be in "Open"/"To Do" (only completed issues are counted)
- Sprints may still be active

### Cycle time seems wrong
- Verify "In Progress" status name matches your Jira workflow
- Check if issues were bulk-transitioned (may skew times)
- Confirm Jira's changelog is accurate for the period

---

## Related Documentation

- **EBPA Framework**: [Sixt Tech Wiki - Pillar 3 Evidence-Based Performance Analysis](https://sixt-cloud.atlassian.net/wiki/spaces/SXTECH/pages/98144902/Pillar+3+Evidence-Based+Performance+analysis+using+Metrics)
- **Velocity Tab**: See dashboard Overview tab for story points/throughput metrics
- **Overview Tab**: See KPIs, bug counts, and tech debt metrics

