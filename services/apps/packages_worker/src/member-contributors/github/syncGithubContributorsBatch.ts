import { heartbeat } from '@temporalio/activity'

import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { prepareBulkInsert } from '@crowd/data-access-layer/src/utils'
import { getServiceChildLogger } from '@crowd/logging'

import { getGithubAppConfig } from '../../config'
import { getPackagesDb } from '../../db'
import { githubApiGet } from '../../security-contacts/githubToken'
import { mapWithConcurrency } from '../../utils/concurrency'
import { RepoContributorRow } from '../governance/mapRows'
import { readRunStart } from '../governance/syncGovernanceContributors'
import { GithubSyncCounts, emptyGithubSyncCounts } from './counts'
import { fetchRepoContributors } from './fetchRepoContributors'
import { GITHUB_SOURCE, GithubContributorsStatus, toGithubContributorRows } from './mapContributors'

const log = getServiceChildLogger('syncGithubContributorsBatch')

const FETCH_CONCURRENCY = 10
const FETCH_TIMEOUT_MS = 15000
const RECHECK_AFTER_DAYS = 6
const HEARTBEAT_INTERVAL_MS = 30_000
const MIN_REPOS_FOR_ALL_ERROR_GUARD = 20
const UPSERT_CHUNK_SIZE = 5000

export interface GithubBatchInput {
  runStartedAt: string
  limit: number
}

export interface GithubBatchResult {
  counts: GithubSyncCounts
}

interface SelectedRepo {
  id: string
  url: string
}

export interface RepoFetchOutcome {
  repoId: string
  status: GithubContributorsStatus
  rows: RepoContributorRow[]
}

const CONTRIBUTOR_COLUMNS = [
  'repo_id',
  'source',
  'role',
  'role_kind',
  'identity_type',
  'identity_value',
  'first_seen_at',
  'last_seen_at',
  'ended_at',
]

const UPSERT_CLAUSE = `(repo_id, source, identity_type, identity_value, role) DO UPDATE SET
  role_kind     = EXCLUDED.role_kind,
  first_seen_at = LEAST(repo_contributors.first_seen_at, EXCLUDED.first_seen_at),
  last_seen_at  = GREATEST(repo_contributors.last_seen_at, EXCLUDED.last_seen_at),
  ended_at      = EXCLUDED.ended_at,
  updated_at    = NOW()`

const STATUSES_THAT_REPLACE_ROWS: GithubContributorsStatus[] = ['fetched', 'empty']

export async function selectGithubContributorRepos(
  pkgsQx: QueryExecutor,
  runStartedAt: Date,
  limit: number,
): Promise<SelectedRepo[]> {
  const recheckBefore = new Date(runStartedAt.getTime() - RECHECK_AFTER_DAYS * 24 * 60 * 60 * 1000)
  return pkgsQx.select(
    `
    SELECT r.id::text AS id, r.url
    FROM repos r
    WHERE r.host = 'github'
      AND (r.github_contributors_checked_at IS NULL OR r.github_contributors_checked_at < $(recheckBefore))
      AND EXISTS (
        SELECT 1 FROM package_repos pr
        JOIN packages p ON p.id = pr.package_id AND p.is_critical
        WHERE pr.repo_id = r.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM repo_contributors rc WHERE rc.repo_id = r.id AND rc.source = 'git_activity'
      )
    ORDER BY r.github_contributors_checked_at NULLS FIRST, r.id
    LIMIT $(limit)
    `,
    { recheckBefore, limit },
  )
}

async function countCheckedRepos(pkgsQx: QueryExecutor): Promise<number> {
  const rows: Array<{ checkedRepos: string }> = await pkgsQx.select(
    `SELECT count(*) AS "checkedRepos" FROM repos WHERE github_contributors_checked_at IS NOT NULL`,
  )
  return Number(rows[0].checkedRepos)
}

export async function fetchGithubRepoOutcome(
  repo: SelectedRepo,
  observedAt: Date,
): Promise<RepoFetchOutcome> {
  const { status, contributors } = await fetchRepoContributors(repo.url, (path) =>
    githubApiGet(path, FETCH_TIMEOUT_MS, { extraOkStatuses: [204] }),
  )
  const rows =
    status === 'fetched' ? toGithubContributorRows(contributors, repo.id, observedAt) : []
  return {
    repoId: repo.id,
    status: rows.length === 0 && status === 'fetched' ? 'empty' : status,
    rows,
  }
}

function toDbRow(row: RepoContributorRow): Record<string, unknown> {
  return {
    repo_id: row.repoId,
    source: row.source,
    role: row.role,
    role_kind: row.roleKind,
    identity_type: row.identityType,
    identity_value: row.identityValue,
    first_seen_at: row.firstSeenAt,
    last_seen_at: row.lastSeenAt,
    ended_at: row.endedAt,
  }
}

export async function upsertGithubContributorRows(
  tx: QueryExecutor,
  rows: RepoContributorRow[],
  chunkSize = UPSERT_CHUNK_SIZE,
): Promise<number> {
  let upserted = 0
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize).map(toDbRow)
    upserted += await tx.result(
      prepareBulkInsert('repo_contributors', CONTRIBUTOR_COLUMNS, chunk, UPSERT_CLAUSE),
    )
  }
  return upserted
}

async function removeStaleRows(
  tx: QueryExecutor,
  repoIds: string[],
  batchStartedAt: Date,
): Promise<number> {
  if (repoIds.length === 0) return 0
  return tx.result(
    `DELETE FROM repo_contributors
     WHERE source = '${GITHUB_SOURCE}'
       AND repo_id = ANY($(repoIds)::bigint[])
       AND updated_at < $(batchStartedAt)`,
    { repoIds, batchStartedAt },
  )
}

async function writeStatus(
  tx: QueryExecutor,
  repoIds: string[],
  status: GithubContributorsStatus,
  checkedAt: Date,
): Promise<void> {
  if (repoIds.length === 0) return
  await tx.result(
    `UPDATE repos
     SET github_contributors_status = $(status), github_contributors_checked_at = $(checkedAt)
     WHERE id = ANY($(repoIds)::bigint[])`,
    { repoIds, status, checkedAt },
  )
}

function groupByStatus(outcomes: RepoFetchOutcome[]): Map<GithubContributorsStatus, string[]> {
  const byStatus = new Map<GithubContributorsStatus, string[]>()
  for (const outcome of outcomes) {
    const ids = byStatus.get(outcome.status) ?? []
    ids.push(outcome.repoId)
    byStatus.set(outcome.status, ids)
  }
  return byStatus
}

export async function writeGithubRepoOutcomes(
  pkgsQx: QueryExecutor,
  outcomes: RepoFetchOutcome[],
  batchStartedAt: Date,
): Promise<Pick<GithubSyncCounts, 'upserted' | 'removed'>> {
  const rows = outcomes.flatMap((o) => o.rows)
  const replaceIds = outcomes
    .filter((o) => STATUSES_THAT_REPLACE_ROWS.includes(o.status))
    .map((o) => o.repoId)
  const byStatus = groupByStatus(outcomes)
  const written = { upserted: 0, removed: 0 }

  await pkgsQx.tx(async (tx) => {
    written.upserted = await upsertGithubContributorRows(tx, rows)
    written.removed = await removeStaleRows(tx, replaceIds, batchStartedAt)
    for (const [status, repoIds] of byStatus) {
      await writeStatus(tx, repoIds, status, batchStartedAt)
    }
  })
  return written
}

function tallyOutcomes(outcomes: RepoFetchOutcome[], counts: GithubSyncCounts): void {
  for (const outcome of outcomes) {
    if (outcome.status === 'fetched') counts.fetched += 1
    else counts.skipped[outcome.status] += 1
  }
}

function assertNotAllFailed(outcomes: RepoFetchOutcome[]): void {
  if (outcomes.length < MIN_REPOS_FOR_ALL_ERROR_GUARD) return
  if (outcomes.every((o) => o.status === 'error')) {
    throw new Error(
      `Refusing to record github contributors batch: all ${outcomes.length} repos failed`,
    )
  }
}

function heartbeatSafely(details: { done: number; selected: number }): void {
  try {
    heartbeat(details)
  } catch (err) {
    log.warn({ errMsg: (err as Error).message }, 'Heartbeat failed')
  }
}

export async function syncGithubContributorsBatch(
  input: GithubBatchInput,
): Promise<GithubBatchResult> {
  getGithubAppConfig()
  const pkgsQx = await getPackagesDb()
  const runStartedAt = new Date(input.runStartedAt)
  const counts = emptyGithubSyncCounts()

  const repos = await selectGithubContributorRepos(pkgsQx, runStartedAt, input.limit)
  counts.selected = repos.length
  if (repos.length === 0) {
    if ((await countCheckedRepos(pkgsQx)) === 0) {
      throw new Error(
        'Refusing to finish github contributors sync: selected 0 repos and none were ever checked',
      )
    }
    return { counts }
  }

  let done = 0
  const heartbeatTimer = setInterval(
    () => heartbeatSafely({ done, selected: repos.length }),
    HEARTBEAT_INTERVAL_MS,
  )
  try {
    const batchStartedAt = await readRunStart(pkgsQx)
    const outcomes = await mapWithConcurrency(repos, FETCH_CONCURRENCY, async (repo) => {
      const outcome = await fetchGithubRepoOutcome(repo, runStartedAt)
      done += 1
      return outcome
    })

    assertNotAllFailed(outcomes)
    tallyOutcomes(outcomes, counts)
    const written = await writeGithubRepoOutcomes(pkgsQx, outcomes, batchStartedAt)
    counts.upserted = written.upserted
    counts.removed = written.removed
  } finally {
    clearInterval(heartbeatTimer)
  }

  log.info(counts, 'GitHub contributors batch synced')
  return { counts }
}
