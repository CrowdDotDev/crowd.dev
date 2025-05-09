export enum IndexedEntityType {
  MEMBER = 'member',
  ORGANIZATION = 'organization',
}

export interface IRecentlyIndexedEntity {
  entity_id: string
  indexed_at: string
}
