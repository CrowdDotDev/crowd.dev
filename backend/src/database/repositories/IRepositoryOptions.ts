import { Logger } from '@crowd/logging'

export interface IRepositoryOptions {
  log: Logger
  language: string
  currentUser: any
  currentTenant: any
  database: any
  searchEngine: any
  transaction?: any
  bypassPermissionValidation?: any
}
