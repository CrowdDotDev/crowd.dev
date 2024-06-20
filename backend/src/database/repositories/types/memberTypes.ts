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
  isDeleted?: boolean
  activityIsContribution?: boolean
  activityTimestampFrom: string
  activityTimestampTo: string
}

export interface IMemberIdentity {
  platform: string
  username: string
  integrationId?: string
  sourceId?: string
  createdAt?: string
}

export const mapSingleUsernameToIdentity = (usernameOrIdentity: any): any => {
  if (typeof usernameOrIdentity === 'string') {
    return {
      username: usernameOrIdentity,
    }
  }

  if (typeof usernameOrIdentity === 'object') {
    return usernameOrIdentity
  }

  throw new Error(`Unknown username type: ${typeof usernameOrIdentity}: ${usernameOrIdentity}`)
}

export const mapUsernameToIdentities = (username: any, platform?: string): any => {
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
        const identities = []
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
