export type IMemberEnrichmentClearbitAPIResponse =
  | IMemberEnrichmentDataClearbit
  | IMemberEnrichmentClearbitAPIErrorResponse

export interface IMemberEnrichmentClearbitAPIErrorResponse {
  error: {
    type: string
    message: string
  }
}

export interface IMemberEnrichmentDataClearbit {
  id: string
  name: IMemberNameClearbit
  email: string
  location: string
  timezone: string
  utcOffset: number
  geo: IMemberGeoClearbit
  bio: string
  site: string
  avatar: string
  employment: IMemberEmploymentClearbit
  facebook: IMemberFacebookClearbit
  github: IMemberGithubClearbit
  twitter: IMemberTwitterClearbit
  linkedin: IMemberLinkedinClearbit
  googleplus: IMemberGoogleplusClearbit
  gravatar: IMemberGravatarClearbit
  fuzzy: boolean
  emailProvider: boolean
  indexedAt: string
  phone: string
  inactiveAt: string
}

export interface IMemberNameClearbit {
  fullName: string
  givenName: string
  familyName: string
}

export interface IMemberGeoClearbit {
  city: string
  state: string
  stateCode: string
  country: string
  countryCode: string
  lat: number
  lng: number
}

export interface IMemberEmploymentClearbit {
  domain: string
  name: string
  title: string
  role: string
  subRole: string
  seniority: string
}

export interface IMemberFacebookClearbit {
  handle: string
}

export interface IMemberGithubClearbit {
  handle: string
  id: number
  avatar: string
  company: string
  blog: string
  followers: number
  following: number
}

export interface IMemberTwitterClearbit {
  handle: string
  id: number
  bio: string
  followers: number
  following: number
  statuses: number
  favorites: number
  location: string
  site: string
  avatar: string
}

export interface IMemberLinkedinClearbit {
  handle: string
}

export interface IMemberGoogleplusClearbit {
  handle: string
}

export interface IMemberGravatarClearbit {
  handle: string
  urls: string[]
  avatar: string
  avatars: string[]
}
