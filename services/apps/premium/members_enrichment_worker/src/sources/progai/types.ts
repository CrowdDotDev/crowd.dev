export interface IEnrichmentAPIContributionProgAI {
  project_name: string
  github_url: string
  first_commit_date: string
  last_commit_date: string
  num_of_commits: number
  id: number
  summary: string
  topics: string[]
}

export interface IEnrichmentAPISkillsProgAI {
  skill: string
  weight: number
}

export interface IEnrichmentAPIWorkExperienceProgAI {
  company: string
  companyLinkedInUrl: string
  companyUrl: string
  countryId: number
  current: number
  endDate: string
  location: string
  locationId: number
  maxEmployeeSize: string
  minEmployeeSize: string
  sequenceNo: number
  startDate: string
  summary: string
  title: string
}

export interface IEnrichmentAPIEducationProgAI {
  campus: string
  campusUuid: string
  current: number
  endDate: string
  major: string
  sequenceNo: number
  specialization: string
  startDate: string
}

export interface IEnrichmentAPICertificationProgAI {
  description: string
  title: string
}

export interface IMemberEnrichmentDataProgAI {
  id: number
  profile_pic_url?: string
  full_name?: string
  first_name?: string
  last_name?: string
  github_handle: string
  twitter_handle?: string
  github_url?: string
  linkedin_url?: string
  title?: string
  summary?: string
  seniority_level?: string
  emails?: string[]
  primary_mail?: string
  location?: string
  country?: string
  country_id?: number
  company?: string
  skills?: IEnrichmentAPISkillsProgAI[]
  programming_languages?: string[]
  languages?: string[]
  years_of_experience?: number
  bio?: string
  oss_contributions?: IEnrichmentAPIContributionProgAI[]
  work_experiences?: IEnrichmentAPIWorkExperienceProgAI[]
  educations?: IEnrichmentAPIEducationProgAI[]
  awards?: string[]
  certifications?: IEnrichmentAPICertificationProgAI[]
  expertise?: string[]
}

export interface IMemberEnrichmentDataProgAIResponse {
  profile: IMemberEnrichmentDataProgAI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any
}
