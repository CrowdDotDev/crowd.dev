import OpenAI from 'openai'
import pLimit from 'p-limit'

import { getDbConnection } from '@crowd/data-access-layer/src/database'

import { DB_CONFIG } from '../conf'

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  })

  await dbClient.any(
    'ALTER TABLE "insightsProjects" ADD COLUMN IF NOT EXISTS "tempname" VARCHAR(255) DEFAULT name',
  )

  const projects = await dbClient.any(
    'SELECT * FROM "insightsProjects" WHERE "segmentId" IS NULL AND tempname IS NULL',
  )

  console.log(`Total Projects to Process: ${projects.length}`)

  const limit = pLimit(3)

  await Promise.all(
    projects.map((project) =>
      limit(async () => {
        const { name, description } = project

        const prompt = `
give me name of the project from this current name and description include also organization name if needed
name: ${name}
description: ${description}

Return simply just project name no other text and no formatting`

        const chatCompletion = await client.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4o',
        })
        const newName = chatCompletion.choices[0].message.content.trim()

        await dbClient.one(
          'UPDATE "insightsProjects" SET "tempname" = $1 WHERE "id" = $2 RETURNING *',
          [newName, project.id],
        )

        console.log(`${name} -> ${newName}`)
      }),
    ),
  )

  const duplicates = await dbClient.any(
    'SELECT tempname, COUNT(*) AS duplicate_count FROM "insightsProjects" GROUP BY tempname HAVING COUNT(*) > 1',
  )

  console.log(`Number of Duplicates: ${duplicates.length}`)

  await Promise.all(
    duplicates.map((duplicate) =>
      limit(async () => {
        const duplicateName = duplicate.tempname
        const sameResults = await dbClient.any(
          'SELECT id, name, description FROM "insightsProjects" WHERE tempname = $1',
          [duplicateName],
        )

        const projectDetails = sameResults.map((result) => ({
          name: result.name,
          description: result.description,
        }))

        const prompt = `
The following projects have the same name. Generate unique names for each by incorporating distinguishing details such as organization name or additional project context. Ensure the names remain relevant and unique.
Projects: ${JSON.stringify(projectDetails, null, 2)}

Return an array of strings of unique project names in JSON format, maintaining the same order as given.`

        const chatCompletion = await client.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4o',
        })

        const responseContent = chatCompletion.choices[0].message.content.trim()
        const uniqueNames = JSON.parse(responseContent.replace(/```json|```/g, '').trim())

        console.log(duplicateName)
        console.log(uniqueNames)

        await Promise.all(
          sameResults.map((result, index) =>
            dbClient.one(
              'UPDATE "insightsProjects" SET "tempname" = $1 WHERE "id" = $2 RETURNING *',
              [uniqueNames[index], result.id],
            ),
          ),
        )
      }),
    ),
  )

  process.exit(0)
})
