export enum NodeWorkerMessageType {
  INTEGRATION = 'integration',
  NODE_MICROSERVICE = 'node_microservice',
  DB_OPERATIONS = 'db_operations',
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
  member?: string
  tenant?: string
}
