import { DbColumnSet, DbInstance } from '@crowd/database'

export interface IDbOrganization {
  id: string
  name: string
  description: string | null
  location: string | null
  logo: string | null
  url: string | null
  github: string | null
  twitter: string | null
  website: string | null
}

export interface IDbInsertOrganizationData {
  name: string
  displayName: string
  description: string | null
  location: string | null
  logo: string | null
  url: string | null
  github: string | null
  twitter: string | null
  website: string | null
}

let insertOrganizationColumnSet: DbColumnSet
export function getInsertOrganizationColumnSet(instance: DbInstance): DbColumnSet {
  if (insertOrganizationColumnSet) return insertOrganizationColumnSet

  insertOrganizationColumnSet = new instance.helpers.ColumnSet(
    [
      'id',
      'tenantId',
      'name',
      'displayName',
      'description',
      'location',
      'logo',
      'url',
      'github',
      'twitter',
      'website',
      'createdAt',
      'updatedAt',
    ],
    {
      table: {
        table: 'organizations',
      },
    },
  )

  return insertOrganizationColumnSet
}

export interface IDbUpdateOrganizationData {
  name: string
  displayName: string
  description: string | null
  location: string | null
  logo: string | null
  url: string | null
  github: string | null
  twitter: string | null
  website: string | null
}

let updateOrganizationColumnSet: DbColumnSet
export function getUpdateOrganizationColumnSet(instance: DbInstance): DbColumnSet {
  if (updateOrganizationColumnSet) return updateOrganizationColumnSet

  updateOrganizationColumnSet = new instance.helpers.ColumnSet(
    [
      'name',
      'displayName',
      'description',
      'location',
      'logo',
      'url',
      'github',
      'twitter',
      'website',
      'updatedAt',
    ],
    {
      table: {
        table: 'organizations',
      },
    },
  )

  return updateOrganizationColumnSet
}

export interface IDbCacheOrganization extends IDbOrganization {
  enriched: boolean
}

let insertCacheOrganizationColumnSet: DbColumnSet
export function getInsertCacheOrganizationColumnSet(instance: DbInstance): DbColumnSet {
  if (insertCacheOrganizationColumnSet) return insertCacheOrganizationColumnSet

  insertCacheOrganizationColumnSet = new instance.helpers.ColumnSet(
    [
      'id',
      'name',
      'description',
      'location',
      'logo',
      'url',
      'github',
      'twitter',
      'website',
      'createdAt',
      'updatedAt',
    ],
    {
      table: {
        table: 'organizationCaches',
      },
    },
  )
}

export type IDbUpdateCacheOrganizationData = IDbUpdateOrganizationData

let updateCacheOrganizationColumnSet: DbColumnSet
export function getUpdateCacheOrganizationColumnSet(instance: DbInstance): DbColumnSet {
  if (updateCacheOrganizationColumnSet) return updateCacheOrganizationColumnSet

  updateCacheOrganizationColumnSet = new instance.helpers.ColumnSet(
    ['name', 'description', 'location', 'logo', 'url', 'github', 'twitter', 'website', 'updatedAt'],
    {
      table: {
        table: 'organizationCaches',
      },
    },
  )

  return updateCacheOrganizationColumnSet
}
