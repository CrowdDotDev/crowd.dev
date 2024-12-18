/* eslint-disable no-continue */
import { uniq } from 'lodash'

import { groupBy } from '@crowd/common'
import { findMaintainerRoles } from '@crowd/data-access-layer/src/maintainers'
import { fetchManySegments } from '@crowd/data-access-layer/src/segments'
import { LoggerBase } from '@crowd/logging'
import { IMemberAffiliation } from '@crowd/types'

import MemberAffiliationsRepository from '@/database/repositories/member/memberAffiliationsRepository'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from '../IServiceOptions'

export default class MemberAffiliationsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  // Member affiliations list
  async list(memberId: string): Promise<IMemberAffiliation[]> {
    const affiliations: IMemberAffiliation[] = await MemberAffiliationsRepository.list(
      memberId,
      this.options,
    )

    await (async function addMaintainerRoles(options: IServiceOptions, rows: IMemberAffiliation[]) {
      const qx = SequelizeRepository.getQueryExecutor(options)
      const maintainerRoles = await findMaintainerRoles(qx, [memberId])
      const segmentIds = uniq(maintainerRoles.map((m) => m.segmentId))
      const segmentsInfo = await fetchManySegments(qx, segmentIds)

      const groupedMaintainers = groupBy(maintainerRoles, (m) => m.segmentId)
      rows.forEach((row: any) => {
        row.maintainerRoles = (groupedMaintainers.get(row.segmentId) || []).map((role) => {
          const segmentInfo = segmentsInfo.find((s) => s.id === role.segmentId)
          return {
            ...role,
            segmentName: segmentInfo?.name,
          }
        })
      })
    })(this.options, affiliations)

    return affiliations
  }

  // Member multiple identity creation
  async upsertMultiple(
    tenantId: string,
    memberId: string,
    data: Partial<IMemberAffiliation>[],
  ): Promise<IMemberAffiliation[]> {
    return MemberAffiliationsRepository.upsertMultiple(tenantId, memberId, data, this.options)
  }
}
