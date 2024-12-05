import fs from 'fs'
import path from 'path'

import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { anonymizeUsername } from '@crowd/data-access-layer/src/gdpr'
import { getServiceChildLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

const log = getServiceChildLogger('anonymize-member')

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
    `Anonymizing member based on input data: [${pairs
      .map((p) => `${p.type} "${p.value}"`)
      .join(', ')}]`,
  )

  const idParams = pairs.filter((p) => p.type === 'ids')
  const idsToAnonymize: string[] = []
  for (const param of idParams) {
    idsToAnonymize.push(...param.value.split(',').map((id) => id.trim()))
  }

  const memberDataMap: Map<string, any> = new Map()

  if (idsToAnonymize.length > 0) {
    for (const memberId of idsToAnonymize) {
      try {
        await store.transactionally(async (t) => {
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

          // Get all identities for the member
          const identities = await store
            .connection()
            .any(`select * from "memberIdentities" where "memberId" = $(memberId)`, { memberId })

          log.info({ tenantId: memberData.tenantId }, 'ANONYMIZING MEMBER DATA...')

          // Anonymize each identity and update the database
          for (const identity of identities) {
            const hashedUsername = anonymizeUsername(
              identity.value,
              identity.platform,
              identity.type,
            )

            await anonymizeMemberInDb(store, identity, hashedUsername)
          }

          await searchSyncWorkerEmitter.triggerMemberSync(memberData.tenantId, memberId, true)
        })
      } catch (err) {
        log.error(err, { memberId }, 'Failed to anonymize member!')
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
        log.info(`Found ${existingIdentities.length} existing identities to anonymize.`)

        for (const identity of existingIdentities) {
          try {
            await store.transactionally(async (t) => {
              const hashedUsername = anonymizeUsername(
                identity.value,
                identity.platform,
                identity.type,
              )

              // Update memberIdentities table
              await store.connection().none(
                `update "memberIdentities" 
                 set value = $(hashedValue)
                 where "memberId" = $(memberId) 
                 and platform = $(platform)
                 and type = $(type)`,
                {
                  hashedValue: hashedUsername,
                  memberId: identity.memberId,
                  platform: identity.platform,
                  type: identity.type,
                },
              )

              // Add to requestedForErasureMemberIdentities
              await store.connection().none(
                `insert into "requestedForErasureMemberIdentities" 
                 (id, platform, type, value, "memberId") 
                 values ($(id), $(platform), $(type), $(value), $(memberId))
                 on conflict do nothing`,
                {
                  memberId: identity.memberId,
                  platform: identity.platform,
                  type: identity.type,
                  value: hashedUsername,
                },
              )

              // Update activities
              await store.connection().none(
                `update activities 
                 set username = $(hashedValue)
                 where "memberId" = $(memberId)`,
                {
                  hashedValue: hashedUsername,
                  memberId: identity.memberId,
                },
              )

              await store.connection().none(
                `update activities 
                 set "objectMemberUsername" = $(hashedValue)
                 where "objectMemberId" = $(memberId)`,
                {
                  hashedValue: hashedUsername,
                  memberId: identity.memberId,
                },
              )

              await searchSyncWorkerEmitter.triggerMemberSync(
                identity.tenantId,
                identity.memberId,
                true,
              )
            })
          } catch (err) {
            log.error(err, { identity }, 'Failed to anonymize member identity!')
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

function addLinesToFile(filePath: string, lines: string[]) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    try {
      fs.accessSync(filePath)
      fs.appendFileSync(filePath, lines.join('\n') + '\n')
    } catch (error) {
      fs.writeFileSync(filePath, lines.join('\n') + '\n')
    }
  } catch (err) {
    log.error(err, { filePath }, 'Error while writing to file!')
    throw err
  }
}

async function anonymizeMemberInDb(
  store: DbStore,
  identity: IMemberIdentity,
  hashedUsername: string,
) {
  // Update member details
  //   todo: cleanup original member data in members table
  await store.connection().none(
    `update members 
         set "displayName" = $(hashedValue)
         where id = $(memberId)`,
    {
      hashedValue: hashedUsername,
      memberId: identity.memberId,
    },
  )

  // Update memberIdentities table
  await store.connection().none(
    `update "memberIdentities" 
         set value = $(hashedValue)
         where "memberId" = $(memberId) 
         and platform = $(platform)
         and type = $(type)`,
    {
      hashedValue: hashedUsername,
      memberId: identity.memberId,
      platform: identity.platform,
      type: identity.type,
    },
  )

  // Add to requestedForErasureMemberIdentities
  await store.connection().none(
    `insert into "requestedForErasureMemberIdentities" 
         (id, platform, type, value, "memberId") 
         values ($(id), $(platform), $(type), $(value))
         on conflict do nothing`,
    {
      id: identity.memberId,
      platform: identity.platform,
      type: identity.type,
      value: hashedUsername,
    },
  )

  // Update activities table
  await store.connection().none(
    `update activities 
         set "objectMemberUsername" = $(hashedValue)
         where "objectMemberId" = $(memberId)`,
    {
      hashedValue: hashedUsername,
      memberId: identity.memberId,
    },
  )

  // Update activities table for member activities
  await store.connection().none(
    `update activities 
         set username = $(hashedValue)
         where "memberId" = $(memberId)`,
    {
      hashedValue: hashedUsername,
      memberId: identity.memberId,
    },
  )
}
