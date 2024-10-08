import { generateUUIDv4, partition } from '@crowd/common'
import { ConversationService } from '@crowd/conversations'
import {
  ALL_COLUMNS_TO_SELECT,
  insertActivities,
  insertConversations,
  mapActivityRowToResult,
} from '@crowd/data-access-layer'
import { IDbConversationCreateData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/conversation.data'

import { svc } from '../main'

/* eslint-disable @typescript-eslint/no-explicit-any */

const conversationService = new ConversationService(svc.postgres.writer, svc.questdbSQL, svc.log)

export interface ICreateConversationsResult {
  conversationsCreated: number
  activitiesAddedToConversations: number
}

export async function createConversations(): Promise<ICreateConversationsResult> {
  // Find all activities, and their parent activities
  const query = `
  WITH
  activities_to_check_for_parentId AS (
    SELECT *
    FROM activities child
    WHERE deletedAt IS NULL 
    AND sourceParentId IS NOT NULL
    AND conversationId IS NULL
    AND createdAt >= dateadd('M', -1, now())
  )
SELECT
  conversation.id AS conversationId,
  ${ALL_COLUMNS_TO_SELECT.map((c) => `parent.${c} as parent_${c}`).join(', \n')},
  ${ALL_COLUMNS_TO_SELECT.map((c) => `child.${c} as child_${c}`).join(', \n')}
FROM activities parent
JOIN activities_to_check_for_parentId child ON parent.sourceId = child.sourceParentId
LEFT JOIN conversations conversation ON parent.conversationId = conversation.id
ORDER BY child.createdAt ASC
LIMIT 5000;
  `
  const rows: any[] = await svc.questdbSQL.query(query)

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

  for (const row of rows) {
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
    if (!row.conversationId) {
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
      conversationToParentActivity[row.conversationId] = row.parent.id
      // link conversation of the parent activity with the child activity
      linkActivityAndConversation(row.child, row.conversationId)
    }
  }

  // Create all conversations not yet existing.
  let conversationsCreated = 0
  const toCreate = Object.values(conversationsToCreate)
  if (toCreate.length > 0) {
    for (const batch of partition(toCreate, 1)) {
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
    for (const batch of partition(toUpdate, 1)) {
      try {
        const results = await insertActivities(batch)
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
