import { calculateMemberAggregatesForSegment } from '@crowd/data-access-layer/src/members/segments'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  ISegmentHierarchy,
  getSegmentHierarchy as getSegmentHierarchyFromDAL,
} from '@crowd/data-access-layer/src/segments'

import { svc } from '../../main'

export async function getSegmentHierarchy(): Promise<ISegmentHierarchy> {
  const qx = pgpQx(svc.postgres.reader.connection())
  return getSegmentHierarchyFromDAL(qx)
}

export async function calculateProjectMemberAggregates(
  projectId: string,
  subprojectIds: string[],
): Promise<number> {
  const readQx = pgpQx(svc.postgres.reader.connection())
  const writeQx = pgpQx(svc.postgres.writer.connection())

  return calculateMemberAggregatesForSegment(
    readQx,
    writeQx,
    projectId,
    subprojectIds,
    10000,
    (batchNumber, total) => {
      console.log(`Project ${projectId}: Processed batch ${batchNumber}, total: ${total} members`)
    },
  )
}

export async function calculateProjectGroupMemberAggregates(
  projectGroupId: string,
  subprojectIds: string[],
): Promise<number> {
  const readQx = pgpQx(svc.postgres.reader.connection())
  const writeQx = pgpQx(svc.postgres.writer.connection())

  return calculateMemberAggregatesForSegment(
    readQx,
    writeQx,
    projectGroupId,
    subprojectIds,
    10000,
    (batchNumber, total) => {
      console.log(
        `Project Group ${projectGroupId}: Processed batch ${batchNumber}, total: ${total} members`,
      )
    },
  )
}
