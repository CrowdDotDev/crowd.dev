import { calculateOrganizationAggregatesForSegment } from '@crowd/data-access-layer/src/organizations/segments'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { svc } from '../../main'

export async function calculateProjectOrganizationAggregates(
  projectId: string,
  subprojectIds: string[],
): Promise<number> {
  const readQx = pgpQx(svc.postgres.reader.connection())
  const writeQx = pgpQx(svc.postgres.writer.connection())

  return calculateOrganizationAggregatesForSegment(
    readQx,
    writeQx,
    projectId,
    subprojectIds,
    10000,
    (batchNumber, total) => {
      console.log(
        `Project ${projectId}: Processed batch ${batchNumber}, total: ${total} organizations`,
      )
    },
  )
}

export async function calculateProjectGroupOrganizationAggregates(
  projectGroupId: string,
  subprojectIds: string[],
): Promise<number> {
  const readQx = pgpQx(svc.postgres.reader.connection())
  const writeQx = pgpQx(svc.postgres.writer.connection())

  return calculateOrganizationAggregatesForSegment(
    readQx,
    writeQx,
    projectGroupId,
    subprojectIds,
    10000,
    (batchNumber, total) => {
      console.log(
        `Project Group ${projectGroupId}: Processed batch ${batchNumber}, total: ${total} organizations`,
      )
    },
  )
}
