import { QueryExecutor } from '../queryExecutor'

export enum MaintainerRepoType {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  GIT = 'git',
  GERRIT = 'gerrit',
}

export interface Maintainer {
  id: string
  memberId: string
  segmentId: string
  dateStart: string
  dateEnd?: string
  url: string
  repoType: MaintainerRepoType
  role: string
}

export async function findMaintainerRoles(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<Maintainer[]> {
  return qx.select(
    `
      SELECT * FROM mv_maintainer_roles
      WHERE "memberId" IN ($(memberIds:csv))
    `,
    {
      memberIds,
    },
  )
}
