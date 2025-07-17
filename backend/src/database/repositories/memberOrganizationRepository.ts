import { QueryTypes } from 'sequelize'

import { IMemberOrganization, IMemberRoleWithOrganization } from '@crowd/types'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

class MemberOrganizationRepository {
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
