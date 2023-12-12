export enum NodeWorkerMessageType {
  INTEGRATION_CHECK = 'integration_check',
  NODE_MICROSERVICE = 'node_microservice',
  DB_OPERATIONS = 'db_operations',
}

export enum PythonWorkerMessageType {
  MEMBERS_SCORE = 'members_score',
}

export interface PythonWorkerMessage {
  type: PythonWorkerMessageType
  member?: string
  tenant?: string
}
