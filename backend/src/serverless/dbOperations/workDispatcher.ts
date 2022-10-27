import { consumer } from './handler'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'

export const processDbOperationsMessage = async (msg: NodeWorkerMessageBase): Promise<void> => {
  await consumer(msg)
}
