import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

class MemberAffiliationRepository {
  static async update(memberId: string, options: IRepositoryOptions) {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const query = `
      WITH new_activities_organizations AS (
          SELECT
              a.id,

              -- this 000000 magic is to differentiate between nothing to LEFT JOIN with and real individial affiliation
              -- we want to keep NULL in 'organizationId' if there is an affiliation configured,
              -- but if there is no manual affiliation, we know this by 'msa.id' being NULL, and then using 000000 as a marker,
              -- which we remove afterwards
              (ARRAY_REMOVE(ARRAY_AGG(CASE WHEN msa.id IS NULL THEN '00000000-0000-0000-0000-000000000000' ELSE msa."organizationId" END), '00000000-0000-0000-0000-000000000000')
               || ARRAY_REMOVE(ARRAY_AGG(mo."organizationId" ORDER BY mo."dateStart" DESC), NULL)
               || ARRAY_REMOVE(ARRAY_AGG(mo1."organizationId" ORDER BY mo1."createdAt" DESC), NULL)
              )[1] AS new_org
          FROM activities a
          LEFT JOIN "memberSegmentAffiliations" msa ON msa."memberId" = a."memberId" AND a."segmentId" = msa."segmentId" AND (
                 a.timestamp BETWEEN msa."dateStart" AND msa."dateEnd"
                 OR (a.timestamp >= msa."dateStart" AND msa."dateEnd" IS NULL)
             )
          LEFT JOIN "memberOrganizations" mo ON mo."memberId" = a."memberId" AND (
                  a.timestamp BETWEEN mo."dateStart" AND mo."dateEnd"
                  OR (a.timestamp >= mo."dateStart" AND mo."dateEnd" IS NULL)
              )
          LEFT JOIN "memberOrganizations" mo1 ON mo1."memberId" = a."memberId" AND mo1."createdAt" <= a.timestamp
          WHERE a."memberId" = :memberId
          GROUP BY a.id
      )
      UPDATE activities a1
      SET "organizationId" = nao.new_org
      FROM new_activities_organizations nao
      WHERE a1.id = nao.id
        AND ("organizationId" != nao.new_org
             OR ("organizationId" IS NULL AND nao.new_org IS NOT NULL)
             OR ("organizationId" IS NOT NULL AND nao.new_org IS NULL))
      RETURNING a1.id, a1."organizationId", nao.new_org
    `
    await seq.query(query, {
      replacements: {
        memberId,
      },
      type: QueryTypes.UPDATE,
      transaction,
    })
  }
}

export default MemberAffiliationRepository
