export interface ILinkedInOrganization {
  name: string
  id: number
  organizationUrn: string
  vanityName: string
  profilePictureUrl?: string
  inUse?: boolean
}

export interface ILinkedInOrganizationPost {
  urnId: string
  visibility: string
  lifecycleState: string
  authorUrn: string
  body?: string
  originalUrnId?: string
  timestamp: number
}

export enum LinkedInAuthorType {
  ORGANIZATION = 'organization',
  USER = 'user',
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
  profilePictureUrl?: string
}

export interface ILinkedInPostComment {
  authorUrn: string
  comment: string
  imageUrl?: string
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
