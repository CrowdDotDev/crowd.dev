export interface IOrganization {
  name: string
  url?: string
  description?: string
  emails?: string[]
  logo?: string
  tags?: string[]
  github?: IOrganizationSocial | string
  twitter?: IOrganizationSocial | string
  linkedin?: IOrganizationSocial | string
  crunchbase?: IOrganizationSocial | string
  employees?: number
  location?: string
  website?: string
  type?: string
  size?: string
  headline?: string
  industry?: string
  founded?: string
}

export interface IOrganizationSocial {
  handle: string
  url?: string
}
