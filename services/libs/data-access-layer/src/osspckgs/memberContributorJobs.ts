import { QueryExecutor } from '../queryExecutor'

export type MemberContributorCollectionPath = 'github'
export type MemberContributorJobStatus = 'pending' | 'running' | 'done' | 'failed'

export interface MemberContributorJobInput {
  id: string
  purl: string
  ecosystem: string
  collectionPath: MemberContributorCollectionPath
  packageId: string
  repoId: string
}

export interface MemberContributorJobRow {
  id: string
  purl: string
  status: MemberContributorJobStatus
  error: string | null
  packageId: string | null
  repoId: string | null
}

export interface MemberContributorJobRepo {
  repoId: string
  repoUrl: string
  repoHost: string
}

export async function createMemberContributorJob(
  qx: QueryExecutor,
  input: MemberContributorJobInput,
): Promise<string | null> {
  const row = await qx.selectOneOrNone(
    `
    INSERT INTO member_contributor_jobs
      (id, purl, ecosystem, collection_path, package_id, repo_id, status)
    VALUES
      ($(id), $(purl), $(ecosystem), $(collectionPath), $(packageId), $(repoId), 'pending')
    ON CONFLICT (purl) WHERE status IN ('pending', 'running') DO NOTHING
    RETURNING id
    `,
    input,
  )
  return row ? (row.id as string) : null
}

export async function findActiveMemberContributorJobByPurl(
  qx: QueryExecutor,
  purl: string,
): Promise<{ id: string } | null> {
  return qx.selectOneOrNone(
    `
    SELECT id
    FROM member_contributor_jobs
    WHERE purl = $(purl) AND status IN ('pending', 'running')
    `,
    { purl },
  )
}

export async function findLatestMemberContributorJobStatusByPurl(
  qx: QueryExecutor,
  purl: string,
): Promise<MemberContributorJobStatus | null> {
  const row = await qx.selectOneOrNone(
    `
    SELECT status
    FROM member_contributor_jobs
    WHERE purl = $(purl)
    ORDER BY created_at DESC, id DESC
    LIMIT 1
    `,
    { purl },
  )
  return row ? (row.status as MemberContributorJobStatus) : null
}

export async function findMemberContributorJob(
  qx: QueryExecutor,
  id: string,
): Promise<MemberContributorJobRow | null> {
  return qx.selectOneOrNone(
    `
    SELECT id, purl, status, error,
           package_id::text AS "packageId", repo_id::text AS "repoId"
    FROM member_contributor_jobs
    WHERE id = $(id)
    `,
    { id },
  )
}

export async function findMemberContributorJobRepo(
  qx: QueryExecutor,
  id: string,
): Promise<MemberContributorJobRepo | null> {
  return qx.selectOneOrNone(
    `
    SELECT j.repo_id::text AS "repoId", r.url AS "repoUrl", r.host AS "repoHost"
    FROM member_contributor_jobs j
    JOIN repos r ON r.id = j.repo_id
    WHERE j.id = $(id)
    `,
    { id },
  )
}

export async function markMemberContributorJobRunning(
  qx: QueryExecutor,
  id: string,
): Promise<void> {
  await qx.result(
    `
    UPDATE member_contributor_jobs
    SET status = 'running', started_at = NOW(), updated_at = NOW()
    WHERE id = $(id) AND status = 'pending'
    `,
    { id },
  )
}

export async function completeMemberContributorJob(qx: QueryExecutor, id: string): Promise<void> {
  await qx.result(
    `
    UPDATE member_contributor_jobs
    SET status = 'done', completed_at = NOW(), updated_at = NOW()
    WHERE id = $(id) AND status = 'running'
    `,
    { id },
  )
}

export async function failMemberContributorJob(
  qx: QueryExecutor,
  id: string,
  error: string,
): Promise<void> {
  await qx.result(
    `
    UPDATE member_contributor_jobs
    SET status = 'failed', error = $(error), completed_at = NOW(), updated_at = NOW()
    WHERE id = $(id) AND status <> 'done'
    `,
    { id, error },
  )
}
