import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IGenerateStreamsData } from './integrationRun.data'

export default class IntegrationRunRepository extends RepositoryBase<IntegrationRunRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  private readonly getGenerateStreamDataQuery = `
    with stream_count as (select "runId", count(id) as stream_count
                          from "integrationStreams"
                         where "runId" = $(runId)
                         group by "runId")
select r."integrationId",
       i.status                    as "integrationState",
       r.state                     as "runState",
       r.id                        as "runId",
       i.settings                  as "integrationSettings",
       coalesce(c.stream_count, 0) as "streamCount"
  from "integrationRuns" r
           inner join integrations i on (r."integrationId" = i.id and i."deletedAt" is null)
           left join stream_count c on c."runId" = r.id
 where r.id = $(runId);
  `
  public async getGenerateStreamData(runId: string): Promise<IGenerateStreamsData | undefined> {
    const results = await this.db().oneOrNone(this.getGenerateStreamDataQuery, {
      runId,
    })

    return results
  }
}
