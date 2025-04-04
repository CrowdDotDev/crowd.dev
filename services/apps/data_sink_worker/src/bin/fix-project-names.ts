import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

import { getDbConnection } from '@crowd/data-access-layer/src/database'

import { DB_CONFIG } from '../conf'

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())
  const client = new BedrockRuntimeClient({
    credentials: {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    region: 'us-east-1',
  })

  const projects = await dbClient.any('SELECT * FROM "insightsProjects" where name ilike $1', ['%docs%'])

  for (const project of projects.slice(0, 100)) {
    const name = project.name
    const description = project.description

    const prompt = `
      give me name of the project from this current name and description include also organization name if needed
name: ${name}
description: ${description}

Return just project name no other text`

    const command = new InvokeModelCommand({
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 512,
        anthropic_version: 'bedrock-2023-05-31',
      }),
      modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      accept: 'application/json',
      contentType: 'application/json',
    })

    const res = await client.send(command)

    const responseBody = JSON.parse(new TextDecoder('utf-8').decode(res.body))
    const [answer] = responseBody.content
    const newName = answer.text

    await dbClient.one(
      'UPDATE "insightsProjects" SET "tempname" = $1 WHERE "id" = $2 RETURNING *',
      [newName, project.id],
    )

    console.log(name, '->', newName)
  }

  process.exit(0)
})
