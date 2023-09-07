import { DbColumnSet, DbInstance } from '@crowd/database'
import { IAttributes, IOrganizationIdentity, IOrganizationSocial } from '@crowd/types'

export interface IDbOrganization {
  id: string
  displayName?: string | null
  url: string | null
  description: string | null
  emails: string[] | null
  logo: string | null
  tags: string[] | null
  github: IOrganizationSocial | null
  twitter: IOrganizationSocial | null
  linkedin: IOrganizationSocial | null
  crunchbase: IOrganizationSocial | null
  employees: number | null
  location: string | null
  website: string | null
  type: string | null
  size: string | null
  headline: string | null
  industry: string | null
  founded: string | null
  attributes: IAttributes | null
  weakIdentities: IOrganizationIdentity[]
}

export interface IDbInsertOrganizationData {
  displayName?: string
  url: string | null
  description: string | null
  emails: string[] | null
  logo: string | null
  tags: string[] | null
  github: IOrganizationSocial | null
  twitter: IOrganizationSocial | null
  linkedin: IOrganizationSocial | null
  crunchbase: IOrganizationSocial | null
  employees: number | null
  location: string | null
  website: string | null
  type: string | null
  size: string | null
  headline: string | null
  industry: string | null
  founded: string | null
  attributes?: IAttributes | null
  weakIdentities: IOrganizationIdentity[]
}

export interface IDbInsertOrganizationCacheData {
  name: string
  displayName?: string
  url: string | null
  description: string | null
  emails: string[] | null
  logo: string | null
  tags: string[] | null
  github: IOrganizationSocial | null
  twitter: IOrganizationSocial | null
  linkedin: IOrganizationSocial | null
  crunchbase: IOrganizationSocial | null
  employees: number | null
  location: string | null
  website: string | null
  type: string | null
  size: string | null
  headline: string | null
  industry: string | null
  founded: string | null
  attributes?: IAttributes | null
}

let insertOrganizationColumnSet: DbColumnSet
export function getInsertOrganizationColumnSet(instance: DbInstance): DbColumnSet {
  if (insertOrganizationColumnSet) return insertOrganizationColumnSet

  insertOrganizationColumnSet = new instance.helpers.ColumnSet(
    [
      'id',
      'tenantId',
      'displayName',
      'description',
      'emails',
      'logo',
      'tags',
      'github',
      'twitter',
      'linkedin',
      'crunchbase',
      'employees',
      'location',
      'website',
      'type',
      'size',
      'headline',
      'industry',
      'founded',
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

export interface IDbUpdateOrganizationCacheData {
  name: string
  url: string | null
  description: string | null
  emails: string[] | null
  logo: string | null
  tags: string[] | null
  github: IOrganizationSocial | null
  twitter: IOrganizationSocial | null
  linkedin: IOrganizationSocial | null
  crunchbase: IOrganizationSocial | null
  employees: number | null
  location: string | null
  website: string | null
  type: string | null
  size: string | null
  headline: string | null
  industry: string | null
  founded: string | null
}

export interface IDbUpdateOrganizationData {
  url: string | null
  description: string | null
  emails: string[] | null
  logo: string | null
  tags: string[] | null
  github: IOrganizationSocial | null
  twitter: IOrganizationSocial | null
  linkedin: IOrganizationSocial | null
  crunchbase: IOrganizationSocial | null
  employees: number | null
  location: string | null
  website: string | null
  type: string | null
  size: string | null
  headline: string | null
  industry: string | null
  founded: string | null
  displayName: string | null
  attributes: IAttributes | null
  weakIdentities: IOrganizationIdentity[]
}

let updateOrganizationColumnSet: DbColumnSet
export function getUpdateOrganizationColumnSet(instance: DbInstance): DbColumnSet {
  if (updateOrganizationColumnSet) return updateOrganizationColumnSet

  updateOrganizationColumnSet = new instance.helpers.ColumnSet(
    [
      'displayName',
      'description',
      'emails',
      'logo',
      'tags',
      'github',
      'twitter',
      'linkedin',
      'crunchbase',
      'employees',
      'location',
      'website',
      'type',
      'size',
      'headline',
      'industry',
      'founded',
      'updatedAt',
      'attributes',
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
  name: string
}

let insertCacheOrganizationColumnSet: DbColumnSet
export function getInsertCacheOrganizationColumnSet(instance: DbInstance): DbColumnSet {
  if (insertCacheOrganizationColumnSet) return insertCacheOrganizationColumnSet

  insertCacheOrganizationColumnSet = new instance.helpers.ColumnSet(
    [
      'id',
      'name',
      'url',
      'description',
      'emails',
      'logo',
      'tags',
      'github',
      'twitter',
      'linkedin',
      'crunchbase',
      'employees',
      'location',
      'website',
      'type',
      'size',
      'headline',
      'industry',
      'founded',
      'createdAt',
      'updatedAt',
    ],
    {
      table: {
        table: 'organizationCaches',
      },
    },
  )

  return insertCacheOrganizationColumnSet
}

export type IDbUpdateCacheOrganizationData = IDbUpdateOrganizationData

let updateCacheOrganizationColumnSet: DbColumnSet
export function getUpdateCacheOrganizationColumnSet(instance: DbInstance): DbColumnSet {
  if (updateCacheOrganizationColumnSet) return updateCacheOrganizationColumnSet

  updateCacheOrganizationColumnSet = new instance.helpers.ColumnSet(
    [
      'name',
      'url',
      'description',
      'emails',
      'logo',
      'tags',
      'github',
      'twitter',
      'linkedin',
      'crunchbase',
      'employees',
      'location',
      'website',
      'type',
      'size',
      'headline',
      'industry',
      'founded',
      'updatedAt',
    ],
    {
      table: {
        table: 'organizationCaches',
      },
    },
  )

  return updateCacheOrganizationColumnSet
}
