export interface GithubSkippedCounts {
  missing: number
  private: number
  empty: number
  error: number
}

export interface GithubSyncCounts {
  selected: number
  fetched: number
  upserted: number
  removed: number
  skipped: GithubSkippedCounts
}

export function emptyGithubSyncCounts(): GithubSyncCounts {
  return {
    selected: 0,
    fetched: 0,
    upserted: 0,
    removed: 0,
    skipped: { missing: 0, private: 0, empty: 0, error: 0 },
  }
}

export function addGithubSyncCounts(a: GithubSyncCounts, b: GithubSyncCounts): GithubSyncCounts {
  return {
    selected: a.selected + b.selected,
    fetched: a.fetched + b.fetched,
    upserted: a.upserted + b.upserted,
    removed: a.removed + b.removed,
    skipped: {
      missing: a.skipped.missing + b.skipped.missing,
      private: a.skipped.private + b.skipped.private,
      empty: a.skipped.empty + b.skipped.empty,
      error: a.skipped.error + b.skipped.error,
    },
  }
}
