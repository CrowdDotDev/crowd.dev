import { generateUUIDv4, partition } from '@crowd/common'
import { ConversationService } from '@crowd/conversations'
import {
  ALL_COLUMNS_TO_SELECT,
  insertActivities,
  insertConversations,
  mapActivityRowToResult,
} from '@crowd/data-access-layer'
import { DbConnOrTx } from '@crowd/data-access-layer/src/database'
import { IDbConversationCreateData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/conversation.data'

import { svc } from '../main'

/* eslint-disable @typescript-eslint/no-explicit-any */

const conversationService = new ConversationService(svc.postgres.writer, svc.questdbSQL, svc.log)

export interface ICreateConversationsResult {
  conversationsCreated: number
  activitiesAddedToConversations: number
}

export async function createConversations(): Promise<ICreateConversationsResult> {
  // find the timestamp of the oldest activity so we can limit the query
  const minTimestamp = await getMinActivityTimestamp(svc.questdbSQL)
  if (!minTimestamp) {
    return {
      conversationsCreated: 0,
      activitiesAddedToConversations: 0,
    }
  }

  const limit = new Date(minTimestamp)

  let current = new Date()

  const results = []
  while (limit < current) {
    // fetch results for a timeframe of one week
    // Find all activities, and their parent activities
    const currentResults = await getRows(svc.questdbSQL, current)
    if (currentResults.length > 0) {
      results.push(...currentResults)

      if (results.length >= 1000) {
        svc.log.info('Reached 1000 results...')
        break
      }
    }

    current = subtractOneWeek(current)
  }

  svc.log.info(`Found ${results.length} activities to process...`)

  // For all rows found, store the conversation created for the source parent ID.
  const conversationsToCreate: Record<string, IDbConversationCreateData> = {}

  // conversationId -> [activityData]
  const activitiesToLinkToConversation: Record<string, any[]> = {}

  // conversationId -> parentActivityId
  const conversationToParentActivity: Record<string, string> = {}

  const linkActivityAndConversation = (a: any, cId: string) => {
    if (activitiesToLinkToConversation[cId]) {
      activitiesToLinkToConversation[cId].push(a)
    } else {
      activitiesToLinkToConversation[cId] = [a]
    }
  }

  for (const row of results) {
    // map parent and child activities to objects
    const parent: any = {}
    const child: any = {}
    for (const key of Object.keys(row)) {
      if (key.startsWith('parent_')) {
        parent[key.replace('parent_', '')] = row[key]
        delete row[key]
      } else if (key.startsWith('child_')) {
        child[key.replace('child_', '')] = row[key]
        delete row[key]
      }
    }

    row.parent = parent
    row.child = child

    // check first if parent activity already has a conversation created
    if (!row.parent.conversationId) {
      // check if we already prepared the conversation
      let conversationId: string
      if (!conversationsToCreate[row.parent.sourceId]) {
        // prepare new conversation
        // if not then create a new conversation
        conversationId = generateUUIDv4()
        const conversationTitle = await conversationService.generateTitle(
          row.parent.tenantId,
          row.parent.egmentId,
          row.parent.title || row.parent.body,
          ConversationService.hasHtmlActivities(row.parent.platform),
        )

        // prepare the conversation data
        conversationsToCreate[row.parent.sourceId] = {
          id: conversationId,
          title: conversationTitle,
          slug: await conversationService.generateSlug(
            row.parent.tenantId,
            row.parent.segmentId,
            conversationTitle,
          ),
          published: true,
          timestamp: row.parent.timestamp || row.child.timestamp,
          tenantId: row.parent.tenantId,
          segmentId: row.parent.segmentId,
          createdById: null,
          updatedById: null,
        }

        conversationToParentActivity[conversationId] = row.parent.id
      } else {
        conversationId = conversationsToCreate[row.parent.sourceId].id
        conversationToParentActivity[conversationId] = row.parent.id
      }

      // link it with the parent activity
      linkActivityAndConversation(row.parent, conversationId)
      // link it with the child activity
      linkActivityAndConversation(row.child, conversationId)
    } else if (!row.child.conversationId) {
      conversationToParentActivity[row.parent.conversationId] = row.parent.id
      // link conversation of the parent activity with the child activity
      linkActivityAndConversation(row.child, row.parent.conversationId)
    }
  }

  // Create all conversations not yet existing.
  let conversationsCreated = 0
  const toCreate = Object.values(conversationsToCreate)
  if (toCreate.length > 0) {
    for (const batch of partition(toCreate, 100)) {
      try {
        const results = await insertConversations(batch)
        conversationsCreated += results.length
      } catch (err) {
        svc.log.error(err, 'Error creating conversations')
        throw err
      }
    }
  }

  // link activities and conversations
  let activitiesAddedToConversations = 0
  const toUpdate: any[] = []

  for (const conversationId of Object.keys(activitiesToLinkToConversation)) {
    for (const activity of activitiesToLinkToConversation[conversationId]) {
      const mapped = mapActivityRowToResult(activity, ALL_COLUMNS_TO_SELECT)

      if (activity.member_isBot !== undefined && activity.member_isBot !== null) {
        mapped.isBotActivity = activity.member_isBot
      }
      if (activity.member_isTeamMember !== undefined && activity.member_isTeamMember !== null) {
        mapped.isTeamMemberActivity = activity.member_isBot
      }

      let parentId: string | undefined
      if (activity.sourceParentId) {
        parentId = conversationToParentActivity[conversationId]
        if (!parentId) {
          throw new Error('Parent activity ID not found!')
        }
      }

      toUpdate.push({
        ...mapped,
        parentId,
        conversationId,
      })
    }
  }

  if (toUpdate.length > 0) {
    for (const batch of partition(toUpdate, 100)) {
      try {
        const results = await insertActivities(batch, true)
        activitiesAddedToConversations += results.length
      } catch (err) {
        svc.log.error(err, 'Error linking activities to conversations')
        throw err
      }
    }
  }

  return {
    conversationsCreated,
    activitiesAddedToConversations,
  }
}

function subtractOneWeek(date: Date): Date {
  const newDate = new Date(date)
  newDate.setDate(date.getDate() - 7)
  return newDate
}

async function getRows(qdbConn: DbConnOrTx, current: Date): Promise<any[]> {
  const query = `
  WITH
  activities_to_check_for_parentId AS (
    SELECT *
    FROM activities child
    WHERE deletedAt IS NULL 
    AND sourceParentId IS NOT NULL
    AND conversationId IS NULL
    AND timestamp > dateadd('w', -1, $(limit))
    AND timestamp <= $(limit)
  )
SELECT
  ${ALL_COLUMNS_TO_SELECT.map((c) => `parent.${c} as parent_${c}`).join(', \n')},
  ${ALL_COLUMNS_TO_SELECT.map((c) => `child.${c} as child_${c}`).join(', \n')}
FROM activities parent
JOIN activities_to_check_for_parentId child ON parent.sourceId = child.sourceParentId
-- WHERE parent.timestamp > dateadd('y', -1, $(limit))
ORDER BY child.timestamp ASC
LIMIT 1000;
  `

  const results = await qdbConn.query(query, {
    limit: current,
  })

  return results
}

async function getMinActivityTimestamp(qdbConn: DbConnOrTx): Promise<string | null> {
  const query = `
  select first(timestamp) as minTimestamp
  from activities
  where 
    deletedAt is null and
    sourceParentId is not null and
    conversationId is null;
  `

  const result = await qdbConn.oneOrNone(query)

  if (!result) {
    return null
  }

  return result.minTimestamp
}
