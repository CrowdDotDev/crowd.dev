import { QueryTypes } from 'sequelize'

import { IMemberOrganization, IMemberRoleWithOrganization } from '@crowd/types'

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
  ): Promise<string> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)

    const query = `
          insert into "memberOrganizations" ("memberId", "organizationId", "createdAt", "updatedAt", "title", "dateStart", "dateEnd", "source")
          values (:memberId, :organizationId, NOW(), NOW(), :title, :dateStart, :dateEnd, :source)
          on conflict do nothing returning "id";
    `

    const result = await sequelize.query(query, {
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

    return result[0][0]?.id
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

  static async findMemberRoles(
    memberId: string,
    options: IRepositoryOptions,
  ): Promise<IMemberRoleWithOrganization[]> {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const memberRoles = (await seq.query(
      `
        SELECT mo.*, o."displayName" as "organizationName", o.logo as "organizationLogo"
        FROM "memberOrganizations" mo
        join "organizations" o on mo."organizationId" = o.id
        WHERE mo."memberId" = :memberId
        AND mo."deletedAt" IS NULL;
      `,
      {
        replacements: {
          memberId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )) as IMemberRoleWithOrganization[]

    return memberRoles
  }

  static async findRolesInOrganization(
    organizationId: string,
    options: IRepositoryOptions,
  ): Promise<IMemberOrganization[]> {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const rolesInOrganization = (await seq.query(
      `
        SELECT *
        FROM "memberOrganizations"
        WHERE "organizationId" = :organizationId
        AND "deletedAt" IS NULL;
      `,
      {
        replacements: {
          organizationId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )) as IMemberOrganization[]

    return rolesInOrganization
  }
}

export default MemberOrganizationRepository
