/**
 * This script is responsible for replacing the category attribute for channel in MeiliSearch
 */

import { MeiliSearch } from 'meilisearch'
import { SEARCH_ENGINE_CONFIG } from '../../conf/index'

async function conversationInit() {
  const client = new MeiliSearch({
    host: SEARCH_ENGINE_CONFIG.host,
    apiKey: SEARCH_ENGINE_CONFIG.apiKey,
  })
  const docs = await client.index('conversations').search('', { limit: 1000000 })
  for (const doc of docs.hits) {
    if (doc.category) {
      const newDoc = { ...doc, channel: doc.category } as any
      delete newDoc.category
      await client.index('conversations').addDocuments([newDoc])
    }
  }

  const filterable = ['platform', 'slug', 'channel', 'tenantSlug', 'homepageLink', 'inviteLink']
  await client.index('conversations').updateFilterableAttributes(filterable)
}

conversationInit()
