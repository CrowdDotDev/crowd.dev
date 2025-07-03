import pick from 'lodash.pick'

import { captureApiChange, memberMergeAction } from '@crowd/audit-logs'
import { DEFAULT_TENANT_ID, Error409 } from '@crowd/common'
import {
  MEMBER_MERGE_FIELDS,
  MemberField,
  QueryExecutor,
  fetchManyMemberOrgsForMerge,
  findMemberById,
  findMemberTags,
} from '@crowd/data-access-layer'
import { findIdentitiesForMembers } from '@crowd/data-access-layer/src/member_identities'
import { findMemberAffiliations } from '@crowd/data-access-layer/src/member_segment_affiliations'
import { findMergeAction } from '@crowd/data-access-layer/src/mergeActions/repo'
import { Logger, LoggerBase } from '@crowd/logging'
import { Client as TemporalClient } from '@crowd/temporal'
import { MergeActionState, MergeActionStep, MergeActionType } from '@crowd/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

export class MemberMergeService extends LoggerBase {
  public constructor(
    private readonly qx: QueryExecutor,
    private readonly temporal: TemporalClient,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  public async merge(
    originalId: string,
    toMergeId: string,
    options?: any,
  ): Promise<{ status: number; mergedId: string }> {
    this.log.info({ originalId, toMergeId }, 'Merging members!')

    if (originalId === toMergeId) {
      return {
        status: 203,
        mergedId: originalId,
      }
    }

    const mergeAction = await findMergeAction(this.qx, originalId, toMergeId)

    // prevent multiple merge operations
    if (mergeAction && mergeAction?.state === MergeActionState.IN_PROGRESS) {
      throw new Error409(undefined, 'merge.errors.multiple', mergeAction?.state)
    }

    try {
      const { original, toMerge } = await captureApiChange(
        options,
        memberMergeAction(originalId, async (captureOldState, captureNewState) => {
          const original = await this.getMemberById(originalId)
          const toMerge = await this.getMemberById(toMergeId)

          captureOldState({
            primary: original,
            secondary: toMerge,
          })

          const allIdentities = await findIdentitiesForMembers(this.qx, [originalId, toMergeId])

          const originalIdentities = allIdentities.get(originalId)
          const toMergeIdentities = allIdentities.get(toMergeId)

          const memberOrganizationMap = await fetchManyMemberOrgsForMerge(this.qx, [
            originalId,
            toMergeId,
          ])

          const backup = {
            primary: {
              ...pick(original, MEMBER_MERGE_FIELDS),
              identities: originalIdentities,
              memberOrganizations: memberOrganizationMap.get(originalId),
            },
            secondary: {
              ...pick(toMerge, MEMBER_MERGE_FIELDS),
              identities: toMergeIdentities,
              memberOrganizations: memberOrganizationMap.get(toMergeId),
            },
          }

          await MergeActionsRepository.add(
            MergeActionType.MEMBER,
            originalId,
            toMergeId,
            this.options,
            MergeActionStep.MERGE_STARTED,
            MergeActionState.IN_PROGRESS,
            backup,
          )

          const repoOptions: IRepositoryOptions =
            await SequelizeRepository.createTransactionalRepositoryOptions(this.options)
          tx = repoOptions.transaction

          const identitiesToUpdate = []
          const identitiesToMove = []
          for (const identity of toMergeIdentities) {
            const existing = originalIdentities.find(
              (i) =>
                i.platform === identity.platform &&
                i.type === identity.type &&
                i.value === identity.value,
            )

            if (existing) {
              // if it's not verified but it should be
              if (!existing.verified && identity.verified) {
                identitiesToUpdate.push(identity)
              }
            } else {
              identitiesToMove.push(identity)
            }
          }

          await MemberRepository.moveIdentitiesBetweenMembers(
            toMergeId,
            originalId,
            identitiesToMove,
            identitiesToUpdate,
            repoOptions,
          )

          // Update member segment affiliations and organization affiliation overrides
          await MemberRepository.moveAffiliationsBetweenMembers(toMergeId, originalId, repoOptions)

          // Performs a merge and returns the fields that were changed so we can update
          const toUpdate: any = await MemberService.membersMerge(original, toMerge)

          // Update original member
          const txService = new MemberService(repoOptions as IServiceOptions)

          captureNewState({ primary: toUpdate })

          await txService.update(originalId, toUpdate, {
            syncToOpensearch: false,
          })

          // update members that belong to source organization to destination org
          const memberOrganizationService = new MemberOrganizationService(repoOptions)
          await memberOrganizationService.moveOrgsBetweenMembers(originalId, toMergeId)

          // Remove toMerge from original member
          await MemberRepository.removeToMerge(originalId, toMergeId, repoOptions)

          const secondMemberSegments = await MemberRepository.getMemberSegments(
            toMergeId,
            repoOptions,
          )

          await MemberRepository.includeMemberToSegments(toMergeId, {
            ...repoOptions,
            currentSegments: secondMemberSegments,
          })

          await SequelizeRepository.commitTransaction(tx)

          this.log.info({ originalId, toMergeId }, '[Merge Members] - Transaction commited! ')

          await MergeActionsRepository.setMergeAction(
            MergeActionType.MEMBER,
            originalId,
            toMergeId,
            this.options,
            {
              step: MergeActionStep.MERGE_SYNC_DONE,
            },
          )
          return { original, toMerge }
        }),
      )

      await this.temporal.workflow.start('`finishMemberMerging`', {
        taskQueue: 'entity-merging',
        workflowId: `finishMemberMerging/${originalId}/${toMergeId}`,
        retry: {
          maximumAttempts: 10,
        },
        args: [originalId, toMergeId, original.displayName, toMerge.displayName],
        searchAttributes: {
          TenantId: [DEFAULT_TENANT_ID],
        },
      })

      this.log.info({ originalId, toMergeId }, 'Members merged!')
      return { status: 200, mergedId: originalId }
    } catch (err) {
      if (err.name === 'WorkflowExecutionAlreadyStartedError') {
        this.log.info({ originalId, toMergeId }, 'Temporal workflow already started!')
        return { status: 409, mergedId: originalId }
      }

      this.log.error(err, 'Error while merging members!', { originalId, toMergeId })

      await MergeActionsRepository.setMergeAction(
        MergeActionType.MEMBER,
        originalId,
        toMergeId,
        this.options,
        {
          state: MergeActionState.ERROR,
        },
      )

      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }

      throw err
    }
  }

  private async getMemberById(memberId: string) {
    const member = await findMemberById(this.qx, memberId, [
      MemberField.ID,
      MemberField.DISPLAY_NAME,
      MemberField.JOINED_AT,
      MemberField.TENANT_ID,
      MemberField.REACH,
      MemberField.SCORE,
      MemberField.CONTRIBUTIONS,
      MemberField.ATTRIBUTES,
      MemberField.MANUALLY_CREATED,
      MemberField.MANUALLY_CHANGED_FIELDS,
    ])

    const [tags, affiliations] = await Promise.all([
      findMemberTags(this.qx, memberId),
      findMemberAffiliations(this.qx, memberId),
    ])

    return {
      ...member,
      tags: tags.map((t) => ({ id: t.tagId })),
      affiliations,
    }
  }
}
