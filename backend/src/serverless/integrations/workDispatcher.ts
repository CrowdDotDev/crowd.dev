import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { IntegrationsMessage } from './types/messageTypes'
import mainWorker from './workers/mainWorker'

export const processIntegrationsMessage = async (msg: NodeWorkerMessageBase): Promise<void> => {
  await mainWorker(msg as any as IntegrationsMessage)
}
