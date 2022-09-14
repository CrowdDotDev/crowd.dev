export enum NodeWorkerMessageType {
  DEVTO_INTEGRATION = 'devto_integration',
}

export interface NodeWorkerMessage {
  type: NodeWorkerMessageType
}
