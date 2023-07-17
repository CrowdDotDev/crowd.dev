import { v4 as uuid } from 'uuid'
import { QueryTypes } from 'sequelize'
import {
  MemberSegmentAffiliation,
  MemberSegmentAffiliationCreate,
  MemberSegmentAffiliationUpdate,
} from '../../types/memberSegmentAffiliationTypes'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'
import Error404 from '../../errors/Error404'

class MemberSegmentAffiliationRepository extends RepositoryBase<
  MemberSegmentAffiliation,
  string,
  MemberSegmentAffiliationCreate,
  MemberSegmentAffiliationUpdate,
  unknown
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  async createOrUpdate(data: MemberSegmentAffiliationCreate): Promise<MemberSegmentAffiliation> {
    if (!data.memberId) {
      throw new Error('memberId is required when creating a member segment affiliation.')
    }

    if (!data.segmentId) {
      throw new Error('segmentId is required when creating a member segment affiliation.')
    }

    if (data.organizationId === undefined) {
      throw new Error('organizationId is required when creating a member segment affiliation.')
    }

    const transaction = this.transaction

    const affiliationInsertResult = await this.options.database.sequelize.query(
      `INSERT INTO "memberSegmentAffiliations" ("id", "memberId", "segmentId", "organizationId")
          VALUES
              (:id, :memberId, :segmentId, :organizationId)
          ON CONFLICT ("memberId", "segmentId" ) DO UPDATE SET "organizationId" = :organizationId
          RETURNING "id"
        `,
      {
        replacements: {
          id: uuid(),
          memberId: data.memberId,
          segmentId: data.segmentId,
          organizationId: data.organizationId,
        },
        type: QueryTypes.INSERT,
        transaction,
      },
    )

    await this.updateAffiliation(data.memberId, data.segmentId, data.organizationId)

    return this.findById(affiliationInsertResult[0][0].id)
  }

  override async findById(id: string): Promise<MemberSegmentAffiliation> {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `SELECT *
       FROM "memberSegmentAffiliations"
       WHERE id = :id
      `,
      {
        replacements: {
          id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }

  override async update(
    id: string,
    data: MemberSegmentAffiliationUpdate,
  ): Promise<MemberSegmentAffiliation> {
    const transaction = this.transaction

    if (data.organizationId === undefined) {
      throw new Error('When updating member segment affiliation, organizationId is required.')
    }

    const affiliation = await this.findById(id)

    if (!affiliation) {
      throw new Error404()
    }

    await this.options.database.sequelize.query(
      `UPDATE "memberSegmentAffiliations" SET "organizationId" = :organizationId`,
      {
        replacements: {
          organizationId: data.organizationId,
        },
        type: QueryTypes.UPDATE,
        transaction,
      },
    )

    return this.findById(id)
  }

  override async destroyAll(ids: string[]): Promise<void> {
    const transaction = this.transaction

    const records = await this.findInIds(ids)

    if (ids.some((id) => records.find((r) => r.id === id) === undefined)) {
      throw new Error404()
    }

    await this.options.database.sequelize.query(
      `DELETE FROM "memberSegmentAffiliations" WHERE id in (:ids)
              `,
      {
        replacements: {
          ids,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )
  }

  async findInIds(ids: string[]): Promise<MemberSegmentAffiliation[]> {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "memberSegmentAffiliations"
             WHERE id in (:ids)
            `,
      {
        replacements: {
          ids,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records
  }

  private async updateAffiliation(memberId, segmentId, organizationId) {
    const transaction = this.transaction

    const query = `
      UPDATE activities
      SET "organizationId" = :organizationId
      WHERE "memberId" = :memberId
        AND "segmentId" = :segmentId
    `

    await this.options.database.sequelize.query(query, {
      replacements: {
        memberId,
        segmentId,
        organizationId,
      },
      type: QueryTypes.UPDATE,
      transaction,
    })
  }
}

export default MemberSegmentAffiliationRepository
