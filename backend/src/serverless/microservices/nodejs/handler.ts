import weeklyAnalyticsEmailsCoordinator from './analytics/coordinators/weeklyAnalyticsEmailsCoordinator'
import workerFactory from './workerFactory'
import { stepFunctions } from '../../../services/aws'

export async function handlerWeeklyAnalyticsEmailsCoordinator() {
  return weeklyAnalyticsEmailsCoordinator()
}

export async function consumer(event) {
  const statusCode = 200
  console.log('Event: ', event)
  const stateMachineArn = process.env.NODE_MICROSERVICES_STATEMACHINE_ARN
  const params = {
    stateMachineArn,
    input: JSON.stringify(JSON.parse(event.Records[0].body)),
  }

  await stepFunctions.startExecution(params).promise()
  const message = 'Started execution of State Machine'
  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  }
}

export async function worker(event) {
  const statusCode = 200

  const message = await workerFactory(event)
  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  }
}
