export interface GroupsioIntegrationData {
  email: string
  token: string
  tokenExpiry: string
  password: string
  groups: GroupDetails[]
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
}

export type GroupName = string
