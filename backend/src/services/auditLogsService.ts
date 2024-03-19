import { LoggerBase } from '@crowd/logging'
import { queryAuditLogs } from '@crowd/data-access-layer/src/audit_logs/repo'
import { IServiceOptions } from './IServiceOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

export default class AuditLogsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  public async query(query: any) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    return queryAuditLogs(qx, query)
  }
}
