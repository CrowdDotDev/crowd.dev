export interface ILinkedInOrganization {
  name: string
  id: number
  role: string
  organizationUrn: string
  inUse?: boolean
}

export interface ILinkedInOrganizationPost {
  id: string
  visibility: string
  lifecycleState: string
  author: string
  title?: string
  body?: string
  originalId?: string
}

export interface ILinkedInPostReaction {
  memberId: string
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
  memberId: string
  comment: string
  timestamp: number
  id: string
  childComments: number
}

export interface IPaginatedResponse<T> {
  elements: T[]
  start?: number
}
