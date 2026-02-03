import { LlmService } from '@crowd/common_services'
import { dbStoreQx } from '@crowd/data-access-layer'
import { listCategories } from '@crowd/data-access-layer/src/categories'
import {
  CollectionField,
  ICollection,
  InsightsProjectField,
  connectProjectsAndCollections,
  queryCollections,
  queryInsightsProjects,
} from '@crowd/data-access-layer/src/collections'

import { svc } from '../main'
import { IFindCategoryParams, IFindCollectionsParams, IListedCategory } from '../types'

function formatTextCategoriesForPrompt(categories: IListedCategory[]): string {
  const groupedCategories = new Map<string, string[]>()

  for (const category of categories) {
    const groupName = category.categoryGroupName
    if (!groupedCategories.has(groupName)) {
      groupedCategories.set(groupName, [])
    }
    groupedCategories.get(groupName).push(category.name + '-' + category.id)
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
  categories: Partial<IListedCategory>[],
): string {
  if (collections.length === 0 || categories.length === 0) return ''

  const categoryMap = new Map<string, string>(categories.map((cat) => [cat.id, cat.name]))

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
  const qx = dbStoreQx(svc.postgres.writer)

  const categories = await listCategories(qx, {
    query: '',
    limit: 1000,
    offset: 0,
    groupType: null,
  })

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

      IMPORTANT RULES (MUST FOLLOW):
      - You MUST select categories ONLY from the list provided above.
      - You MUST copy BOTH the category name AND the category id EXACTLY as shown.
      - DO NOT rephrase, normalize, translate, or modify category names in any way.
      - DO NOT generate new ids.
      - DO NOT invent categories.
      - If no category clearly applies, return an empty categories array.
      - If you are unsure, prefer returning fewer categories rather than guessing.

      ANY category not copied verbatim from the list is INVALID.

      Each category above is an atomic, immutable pair.
      You may ONLY choose from these exact values.


      ## Your Task
      Analyze the project and determine which categories it belongs to. A project can belong to multiple categories if appropriate.

      Consider:
      - The project's primary functionality and purpose
      - The technology domain it operates in
      - The industry or vertical it serves (if applicable)
      - How developers would expect to find this project when browsing by category

      If the project doesn't clearly fit into any of the available categories, return an empty array for categories.

      ## Format
      Respond with a valid JSON object **only**. Do not include any explanations, markdown formatting, or extra text.

      If the project fits one or more categories:
      {
        "categories": [
          { "name": "CategoryName", "id": "CategoryID" },
          { "name": "AnotherCategory", "id": "AnotherID" }
        ],
        "explanation": "Brief explanation of why you chose these categories"
      }

      If the project does not clearly fit any category:
      {
        "categories": []
      }

      Remember:
      - Names and IDs MUST match the list EXACTLY, character for character.
      - Any deviation is an error.
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

  // Validate and correct UUIDs from LLM response
  if (result.categories && result.categories.length > 0) {
    const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    result.categories = result.categories
      .map((llmCat) => {
        // 1. Check if UUID is valid format AND exists in DB
        const categoryById = categories.find((c) => c.id === llmCat.id)
        if (validUuidRegex.test(llmCat.id) && categoryById) {
          return llmCat // UUID is correct
        }

        // 2. If UUID is wrong, fallback to name lookup
        const categoryByName = categories.find(
          (c) => c.name.toLowerCase() === llmCat.name.toLowerCase(),
        )
        if (categoryByName) {
          svc.log.warn(
            `LLM returned invalid UUID "${llmCat.id}" for category "${llmCat.name}", using correct UUID "${categoryByName.id}"`,
          )
          return { name: categoryByName.name, id: categoryByName.id }
        }

        // 3. Category not found at all, skip it
        svc.log.warn(
          `Category "${llmCat.name}" with UUID "${llmCat.id}" not found in database, skipping`,
        )
        return null
      })
      .filter(Boolean)
  }

  return result
}

export async function findCollectionsWithLLM({
  categories,
  description,
  github,
  topics,
  website,
}: IFindCollectionsParams) {
  const qx = dbStoreQx(svc.postgres.writer)

  if (!categories || categories.length === 0) {
    return null
  }

  const collections = await queryCollections(qx, {
    fields: Object.values(CollectionField),
    filter: {
      categoryId: { in: categories.map((c) => c.id) },
    },
    orderBy: '"name" ASC',
  })

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
    ${categories.join(', ')}

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

    If the project doesn't clearly fit into any of the available collections, return an empty list for collections, and **do not include an explanation**.

    ## Format
    Return **only** a valid JSON object in the following format — without any explanations, markdown, or introductory text:

    If one or more collections apply:
    {
      "collections": [
        { "name": "collectionName", "id": "CollectionID" },
        { "name": "anotherCollectionName", "id": "AnotherID" }
      ],
      "explanation": "Brief explanation of why you chose these collections."
    }

    If no collections apply:
    {
      "collections": []
    }

    ### Rules:
    - Do **not** include any markdown formatting or code block syntax (like triple backticks).
    - Do **not** include the word "json" or any introductory/explanatory text.
    - The output must be **only** a valid JSON object.
    - Use **only** the collections provided — do not invent new ones.
    `

  const llmService = new LlmService(
    qx,
    {
      accessKeyId: process.env.CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
      secretAccessKey: process.env.CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
    },
    svc.log,
  )

  const { result } = await llmService.findRepoCollections<{
    collections: { name: string; id: string }[]
    explanation: string
  }>(prompt)

  svc.log.info(`collections found: ${JSON.stringify(result)}`)

  return result
}

export async function findInsightsProjectBySegmentId(segmentId: string) {
  const qx = dbStoreQx(svc.postgres.writer)

  const result = await queryInsightsProjects(qx, {
    filter: {
      segmentId: { eq: segmentId },
    },
    fields: Object.values(InsightsProjectField),
  })

  return result
}

export async function connectProjectAndCollection(
  collectionIds: string[],
  insightsProjectId: string,
) {
  svc.log.info(`updating the collections: ${collectionIds} with the project: ${insightsProjectId}`)
  await connectProjectsAndCollections(
    dbStoreQx(svc.postgres.writer),
    collectionIds.map((collectionId) => ({
      insightsProjectId,
      collectionId,
      starred: false,
    })),
    'DO NOTHING',
  )
}
