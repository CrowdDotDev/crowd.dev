import { IDbMember, IDbMemberUpdateData } from '@/repo/member.data'
import MemberRepository from '@/repo/member.repo'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { IMemberData } from '@crowd/types'
import { IMemberCreateData, IMemberUpdateData } from './member.data'

export default class MemberService extends LoggerBase {
  constructor(private readonly store: DbStore, parentLog: Logger) {
    super(parentLog)
  }

  public async create(data: IMemberCreateData): Promise<string> {
    try {
      this.log.debug('Creating a new member!')
      return await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)

        const id = await txRepo.create(data)
      })
    } catch (err) {
      this.log.error(err, 'Error while creating a new member!')
      throw err
    }
  }

  public async update(id: string, data: IMemberUpdateData, original?: IDbMember): Promise<void> {
    try {
      this.log.debug({ memberId: id }, 'Updating a member.')
      let dbData = original
      if (!dbData) {
        dbData = await this.repo.findById(id)
      }

      if (!dbData) {
        this.log.error({ id }, 'Member not found!')
        throw new Error(`Member not found: ${id}!`)
      }

      const toUpdate = MemberService.mergeData(dbData, data)

      await this.repo.update(id, toUpdate)
    } catch (err) {
      this.log.error(err, { memberId: id }, 'Error while updating a member!')
      throw err
    }
  }

  private static mergeData(dbMember: IDbMember, member: IMemberData): IDbMemberUpdateData {
    let joinedAt: Date
    if (!member.joinedAt) {
      joinedAt = new Date(dbMember.joinedAt)
    } else {
    }
    return undefined
  }
}
