import { QueryTypes } from 'sequelize'
import { IMemberOrganization } from '@crowd/types'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

class MemberOrganizationRepository {
  static async findMembersBelongToBothOrganizations(
    organizationId1: string,
    organizationId2: string,
    options: IRepositoryOptions,
  ): Promise<IMemberOrganization[]> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)

    const results = await sequelize.query(
      `
      SELECT  mo.*
      FROM "memberOrganizations" AS mo
      WHERE mo."deletedAt" is null and
         mo."memberId" IN (
          SELECT "memberId"
          FROM "memberOrganizations"
          WHERE "organizationId" = :organizationId1
      )
      AND mo."memberId" IN (
          SELECT "memberId"
          FROM "memberOrganizations"
          WHERE "organizationId" = :organizationId2);
    `,
      {
        replacements: {
          organizationId1,
          organizationId2,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return results as IMemberOrganization[]
  }

  static async removeMemberRole(role: IMemberOrganization, options: IRepositoryOptions) {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    let deleteMemberRole = `DELETE FROM "memberOrganizations" 
                                            WHERE 
                                            "organizationId" = :organizationId and 
                                            "memberId" = :memberId`

    const replacements = {
      organizationId: role.organizationId,
      memberId: role.memberId,
    } as any

    if (role.dateStart === null) {
      deleteMemberRole += ` and "dateStart" is null `
    } else {
      deleteMemberRole += ` and "dateStart" = :dateStart `
      replacements.dateStart = (role.dateStart as Date).toISOString()
    }

    if (role.dateEnd === null) {
      deleteMemberRole += ` and "dateEnd" is null `
    } else {
      deleteMemberRole += ` and "dateEnd" = :dateEnd `
      replacements.dateEnd = (role.dateEnd as Date).toISOString()
    }

    await seq.query(deleteMemberRole, {
      replacements,
      type: QueryTypes.DELETE,
      transaction,
    })
  }

  static async addMemberRole(
    role: IMemberOrganization,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)

    const query = `
          insert into "memberOrganizations" ("memberId", "organizationId", "createdAt", "updatedAt", "title", "dateStart", "dateEnd", "source")
          values (:memberId, :organizationId, NOW(), NOW(), :title, :dateStart, :dateEnd, :source)
          on conflict do nothing;
    `

    await sequelize.query(query, {
      replacements: {
        memberId: role.memberId,
        organizationId: role.organizationId,
        title: role.title || null,
        dateStart: role.dateStart,
        dateEnd: role.dateEnd,
        source: role.source || null,
      },
      type: QueryTypes.INSERT,
      transaction,
    })
  }

  static async fetchRemainingRoles(
    fromOrganizationId: string,
    toOrganizationId: string,
    options: IRepositoryOptions,
  ): Promise<IMemberOrganization[]> {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const remainingRoles = (await seq.query(
      `
        SELECT *
        FROM "memberOrganizations"
        WHERE "organizationId" = :fromOrganizationId 
        AND "deletedAt" IS NULL
        AND "memberId" NOT IN (
            SELECT "memberId" 
            FROM "memberOrganizations" 
            WHERE "organizationId" = :toOrganizationId
            AND "deletedAt" IS NULL
        );
      `,
      {
        replacements: {
          toOrganizationId,
          fromOrganizationId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )) as IMemberOrganization[]

    return remainingRoles
  }
}

export default MemberOrganizationRepository
