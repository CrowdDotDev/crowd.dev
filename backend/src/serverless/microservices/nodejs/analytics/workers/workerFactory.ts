import { weeklyAnalyticsEmailsWorker } from './weeklyAnalyticsEmailsWorker'
import { AnalyticsEmailsOutput, NodeMicroserviceMessage } from '../../messageTypes'

/**
 * Worker factory for spawning different microservices
 * according to event.service
 * @param event
 * @returns worker function promise
 */

async function workerFactory(event: NodeMicroserviceMessage): Promise<AnalyticsEmailsOutput> {
  console.log('Starting main worker with event, ', event)

  const { service, tenant } = event

  switch (service.toLowerCase()) {
    case 'weekly-analytics-emails':
      return weeklyAnalyticsEmailsWorker(tenant)
    default:
      throw new Error(`Invalid microservice ${service}`)
  }
}

export default workerFactory
