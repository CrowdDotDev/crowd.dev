import { IDbMember, IDbMemberUpdateData } from '@/repo/member.data'
import MemberRepository from '@/repo/member.repo'
import { areArraysEqual, isObjectEmpty } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { IMemberIdentity } from '@crowd/types'
import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import { IMemberCreateData, IMemberUpdateData } from './member.data'
import MemberAttributeService from './memberAttribute.service'
import { NodejsWorkerEmitter } from '@crowd/sqs'

export default class MemberService extends LoggerBase {
  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  public async create(
    tenantId: string,
    segmentId: string,
    integrationId: string,
    data: IMemberCreateData,
  ): Promise<string> {
    try {
      this.log.debug('Creating a new member!')

      if (data.identities.length === 0) {
        throw new Error('Member must have at least one identity!')
      }

      return await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)
        const txMemberAttributeService = new MemberAttributeService(txStore, this.log)

        let attributes: Record<string, unknown> = {}
        if (data.attributes) {
          attributes = await txMemberAttributeService.validateAttributes(tenantId, data.attributes)

          attributes = await txMemberAttributeService.setAttributesDefaultValues(
            tenantId,
            attributes,
          )
        }

        // check if any weak identities are actually strong
        await this.checkForStrongWeakIdentities(txRepo, tenantId, data)

        const id = await txRepo.create(tenantId, {
          displayName: data.displayName,
          emails: data.emails,
          joinedAt: data.joinedAt.toISOString(),
          attributes,
          weakIdentities: data.weakIdentities || [],
          identities: data.identities,
        })

        await txRepo.addToSegment(id, tenantId, segmentId)

        await txRepo.insertIdentities(id, tenantId, integrationId, data.identities)

        await this.nodejsWorkerEmitter.processAutomationForNewMember(tenantId, id)

        return id
      })
    } catch (err) {
      this.log.error(err, 'Error while creating a new member!')
      throw err
    }
  }

  public async update(
    id: string,
    tenantId: string,
    segmentId: string,
    integrationId: string,
    data: IMemberUpdateData,
    original: IDbMember,
  ): Promise<void> {
    try {
      await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)
        const txMemberAttributeService = new MemberAttributeService(txStore, this.log)
        const dbIdentities = await txRepo.getIdentities(id, tenantId)

        if (data.attributes) {
          data.attributes = await txMemberAttributeService.validateAttributes(
            tenantId,
            data.attributes,
          )
        }

        // check if any weak identities are actually strong
        await this.checkForStrongWeakIdentities(txRepo, tenantId, data, id)

        const toUpdate = MemberService.mergeData(original, dbIdentities, data)

        if (toUpdate.attributes) {
          toUpdate.attributes = await txMemberAttributeService.setAttributesDefaultValues(
            tenantId,
            toUpdate.attributes,
          )
        }

        if (!isObjectEmpty(toUpdate)) {
          this.log.debug({ memberId: id }, 'Updating a member!')
          await txRepo.update(id, tenantId, {
            emails: toUpdate.emails || original.emails,
            joinedAt: toUpdate.joinedAt || original.joinedAt,
            attributes: toUpdate.attributes || original.attributes,
            weakIdentities: toUpdate.weakIdentities || original.weakIdentities,
            // leave this one empty if nothing changed - we are only adding up new identities not removing them
            identities: toUpdate.identities,
          })

          await txRepo.addToSegment(id, tenantId, segmentId)
        } else {
          this.log.debug({ memberId: id }, 'Nothing to update in a member!')
        }

        if (toUpdate.identities) {
          await txRepo.insertIdentities(id, tenantId, integrationId, toUpdate.identities)
        }
      })
    } catch (err) {
      this.log.error(err, { memberId: id }, 'Error while updating a member!')
      throw err
    }
  }

  private async checkForStrongWeakIdentities(
    repo: MemberRepository,
    tenantId: string,
    data: IMemberCreateData | IMemberUpdateData,
    memberId?: string,
  ): Promise<void> {
    if (data.weakIdentities && data.weakIdentities.length > 0) {
      const results = await repo.findIdentities(tenantId, data.weakIdentities, memberId)

      const strongIdentities = []

      for (const weakIdentity of data.weakIdentities) {
        if (!results.has(`${weakIdentity.platform}:${weakIdentity.username}`)) {
          strongIdentities.push(weakIdentity)
        }
      }

      if (strongIdentities.length > 0) {
        data.weakIdentities = data.weakIdentities.filter(
          (i) =>
            strongIdentities.find((s) => s.platform === i.platform && s.username === i.username) ===
            undefined,
        )

        for (const identity of strongIdentities) {
          if (
            data.identities.find(
              (i) => i.platform === identity.platform && i.username === identity.username,
            ) === undefined
          ) {
            data.identities.push(identity)
          }
        }
      }
    }
  }

  private static mergeData(
    dbMember: IDbMember,
    dbIdentities: IMemberIdentity[],
    member: IMemberUpdateData,
  ): IDbMemberUpdateData {
    let joinedAt: string | undefined
    if (member.joinedAt) {
      const newDate = member.joinedAt
      const oldDate = new Date(dbMember.joinedAt)

      if (newDate.getTime() !== oldDate.getTime()) {
        // pick the oldest
        joinedAt = newDate < oldDate ? newDate.toISOString() : oldDate.toISOString()
      }
    }

    let emails: string[] | undefined
    if (member.emails) {
      if (!areArraysEqual(member.emails, dbMember.emails)) {
        emails = [...new Set([...member.emails, ...dbMember.emails])]
      }
    }

    let weakIdentities: IMemberIdentity[] | undefined
    if (member.weakIdentities && member.weakIdentities.length > 0) {
      const newWeakIdentities: IMemberIdentity[] = []
      for (const identity of member.weakIdentities) {
        if (
          !dbMember.weakIdentities.find(
            (t) => t.platform === identity.platform && t.username === identity.username,
          )
        ) {
          newWeakIdentities.push(identity)
        }
      }

      if (newWeakIdentities.length > 0) {
        weakIdentities = newWeakIdentities
      }
    }

    let identities: IMemberIdentity[] | undefined
    if (member.identities && member.identities.length > 0) {
      const newIdentities: IMemberIdentity[] = []
      for (const identity of member.identities) {
        if (
          !dbIdentities.find(
            (t) => t.platform === identity.platform && t.username === identity.username,
          )
        ) {
          newIdentities.push(identity)
        }
      }

      if (newIdentities.length > 0) {
        identities = newIdentities
      }
    }

    let attributes: Record<string, unknown> | undefined
    if (member.attributes) {
      const temp = mergeWith({}, dbMember.attributes, member.attributes)
      if (!isEqual(temp, dbMember.attributes)) {
        attributes = temp
      }
    }

    return {
      emails,
      joinedAt,
      attributes,
      weakIdentities,
      identities,
    }
  }
}
