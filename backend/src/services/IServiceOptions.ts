import { Logger } from '../utils/logging'

export interface IServiceOptions {
  log: Logger
  language: string
  currentUser: any
  currentTenant: any
  database: any
  searchEngine: any
}
