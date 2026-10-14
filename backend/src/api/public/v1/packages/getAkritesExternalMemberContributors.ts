import type { Request, Response } from 'express'

import { getPackagesQx } from '@/db/packagesDb'
import { ok } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'
import { NotFoundError } from '@crowd/common'
import {
  findAffiliatedMemberIdentities,
  findMemberContributorsPackage,
} from '@crowd/data-access-layer'

import {
  groupAffiliatedMemberIdentities,
  toAkritesExternalMemberContributors,
} from './akritesExternalMemberContributors'
import { purlQuerySchema } from './purl'

export async function getAkritesExternalMemberContributors(
  req: Request,
  res: Response,
): Promise<void> {
  const { purl } = validateOrThrow(purlQuerySchema, req.query)

  const qx = await getPackagesQx()
  const pkg = await findMemberContributorsPackage(qx, purl)

  if (!pkg) {
    throw new NotFoundError()
  }

  if (pkg.repoId === null) {
    throw new NotFoundError('Purl has no linked repository')
  }

  const rows = await findAffiliatedMemberIdentities(qx, {
    packageId: pkg.packageId,
    repoId: pkg.repoId,
  })

  ok(res, toAkritesExternalMemberContributors(pkg, groupAffiliatedMemberIdentities(rows)))
}
