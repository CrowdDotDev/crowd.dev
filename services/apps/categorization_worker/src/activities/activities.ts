
import { LlmService } from '@crowd/common_services'
import { dbStoreQx } from '@crowd/data-access-layer'
import { listCategories } from '@crowd/data-access-layer/src/categories'
import { CollectionField, connectProjectsAndCollections, ICollection, InsightsProjectField, queryCollections, queryInsightsProjects } from '@crowd/data-access-layer/src/collections'
import { svc } from '../main'
import { IFindCategoryParams, IFindCollectionsParams, IListedCategory } from '../types'

function formatTextCategoriesForPrompt(
  categories: IListedCategory[],
): string {
  const groupedCategories = new Map<string, string[]>()

  for (const category of categories) {
    const groupName = category.categoryGroupName
    if (!groupedCategories.has(groupName)) {
      groupedCategories.set(groupName, [])
    }
    groupedCategories.get(groupName)!.push(category.name + '-' + category.id)
  }

  let categoriesText = ''
  for (const [groupName, names] of groupedCategories) {
    categoriesText += `## ${groupName}\n`
    for (const name of names) {
      categoriesText += `- ${name}\n`
    }
    categoriesText += '\n'
  }
  return categoriesText.trim()
}

function formatTextCollectionsForPrompt(
  collections: ICollection[],
  categories: Partial<IListedCategory>[]
): string {
  if (collections.length === 0 || categories.length === 0) return ''

  const categoryMap = new Map<string, string>(
    categories.map((cat) => [cat.id, cat.name])
  )

  const groupedCollections: Record<string, ICollection[]> = {}

  for (const collection of collections) {
    const categoryName = categoryMap.get(collection.categoryId)

    if (!groupedCollections[categoryName]) {
      groupedCollections[categoryName] = []
    }

    groupedCollections[categoryName].push({
      ...collection,
      description: collection.description,
    })
  }

  let collectionsText = ''

  for (const categoryName of Object.keys(groupedCollections)) {
    collectionsText += `### ${categoryName}\n`
    for (const collection of groupedCollections[categoryName]) {
      collectionsText += `- **${collection.name}**: ${collection.description}, id: ${collection.id}\n`
    }
    collectionsText += '\n'
  }

  return collectionsText.trim()
}

export async function findCategoriesWithLLM({
  description,
  github,
  topics,
  website,
}: IFindCategoryParams) {

  const qx = dbStoreQx(svc.postgres.writer);

  // FIXME: should we handle the pagination here ? 
  const categories = await listCategories(qx, { query: '', limit: 1000, offset: 0, groupType: null })

  const prompt = `

      You are an expert open-source analyst. Your job is to classify ${github} into appropriate categories.

      ## Context and Purpose
      This classification is part of the Open Source Index, a comprehensive catalog of the most critical open-source projects. 
      Developers and organizations use this index to:
      - Discover relevant open-source tools for their technology stack
      - Understand the open-source ecosystem in their domain
      - Make informed decisions about which projects to adopt or contribute to
      - Assess the health and importance of projects in specific technology areas

      Accurate categorization is essential for users to find the right projects when browsing by technology domain or industry vertical.

      ## Project Information
      - URL: ${github}
      - Description: ${description}
      - Topics: ${topics}
      - Homepage: ${website}

      ## Available Categories
      These categories are organized by category groups and each category is shown as "CategoryName-CategoryID":

      ${formatTextCategoriesForPrompt(categories)}

      ## Your Task
      Analyze the project and determine which categories it belongs to. A project can belong to multiple categories if appropriate.

      Consider:
      - The project's primary functionality and purpose
      - The technology domain it operates in
      - The industry or vertical it serves (if applicable)
      - How developers would expect to find this project when browsing by category

      If the project doesn't clearly fit into any of the available categories, return an empty array for categories.

      ## Format
      Return a JSON object in the following format:

      json
      {
        "categories": [
          { "name": "CategoryName", "id": "CategoryID" },
          { "name": "AnotherCategory", "id": "AnotherID" }
        ],
        "explanation": "Brief explanation of why you chose these categories"
      }

    `

  const llmService = new LlmService(
    qx,
    {
      accessKeyId: process.env.CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
      secretAccessKey: process.env.CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
    },
    svc.log,
  )

  const { result } = await llmService.findRepoCategories<{
    categories: { name: string; id: string }[]
    explanation: string
  }>(prompt)

  svc.log.info(`categories found: ${JSON.stringify(result)}`)

  return result
}

export async function findCollectionsWithLLM({
  categories,
  description,
  github,
  topics,
  website,
}: IFindCollectionsParams) {
  const qx = dbStoreQx(svc.postgres.writer);

  if (!categories || categories.length === 0) {
    return null
  }

  svc.log.info(`categoriesIds: ${JSON.stringify(categories)}`)

  const collections = await queryCollections(qx, {
    fields: Object.values(CollectionField),
    filter: {
      categoryId: { in: categories.map((c) => c.id) },
    },
    orderBy: '"name" ASC',
  })

  svc.log.info(`collections: ${JSON.stringify(collections)}`)


  const prompt = `
    You are an expert open-source analyst. Your job is to classify ${github} into appropriate collections.

      ## Context and Purpose
      This classification is part of the Open Source Index, a comprehensive catalog of the most critical open-source projects. 
      Developers and organizations use this index to:
      - Discover relevant open-source tools for their technology stack
      - Understand the open-source ecosystem in their domain
      - Make informed decisions about which projects to adopt or contribute to
      - Assess the health and importance of projects in specific technology areas

      Accurate classification is essential for users to find the right projects when browsing by technology domain or industry vertical.

      ## Project Information
      - URL: ${github}
      - Description: ${description}
      - Topics: ${topics}
      - Homepage: ${website}

      ## Categories
      The project has been identified as belonging to these categories:
      {', '.join(${categories})}
      
      ## Available Collections
      These are the collections within those categories:

      ${formatTextCollectionsForPrompt(collections, categories)}

      ## Your Task
      Analyze the project carefully and assign it to all relevant collections. 
      A project can (and often does) belong to **multiple collections** if it serves multiple use cases, domains, or technical functions.
      Do **not** limit the classification to a single collection unless it clearly fits only one.
      Use your judgment to consider the primary and secondary purposes of the project.

      Consider:
      - The specific functionality the project provides
      - How it compares to other projects in potential collections
      - Whether it's a horizontal tool (used across industries) or vertical solution (industry-specific)
      - The granularity of the collections (neither too broad nor too specific)

      If the project doesn't clearly fit into any of the available collections, return an empty list for collections.

      ## Format
      Return **only** a valid JSON object in the following format — without any explanations, markdown, or introductory text:

      {
        "collections": [
          { "name": "collectionName", "id": "CollectionID" },
          { "name": "anotherCollectionName", "id": "AnotherID" }
        ],
        "explanation": "Brief explanation of why you chose these collections."
      }

      Rules:
      - Do **not** wrap the output in triple backticks.
      - Do **not** include the word "json" or any explanation before or after the JSON.
      - The entire output must be a valid JSON object that can be parsed directly.
      - Only use collections from the provided list. Do not invent new ones.
    
    `


  const llmService = new LlmService(
    qx,
    {
      accessKeyId: process.env.CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
      secretAccessKey: process.env.CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
    },
    svc.log,
  )

  const { result } = await llmService.findRepoCollections<any>(prompt)
  svc.log.info(`collections found: ${JSON.stringify(result)}`)

  return result
}

export async function findInsightsProjectBySegmentId(segmentId: string) {
  const qx = dbStoreQx(svc.postgres.writer);

  const result = await queryInsightsProjects(qx, {
    filter: {
      segmentId: { eq: segmentId },
    },
    fields: Object.values(InsightsProjectField),
  })

  return result
}

export async function connectProjectAndCollection(collectionIds: string[], insightsProjectId: string) {
  try {
    // FIXME: should we update the single collection one by one in order to be sure to skip just the duplicates ? 
    svc.log.info(`updating the collections: ${collectionIds} with the project: ${insightsProjectId}`)
    await connectProjectsAndCollections(
      dbStoreQx(svc.postgres.writer),
      collectionIds.map((collectionId) => ({
        insightsProjectId,
        collectionId,
        starred: false,
      })),
    )
  } catch (error) {
    svc.log.warn(`There was an errore updating the project: ${insightsProjectId} with one of the collections: ${JSON.stringify(collectionIds)}`)
  }
}