import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IRecentlyIndexedEntity, IndexedEntityType } from './indexing.data'

export class IndexingRepository extends RepositoryBase<IndexingRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async deleteIndexedEntities(
    type: IndexedEntityType,
    segmentIds?: string[],
  ): Promise<void> {
    let segmentCondition = ''

    if (segmentIds) {
      const materializedView =
        type === IndexedEntityType.MEMBER ? 'member_segments_mv' : 'organization_segments_mv'
      const entityColumn = type === IndexedEntityType.MEMBER ? '"memberId"' : '"organizationId"'

      segmentCondition = `
        USING ${materializedView} mv 
        WHERE mv.${entityColumn} = indexed_entities.entity_id 
        AND mv."segmentId" IN ($(segmentIds:csv))
      `
    }

    await this.db().none(
      `
      DELETE FROM indexed_entities
      ${segmentCondition}
      AND indexed_entities.type = $(type)
      `,
      {
        type,
        segmentIds,
      },
    )
  }

  public async markEntitiesIndexed(type: IndexedEntityType, data: string[]): Promise<void> {
    if (data.length > 0) {
      const uniqueRecords = [...new Set(data)]
      const values = uniqueRecords.map((d) => `('${type}', '${d}')`)
      const query = `
        insert into indexed_entities(type, entity_id)
        values ${values.join(',\n')}
        on conflict (type, entity_id)
        do update set indexed_at = now()
      `
      await this.db().none(query)
    }
  }

  public async getLatestIndexedEntityId(type: IndexedEntityType): Promise<string | null> {
    const result = await this.db().oneOrNone<{ entity_id: string }>(
      `
      select entity_id
      from indexed_entities
      where type = $(type)
      order by entity_id desc
      limit 1
      `,
      {
        type,
      },
    )

    return result?.entity_id ?? null
  }

  public async getRecentlyIndexedEntities(
    entityType: IndexedEntityType,
    batchSize: number,
    lastSyncedAt: string,
    lastUuid?: string,
  ): Promise<IRecentlyIndexedEntity[]> {
    return this.db().any(
      `
        SELECT "entity_id", "indexed_at"
        FROM "indexed_entities"
        WHERE "type" = $(entityType)
          AND ("indexed_at", "entity_id") > ($(lastSyncedAt), $(lastUuid))
        ORDER BY "indexed_at" ASC, "entity_id" ASC
        LIMIT $(batchSize);
      `,
      {
        entityType,
        batchSize,
        lastSyncedAt,
        lastUuid,
      },
    )
  }
}
