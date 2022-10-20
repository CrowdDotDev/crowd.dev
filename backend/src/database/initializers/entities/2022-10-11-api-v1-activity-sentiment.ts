import { QueryTypes } from 'sequelize'
import ActivityService from '../../../services/activityService'
import SequelizeRepository from '../../repositories/sequelizeRepository'
import BaseIterator from '../../../serverless/integrations/iterators/baseIterator'

/**
 * Since requests to aws activity sentiment api creates a bottleneck,
 * We'll be generating the sentiment for this month's activities only.
 * TODO:: Finish this up
 */
export default async () => {
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  console.time('whole-script-time')

  // const activityQuery = `select * from activities a where a."timestamp"  between '2022-09-01' and now() and (a."attributes"->>'sample') is null`
  const activityQuery = `select * from activities a where a."timestamp"  between '2022-09-01' and now() 
  and(a."attributes"->>'sample') is null
  and ((a.title is not null and a.title != '') or (a.body is not null and a.body != ''))`

  let activities = await options.database.sequelize.query(activityQuery, {
    type: QueryTypes.SELECT,
  })

  console.log('activities: ')
  console.log(activities.length)
  const rawLength = activities.length

  const splittedActivities = []
  const ACTIVITY_CHUNK_SIZE = 350

  if (activities.length > ACTIVITY_CHUNK_SIZE) {
    while (activities.length > ACTIVITY_CHUNK_SIZE) {
      splittedActivities.push(activities.slice(0, ACTIVITY_CHUNK_SIZE))
      activities = activities.slice(ACTIVITY_CHUNK_SIZE)
    }
    // insert last small chunk
    if (activities.length > 0) splittedActivities.push(activities)
  } else {
    splittedActivities.push(activities)
  }

  let processedCount = 0

  for (let activityChunk of splittedActivities) {
    let sentiments

    try {
      sentiments = await ActivityService.getSentimentBatch(activityChunk)
    } catch (e) {
      console.log(e)
      console.log('exception occured. sleeping 2 seconds and retrying...')
      await BaseIterator.sleep(3)
      sentiments = await ActivityService.getSentimentBatch(activityChunk)
    }

    activityChunk = activityChunk.map((a, index) => {
      a.sentiment = sentiments[index]
      return a
    })

    await options.database.activity.bulkCreate(activityChunk, {
      updateOnDuplicate: ['sentiment'],
    })
    processedCount += activityChunk.length
    console.log(`${processedCount}/${rawLength} processed`)
  }

  console.timeEnd('whole-script-time')
}
