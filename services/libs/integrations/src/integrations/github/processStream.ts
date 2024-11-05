// processStream.ts content
import { SnowflakeClient } from '@crowd/snowflake'

import { IProcessStreamContext, ProcessStreamHandler } from '../../types'

import { GithubPlatformSettings } from './types'

let client: SnowflakeClient | undefined = undefined

const initClient = (ctx: IProcessStreamContext) => {
  const settings = ctx.platformSettings as GithubPlatformSettings
  client = new SnowflakeClient({
    privateKeyString: settings.privateKey,
    account: settings.account,
    username: settings.username,
    database: settings.database,
    warehouse: settings.warehouse,
  })
}

const getClient = (ctx: IProcessStreamContext) => {
  if (!client) {
    initClient(ctx)
  }
  return client
}

const handler: ProcessStreamHandler = async (ctx) => {
  const client = getClient(ctx)
  const streamIdentifier = ctx.stream.identifier

  console.log(streamIdentifier)

  const result = await client.run('SELECT 1')
  console.log(result)
}

export default handler
