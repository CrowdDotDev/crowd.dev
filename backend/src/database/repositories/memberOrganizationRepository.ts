import { QueryTypes } from 'sequelize'
import { IMemberOrganization } from '@crowd/types'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export enum EntityField {
  memberId = 'memberId',
  organizationId = 'organizationId',
}

class MemberOrganizationRepository {
  static async findRolesBelongingToBothEntities(
    primaryId: string,
    secondaryId: string,
    entityIdField: EntityField,
    intersectBasedOnField: EntityField,
    options: IRepositoryOptions,
  ): Promise<IMemberOrganization[]> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)

    const results = await sequelize.query(
      `
      SELECT  mo.*
      FROM "memberOrganizations" AS mo
      WHERE mo."deletedAt" is null and
         mo."${intersectBasedOnField}" IN (
          SELECT "${intersectBasedOnField}"
          FROM "memberOrganizations"
          WHERE "${entityIdField}" = :primaryId
      )
      AND mo."${intersectBasedOnField}" IN (
          SELECT "${intersectBasedOnField}"
          FROM "memberOrganizations"
          WHERE "${entityIdField}" = :secondaryId)
      AND mo."${entityIdField}" IN (:primaryId, :secondaryId);

    `,
      {
        replacements: {
          primaryId,
          secondaryId,
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

  static async findNonIntersectingRoles(
    primaryId: string,
    secondaryId: string,
    entityIdField: EntityField,
    intersectBasedOnField: EntityField,
    options: IRepositoryOptions,
  ): Promise<IMemberOrganization[]> {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const remainingRoles = (await seq.query(
      `
        SELECT *
        FROM "memberOrganizations"
        WHERE "${entityIdField}" = :secondaryId
        AND "deletedAt" IS NULL
        AND "${intersectBasedOnField}" NOT IN (
            SELECT "${intersectBasedOnField}"
            FROM "memberOrganizations"
            WHERE "${entityIdField}" = :primaryId
            AND "deletedAt" IS NULL
        );
      `,
      {
        replacements: {
          primaryId,
          secondaryId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )) as IMemberOrganization[]

    return remainingRoles
  }
}

export default MemberOrganizationRepository
