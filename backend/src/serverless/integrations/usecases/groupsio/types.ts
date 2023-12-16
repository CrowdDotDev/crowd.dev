export interface GroupsioIntegrationData {
  email: string
  token: string
  tokenExpiry: string
  password: string
  groupNames: GroupName[]
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

export type GroupName = string
