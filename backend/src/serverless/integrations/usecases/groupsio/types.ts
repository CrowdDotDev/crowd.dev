export interface GroupsioIntegrationData {
  email: string
  token: string
  tokenExpiry: string
  password: string
  groups: GroupDetails[]
  autoImports?: {
    mainGroup: string
    isAllowed: boolean
  }[]
}

export interface GroupsioGetToken {
  email: string
  password: string
  twoFactorCode?: string
}

export interface GroupsioVerifyGroup {
  groupName: GroupName
  cookie: string
}

export interface GroupDetails {
  id: number
  slug: string
  name: string
  groupAddedOn?: Date
}

export type GroupName = string
