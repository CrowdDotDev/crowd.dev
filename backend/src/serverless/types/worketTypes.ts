export enum NodeWorkerMessageType {
  INTEGRATION = 'integration',
  NODE_MICROSERVICE = 'node_microservice',
}

export interface NodeWorkerMessage {
  type: NodeWorkerMessageType
}

export enum PythonWorkerMessageType {
  MEMBERS_SCORE = 'members_score',
  CHECK_MERGE = 'check_merge',
}

export interface PythonWorkerMessage {
  type: PythonWorkerMessageType
}
