import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbMember, IDbMemberCreateData, IDbMemberUpdateData } from './member.data'

export default class MemberRepository extends RepositoryBase<MemberRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findMember(
    tenantId: string,
    platform: string,
    username: string,
  ): Promise<IDbMember | null> {
    return null
  }

  public async findById(id: string): Promise<IDbMember | null> {
    throw new Error('Method not implemented.')
  }

  public async create(data: IDbMemberCreateData): Promise<string> {
    throw new Error('Method not implemented.')
  }

  public async update(id: string, data: IDbMemberUpdateData): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
