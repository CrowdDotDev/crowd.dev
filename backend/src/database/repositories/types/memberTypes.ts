import { MemberIdentityType } from '@crowd/types'

export interface IActiveMemberData {
  id: string
  displayName: string
  username: any
  attributes: any
  organizations: any[]
  activityCount: number
  activeDaysCount: number
}

export interface IActiveMemberFilter {
  platforms?: string[]
  isBot?: boolean
  isTeamMember?: boolean
  isOrganization?: boolean
  activityTimestampFrom: string
  activityTimestampTo: string
}

export type BasicMemberIdentity = { value: string; type: MemberIdentityType }

export const mapSingleUsernameToIdentity = (usernameOrIdentity: any): BasicMemberIdentity => {
  if (typeof usernameOrIdentity === 'string') {
    return {
      value: usernameOrIdentity,
      type: MemberIdentityType.USERNAME,
    }
  }

  if (typeof usernameOrIdentity === 'object') {
    return usernameOrIdentity
  }

  throw new Error(`Unknown username type: ${typeof usernameOrIdentity}: ${usernameOrIdentity}`)
}

export type UsernameIdentities = { [key: string]: BasicMemberIdentity[] }

export const mapUsernameToIdentities = (username: any, platform?: string): UsernameIdentities => {
  const mapped = {}

  if (typeof username === 'string') {
    if (!platform) {
      throw new Error('Platform is required when username is a string')
    }

    mapped[platform] = [mapSingleUsernameToIdentity(username)]
  } else {
    for (const platform of Object.keys(username)) {
      const data = username[platform]

      if (Array.isArray(data)) {
        const identities: BasicMemberIdentity[] = []
        for (const entry of data) {
          identities.push(mapSingleUsernameToIdentity(entry))
        }
        mapped[platform] = identities
      } else {
        mapped[platform] = [mapSingleUsernameToIdentity(data)]
      }
    }
  }

  return mapped
}
export interface IMemberMergeSuggestion {
  similarity: number
  members: [string, string]
}

export enum IMemberMergeSuggestionsType {
  USERNAME = 'username',
  EMAIL = 'email',
  SIMILARITY = 'similarity',
}
