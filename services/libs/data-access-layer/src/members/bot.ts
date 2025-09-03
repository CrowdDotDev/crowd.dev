import { QueryExecutor } from '../queryExecutor'

export async function fetchBotCandidateMembers(
  qx: QueryExecutor,
  limit: number = 100,
): Promise<string[]> {
  const rows = await qx.select(
    `
    SELECT DISTINCT m.id AS "memberId"
    FROM "memberIdentities" mi
    JOIN "members" m ON mi."memberId" = m.id
    WHERE m."deletedAt" IS NULL
        AND (
            mi.value ~* '(^|[-_/\s])(bot|robot)($|[-_/\s])'
            OR mi.value ~* '(^|[-_/])(bot|automation|ci|cd|deploy|build|release)[-_]?\\d+$'
            OR mi.value ~* '(^|[-_/])(github|gitlab|bitbucket|azure|aws|gcp|k8s|openshift)[-_](bot|ci|actions?|pipeline|runner|automation)($|[-_/])'
            OR mi.value ~* '^(bot[-_/\s\\d]*|.*[-_/\s\\d]bot)$'

            OR m."displayName" ~* '(^|[-_/\s])(bot|robot)($|[-_/\s])'
            OR m."displayName" ~* '(^|[-_/])(bot|automation|ci|cd|deploy|build|release)[-_]?\\d+$'
            OR m."displayName" ~* '(^|[-_/])(github|gitlab|bitbucket|azure|aws|gcp|k8s|openshift)[-_](bot|ci|actions?|pipeline|runner|automation)($|[-_/])'
            OR m."displayName" ~* '^(bot[-_/\s\\d]*|.*[-_/\s\\d]bot)$'
        )
        AND (
            m.attributes IS NULL
            OR m.attributes->'isBot' IS NULL
            OR (m.attributes->'isBot'->>'default')::boolean IS NOT TRUE
        )
        AND m.id NOT IN (SELECT "memberId" FROM "memberBotSuggestions")
        AND m.id NOT IN (SELECT "memberId" FROM "memberNoBot")
    LIMIT $(limit);
    `,
    {
      limit,
    },
  )

  return rows.map((r) => r.memberId)
}
