import { svc } from '../../main'
import { MemberWithIDOnly } from '../../types/member'

/*
updateMemberAffiliations is a Temporal activity that updates all affiliations for
a given member.
*/
export async function updateMemberAffiliations(input: MemberWithIDOnly): Promise<void> {
  try {
    await svc.postgres.writer.connection().query(
      `WITH new_activities_organizations AS (
        SELECT
          a.id,

          -- this 000000 magic is to differentiate between nothing to LEFT JOIN with and real individial affiliation
          -- we want to keep NULL in 'organizationId' if there is an affiliation configured,
          -- but if there is no manual affiliation, we know this by 'msa.id' being NULL, and then using 000000 as a marker,
          -- which we remove afterwards
          (ARRAY_REMOVE(ARRAY_AGG(CASE WHEN msa.id IS NULL THEN '00000000-0000-0000-0000-000000000000' ELSE msa."organizationId" END), '00000000-0000-0000-0000-000000000000')
            || ARRAY_REMOVE(ARRAY_AGG(mo."organizationId" ORDER BY mo."dateStart" DESC, mo.id), NULL)
            || ARRAY_REMOVE(ARRAY_AGG(mo1."organizationId" ORDER BY mo1."createdAt" DESC, mo1.id), NULL)
            || ARRAY_REMOVE(ARRAY_AGG(mo2."organizationId" ORDER BY mo2."createdAt", mo2.id), NULL)
          )[1] AS new_org
        FROM activities a
        LEFT JOIN "memberSegmentAffiliations" msa ON msa."memberId" = a."memberId" AND a."segmentId" = msa."segmentId" AND (
          a.timestamp BETWEEN msa."dateStart" AND msa."dateEnd"
          OR (a.timestamp >= msa."dateStart" AND msa."dateEnd" IS NULL)
        )
        LEFT JOIN "memberOrganizations" mo ON mo."memberId" = a."memberId"
          AND (
            a.timestamp BETWEEN mo."dateStart" AND mo."dateEnd"
            OR (a.timestamp >= mo."dateStart" AND mo."dateEnd" IS NULL)
          )
          AND mo."deletedAt" IS NULL
        LEFT JOIN "memberOrganizations" mo1 ON mo1."memberId" = a."memberId"
          AND mo1."dateStart" IS NULL AND mo1."dateEnd" IS NULL
          AND mo1."createdAt" <= a.timestamp
          AND mo1."deletedAt" IS NULL
        LEFT JOIN "memberOrganizations" mo2 ON mo2."memberId" = a."memberId"
          AND mo2."dateStart" IS NULL AND mo2."dateEnd" IS NULL
          AND mo2."deletedAt" IS NULL
        WHERE a."memberId" = $1
        GROUP BY a.id
      )
      UPDATE activities a1
      SET "organizationId" = nao.new_org
      FROM new_activities_organizations nao
      WHERE a1.id = nao.id
        AND ("organizationId" != nao.new_org
        OR ("organizationId" IS NULL AND nao.new_org IS NOT NULL)
        OR ("organizationId" IS NOT NULL AND nao.new_org IS NULL));`,
      [input.member.id],
    )
  } catch (err) {
    throw new Error(err)
  }
}
