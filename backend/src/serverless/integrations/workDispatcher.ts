import { NodeWorkerMessage } from '../types/workerTypes'
import { IntegrationsMessage } from './types/messageTypes'
import mainWorker from './workers/mainWorker'

export const processIntegrationsMessage = async (msg: NodeWorkerMessage): Promise<void> => {
  await mainWorker(msg as any as IntegrationsMessage)
}
