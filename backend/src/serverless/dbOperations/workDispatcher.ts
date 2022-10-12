import { NodeWorkerMessage } from '../types/worketTypes'
import { consumer } from './handler'

export const processDbOperationsMessage = async (msg: NodeWorkerMessage): Promise<void> => {
  await consumer(msg)
}
