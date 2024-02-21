export interface IEntityData {
  id: string
  tenantId: string
}

export enum IndexedEntityType {
  ACTIVITY = 'activity',
  MEMBER = 'member',
  ORGANIZATION = 'organization',
}
