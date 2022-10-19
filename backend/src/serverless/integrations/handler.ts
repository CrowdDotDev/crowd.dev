import slackCoordinator from './coordinators/slackCoordinator'
import twitterCoordinator from './coordinators/twitterCoordinator'
import twitterReachCoordinator from './coordinators/twitterReachCoordinator'
import mainWorker from './workers/mainWorker'
import { stepFunctions } from '../../services/aws'

export async function handlerTwitterCoordinator() {
  return twitterCoordinator()
}

export async function handlerTwitterReachCoordinator() {
  return twitterReachCoordinator()
}

export async function handlerSlackCoordinator() {
  return slackCoordinator()
}

export async function consumer(event) {
  const statusCode = 200
  console.log('Event: ', event)
  const stateMachineArn = process.env.INTEGRATIONS_STATEMACHINE_ARN

  const params = {
    stateMachineArn,
    input: JSON.stringify(JSON.parse(event.Records[0].body)),
  }

  await stepFunctions.startExecution(params).promise()
  const message = 'Started execution of State Machine'

  // this isn't actually necessary to return
  // since it's only being called from a step function anyway
  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  }
}

export async function worker(event) {
  const statusCode = 200

  const message = await mainWorker(event)
  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  }
}
