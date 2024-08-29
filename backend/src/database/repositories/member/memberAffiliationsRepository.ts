import { fetchMemberAffiliations, fetchSegmentsByIds } from '@crowd/data-access-layer/src/members'
import { IMemberAffiliation, IOrganization } from '@crowd/types'
import { findOrganizationsByIds } from '@crowd/data-access-layer/src/organizations'
import {
  deleteMemberAffiliations,
  insertMemberAffiliations,
} from '@crowd/data-access-layer/src/member_segment_affiliations'
import { ISegment } from '@crowd/data-access-layer/src/old/apps/cache_worker/types'
import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'

class MemberAffiliationsRepository {
  static async list(memberId: string, options: IRepositoryOptions) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = { ...options, transaction }
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      // Fetch member affiliations
      const affiliations = await fetchMemberAffiliations(qx, memberId)
      const orgIds = affiliations.map((a) => a.organizationId)
      const segmentIds = affiliations.map((a) => a.segmentId)

      // Fetch organizations
      const organizations = await findOrganizationsByIds(qx, orgIds, 'id, "displayName", "logo"')
      const orgObject: Record<string, IOrganization> = organizations.reduce((acc, org) => {
        acc[org.id] = org
        return acc
      }, {})

      // Fetch organizations
      const segments = await fetchSegmentsByIds(qx, segmentIds, 'id, "slug", "name", "parentName"')
      const segmentsObject: Record<string, ISegment> = segments.reduce((acc, seg) => {
        acc[seg.id] = seg
        return acc
      }, {})

      // Map affiliations
      const list = affiliations.map((affiliation) => {
        const org = orgObject[affiliation.organizationId]
        const segment = segmentsObject[affiliation.segmentId]

        return {
          ...affiliation,
          segmentSlug: segment?.slug,
          segmentName: segment?.name,
          segmentParentName: segment?.parentName,
          organizationName: org?.displayName,
          organizationLogo: org?.logo,
        }
      })

      await SequelizeRepository.commitTransaction(transaction)

      return list
    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }

  static async upsertMultiple(
    tenantId: string,
    memberId: string,
    data: Partial<IMemberAffiliation>[],
    options: IRepositoryOptions,
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = { ...options, transaction }
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      // Delete all member affiliations
      await deleteMemberAffiliations(qx, memberId)

      //  Insert multiple member affiliations
      await insertMemberAffiliations(qx, memberId, data)

      // List all member identities
      const list = await fetchMemberAffiliations(qx, memberId)

      await SequelizeRepository.commitTransaction(transaction)

      return list
    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }
}

export default MemberAffiliationsRepository
