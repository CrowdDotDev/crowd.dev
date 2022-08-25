/**
 * This script is responsible for replacing the category attribute for channel in MeiliSearch
 */

import { MeiliSearch } from 'meilisearch'

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const path = require('path')

const environmentArg = process.argv[2]

const envFile = environmentArg === 'dev' ? '.env' : `.env-${environmentArg}`

const env = dotenv.config({
  path: path.resolve(__dirname, `../../../${envFile}`),
})

dotenvExpand.expand(env)

async function conversationInit() {
  const client = new MeiliSearch({
    host: process.env.SEARCH_ENGINE_HOST,
    apiKey: process.env.SEARCH_ENGINE_API_KEY,
  })
  const docs = await client.index('conversations').search('', { limit: 1000000 })
  console.log(docs.hits.length)
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
