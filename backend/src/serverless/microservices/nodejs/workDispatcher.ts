import { NodeMicroserviceMessage } from './messageTypes'
import workerFactory from './workerFactory'
import { NodeWorkerMessageBase } from '../../../types/mq/nodeWorkerMessageBase'

export const processNodeMicroserviceMessage = async (msg: NodeWorkerMessageBase): Promise<void> => {
  const microserviceMsg = msg as any as NodeMicroserviceMessage
  await workerFactory(microserviceMsg)
}
