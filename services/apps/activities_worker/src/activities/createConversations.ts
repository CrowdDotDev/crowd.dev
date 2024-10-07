import { generateUUIDv4 } from '@crowd/common'
import { PlatformType } from '@crowd/types'
import { insertConversations } from '@crowd/data-access-layer'
import { ConversationService } from '@crowd/conversations'
import { IDbConversationCreateData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/conversation.data'

import { svc } from '../main'

type row = {
  tenantId: string
  segmentId: string
  conversationId: string | null
  child_id: string
  child_sourceId: string
  child_sourceParentId: string
  child_conversationId: string | null
  child_title: string | null
  child_attributes: object
  child_timestamp: string
  parent_id: string
  parent_sourceId: string
  parent_sourceParentId: string | null
  parent_conversationId: string | null
  parent_platform: PlatformType
  parent_title: string | null
  parent_body: string
  parent_attributes: object
  parent_timestamp: string
}

const conversationService = new ConversationService(svc.postgres.writer, svc.questdbSQL, svc.log)

export async function createConversations(): Promise<Record<string, string>> {
  // Find all activities, and their parent activities
  const rows: row[] = await svc.questdbSQL.query(`
  WITH
  activities_to_check_for_parentId AS (
    SELECT
      id,
      sourceId,
      sourceParentId,
      conversationId,
      title,
      attributes,
      timestamp,
      createdAt
    FROM activities child
    WHERE sourceParentId IS NOT NULL
    AND conversationId IS NULL
    AND createdAt >= dateadd('d', -1, now())
  )

SELECT
  parent.tenantId AS tenantId,
  parent.segmentId AS segmentId,
  conversation.id AS conversationId,
  child.id AS child_id,
  child.sourceId AS child_sourceId,
  child.sourceParentId AS child_sourceParentId,
  child.conversationId AS child_conversationId,
  child.title AS child_title,
  child.attributes AS child_attributes,
  parent.id AS parent_id,
  parent.sourceId AS parent_sourceId,
  parent.sourceParentId AS parent_sourceParentId,
  parent.conversationId AS parent_conversationId,
  parent.platform AS parent_platform,
  parent.title AS parent_title,
  parent.body AS parent_body,
  parent.attributes AS parent_attributes,
  parent.timestamp AS parent_timestamp
FROM activities parent
JOIN activities_to_check_for_parentId child ON parent.sourceId = child.sourceParentId
LEFT JOIN conversations conversation ON parent.conversationId = conversation.id
ORDER BY child.createdAt ASC
LIMIT 5000;
  `)

  // For all rows found, store the conversation created for the source parent ID.
  const conversationsToCreate: Record<string, IDbConversationCreateData> = {}
  const activitiesToLinkToConversation: Record<string, string> = {}
  for (const row of rows) {
    if (row.conversationId) {
      activitiesToLinkToConversation[row.parent_sourceId] = row.conversationId
    } else {
      if (!activitiesToLinkToConversation[row.parent_sourceId]) {
        const conversationId = generateUUIDv4()
        const conversationTitle = await conversationService.generateTitle(
          row.tenantId,
          row.segmentId,
          row.parent_title || row.parent_body,
          ConversationService.hasHtmlActivities(row.parent_platform),
        )

        activitiesToLinkToConversation[row.parent_sourceId] = conversationId
        conversationsToCreate[row.parent_sourceId] = {
          id: conversationId,
          title: conversationTitle,
          slug: await conversationService.generateSlug(
            row.tenantId,
            row.segmentId,
            conversationTitle,
          ),
          published: true,
          timestamp: row.parent_timestamp || row.child_timestamp,
          tenantId: row.tenantId,
          segmentId: row.segmentId,
          createdById: null,
          updatedById: null,
        }
      }
    }
  }

  // Create all conversations not yet existing.
  if (Object.values(conversationsToCreate).length > 0) {
    await insertConversations(Object.values(conversationsToCreate))
  }

  return activitiesToLinkToConversation
}

// Update all rows with the appropriate conversationId.
export async function linkActivitiesToConversations(
  relations: Record<string, string>,
): Promise<void> {
  const queries: string[] = []
  for (const [sourceParentId, conversationId] of Object.entries(relations)) {
    queries.push(`
      UPDATE activities SET conversationId = '${conversationId}'
      WHERE sourceParentId = '${sourceParentId}';
    `)
  }

  await Promise.all(
    queries.map(async (query) => {
      return await svc.questdbSQL.query(query)
    }),
  )
}
