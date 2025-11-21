# Lambda Architecture for Tinybird Data Pipelines

## Overview

This document explains the **Lambda Architecture** implementation used in our Tinybird data pipelines. Lambda Architecture is a data processing design pattern that combines:

- **Enrichment Layer (Real-time)**: Materialized Views (MVs) that process new data immediately as it arrives
- **Merge Layer (Scheduled)**: Copy pipes that merge real-time snapshots with historical data on a schedule
- **Serving Layer**: Snapshot-based datasources that provide deduplicated views via query-time filtering

**Key Benefits:**
- ✅ **Fast query performance**: Queries read pre-processed, snapshot-filtered data (not raw data)
- ✅ **Real-time enrichment**: MVs enrich and filter data immediately at ingestion time
- ✅ **Efficient deduplication**: Copy pipes merge snapshots hourly; queries filter by latest snapshot
- ✅ **Predictable costs**: Heavy processing (enrichment, filtering) happens once at ingestion, not on every query
- ✅ **Near real-time**: Data enriched immediately, available in serving layer within 10 minutes

---

## Main Activity Relations Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MAIN ACTIVITY RELATIONS PIPELINE                          │
└─────────────────────────────────────────────────────────────────────────────┘

[1] Raw Data Ingestion
    ┌────────────────────────────────────────┐
    │  activityRelations                     │
    │  (Postgres → Tinybird replication)     │
    └────────────────────────────────────────┘
                     ↓
    • TYPE: ReplacingMergeTree
    • Partitioned by: toYear(createdAt)
    • Sorting Key: segmentId, timestamp, type, platform, channel, sourceId
    • Raw data from Postgres


[2] Enrichment Layer - Real-time Materialized View
    ┌────────────────────────────────────────┐
    │  activityRelations_enrich_clean        │
    │  _snapshot_MV                          │
    │  (TYPE: MATERIALIZED)                  │
    └────────────────────────────────────────┘
                     ↓ (triggers on INSERT to activityRelations)

    What it does:
    ├─ Enriches: country codes, org names, gitChangedLines, buckets
    ├─ Filters: activities from valid members, repos, segments
    ├─ Attaches snapshot IDs to rows: toStartOfInterval(updatedAt, 1 hour) + 1 hour
    └─ Runs: Immediately on new data


[3] Enrichment Layer Output
    ┌────────────────────────────────────────┐
    │  activityRelations_enrich_clean        │
    │  _snapshot_MV_ds                       │
    └────────────────────────────────────────┘
                     ↓
    • TYPE: ReplacingMergeTree
    • Partitioned by: toYYYYMM(snapshotId)
    • TTL: snapshotId + 1 day
    • Purpose: Temporary real-time enriched snapshots
                     │
                     │ (branches to specialized MVs)
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    [Pull Requests]        [Other specialized MVs]
    (see below)            (future: issues, commits, etc.)


[4] Merge Layer - Snapshot Merger Copy Pipe
    ┌────────────────────────────────────────┐
    │  activityRelations_snapshot_           │
    │  merger_copy                           │
    │  (TYPE: COPY, every hour at :10)       │
    └────────────────────────────────────────┘
                     ↓

    What it does:
    ├─ Fetches: NEW data from MV (latest snapshotId + 1 hour)
    ├─ Fetches: OLD data from serving layer (current max snapshotId)
    ├─ Merges: UNION ALL → creates new snapshot
    ├─ Mode: append
    └─ Schedule: 10 * * * * (hourly at minute 10)


[5] Serving Layer - Final Datasource
    ┌────────────────────────────────────────┐
    │  activityRelations_deduplicated        │
    │  _cleaned_ds                           │
    │  (queried by all analytics)            │
    └────────────────────────────────────────┘
                     ↓
    • TYPE: MergeTree
    • Partitioned by: snapshotId
    • Sorting Key: segmentId, timestamp, type, platform, memberId, organizationId
    • TTL: snapshotId + 6 hours (keeps last ~6 snapshots)
    • Query Pattern: WHERE snapshotId = (SELECT max(snapshotId) FROM ...)

    Data structure:
    ├─ Record A, snapshotId: 14:00
    ├─ Record A, snapshotId: 15:00  (same record, updated snapshot)
    ├─ Record A, snapshotId: 16:00  (same record, latest snapshot)
    ├─ Record B, snapshotId: 15:00
    └─ Record B, snapshotId: 16:00

    ⚠️  Multiple copies exist physically
    ✅  Deduplication happens at query time via max(snapshotId) filter
```

---

## Timeline View (Hourly Execution)

```
═══════════════════════════════════════════════════════════════════════════════
                         HOURLY EXECUTION TIMELINE
═══════════════════════════════════════════════════════════════════════════════

Time:   :00              :10                    :59        Next Hour :00
        │                │                      │          │
        │                │                      │          │
Step 1: │ New data       │                      │          │
        │ arrives in     │                      │          │
        │ activityRel    │                      │          │
        ↓                │                      │          │
        │                │                      │          │
Step 2: MV triggers      │                      │          │
        immediately      │                      │          │
        • Enriches data  │                      │          │
        • Filters        │                      │          │
        • Adds snapshot  │                      │          │
        ↓                │                      │          │
        │                │                      │          │
Step 3: Writes to        │                      │          │
        MV_ds with       │                      │          │
        snapshotId =     │                      │          │
        (next hour)      │                      │          │
                         ↓                      │          │
                         │                      │          │
Step 4:                  Copy pipe runs         │          │
                         • Fetch NEW            │          │
                         •  (from MV_ds)        │          │
                         • Fetch OLD            │          │
                         •  (from serving)      │          │
                         • UNION ALL            │          │
                         • New snapshotId       │          │
                         ↓                      │          │
                         │                      │          │
Step 5:                  Appends to serving     │          │
                         layer with new         │          │
                         snapshot               │          │
                                          ↓          ↓
                                    [Continues   [Next cycle]
                                     processing]

Queries:                 Always filter by max(snapshotId) to get latest data
                         ↓
                         Only sees deduplicated view (latest snapshot)
```

---

## Snapshot-Based Deduplication Strategy

### How It Works

Unlike traditional database deduplication, our approach uses **snapshot-based logical deduplication**:

1. **Physical Storage**: Multiple copies of the same record exist across different snapshots
2. **Logical View**: Queries filter by `max(snapshotId)` to see only the latest version
3. **Automatic Cleanup**: TTL removes old snapshots (keeps last 6 hours)

### Example

```sql
-- Physical data in datasource:
┌─────────┬─────────────┬────────────┐
│ id      │ value       │ snapshotId │
├─────────┼─────────────┼────────────┤
│ 1       │ old_value   │ 2024-01-01 14:00 │  ← Old snapshot
│ 1       │ new_value   │ 2024-01-01 15:00 │  ← New snapshot (same record)
│ 2       │ some_value  │ 2024-01-01 15:00 │
└─────────┴─────────────┴────────────┘

-- Query with snapshot filter:
SELECT *
FROM activityRelations_deduplicated_cleaned_ds
WHERE snapshotId = (SELECT max(snapshotId) FROM activityRelations_deduplicated_cleaned_ds)

-- Result (deduplicated logical view):
┌─────────┬─────────────┬────────────┐
│ id      │ value       │ snapshotId │
├─────────┼─────────────┼────────────┤
│ 1       │ new_value   │ 2024-01-01 15:00 │  ← Latest only
│ 2       │ some_value  │ 2024-01-01 15:00 │
└─────────┴─────────────┴────────────┘
```

### Why This Approach?

**Simple**: No complex deduplication logic in queries

**Fast filtering**: Filter by snapshotId is highly efficient (partition key)

**Fast copy operations**: Append mode copys are much lightweight and fast then replace mode copys

**Reliable**: TTL automatically manages storage

---

## Pull Requests Specialized Pipeline

The Pull Requests pipeline demonstrates how to **branch from the main pipeline** for specialized, real-time analytics.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PULL REQUESTS SPECIALIZED PIPELINE                        │
│                  (Branches from activityRelations MV output)                 │
└─────────────────────────────────────────────────────────────────────────────┘

[From Step 3 of Main Pipeline]
    activityRelations_enrich_clean_snapshot_MV_ds
    ↓ (filters for PR-related activity types only)
    │
    ├─ pull_request-opened, merge_request-opened, changeset-created
    ├─ pull_request-assigned, pull_request-reviewed, pull_request-approved
    └─ pull_request-closed, pull_request-merged, etc.


[4*] Enrichment Layer - PR Analysis MV (Baseline-Merge Strategy)
    ┌────────────────────────────────────────┐
    │  pull_request_analysis_MV              │
    │  _baseline_merge                       │
    │  (TYPE: MATERIALIZED)                  │
    └────────────────────────────────────────┘
                     ↓ (triggers on PR-related activities)

    Node 1: new_pull_request_related_activity
    └─ Filters PR events from latest snapshot

    Node 2: new_events_aggregated
    ├─ Aggregates NEW delta events by prSourceId
    ├─ Uses argMinIf/minIf for lifecycle timestamps
    ├─ Handles opened events (sourceId) + child events (sourceParentId)
    └─ Groups by normalized PR identifier

    Node 3: pull_request_analysis_results_merged
    ├─ LEFT JOIN: new_events → pull_requests_analyzed (BASELINE)
    ├─ Merge Strategy:
    │   • Strings: if(existing != '', existing, new)
    │   • Timestamps: COALESCE + least() for earliest
    │   • Handles new PRs + updated existing PRs
    └─ Result: Merged PR records


[5*] Enrichment Layer Output
    ┌────────────────────────────────────────┐
    │  pull_request_analyzed_MV_ds           │
    └────────────────────────────────────────┘
                     ↓
    • TYPE: ReplacingMergeTree
    • Purpose: Temporary MV output


[6*] Merge Layer - PR Snapshot Merger
    ┌────────────────────────────────────────┐
    │  pull_request_analysis_snapshot        │
    │  _merger_copy                          │
    │  (TYPE: COPY, every hour at :00)       │
    └────────────────────────────────────────┘
                     ↓

    What it does:
    ├─ Fetches: NEW data from MV_ds (latest snapshot + 1 hour)
    ├─ Fetches: OLD data from pull_requests_analyzed (max snapshot)
    ├─ Merges: UNION ALL → creates new snapshot
    ├─ Mode: replace
    └─ Schedule: 0 * * * * (hourly at minute 0)


[Final] Serving Layer - PR Analytics
    ┌────────────────────────────────────────┐
    │  pull_requests_analyzed                │
    │  (queried by PR widgets)               │
    └────────────────────────────────────────┘
                     ↓
    • TYPE: MergeTree
    • Partitioned by: toYear(openedAt)
    • Sorting Key: segmentId, channel, openedAt, gitChangedLinesBucket, sourceId, id
    • No TTL (permanent analytics data)
    • Query Pattern: WHERE snapshotId = max(snapshotId)

    Schema:
    ├─ Core: id, sourceId, openedAt, segmentId, channel, memberId, organizationId
    ├─ Lifecycle: assignedAt, reviewRequestedAt, reviewedAt, approvedAt,
    │             closedAt, mergedAt, resolvedAt (all Nullable)
    └─ Metrics: assignedInSeconds, reviewedInSeconds, mergedInSeconds, etc.
```

---

## Baseline-Merge Strategy (Pull Requests)

The PR MV uses a **baseline-merge** pattern to efficiently update PR records:

### The Problem

- PRs have **one opened event** (creates the record)
- PRs have **many lifecycle events** that arrive over time (assigned, reviewed, merged)
- We need to merge new events with existing PR data without recomputing everything

### The Solution

```
┌──────────────────────────────────────────────────────────────────┐
│  BASELINE (Existing)        +        DELTA (New Events)          │
│  pull_requests_analyzed              MV latest snapshot          │
│  ────────────────────                ─────────────────           │
│  PR #123                             PR #123                     │
│  • opened: 2024-01-01                • reviewed: 2024-01-05      │
│  • assigned: 2024-01-02              (NEW lifecycle event!)      │
│  • reviewed: NULL                                                │
│  • merged: NULL                                                  │
│                                                                  │
│                    ↓  MERGE LOGIC  ↓                             │
│                                                                  │
│  RESULT (New Snapshot):                                          │
│  PR #123                                                         │
│  • opened: 2024-01-01    (from baseline)                         │
│  • assigned: 2024-01-02  (from baseline)                         │
│  • reviewed: 2024-01-05  (from delta - MERGED!)                 │
│  • merged: NULL          (from baseline)                         │
│  • snapshotId: 2024-01-05 16:00 (new snapshot)                  │
└──────────────────────────────────────────────────────────────────┘
```

### Merge Logic

**For String Fields** (ClickHouse returns `''` not `NULL`):
```sql
if(existing.id != '', existing.id, new.id)
```

**For DateTime Fields** (take earliest):
```sql
COALESCE(
    if(new.assignedAt IS NOT NULL AND new.assignedAt != toDateTime(0),
       least(existing.assignedAt, new.assignedAt),  -- Earlier of both
       existing.assignedAt                          -- Keep existing if no new
    ),
    new.assignedAt  -- Use new if no existing (new PR)
)
```

### Scenarios

1. **New PR**: `existing` is empty → uses all `new` data
2. **Updated PR**: Merges timestamps (takes earliest), preserves metadata
3. **Unchanged PR**: Not in new delta → not processed (efficient!)

---

## Query Patterns

### Always Filter by Latest Snapshot

**CRITICAL**: All analytics queries **MUST** filter by `max(snapshotId)` to get deduplicated data:

```sql
-- ✅ CORRECT: Gets latest snapshot (deduplicated)
SELECT *
FROM activityRelations_deduplicated_cleaned_ds
WHERE snapshotId = (SELECT max(snapshotId) FROM activityRelations_deduplicated_cleaned_ds)
  AND segmentId = 'your-segment-id'
  AND timestamp >= '2024-01-01'

-- ❌ WRONG: Gets ALL snapshots (duplicates, old data)
SELECT *
FROM activityRelations_deduplicated_cleaned_ds
WHERE segmentId = 'your-segment-id'
  AND timestamp >= '2024-01-01'
```

### Why This Works

- **Partition pruning**: `snapshotId` is the partition key → fast filtering
- **Small result set**: Only 1 snapshot returned (latest data)
- **No duplicates**: Logical deduplication via snapshot filtering

---

## Initial Snapshot Pipes (Bootstrap)

Before the Lambda Architecture can run continuously, we need to **create the first snapshot** in each serving datasource. This is done via **initial snapshot copy pipes** that run **@on-demand** (manually triggered).

### Purpose

Initial snapshot pipes:
- ✅ Create the baseline/first snapshot in serving datasources
- ✅ Run once at system startup or when resetting the pipeline
- ✅ Use `COPY_MODE: replace` to overwrite the entire target datasource
- ✅ Process current data to create a deterministic starting point
- ✅ Enable subsequent merger copy pipes to work incrementally

### Examples

#### 1. activityRelations_enrich_clean_initial_snapshot

```
File: activityRelations_enrich_clean_initial_snapshot.pipe

TYPE: COPY
COPY_MODE: replace
COPY_SCHEDULE: @on-demand
TARGET_DATASOURCE: activityRelations_deduplicated_cleaned_ds

What it does:
├─ Reads raw activityRelations (base table)
├─ Enriches with country codes, org names, gitChangedLines buckets
├─ Filters valid members, repos, segments
├─ Creates snapshotId: toStartOfInterval(now(), INTERVAL 1 hour)
└─ Writes initial baseline to serving datasource

Usage: Run once to bootstrap activityRelations serving layer
```

#### 2. pull_request_analysis_initial_snapshot

```
File: pull_request_analysis_initial_snapshot.pipe

TYPE: COPY
COPY_MODE: replace
COPY_SCHEDULE: @on-demand
TARGET_DATASOURCE: pull_requests_analyzed

What it does:
├─ Reads from activityRelations_deduplicated_cleaned_ds (latest snapshot)
├─ Extracts all PR lifecycle events (opened, assigned, reviewed, approved, closed, merged)
├─ Joins lifecycle events by sourceId/sourceParentId
├─ Computes duration metrics (assignedInSeconds, reviewedInSeconds, etc.)
└─ Writes initial PR analysis baseline

Usage: Run once to bootstrap pull_requests_analyzed serving layer
```

#### 3. segmentId_aggregates_initial_snapshot

```
File: segmentId_aggregates_initial_snapshot.pipe

TYPE: COPY
COPY_MODE: replace
COPY_SCHEDULE: @on-demand
TARGET_DATASOURCE: segmentsAggregatedMV

What it does:
├─ Reads from activityRelations_deduplicated_cleaned_ds (latest snapshot)
├─ Groups by segmentId
├─ Counts distinct contributors (memberId) and organizations (organizationId)
└─ Writes initial segment aggregates

Usage: Run once to bootstrap segment-level metrics
```

### When to Run Initial Snapshots

**Run initial snapshot pipes when:**
1. 🆕 **First time setup**: Deploying the Lambda Architecture for the first time
2. 🔄 **Pipeline reset**: Need to rebuild serving datasources from scratch
3. 🐛 **Data corruption**: Serving datasource has bad data and needs complete refresh
4. 🔧 **Schema changes**: Major changes to enrichment logic or serving datasource schema

**How to run:**
```bash
# Via Tinybird CLI (assuming you have tb CLI configured)
tb pipe copy run activityRelations_enrich_clean_initial_snapshot --wait
tb pipe copy run pull_request_analysis_initial_snapshot --wait
tb pipe copy run segmentId_aggregates_initial_snapshot --wait
```

### Comparison: Initial vs Merger Copy Pipes

| Aspect | Initial Snapshot | Merger Copy Pipe |
|--------|------------------|------------------|
| **Schedule** | @on-demand (manual) | Hourly (10 * * * * or 0 * * * *) |
| **Mode** | replace (overwrites all) | append (adds new snapshot) |
| **Purpose** | Bootstrap/reset | Incremental updates |
| **Source** | Base tables or latest snapshot | MV output + existing serving data |
| **Logic** | Simple: process current data | Complex: merge new + old with dedup |
| **Frequency** | Once (or rarely) | Continuous (hourly) |
| **Snapshot Strategy** | Create first snapshot | Create new snapshots, merge with old |

### Bootstrap Flow

```
Step 1: Initial Data Setup
    ┌──────────────────────────────────────┐
    │  Run Initial Snapshot Pipes          │
    │  (manual, @on-demand)                │
    └──────────────────────────────────────┘
              ↓
    Creates first snapshot in:
    ├─ activityRelations_deduplicated_cleaned_ds (snapshotId: now)
    ├─ pull_requests_analyzed (snapshotId: now)
    └─ segmentsAggregatedMV (snapshotId: now)

              ↓

Step 2: Enable Continuous Processing
    ┌──────────────────────────────────────┐
    │  Materialized Views Start            │
    │  (automatic, triggered by inserts)   │
    └──────────────────────────────────────┘
              ↓
    MV processes new data immediately:
    └─ activityRelations_enrich_clean_snapshot_MV → MV_ds

              ↓

Step 3: Hourly Merging
    ┌──────────────────────────────────────┐
    │  Merger Copy Pipes Run               │
    │  (scheduled, hourly)                 │
    └──────────────────────────────────────┘
              ↓
    Merges MV output with serving datasources:
    ├─ activityRelations_snapshot_merger_copy (every hour at :10)
    ├─ pull_request_analysis_snapshot_merger_copy (every hour at :00)
    └─ Creates new snapshots, appends to serving layer
```

---

## Creating Specialized Branches

To create your own specialized real-time analytics (like the PR pipeline):

### Step 1: Understand the Branching Point

Branch from **activityRelations_enrich_clean_snapshot_MV_ds** (Step 3 of main pipeline):
- Already enriched (country codes, org names, etc.)
- Already filtered (valid members, repos, segments)
- Already snapshotted (hourly intervals)
- 1-day TTL (real-time cache)

### Step 2: Create a Specialized Materialized View

```sql
-- File: my_widget_analysis_MV.pipe

NODE my_trigger
SQL >
    SELECT *
    FROM activityRelations_enrich_clean_snapshot_MV_ds
    WHERE snapshotId = (SELECT max(snapshotId) FROM activityRelations_enrich_clean_snapshot_MV_ds)
      AND type IN ('specific-activity-type', 'another-type')

NODE my_aggregation
SQL >
    SELECT
        segmentId,
        count(*) as event_count,
        countDistinct(memberId) as unique_members,
        min(timestamp) as first_event_at
    FROM activityRelations_enrich_clean_snapshot_MV_ds
    WHERE snapshotId = (SELECT max(snapshotId) FROM activityRelations_enrich_clean_snapshot_MV_ds)
      AND type IN ('specific-activity-type')
    GROUP BY segmentId

TYPE MATERIALIZED
DATASOURCE my_widget_analysis_MV_ds
```

### Step 3: Create MV Output Datasource

```sql
-- File: my_widget_analysis_MV_ds.datasource

SCHEMA >
    `segmentId` String,
    `event_count` UInt64,
    `unique_members` UInt64,
    `first_event_at` DateTime64(3),
    `snapshotId` DateTime

ENGINE ReplacingMergeTree
ENGINE_PARTITION_KEY toYYYYMM(snapshotId)
ENGINE_SORTING_KEY segmentId, snapshotId
ENGINE_TTL toDateTime(snapshotId) + toIntervalDay(1)
```

### Step 4: Create Snapshot Merger Copy Pipe

```sql
-- File: my_widget_analysis_snapshot_merger_copy.pipe

NODE realtime_snapshot
SQL >
    SELECT *
    FROM my_widget_analysis_MV_ds
    WHERE snapshotId = (
        SELECT max(snapshotId) + INTERVAL 1 hour
        FROM my_widget_analysis_final
    )

NODE historical_snapshot
SQL >
    SELECT *
    FROM my_widget_analysis_final
    WHERE snapshotId = (SELECT max(snapshotId) FROM my_widget_analysis_final)

NODE merged
SQL >
    SELECT *
    FROM (
        SELECT * FROM realtime_snapshot
        UNION ALL
        SELECT * FROM historical_snapshot
    )

TYPE COPY
COPY_MODE append
COPY_SCHEDULE 0 * * * *  -- Hourly at :00
TARGET_DATASOURCE my_widget_analysis_final
```

### Step 5: Create Final Serving Datasource

```sql
-- File: my_widget_analysis_final.datasource

SCHEMA >
    `segmentId` String,
    `event_count` UInt64,
    `unique_members` UInt64,
    `first_event_at` DateTime64(3),
    `snapshotId` DateTime

ENGINE MergeTree
ENGINE_PARTITION_KEY toYYYYMM(snapshotId)
ENGINE_SORTING_KEY segmentId, snapshotId
ENGINE_TTL toDateTime(snapshotId) + toIntervalHour(6)  -- Keep last 6 snapshots

-- Query pattern:
-- SELECT * FROM my_widget_analysis_final
-- WHERE snapshotId = (SELECT max(snapshotId) FROM my_widget_analysis_final)
```

---

## Troubleshooting

### Data Not Updating

**Symptom**: Queries return stale data

**Check**:
1. Is the MV running? `SELECT * FROM activityRelations_enrich_clean_snapshot_MV_ds ORDER BY snapshotId DESC LIMIT 10`
2. Is the copy pipe scheduled? Check `COPY_SCHEDULE` in pipe definition
3. Check Tinybird logs for errors

### Duplicate Records

**Symptom**: Same activity appears multiple times

**Fix**: Ensure you're filtering by `max(snapshotId)`:
```sql
WHERE snapshotId = (SELECT max(snapshotId) FROM datasource_name)
```

### Missing Data

**Symptom**: Recent data not appearing

**Possible Causes**:
1. **TTL deleted it**: Old snapshots auto-deleted (6-hour window for activities, 1-day for MV output)
2. **MV behind**: Check latest `snapshotId` in MV_ds
3. **Copy pipe not run**: Runs at :10 past the hour (activities) or :00 (PRs)
4. **Filtering**: Check member/repo/segment filters in MV

### Performance Issues

**Symptom**: Queries slow despite Lambda Architecture

**Check**:
1. **Missing snapshot filter**: Always use `WHERE snapshotId = max(snapshotId)`
2. **Wrong partition key**: Ensure queries use partition key efficiently
3. **Large snapshots**: Check snapshot size with `SELECT snapshotId, count(*) FROM ... GROUP BY snapshotId`

---

## Key Takeaways

### What Happens When?

| Time | What | Where |
|------|------|-------|
| **Immediately** | Enrichment, Filtering | MV (Enrichment Layer) |
| **Every 10 min** | Snapshot merge, Deduplication | Copy Pipe (Merge Layer) |
| **Every query** | Snapshot filtering | Query-time (Serving Layer) |

### Deduplication Strategy

✅ **Snapshot-based logical deduplication**:
- Physical: Multiple copies across snapshots
- Logical: Query filters `max(snapshotId)` for latest
- Cleanup: TTL removes old snapshots

### Lambda Architecture Flow

```
Raw Data → MV (enrich/filter) → MV_ds (realtime snapshots)
                                     ↓
                                Copy Pipe (merge new + old)
                                     ↓
                              Serving Layer (snapshot-based dedup)
                                     ↓
                              Queries (filter by max(snapshotId))
```

### Remember

1. **Always filter by `max(snapshotId)`** in queries
2. **Enrichment/filtering happens at ingestion** (MV)
3. **Deduplication happens via snapshots** (copy pipe + query filter)
4. **Branch from MV output** for specialized widgets
5. **TTL manages storage** automatically (6 hours for activities)

---

## Summary

The Lambda Architecture provides:
- ✅ **Near real-time data** (10-minute lag for activities, 60-minute for PRs)
- ✅ **Fast queries** (<100ms with snapshot filtering)
- ✅ **Efficient processing** (enrich once, query many times)
- ✅ **Flexible analytics** (easy to create specialized branches)
- ✅ **Automatic cleanup** (TTL manages old snapshots)

This architecture moves heavyweight operations (enrichment, filtering) to ingestion time, handles deduplication through scheduled copy pipes and snapshot-based queries, and enables real-time specialized analytics through branching MVs.
