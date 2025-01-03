import fs from 'fs'
import path from 'path'

import { generateUUIDv1 } from '@crowd/common'
import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceChildLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import { MemberIdentityType } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceChildLogger('erase-member')

const processArguments = process.argv.slice(2)

if (processArguments.length === 0 || processArguments.length % 2 !== 0) {
  log.error(
    `
    Expected argument in pairs which can be any of the following:
      - ids "<memberId1>, <memberId2>, ..."
      - email john@doe.com
      - name "John Doe"
      - <platform> <value> (e.g. lfid someusername)
    `,
  )
  process.exit(1)
}

setImmediate(async () => {
  const manualCheckFile = `manual_check_member_ids.txt`
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG())
  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(queueClient, redisClient, loader, log)
  await searchSyncWorkerEmitter.init()

  const pairs = []
  for (let i = 0; i < processArguments.length; i += 2) {
    pairs.push({
      type: processArguments[i],
      value: processArguments[i + 1],
    })
  }

  log.info(
    `Erasing member based on input data: [${pairs
      .map((p) => `${p.type} "${p.value}"`)
      .join(', ')}]`,
  )

  const idParams = pairs.filter((p) => p.type === 'ids')
  const idsToDelete: string[] = []
  for (const param of idParams) {
    idsToDelete.push(...param.value.split(',').map((id) => id.trim()))
  }

  const orgDataMap: Map<string, any[]> = new Map()
  const memberDataMap: Map<string, any> = new Map()

  if (idsToDelete.length > 0) {
    for (const memberId of idsToDelete) {
      try {
        await store.transactionally(async (t) => {
          // get organization id for a member to sync later
          let orgResults: any[]
          if (orgDataMap.has(memberId)) {
            orgResults = orgDataMap.get(memberId)
          } else {
            orgResults = await store
              .connection()
              .any(
                `select distinct "tenantId", "organizationId" from activities where "memberId" = $(memberId)`,
                {
                  memberId,
                },
              )
            orgDataMap.set(memberId, orgResults)
          }

          let memberData: any
          if (memberDataMap.has(memberId)) {
            memberData = memberDataMap.get(memberId)
          } else {
            memberData = await store
              .connection()
              .one(`select * from members where id = $(memberId)`, {
                memberId,
              })
            memberDataMap.set(memberId, memberData)
          }

          log.info({ tenantId: memberData.tenantId }, 'CLEANUP ACTIVITIES...')

          // delete the member and everything around it
          await deleteMemberFromDb(t, memberId)

          await searchSyncWorkerEmitter.triggerRemoveMember(memberData.tenantId, memberId, true)

          if (orgResults.length > 0) {
            for (const orgResult of orgResults) {
              if (orgResult.organizationId) {
                await searchSyncWorkerEmitter.triggerOrganizationSync(
                  orgResult.tenantId,
                  orgResult.organizationId,
                  true,
                )
              }
            }
          }
        })
      } catch (err) {
        log.error(err, { memberId }, 'Failed to erase member identity!')
      }
    }
  } else {
    const nameIdentity = pairs.find((p) => p.type === 'name')
    const otherIdentities = pairs.filter((p) => p.type !== 'name')

    if (otherIdentities.length > 0) {
      const conditions: string[] = []
      const params: any = {}
      let index = 0
      for (const pair of otherIdentities) {
        params[`value_${index}`] = pair.value
        if (pair.type === 'email') {
          conditions.push(
            `(type = '${MemberIdentityType.EMAIL}' and lower(value) = lower($(value_${index})))`,
          )
        } else {
          params[`platform_${index}`] = (pair.type as string).toLowerCase()
          conditions.push(
            `(platform = $(platform_${index}) and lower(value) = lower($(value_${index})))`,
          )
        }

        index++
      }

      const query = `select * from "memberIdentities" where ${conditions.join(' or ')}`
      const existingIdentities = await store.connection().any(query, params)

      if (existingIdentities.length > 0) {
        log.info(`Found ${existingIdentities.length} existing identities.`)

        const deletedMemberIds = []

        for (const eIdentity of existingIdentities) {
          try {
            await store.transactionally(async (t) => {
              // get organization id for a member to sync later
              let orgResults: any[]
              if (orgDataMap.has(eIdentity.memberId)) {
                orgResults = orgDataMap.get(eIdentity.memberId)
              } else {
                orgResults = await store
                  .connection()
                  .any(
                    `select distinct "tenantId", "organizationId" from activities where "memberId" = $(memberId)`,
                    {
                      memberId: eIdentity.memberId,
                    },
                  )
                orgDataMap.set(eIdentity.memberId, orgResults)
              }

              let memberData: any
              if (memberDataMap.has(eIdentity.memberId)) {
                memberData = memberDataMap.get(eIdentity.memberId)
              } else {
                memberData = await store
                  .connection()
                  .one(`select * from members where id = $(memberId)`, {
                    memberId: eIdentity.memberId,
                  })
                memberDataMap.set(eIdentity.memberId, memberData)
              }

              // mark identity for erasure
              await markIdentityForErasure(t, eIdentity.platform, eIdentity.type, eIdentity.value)

              if (!deletedMemberIds.includes(eIdentity.memberId)) {
                if (eIdentity.verified) {
                  log.info({ tenantId: memberData.tenantId }, 'CLEANUP ACTIVITIES...')

                  // delete the member and everything around it
                  await deleteMemberFromDb(t, eIdentity.memberId)

                  // track so we don't delete the same member twice
                  deletedMemberIds.push(eIdentity.memberId)

                  await searchSyncWorkerEmitter.triggerRemoveMember(
                    memberData.tenantId,
                    eIdentity.memberId,
                    true,
                  )
                } else {
                  // just delete the identity
                  await deleteMemberIdentity(
                    t,
                    eIdentity.memberId,
                    eIdentity.platform,
                    eIdentity.type,
                    eIdentity.value,
                  )
                  await searchSyncWorkerEmitter.triggerMemberSync(
                    memberData.tenantId,
                    eIdentity.memberId,
                    true,
                  )
                }

                if (orgResults.length > 0) {
                  for (const orgResult of orgResults) {
                    if (orgResult.organizationId) {
                      await searchSyncWorkerEmitter.triggerOrganizationSync(
                        orgResult.tenantId,
                        orgResult.organizationId,
                        true,
                      )
                    }
                  }
                }
              }
            })
          } catch (err) {
            log.error(err, { eIdentity }, 'Failed to erase member identity!')
          }
        }
      }
    }

    if (nameIdentity) {
      const results = await store
        .connection()
        .any(`select id from members where lower("displayName") = lower($(name))`, {
          name: nameIdentity.value.trim(),
        })

      if (results.length > 0) {
        addLinesToFile(manualCheckFile, [
          `name: ${nameIdentity.value}, member ids: [${results.map((r) => r.id).join(', ')}]`,
        ])
        log.warn(
          `Found ${results.length} members with name: ${
            nameIdentity.value
          }! Manual check required for member ids: [${results.map((r) => r.id).join(', ')}]!`,
        )
      }
    }
  }

  process.exit(0)
})

async function markIdentityForErasure(
  store: DbStore,
  platform: string,
  type: string,
  value: string,
): Promise<void> {
  await store.connection().none(
    `
    insert into "requestedForErasureMemberIdentities" (id, platform, type, value)
    values ($(id), $(platform), $(type), $(value))
    `,
    {
      id: generateUUIDv1(),
      platform,
      type,
      value,
    },
  )
}

async function deleteMemberIdentity(
  store: DbStore,
  memberId: string,
  platform: string,
  type: string,
  value: string,
): Promise<void> {
  const result = await store.connection().result(
    `delete from "memberIdentities" where
      "memberId" = $(memberId) and
      platform = $(platform) and
      type = $(type) and
      value = $(value)`,
    {
      memberId,
      platform,
      type,
      value,
    },
  )

  if (result.rowCount === 0) {
    throw new Error(
      `Failed to delete member identity - memberId ${memberId}, platform: ${platform}, type: ${type}, value: ${value}!`,
    )
  }
}

export async function deleteMemberFromDb(store: DbStore, memberId: string): Promise<void> {
  let result = await store.connection().result(
    `
    update activities set
      "objectMemberId" = null,
      "objectMemberUsername" = null
    where "objectMemberId" is not null and "objectMemberId" = $(memberId)
    `,
    {
      memberId,
    },
  )

  if (result.rowCount > 0) {
    log.info(
      `Cleared ${result.rowCount} activities."objectMemberId" and activities."objectMemberUsername" for memberId ${memberId}!`,
    )
  }

  const tablesToDelete: Map<string, string[]> = new Map([
    ['activities', ['memberId']],
    ['memberNoMerge', ['memberId', 'noMergeId']],
    ['memberOrganizations', ['memberId']],
    ['memberTags', ['memberId']],
    ['memberSegments', ['memberId']],
    ['memberSegmentsAgg', ['memberId']],
    ['memberTasks', ['memberId']],
    ['memberEnrichmentCache', ['memberId']],
    ['memberIdentities', ['memberId']],
    ['memberSegmentAffiliations', ['memberId']],
    ['membersSyncRemote', ['memberId']],
    ['memberToMergeOld', ['memberId', 'toMergeId']],
    ['memberToMerge', ['memberId', 'toMergeId']],
    ['memberToMergeRaw', ['memberId', 'toMergeId']],
  ])

  for (const table of Array.from(tablesToDelete.keys())) {
    const memberIdColumns = tablesToDelete.get(table)
    log.warn(`Deleting member ${memberId} from table ${table} by columns ${memberIdColumns}...`)

    if (memberIdColumns.length === 0) {
      throw new Error(`No fk columns specified for table ${table}!`)
    }
    const condition = memberIdColumns.map((c) => `"${c}" = $(memberId)`).join(' or ')
    result = await store
      .connection()
      .result(`delete from "${table}" where ${condition}`, { memberId })

    if (result.rowCount > 0) {
      log.info(`Deleted ${result.rowCount} rows from table ${table} for member ${memberId}!`)
    }
  }

  result = await store
    .connection()
    .result(`delete from members where id = $(memberId)`, { memberId })

  if (result.rowCount === 0) {
    throw new Error(`Failed to delete member - memberId ${memberId}!`)
  }
}

function addLinesToFile(filePath: string, lines: string[]) {
  try {
    // Ensure the directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true })

    // Check if the file exists
    try {
      fs.accessSync(filePath)

      // File exists, append lines
      fs.appendFileSync(filePath, lines.join('\n') + '\n')
    } catch (error) {
      // File doesn't exist, create it and write lines
      fs.writeFileSync(filePath, lines.join('\n') + '\n')
    }
  } catch (err) {
    log.error(err, { filePath }, 'Error while writing to file!')
    throw err
  }
}
