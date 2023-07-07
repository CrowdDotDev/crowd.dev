import { OrganizationRepository } from '@/repo/organization.repo'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { NodejsWorkerEmitter } from '@crowd/sqs'

export class OrganizationService extends LoggerBase {
  private readonly repo: OrganizationRepository

  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new OrganizationRepository(store, this.log)
  }

  public async findOrCreate(): Promise<string> {
    return ''
  }
}
