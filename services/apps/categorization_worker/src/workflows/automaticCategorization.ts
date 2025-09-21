import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/activities'
import { IAutomaticCategorization } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minutes',
})

export async function automaticCategorization({
  github,
  description,
  topics,
  website,
  segmentId,
}: IAutomaticCategorization): Promise<void> {
  const { categories } = await activity.findCategoriesWithLLM({
    description,
    github,
    topics,
    website,
  })

  if (!categories || categories.length === 0) {
    return null
  }

  const { collections } = await activity.findCollectionsWithLLM({
    categories,
    description,
    github,
    topics,
    website,
  })

  if (!collections || collections.length === 0) {
    return null
  }

  const [insightsProject] = await activity.findInsightsProjectBySegmentId(segmentId)

  if (!insightsProject) {
    return null
  }

  const collectionIds = collections.map((collection) => collection.id)

  await activity.connectProjectAndCollection(collectionIds, insightsProject.id)
}
