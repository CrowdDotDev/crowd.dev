export interface ILinkedInOrganization {
  name: string
  id: number
  organizationUrn: string
  vanityName: string
  inUse?: boolean
}

export interface ILinkedInOrganizationPost {
  urnId: string
  visibility: string
  lifecycleState: string
  authorUrn: string
  body?: string
  originalUrnId?: string
}

export interface ILinkedInPostReaction {
  authorUrn: string
  reaction: string
  timestamp: number
}

export interface ILinkedInMember {
  id: string
  firstName: string
  lastName: string
  vanityName: string
  country: string
}

export interface ILinkedInPostComment {
  authorUrn: string
  comment: string
  timestamp: number
  urnId: string
  parentUrnId?: string
  childComments: number
  objectUrn: string
}

export interface IPaginatedResponse<T> {
  elements: T[]
  start?: number
}
