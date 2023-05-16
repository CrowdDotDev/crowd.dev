export enum IntegrationState {
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  ERROR = 'error',
  INACTIVE = 'inactive',
  WAITING_APPROVAL = 'waiting-approval',
}

export enum IntegrationRunState {
  DELAYED = 'delayed',
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export enum IntegrationStreamState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export enum IntegrationStreamType {
  ROOT = 'root',
  CHILD = 'child',
}
