export const SCOPES = {
  READ_MEMBERS: 'read:members',
  READ_IDENTITIES: 'read:identities',
  WRITE_IDENTITIES: 'write:identities',
  READ_ROLES: 'read:roles',
  READ_WORK_EXPERIENCES: 'read:work-experiences',
  WRITE_WORK_EXPERIENCES: 'write:work-experiences',
  READ_PROJECTS_AFFILIATIONS: 'read:projects-affiliations',
  WRITE_PROJECTS_AFFILIATIONS: 'write:projects-affiliations',
} as const

export type Scope = (typeof SCOPES)[keyof typeof SCOPES]
