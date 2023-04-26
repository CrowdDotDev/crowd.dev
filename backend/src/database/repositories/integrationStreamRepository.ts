import { QueryTypes } from 'sequelize'
import { v1 as uuidV1 } from 'uuid'
import lodash from 'lodash'
import {
  DbIntegrationStreamCreateData,
  IntegrationStream,
  IntegrationStreamState,
} from '../../types/integrationStreamTypes'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'

export default class IntegrationStreamRepository extends RepositoryBase<
  IntegrationStream,
  string,
  DbIntegrationStreamCreateData,
  unknown,
  unknown
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  override async findById(id: string): Promise<IntegrationStream> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
    select id,
          "runId",
          "tenantId",
          "integrationId",
          "microserviceId",
          state,
          name,
          metadata,
          "processedAt",
          error,
          retries,
          "createdAt",
          "updatedAt"
      from "integrationStreams" where id = :id;      
    `

    const result = await seq.query(query, {
      replacements: {
        id,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    if (result.length !== 1) {
      throw new Error(`Expected 1 row to be selected, got ${result.length} rows instead.`)
    }

    return result[0] as IntegrationStream
  }

  async findByRunId(
    runId: string,
    states?: IntegrationStreamState[],
  ): Promise<IntegrationStream[]> {
    const transaction = this.transaction

    const seq = this.seq

    const replacements: any = {
      runId,
    }

    let condition = `1=1`
    if (states && states.length > 0) {
      condition = `"state" in (:states)`
      replacements.states = states
    }

    const query = `
    select id,
          "runId",
          "tenantId",
          "integrationId",
          "microserviceId",
          state,
          name,
          metadata,
          "processedAt",
          error,
          retries,
          "createdAt",
          "updatedAt"
      from "integrationStreams" where "runId" = :runId and ${condition}
      -- we are using uuid v1 so we can sort by it
      order by "id";
    `

    const result = await seq.query(query, {
      replacements,
      type: QueryTypes.SELECT,
      transaction,
    })

    return result as IntegrationStream[]
  }

  async bulkCreate(data: DbIntegrationStreamCreateData[]): Promise<IntegrationStream[]> {
    const transaction = this.transaction

    const seq = this.seq

    const batches = lodash.chunk(data, 999) as DbIntegrationStreamCreateData[][]

    const results: IntegrationStream[] = []

    const query = `
    insert into "integrationStreams"(id, "runId", "tenantId", "integrationId", "microserviceId", state, name, metadata)
    values 
    `

    for (const batch of batches) {
      let i = 0
      const values: string[] = []
      const replacements: any = {}

      for (const item of batch) {
        const id = uuidV1()
        values.push(
          `(:id${i}, :runId${i}, :tenantId${i}, :integrationId${i}, :microserviceId${i}, :state${i}, :name${i}, :metadata${i})`,
        )
        replacements[`id${i}`] = id
        replacements[`runId${i}`] = item.runId
        replacements[`tenantId${i}`] = item.tenantId
        replacements[`state${i}`] = IntegrationStreamState.PENDING
        replacements[`integrationId${i}`] = item.integrationId || null
        replacements[`microserviceId${i}`] = item.microserviceId || null
        replacements[`name${i}`] = item.name
        replacements[`metadata${i}`] = JSON.stringify(item.metadata || {})
        i++
      }

      const finalQuery = `${query} ${values.join(', ')} returning "createdAt";`

      const batchResults = await seq.query(finalQuery, {
        replacements,
        type: QueryTypes.SELECT,
        transaction,
      })

      if (batchResults.length !== batch.length) {
        throw new Error(
          `Expected ${batch.length} rows to be inserted, got ${batchResults.length} rows instead.`,
        )
      }

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j]
        const createdAt = (batchResults[j] as any).createdAt
        results.push({
          id: replacements[`id${j}`],
          runId: item.runId,
          tenantId: item.tenantId,
          state: IntegrationStreamState.PENDING,
          integrationId: item.integrationId,
          microserviceId: item.microserviceId,
          name: item.name,
          metadata: item.metadata || {},
          createdAt,
          updatedAt: createdAt,
          processedAt: null,
          error: null,
          retries: null,
        })
      }
    }

    return results
  }

  override async create(data: DbIntegrationStreamCreateData): Promise<IntegrationStream> {
    const transaction = this.transaction

    const seq = this.seq

    const id = uuidV1()

    const query = `
      insert into "integrationStreams"(id, "runId", "tenantId", "integrationId", "microserviceId", state, name, metadata)
      values(:id, :runId, :tenantId, :integrationId, :microserviceId, :state, :name, :metadata)
      returning "createdAt";
    `

    const result = await seq.query(query, {
      replacements: {
        id,
        runId: data.runId,
        tenantId: data.tenantId,
        state: IntegrationStreamState.PENDING,
        integrationId: data.integrationId || null,
        microserviceId: data.microserviceId || null,
        name: data.name,
        metadata: JSON.stringify(data.metadata || {}),
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    if (result.length !== 1) {
      throw new Error(`Expected 1 row to be inserted, got ${result.length} rows instead.`)
    }

    return {
      id,
      runId: data.runId,
      tenantId: data.tenantId,
      state: IntegrationStreamState.PENDING,
      integrationId: data.integrationId,
      microserviceId: data.microserviceId,
      name: data.name,
      metadata: data.metadata || {},
      createdAt: (result[0] as any).createdAt,
      updatedAt: (result[0] as any).createdAt,
      processedAt: null,
      error: null,
      retries: null,
    }
  }

  async markProcessing(id: string): Promise<void> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
      update "integrationStreams"
      set state = :state,
          "updatedAt" = now()
      where id = :id;
    `

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, rowCount] = await seq.query(query, {
      replacements: {
        id,
        state: IntegrationStreamState.PROCESSING,
      },
      type: QueryTypes.UPDATE,
      transaction,
    })

    if (rowCount !== 1) {
      throw new Error(`Expected 1 row to be updated, got ${rowCount} rows instead.`)
    }
  }

  async markProcessed(id: string): Promise<void> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
      update "integrationStreams"
      set state = :state,
          "processedAt" = now(),
          "updatedAt" = now()
      where id = :id;
    `

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, rowCount] = await seq.query(query, {
      replacements: {
        id,
        state: IntegrationStreamState.PROCESSED,
      },
      type: QueryTypes.UPDATE,
      transaction,
    })

    if (rowCount !== 1) {
      throw new Error(`Expected 1 row to be updated, got ${rowCount} rows instead.`)
    }
  }

  async markError(id: string, error: any): Promise<number> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
      update "integrationStreams"
      set state = :state,
          "processedAt" = now(),
          error = :error,
          retries = coalesce(retries, 0) + 1,
          "updatedAt" = now()
      where id = :id
      returning retries;
    `

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await seq.query(query, {
      replacements: {
        id,
        error: JSON.stringify(error),
        state: IntegrationStreamState.ERROR,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    if (result.length !== 1) {
      throw new Error(`Expected 1 row to be updated, got ${result.length} rows instead.`)
    }

    return (result[0] as any).retries
  }

  async reset(id: string): Promise<void> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
      update "integrationStreams"
      set state = :state,
          "processedAt" = null,
          error = null,
          retries = null,
          "updatedAt" = now()
      where id = :id;
    `

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, count] = await seq.query(query, {
      replacements: {
        id,
        state: IntegrationStreamState.PENDING,
      },
      type: QueryTypes.UPDATE,
      transaction,
    })

    if (count !== 1) {
      throw new Error(`Expected 1 row to be updated, got ${count} rows instead.`)
    }
  }
}
