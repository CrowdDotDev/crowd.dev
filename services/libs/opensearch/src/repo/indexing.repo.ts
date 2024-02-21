import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

export class IndexingRepository extends RepositoryBase<IndexingRepository> {
  private readonly indexedEntitiesColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.indexedEntitiesColumnSet = new dbStore.dbInstance.helpers.ColumnSet(
      ['entity_id', 'attempt_id', 'tenant_id'],
      {
        table: 'indexed_entities',
      },
    )
  }

  public async markEntitiesIndexed(
    ids: string[],
    attemptId: string,
    tenantId: string,
  ): Promise<void> {
    const objects = ids.map((id) => {
      return {
        entity_id: id,
        tenant_id: tenantId,
        attempt_id: attemptId,
      }
    })

    const prepared = RepositoryBase.prepareBatch(objects, this.indexedEntitiesColumnSet)
    const query = this.dbInstance.helpers.update(prepared, this.indexedEntitiesColumnSet)

    console.log('QUERY', query)

    await this.db().none(query)
  }
}
