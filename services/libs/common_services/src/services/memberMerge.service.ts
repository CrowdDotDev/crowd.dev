import pick from 'lodash.pick'

import { captureApiChange, memberMergeAction } from '@crowd/audit-logs'
import {
  DEFAULT_TENANT_ID,
  Error409,
  calculateReach,
  getEarliestValidDate,
  mergeObjects,
  safeObjectMerge,
} from '@crowd/common'
import {
  MEMBER_MERGE_FIELDS,
  MemberField,
  QueryExecutor,
  fetchManyMemberOrgsForMerge,
  findMemberById,
  findMemberTags,
  getMemberSegments,
  includeMemberToSegments,
  moveAffiliationsBetweenMembers,
  moveIdentitiesBetweenMembers,
} from '@crowd/data-access-layer'
import { findIdentitiesForMembers } from '@crowd/data-access-layer/src/member_identities'
import { findMemberAffiliations } from '@crowd/data-access-layer/src/member_segment_affiliations'
import {
  addMergeAction,
  findMergeAction,
  setMergeAction,
} from '@crowd/data-access-layer/src/mergeActions/repo'
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

          await addMergeAction(
            this.qx,
            MergeActionType.MEMBER,
            originalId,
            toMergeId,
            MergeActionStep.MERGE_STARTED,
            MergeActionState.IN_PROGRESS,
            backup,
            options?.currentUser?.id,
          )

          await this.qx.tx(async (txQx) => {
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

            await moveIdentitiesBetweenMembers(
              txQx,
              toMergeId,
              originalId,
              identitiesToMove,
              identitiesToUpdate,
            )

            // Update member segment affiliations and organization affiliation overrides
            await moveAffiliationsBetweenMembers(txQx, toMergeId, originalId)

            // Performs a merge and returns the fields that were changed so we can update
            const toUpdate: any = await MemberMergeService.membersMerge(original, toMerge)

            // TODO
            // Update original member
            // const txService = new MemberService(repoOptions as IServiceOptions)

            captureNewState({ primary: toUpdate })

            // TODO
            // await txService.update(originalId, toUpdate, {
            //   syncToOpensearch: false,
            // })

            // TODO
            // update members that belong to source organization to destination org
            // const memberOrganizationService = new MemberOrganizationService(repoOptions)
            // await memberOrganizationService.moveOrgsBetweenMembers(originalId, toMergeId)

            // TODO
            // Remove toMerge from original member
            // await MemberRepository.removeToMerge(originalId, toMergeId, repoOptions)

            const secondMemberSegments = await getMemberSegments(txQx, toMergeId)

            await includeMemberToSegments(
              txQx,
              toMergeId,
              secondMemberSegments.map((s) => s.id),
            )
          })

          this.log.info({ originalId, toMergeId }, '[Merge Members] - Transaction commited! ')

          await setMergeAction(this.qx, MergeActionType.MEMBER, originalId, toMergeId, {
            step: MergeActionStep.MERGE_SYNC_DONE,
          })

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

      await setMergeAction(this.qx, MergeActionType.MEMBER, originalId, toMergeId, {
        state: MergeActionState.ERROR,
      })

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

  /**
   * Call the merge function with the special fields for members.
   * We want to always keep the earlies joinedAt date.
   * We always want the original displayName.
   * @param originalObject Original object to merge
   * @param toMergeObject Object to merge into the original object
   * @returns The updates to be performed on the original object
   */
  public static membersMerge(originalObject, toMergeObject) {
    return mergeObjects(originalObject, toMergeObject, {
      joinedAt: (oldDate, newDate) => getEarliestValidDate(oldDate, newDate),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      displayName: (oldValue, _newValue) => oldValue,
      reach: (oldReach, newReach) => calculateReach(oldReach, newReach),
      score: (oldScore, newScore) => Math.max(oldScore, newScore),
      emails: (oldEmails, newEmails) => {
        if (!oldEmails && !newEmails) {
          return []
        }

        oldEmails = oldEmails ?? []
        newEmails = newEmails ?? []

        const emailSet = new Set<string>(oldEmails)
        newEmails.forEach((email) => emailSet.add(email))

        return Array.from(emailSet)
      },
      attributes: (oldAttributes, newAttributes) => safeObjectMerge(oldAttributes, newAttributes),
    })
  }
}
