import { QueryExecutor } from '../queryExecutor'
import { prepareSelectColumns } from '../utils'
import { IDbSlackOnboardingRequest, IDbSlackOnboardingRequestCreate } from './types'

const COLUMNS = [
  'sourceUrl',
  'channel',
  'messageTs',
  'header',
  'doneNotifiedAt',
  'createdAt',
  'updatedAt',
]

export async function upsertSlackOnboardingRequest(
  qx: QueryExecutor,
  data: IDbSlackOnboardingRequestCreate,
): Promise<IDbSlackOnboardingRequest> {
  return qx.selectOne(
    `
    INSERT INTO "slackOnboardingRequests" ("sourceUrl", "channel", "messageTs", "header")
    VALUES ($(sourceUrl), $(channel), $(messageTs), $(header)::jsonb)
    ON CONFLICT ("sourceUrl") DO UPDATE SET
      "channel" = EXCLUDED."channel",
      "messageTs" = EXCLUDED."messageTs",
      "header" = EXCLUDED."header",
      "doneNotifiedAt" = NULL,
      "updatedAt" = NOW()
    RETURNING ${prepareSelectColumns(COLUMNS)}
    `,
    { ...data, header: JSON.stringify(data.header) },
  )
}

export async function findSlackOnboardingRequest(
  qx: QueryExecutor,
  sourceUrl: string,
): Promise<IDbSlackOnboardingRequest | null> {
  return qx.selectOneOrNone(
    `
    SELECT ${prepareSelectColumns(COLUMNS)}
    FROM "slackOnboardingRequests"
    WHERE "sourceUrl" = $(sourceUrl)
    `,
    { sourceUrl },
  )
}

// Held until the transaction ends; serializes the read-then-edit of one request's status
// message across the backend and the two workers so an older snapshot cannot overwrite a newer one.
export async function lockSlackOnboardingRequest(
  qx: QueryExecutor,
  sourceUrl: string,
): Promise<void> {
  await qx.result(
    `SELECT pg_advisory_xact_lock(hashtextextended('slackOnboardingRequest:' || $(sourceUrl)::text, 0))`,
    { sourceUrl },
  )
}

export async function claimSlackOnboardingRequestDone(
  qx: QueryExecutor,
  sourceUrl: string,
): Promise<boolean> {
  const updated = await qx.result(
    `
    UPDATE "slackOnboardingRequests"
    SET "doneNotifiedAt" = NOW(), "updatedAt" = NOW()
    WHERE "sourceUrl" = $(sourceUrl) AND "doneNotifiedAt" IS NULL
    `,
    { sourceUrl },
  )
  return updated > 0
}
