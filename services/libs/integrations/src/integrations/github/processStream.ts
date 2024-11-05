// processStream.ts content
import { GithubSnowflakeClient, SnowflakeClient } from '@crowd/snowflake'

import { IProcessStreamContext, ProcessStreamHandler } from '../../types'

import { GithubPlatformSettings } from './types'

let client: SnowflakeClient | undefined = undefined
let githubClient: GithubSnowflakeClient | undefined = undefined

const initClient = (ctx: IProcessStreamContext) => {
  const settings = ctx.platformSettings as GithubPlatformSettings
  client = new SnowflakeClient({
    privateKeyString: settings.privateKey,
    account: settings.account,
    username: settings.username,
    database: settings.database,
    warehouse: settings.warehouse,
  })
  githubClient = new GithubSnowflakeClient(client)
}

const getClient = (ctx: IProcessStreamContext) => {
  if (!client) {
    initClient(ctx)
  }
  return { client, githubClient }
}

const handler: ProcessStreamHandler = async (ctx) => {
  const { githubClient } = getClient(ctx)
  const streamIdentifier = ctx.stream.identifier

  console.log(streamIdentifier)

  const result = await githubClient.getOrgRepositories({ org: 'CrowdDotDev' })
  console.log(result)
}

export default handler
