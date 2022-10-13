import { QueryTypes } from 'sequelize'
import ActivityService from '../../../services/activityService'
import TenantService from '../../../services/tenantService'
import SequelizeRepository from '../../repositories/sequelizeRepository'

/**
 * Since requests to aws activity sentiment api creates a bottleneck,
 * We'll be generating the sentiment for this month's activities only.
 * TODO:: Finish this up
 */
export default async () => {
  // let tenants = (await TenantService._findAndCountAllForEveryUser({ filter: {} })).rows
  // tenants = [tenants[0]]

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()

  const activityQuery = `select * from activities a
                              where a."timestamp"  between '2022-09-01' and now() `

  let activities = await options.database.sequelize.query(activityQuery, {
    type: QueryTypes.SELECT,
  })

  // console.log('activities: ')
  // console.log(activities)

  const splittedActivities = []
  const ACTIVITY_CHUNK_SIZE = 20

  if (activities.length > ACTIVITY_CHUNK_SIZE) {
    splittedActivities.push(activities.slice(0, ACTIVITY_CHUNK_SIZE))
  }

  console.log("splitted activities[0]")
  console.log(splittedActivities[0])
  const sentimentPromises = []

  for (const activity of splittedActivities[0]) {
    sentimentPromises.push(ActivityService.getSentiment(activity))
  }

  // console.log('sentiment promises: ')
  // console.log(sentimentPromises)

  console.log('getting 10 sentiment in parallel...')
  const values = await Promise.all(sentimentPromises)

  console.log(values)

  splittedActivities[0] = splittedActivities[0].map((i, index) => {
    i.sentiment = values[index]
    return i
  })

  console.log("transformed splitted:")
  console.log(splittedActivities[0])

  // for (let i = 0; i< 10; i++){
  //   sentimentPromises.push(Ac)
  // }
  // const sentiment = await ActivityService.getSentiment(data)
}
