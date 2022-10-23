import { NodeWorkerMessage } from '../types/workerTypes'
import { consumer } from './handler'

export const processDbOperationsMessage = async (msg: NodeWorkerMessage): Promise<void> => {
  await consumer(msg)
}
