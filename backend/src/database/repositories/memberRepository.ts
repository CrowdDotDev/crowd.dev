import lodash, { chunk } from 'lodash'
import Sequelize, { QueryTypes } from 'sequelize'
import { KUBE_MODE, SERVICE } from '../../config'
import { ServiceType } from '../../config/configTypes'
import Error404 from '../../errors/Error404'
import { PlatformIdentities } from '../../serverless/integrations/types/messageTypes'
import ActivityDisplayService from '../../services/activityDisplayService'
import { PageData } from '../../types/common'
import { ALL_PLATFORM_TYPES, PlatformType } from '../../types/integrationEnums'
import { AttributeData } from '../attributes/attribute'
import { AttributeType } from '../attributes/types'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'
import QueryParser from './filters/queryParser'
import { JsonColumnInfo, QueryOutput } from './filters/queryTypes'
import RawQueryParser from './filters/rawQueryParser'
import SequelizeRepository from './sequelizeRepository'
import SettingsRepository from './settingsRepository'
import TenantRepository from './tenantRepository'
import {
  IActiveMemberData,
  IActiveMemberFilter,
  IMemberIdentity,
  mapUsernameToIdentities,
  IMemberMergeSuggestion,
} from './types/memberTypes'

const { Op } = Sequelize

const log: boolean = false

class MemberRepository {
  static async create(data, options: IRepositoryOptions, doPopulateRelations = true) {
    if (!data.username) {
      throw new Error('Username not set when creating member!')
    }

    const platforms = Object.keys(data.username) as PlatformType[]
    if (platforms.length === 0) {
      throw new Error('Username object does not have any platforms!')
    }

    data.username = mapUsernameToIdentities(data.username)

    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.member.create(
      {
        ...lodash.pick(data, [
          'displayName',
          'attributes',
          'emails',
          'lastEnriched',
          'enrichedBy',
          'contributions',
          'score',
          'reach',
          'joinedAt',
          'importHash',
        ]),
        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    const username: PlatformIdentities = data.username

    const seq = SequelizeRepository.getSequelize(options)
    const query = `
      insert into "memberIdentities"("memberId", platform, username, "sourceId", "tenantId", "integrationId")
      values(:memberId, :platform, :username, :sourceId, :tenantId, :integrationId);
    `

    for (const platform of Object.keys(username) as PlatformType[]) {
      const identities: any[] = username[platform]
      for (const identity of identities) {
        await seq.query(query, {
          replacements: {
            memberId: record.id,
            platform,
            username: identity.username,
            sourceId: identity.sourceId || null,
            integrationId: identity.integrationId || null,
            tenantId: tenant.id,
          },
          type: QueryTypes.INSERT,
          transaction,
        })
      }
    }

    await record.setActivities(data.activities || [], {
      transaction,
    })
    await record.setTags(data.tags || [], {
      transaction,
    })
    await record.setOrganizations(data.organizations || [], {
      transaction,
    })

    await record.setTasks(data.tasks || [], {
      transaction,
    })

    await record.setNotes(data.notes || [], {
      transaction,
    })

    await record.setNoMerge(data.noMerge || [], {
      transaction,
    })
    await record.setToMerge(data.toMerge || [], {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options, true, doPopulateRelations)
  }

  static async findSampleDataMemberIds(options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)
    const sampleMemberIds = await options.database.sequelize.query(
      `select m.id from members m
      where (m.attributes->'sample'->'default')::boolean is true
      and m."tenantId" = :tenantId;
    `,
      {
        replacements: {
          tenantId: currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return sampleMemberIds.map((i) => i.id)
  }

  static async findMembersWithMergeSuggestions(
    { limit = 20, offset = 0 },
    options: IRepositoryOptions,
  ) {
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const mems = await options.database.sequelize.query(
      `SELECT 
        "membersToMerge".id, 
        "membersToMerge"."toMergeId",
        "membersToMerge"."total_count",
        "membersToMerge"."similarity"
      FROM 
      (
        SELECT DISTINCT ON (Greatest(Hashtext(Concat(mem.id, mtm."toMergeId")), Hashtext(Concat(mtm."toMergeId", mem.id)))) 
            mem.id, 
            mtm."toMergeId", 
            mem."joinedAt", 
            COUNT(*) OVER() AS total_count,
            mtm."similarity"
          FROM 
            members mem 
            INNER JOIN "memberToMerge" mtm ON mem.id = mtm."memberId" 
          WHERE 
            mem."tenantId" = :tenantId
        ) AS "membersToMerge" 
      ORDER BY 
        "membersToMerge"."joinedAt" DESC 
      LIMIT :limit OFFSET :offset
    `,
      {
        replacements: {
          tenantId: currentTenant.id,
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (mems.length > 0) {
      const memberPromises = []
      const toMergePromises = []

      for (const mem of mems) {
        memberPromises.push(MemberRepository.findById(mem.id, options))
        toMergePromises.push(MemberRepository.findById(mem.toMergeId, options))
      }

      const memberResults = await Promise.all(memberPromises)
      const memberToMergeResults = await Promise.all(toMergePromises)

      const result = memberResults.map((i, idx) => ({
        members: [i, memberToMergeResults[idx]],
        similarity: mems[idx].similarity,
      }))
      return { rows: result, count: mems[0].total_count / 2, limit, offset }
    }

    return { rows: [{ members: [], similarity: 0 }], count: 0, limit, offset }
  }

  static async moveIdentitiesBetweenMembers(
    fromMemberId: string,
    toMemberId: string,
    identitiesToMove: any[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
      update "memberIdentities" 
      set 
        "memberId" = :newMemberId
      where 
        "tenantId" = :tenantId and 
        "memberId" = :oldMemberId and 
        platform = :platform and 
        username = :username;
    `

    for (const identity of identitiesToMove) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, count] = await seq.query(query, {
        replacements: {
          tenantId: tenant.id,
          oldMemberId: fromMemberId,
          newMemberId: toMemberId,
          platform: identity.platform,
          username: identity.username,
        },
        type: QueryTypes.UPDATE,
        transaction,
      })

      if (count !== 1) {
        throw new Error('One row should be updated!')
      }
    }
  }

  static async moveActivitiesBetweenMembers(
    fromMemberId: string,
    toMemberId: string,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
      update activities set "memberId" = :toMemberId where "memberId" = :fromMemberId and "tenantId" = :tenantId;
    `

    await seq.query(query, {
      replacements: {
        fromMemberId,
        toMemberId,
        tenantId: tenant.id,
      },
      type: QueryTypes.UPDATE,
      transaction,
    })
  }

  static async addToMerge(
    suggestions: IMemberMergeSuggestion[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    // Process suggestions in chunks of 100 or less
    const suggestionChunks = chunk(suggestions, 100)

    const insertValues = (
      memberId: string,
      toMergeId: string,
      similarity: number | null,
      index: number,
    ) => {
      const idPlaceholder = (key: string) => `${key}${index}`
      return {
        query: `(:${idPlaceholder('memberId')}, :${idPlaceholder('toMergeId')}, :${idPlaceholder(
          'similarity',
        )}, NOW(), NOW())`,
        replacements: {
          [idPlaceholder('memberId')]: memberId,
          [idPlaceholder('toMergeId')]: toMergeId,
          [idPlaceholder('similarity')]: similarity === null ? null : similarity,
        },
      }
    }

    for (const suggestionChunk of suggestionChunks) {
      const placeholders: string[] = []
      let replacements: Record<string, unknown> = {}

      suggestionChunk.forEach((suggestion, index) => {
        const { query, replacements: chunkReplacements } = insertValues(
          suggestion.members[0],
          suggestion.members[1],
          suggestion.similarity,
          index,
        )
        placeholders.push(query)
        replacements = { ...replacements, ...chunkReplacements }
      })

      const query = `
        INSERT INTO "memberToMerge" ("memberId", "toMergeId", "similarity", "createdAt", "updatedAt")
        VALUES ${placeholders.join(', ')};
      `

      await seq.query(query, {
        replacements,
        type: QueryTypes.INSERT,
        transaction,
      })
    }
  }

  static async removeToMerge(id, toMergeId, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const returnPlain = false

    const member = await this.findById(id, options, returnPlain)

    const toMergeMember = await this.findById(toMergeId, options, returnPlain)

    await member.removeToMerge(toMergeMember, { transaction })

    return this.findById(id, options)
  }

  static async addNoMerge(id, toMergeId, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const returnPlain = false

    const member = await this.findById(id, options, returnPlain)

    const toMergeMember = await this.findById(toMergeId, options, returnPlain)

    await member.addNoMerge(toMergeMember, { transaction })

    return this.findById(id, options)
  }

  static async removeNoMerge(id, toMergeId, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const returnPlain = false

    const member = await this.findById(id, options, returnPlain)

    const toMergeMember = await this.findById(toMergeId, options, returnPlain)

    await member.removeNoMerge(toMergeMember, { transaction })

    return this.findById(id, options)
  }

  static async memberExists(
    username,
    platform,
    options: IRepositoryOptions,
    doPopulateRelations = true,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
    with identities as (select mi."memberId",
                           array_agg(distinct mi.platform)             as identities,
                           jsonb_object_agg(mi.platform, mi.usernames) as username
                    from (select "memberId",
                                 platform,
                                 array_agg(username) as usernames
                          from (select "memberId",
                                       platform,
                                       username,
                                       "createdAt",
                                       row_number() over (partition by "memberId", platform order by "createdAt" desc) =
                                       1 as is_latest
                                from "memberIdentities" where "tenantId" = :tenantId) sub
                          where is_latest
                          group by "memberId", platform) mi
                    group by mi."memberId")
      select m."id",
            m."displayName",
            m."attributes",
            m."emails",
            m."score",
            m."lastEnriched",
            m."enrichedBy",
            m."contributions",
            m."reach",
            m."joinedAt",
            m."importHash",
            m."createdAt",
            m."updatedAt",
            m."deletedAt",
            m."tenantId",
            m."createdById",
            m."updatedById",
            i.username
      from members m
              inner join "memberIdentities" mi on m.id = mi."memberId"
              inner join identities i on i."memberId" = m.id
      where mi."tenantId" = :tenantId
        and mi.platform = :platform
        and mi.username in (:usernames)
    `

    const usernames: string[] = []
    if (typeof username === 'string') {
      usernames.push(username)
    } else if (Array.isArray(username)) {
      usernames.push(...username)
    } else {
      throw new Error(
        'Unknown username format! Allowed formats are string or string[]. For example: "username" or ["username1", "username2"]',
      )
    }

    const records = await options.database.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: {
        tenantId: currentTenant.id,
        platform,
        usernames,
      },
      transaction,
      model: options.database.member,
    })
    if (records.length === 0) {
      return null
    }
    if (doPopulateRelations) {
      return this._populateRelations(records[0], options)
    }

    return records[0].get({ plain: true })
  }

  static async update(id, data, options: IRepositoryOptions, doPopulateRelations = true) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.member.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'displayName',
          'attributes',
          'emails',
          'lastEnriched',
          'enrichedBy',
          'contributions',
          'score',
          'reach',
          'joinedAt',
          'importHash',
        ]),

        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    if (data.activities) {
      await record.setActivities(data.activities || [], {
        transaction,
      })
    }

    if (data.tags) {
      await record.setTags(data.tags || [], {
        transaction,
      })
    }

    if (data.tasks) {
      await record.setTasks(data.tasks || [], {
        transaction,
      })
    }

    if (data.notes) {
      await record.setNotes(data.notes || [], {
        transaction,
      })
    }

    if (data.organizations) {
      await record.setOrganizations(data.organizations || [], {
        transaction,
      })
    }

    if (data.noMerge) {
      await record.setNoMerge(data.noMerge || [], {
        transaction,
      })
    }

    if (data.toMerge) {
      await record.setToMerge(data.toMerge || [], {
        transaction,
      })
    }
    const seq = SequelizeRepository.getSequelize(options)

    if (data.username) {
      data.username = mapUsernameToIdentities(data.username)

      const platforms = Object.keys(data.username) as PlatformType[]
      if (platforms.length > 0) {
        const query = `
          insert into "memberIdentities"("memberId", platform, username, "sourceId", "tenantId", "integrationId")
          values (:memberId, :platform, :username, :sourceId, :tenantId, :integrationId);
          `
        const deleteQuery = `
          delete from "memberIdentities"
          where ("memberId", "tenantId", "platform", "username") in
                (select mi."memberId", mi."tenantId", mi."platform", mi."username"
                from "memberIdentities" mi
                          join (select :memberId::uuid            as memberid,
                                      :tenantId::uuid            as tenantid,
                                      unnest(:platforms::text[]) as platform,
                                      unnest(:usernames::text[]) as username) as combinations
                              on mi."memberId" = combinations.memberid
                                  and mi."tenantId" = combinations.tenantid
                                  and mi."platform" = combinations.platform
                                  and mi."username" = combinations.username);`

        const platformsToDelete: string[] = []
        const usernamesToDelete: string[] = []

        for (const platform of platforms) {
          const identities = data.username[platform]

          for (const identity of identities) {
            if (identity.delete) {
              platformsToDelete.push(identity.platform)
              usernamesToDelete.push(identity.username)
            } else {
              await seq.query(query, {
                replacements: {
                  memberId: record.id,
                  platform,
                  username: identity.username,
                  sourceId: identity.sourceId || null,
                  integrationId: identity.integrationId || null,
                  tenantId: currentTenant.id,
                },
                type: QueryTypes.INSERT,
                transaction,
              })
            }
          }
        }

        if (platformsToDelete.length > 0) {
          await seq.query(deleteQuery, {
            replacements: {
              tenantId: currentTenant.id,
              memberId: record.id,
              platforms: `{${platformsToDelete.join(',')}}`,
              usernames: `{${usernamesToDelete.join(',')}}`,
            },
            type: QueryTypes.DELETE,
            transaction,
          })
        }
      }
    }

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options, true, doPopulateRelations)
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.member.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await record.destroy({
      force,
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async destroyBulk(ids, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    await options.database.member.destroy({
      where: {
        id: ids,
        tenantId: currentTenant.id,
      },
      force,
      transaction,
    })
  }

  static async getIdentities(
    memberIds: string[],
    options: IRepositoryOptions,
  ): Promise<Map<string, IMemberIdentity[]>> {
    const results = new Map<string, IMemberIdentity[]>()

    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    const query = `
      select "memberId", platform, username, "sourceId", "integrationId", "createdAt" from "memberIdentities" where "memberId" in (:memberIds)
      order by "createdAt" asc;
    `

    const data = await seq.query(query, {
      replacements: {
        memberIds,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    for (const id of memberIds) {
      results.set(id, [])
    }

    for (const res of data as any[]) {
      const { memberId, platform, username, sourceId, integrationId, createdAt } = res
      const identities = results.get(memberId)

      identities.push({
        platform,
        username,
        sourceId,
        integrationId,
        createdAt,
      })
    }

    return results
  }

  static async findById(
    id,
    options: IRepositoryOptions,
    returnPlain = true,
    doPopulateRelations = true,
    ignoreTenant = false,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const where: any = {
      id,
    }

    if (!ignoreTenant) {
      const currentTenant = SequelizeRepository.getCurrentTenant(options)
      where.tenantId = currentTenant.id
    }

    const record = await options.database.member.findOne({
      where,
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    if (doPopulateRelations) {
      return this._populateRelations(record, options, returnPlain)
    }
    const data = record.get({ plain: returnPlain })

    const identities = (await this.getIdentities([data.id], options)).get(data.id)

    data.username = {}
    for (const identity of identities) {
      if (data.username[identity.platform]) {
        data.username[identity.platform].push(identity.username)
      } else {
        data.username[identity.platform] = [identity.username]
      }
    }

    return data
  }

  static async filterIdInTenant(id, options: IRepositoryOptions) {
    return lodash.get(await this.filterIdsInTenant([id], options), '[0]', null)
  }

  static async filterIdsInTenant(ids, options: IRepositoryOptions) {
    if (!ids || !ids.length) {
      return []
    }

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const where = {
      id: {
        [Op.in]: ids,
      },
      tenantId: currentTenant.id,
    }

    const records = await options.database.member.findAll({
      attributes: ['id'],
      where,
      transaction,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.member.count({
      where: {
        ...filter,
        tenantId: tenant.id,
      },
      transaction,
    })
  }

  static async findAndCountActive(
    filter: IActiveMemberFilter,
    limit: number,
    offset: number,
    orderBy: string,
    options: IRepositoryOptions,
  ): Promise<PageData<IActiveMemberData>> {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const conditions = ['m."tenantId" = :tenantId']
    const parameters: any = {
      tenantId: tenant.id,
      periodStart: filter.activityTimestampFrom,
      periodEnd: filter.activityTimestampTo,
    }

    if (filter.isTeamMember === true) {
      conditions.push("COALESCE((m.attributes->'isTeamMember'->'default')::boolean, false) = true")
    } else if (filter.isTeamMember === false) {
      conditions.push("COALESCE((m.attributes->'isTeamMember'->'default')::boolean, false) = false")
    }

    if (filter.isBot === true) {
      conditions.push("COALESCE((m.attributes->'isBot'->'default')::boolean, false) = true")
    } else if (filter.isBot === false) {
      conditions.push("COALESCE((m.attributes->'isBot'->'default')::boolean, false) = false")
    }

    if (filter.isOrganization === true) {
      conditions.push(
        "COALESCE((m.attributes->'isOrganization'->'default')::boolean, false) = true",
      )
    } else if (filter.isOrganization === false) {
      conditions.push(
        "COALESCE((m.attributes->'isOrganization'->'default')::boolean, false) = false",
      )
    }

    const activityConditions = ['1=1']

    if (filter.platforms && filter.platforms.length > 0) {
      activityConditions.push('platform in (:platforms)')
      parameters.platforms = filter.platforms
    }

    if (filter.activityIsContribution) {
      activityConditions.push('"isContribution" = (:isContribution)')
      parameters.isContribution = filter.activityIsContribution
    }

    const conditionsString = conditions.join(' and ')
    const activityConditionsString = activityConditions.join(' and ')

    const direction = orderBy.split('_')[1].toLowerCase() === 'desc' ? 'desc' : 'asc'
    let orderString: string
    if (orderBy.startsWith('activityCount')) {
      orderString = `ad."activityCount" ${direction}`
    } else if (orderBy.startsWith('activeDaysCount')) {
      orderString = `ad."activeDaysCount" ${direction}`
    } else {
      throw new Error(`Invalid order by: ${orderBy}`)
    }

    const limitCondition = `limit ${limit} offset ${offset}`
    const query = `
        with orgs as (select mo."memberId", json_agg(row_to_json(o.*)) as organizations
                      from "memberOrganizations" mo
                               inner join organizations o on mo."organizationId" = o.id
                      group by mo."memberId"),
             activity_data as (select "memberId",
                                      count(id)                       as "activityCount",
                                      count(distinct timestamp::date) as "activeDaysCount"
                               from activities
                               where ${activityConditionsString} and 
                                     timestamp >= :periodStart and 
                                     timestamp < :periodEnd
                               group by "memberId"),
              identities as (select mi."memberId",
                                        array_agg(distinct mi.platform)             as identities,
                                        jsonb_object_agg(mi.platform, mi.usernames) as username
                                  from (select "memberId",
                                              platform,
                                              array_agg(username) as usernames
                                        from (select "memberId",
                                                    platform,
                                                    username,
                                                    "createdAt",
                                                    row_number() over (partition by "memberId", platform order by "createdAt" desc) =
                                                    1 as is_latest
                                              from "memberIdentities" where "tenantId" = :tenantId) sub
                                        where is_latest
                                        group by "memberId", platform) mi
                                  group by mi."memberId")
          select m.id,
             m."displayName",
             i.username,
             i.identities,
             m.attributes,
             ad."activityCount",
             ad."activeDaysCount",
             coalesce(o.organizations, json_build_array()) as organizations,
             count(*) over ()                  as "totalCount"
      from members m
               inner join activity_data ad on ad."memberId" = m.id
               inner join identities i on i."memberId" = m.id
               left join orgs o on o."memberId" = m.id
      where ${conditionsString}
      order by ${orderString}
      ${limitCondition};
    `

    options.log.debug(
      { query, filter, orderBy, limit, offset, test: orderBy.split('_')[1].toLowerCase() },
      'Active members query!',
    )

    const results = await seq.query(query, {
      replacements: parameters,
      type: QueryTypes.SELECT,
      transaction,
    })

    if (results.length === 0) {
      return {
        rows: [],
        count: 0,
        offset,
        limit,
      }
    }

    const count = parseInt((results[0] as any).totalCount, 10)
    const rows: IActiveMemberData[] = results.map((r) => {
      const row = r as any
      return {
        id: row.id,
        displayName: row.displayName,
        username: row.username,
        attributes: row.attributes,
        organizations: row.organizations,
        activityCount: parseInt(row.activityCount, 10),
        activeDaysCount: parseInt(row.activeDaysCount, 10),
      }
    })

    return {
      rows,
      count,
      offset,
      limit,
    }
  }

  public static MEMBER_QUERY_FILTER_COLUMN_MAP: Map<string, string> = new Map([
    ['isOrganization', "coalesce((m.attributes -> 'isOrganization' -> 'default')::boolean, false)"],
    ['isTeamMember', "coalesce((m.attributes -> 'isTeamMember' -> 'default')::boolean, false)"],
    ['isBot', "coalesce((m.attributes -> 'isBot' -> 'default')::boolean, false)"],
    ['activeOn', 'aggs."activeOn"'],
    ['activityCount', 'aggs."activityCount"'],
    ['activityTypes', 'aggs."activityTypes"'],
    ['activeDaysCount', 'aggs."activeDaysCount"'],
    ['lastActive', 'aggs."lastActive"'],
    ['averageSentiment', 'aggs."averageSentiment"'],
    ['identities', 'aggs.identities'],
    ['reach', "(m.reach -> 'total')::integer"],
    ['numberOfOpenSourceContributions', 'coalesce(jsonb_array_length(m.contributions), 0)'],

    ['id', 'm.id'],
    ['displayName', 'm."displayName"'],
    ['tenantId', 'm."tenantId"'],
    ['score', 'm.score'],
    ['lastEnriched', 'm."lastEnriched"'],
    ['joinedAt', 'm."joinedAt"'],
    ['importHash', 'm."importHash"'],
    ['createdAt', 'm."createdAt"'],
    ['updatedAt', 'm."updatedAt"'],
    ['emails', 'm.emails'],
  ])

  static async findAndCountAllv2(
    {
      filter = {} as any,
      limit = 20,
      offset = 0,
      orderBy = 'joinedAt_DESC',
      countOnly = false,
      attributesSettings = [] as AttributeData[],
    },
    options: IRepositoryOptions,
  ): Promise<PageData<any>> {
    const tenant = SequelizeRepository.getCurrentTenant(options)
    const seq = SequelizeRepository.getSequelize(options)

    const params: any = {
      tenantId: tenant.id,
      limit,
      offset,
    }

    let orderByString = ''
    const orderByParts = orderBy.split('_')
    const direction = orderByParts[1].toLowerCase()
    switch (orderByParts[0]) {
      case 'joinedAt':
        orderByString = 'm."joinedAt"'
        break
      case 'displayName':
        orderByString = 'm."displayName"'
        break
      case 'reach':
        orderByString = "(m.reach ->> 'total')::int"
        break
      case 'score':
        orderByString = 'm.score'
        break
      case 'lastActive':
        orderByString = 'aggs."lastActive"'
        break
      case 'averageSentiment':
        orderByString = 'aggs."averageSentiment"'
        break
      case 'activeDaysCount':
        orderByString = 'aggs."activeDaysCount"'
        break
      case 'activityCount':
        orderByString = 'aggs."activityCount"'
        break
      case 'numberOfOpenSourceContributions':
        orderByString = '"numberOfOpenSourceContributions"'
        break

      default:
        throw new Error(`Invalid order by: ${orderBy}!`)
    }
    orderByString = `${orderByString} ${direction}`

    const jsonColumnInfos: JsonColumnInfo[] = [
      {
        property: 'attributes',
        column: 'm.attributes',
        attributeInfos: attributesSettings,
      },
      {
        property: 'username',
        column: 'aggs.username',
        attributeInfos: ALL_PLATFORM_TYPES.map((p) => ({
          name: p,
          type: AttributeType.STRING,
        })),
      },
      {
        property: 'tags',
        column: 'mt.all_ids',
        attributeInfos: [],
      },
      {
        property: 'organizations',
        column: 'mo.all_ids',
        attributeInfos: [],
      },
    ]

    let filterString = RawQueryParser.parseFilters(
      filter,
      MemberRepository.MEMBER_QUERY_FILTER_COLUMN_MAP,
      jsonColumnInfos,
      params,
    )
    if (filterString.trim().length === 0) {
      filterString = '1=1'
    }

    const query = `
    with to_merge_data as (select mtm."memberId", string_agg(distinct mtm."toMergeId"::text, ',') as to_merge_ids
                       from "memberToMerge" mtm
                                inner join members m on mtm."memberId" = m.id
                                inner join members m2 on mtm."toMergeId" = m2.id
                       where m."tenantId" = :tenantId
                         and m2."deletedAt" is null
                       group by mtm."memberId"),
     no_merge_data as (select mnm."memberId", string_agg(distinct mnm."noMergeId"::text, ',') as no_merge_ids
                       from "memberNoMerge" mnm
                                inner join members m on mnm."memberId" = m.id
                                inner join members m2 on mnm."noMergeId" = m2.id
                       where m."tenantId" = :tenantId
                         and m2."deletedAt" is null
                       group by mnm."memberId"),
     member_tags as (select mt."memberId",
                            json_agg(
                                    json_build_object(
                                            'id', t.id,
                                            'name', t.name
                                        )
                                ) as all_tags,
                            jsonb_agg(t.id) as all_ids
                     from "memberTags" mt
                              inner join members m on mt."memberId" = m.id
                              inner join tags t on mt."tagId" = t.id
                     where m."tenantId" = :tenantId
                       and m."deletedAt" is null
                       and t."tenantId" = :tenantId
                       and t."deletedAt" is null
                     group by mt."memberId"),
     member_organizations as (select mo."memberId",
                                     json_agg(
                                             row_to_json(o.*)
                                         ) as all_organizations,
                                     jsonb_agg(o.id) as all_ids
                              from "memberOrganizations" mo
                                       inner join members m on mo."memberId" = m.id
                                       inner join organizations o on mo."organizationId" = o.id
                              where m."tenantId" = :tenantId
                                and m."deletedAt" is null
                                and o."tenantId" = :tenantId
                                and o."deletedAt" is null
                              group by mo."memberId")
select m.id,
       m."displayName",
       m.attributes,
       m.emails,
       m."tenantId",
       m.score,
       m."lastEnriched",
       m.contributions,
       m."joinedAt",
       m."importHash",
       m."createdAt",
       m."updatedAt",
       m.reach,
       tmd.to_merge_ids                            as "toMergeIds",
       nmd.no_merge_ids                            as "noMergeIds",
       aggs.username,
       aggs.identities,
       aggs."activeOn",
       aggs."activityCount",
       aggs."activityTypes",
       aggs."activeDaysCount",
       aggs."lastActive",
       aggs."averageSentiment",
       coalesce(mt.all_tags, json_build_array())   as tags,
       coalesce(mo.all_organizations, json_build_array()) as organizations,
       coalesce(jsonb_array_length(m.contributions), 0) as "numberOfOpenSourceContributions"
from members m
         inner join "memberActivityAggregatesMVs" aggs on aggs.id = m.id
         left join to_merge_data tmd on m.id = tmd."memberId"
         left join no_merge_data nmd on m.id = nmd."memberId"
         left join member_tags mt on m.id = mt."memberId"
         left join member_organizations mo on m.id = mo."memberId"
where m."deletedAt" is null
  and m."tenantId" = :tenantId
  and ${filterString}
order by ${orderByString}
limit :limit offset :offset;
    `

    const countQuery = `
with member_tags as (select mt."memberId",
                            jsonb_agg(t.id) as all_ids
                     from "memberTags" mt
                              inner join members m on mt."memberId" = m.id
                              inner join tags t on mt."tagId" = t.id
                     where m."tenantId" = :tenantId
                       and m."deletedAt" is null
                       and t."tenantId" = :tenantId
                       and t."deletedAt" is null
                     group by mt."memberId"),
    member_organizations as (select mo."memberId",
                     jsonb_agg(o.id) as all_ids
              from "memberOrganizations" mo
                       inner join members m on mo."memberId" = m.id
                       inner join organizations o on mo."organizationId" = o.id
              where m."tenantId" = :tenantId
                and m."deletedAt" is null
                and o."tenantId" = :tenantId
                and o."deletedAt" is null
              group by mo."memberId")    
select count(m.id) as "totalCount"
from members m
         inner join "memberActivityAggregatesMVs" aggs on aggs.id = m.id
         left join member_tags mt on m.id = mt."memberId"
         left join member_organizations mo on m.id = mo."memberId"
where m."deletedAt" is null
  and m."tenantId" = :tenantId
  and ${filterString};
    `

    if (countOnly) {
      const countResults = await seq.query(countQuery, {
        replacements: params,
        type: QueryTypes.SELECT,
      })
      const count = parseInt((countResults[0] as any).totalCount, 10)

      return {
        rows: [],
        count,
        limit,
        offset,
      }
    }

    const [results, countResults] = await Promise.all([
      seq.query(query, {
        replacements: params,
        type: QueryTypes.SELECT,
      }),
      seq.query(countQuery, {
        replacements: params,
        type: QueryTypes.SELECT,
      }),
    ])

    const memberIds = results.map((r) => (r as any).id)
    if (memberIds.length > 0) {
      const lastActivities = await seq.query(
        `
          with raw_data as (
              select *, row_number() over (partition by "memberId" order by timestamp desc) as rn from activities
              where "tenantId" = :tenantId and "memberId" in (:memberIds)
          )
          select * from raw_data
          where rn = 1;
      `,
        {
          replacements: {
            tenantId: tenant.id,
            memberIds,
          },
          type: QueryTypes.SELECT,
        },
      )

      for (const row of results) {
        const r = row as any
        r.lastActivity = lastActivities.find((a) => (a as any).memberId === r.id)
        if (r.lastActivity) {
          r.lastActivity.display = ActivityDisplayService.getDisplayOptions(
            r.lastActivity,
            SettingsRepository.getActivityTypes(options),
          )
        }
      }
    }

    const count = parseInt((countResults[0] as any).totalCount, 10)

    return {
      rows: results,
      count,
      limit,
      offset,
    }
  }

  static async findAndCountAll(
    {
      filter = {} as any,
      advancedFilter = null as any,
      limit = 0,
      offset = 0,
      orderBy = '',
      attributesSettings = [] as AttributeData[],
      exportMode = false,
    },

    options: IRepositoryOptions,
  ) {
    let customOrderBy: Array<any> = []
    const include = [
      {
        model: options.database.memberActivityAggregatesMV,
        attributes: [],
        required: true,
        as: 'memberActivityAggregatesMVs',
      },
      {
        model: options.database.member,
        as: 'toMerge',
        attributes: [],
        through: {
          attributes: [],
        },
      },
      {
        model: options.database.member,
        as: 'noMerge',
        attributes: [],
        through: {
          attributes: [],
        },
      },
    ]

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('activityCount', orderBy),
    )

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('activeDaysCount', orderBy),
    )

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('lastActive', orderBy),
    )

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('averageSentiment', orderBy),
    )

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('numberOfOpenSourceContributions', orderBy),
    )

    if (orderBy.includes('reach')) {
      customOrderBy = customOrderBy.concat([
        Sequelize.literal(`("member".reach->'total')::int`),
        orderBy.split('_')[1],
      ])
    }

    if (!advancedFilter) {
      advancedFilter = { and: [] }

      if (filter) {
        if (filter.id) {
          advancedFilter.and.push({ id: filter.id })
        }

        if (filter.platform) {
          advancedFilter.and.push({
            platform: {
              jsonContains: filter.platform,
            },
          })
        }

        if (filter.tags) {
          advancedFilter.and.push({
            tags: filter.tags,
          })
        }

        if (filter.organizations) {
          advancedFilter.and.push({
            organizations: filter.organizations,
          })
        }

        // TODO: member identitites FIX
        if (filter.username) {
          advancedFilter.and.push({ username: { jsonContains: filter.username } })
        }

        if (filter.displayName) {
          advancedFilter.and.push({
            displayName: {
              textContains: filter.displayName,
            },
          })
        }

        if (filter.emails) {
          advancedFilter.and.push({
            emails: {
              contains: filter.emails,
            },
          })
        }

        if (filter.scoreRange) {
          const [start, end] = filter.scoreRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              score: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              score: {
                lte: end,
              },
            })
          }
        }

        if (filter.createdAtRange) {
          const [start, end] = filter.createdAtRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              createdAt: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              createdAt: {
                lte: end,
              },
            })
          }
        }

        if (filter.reachRange) {
          const [start, end] = filter.reachRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              reach: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              reach: {
                lte: end,
              },
            })
          }
        }

        if (filter.activityCountRange) {
          const [start, end] = filter.activityCountRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              activityCount: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              activityCount: {
                lte: end,
              },
            })
          }
        }

        if (filter.activityTypes) {
          advancedFilter.and.push({
            activityTypes: {
              overlap: filter.activityTypes.split(','),
            },
          })
        }
        if (filter.activeDaysCountRange) {
          const [start, end] = filter.activeDaysCountRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              activeDaysCount: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              activeDaysCount: {
                lte: end,
              },
            })
          }
        }

        if (filter.joinedAtRange) {
          const [start, end] = filter.joinedAtRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              joinedAt: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              joinedAt: {
                lte: end,
              },
            })
          }
        }

        if (filter.lastActiveRange) {
          const [start, end] = filter.lastActiveRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              lastActive: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              lastActive: {
                lte: end,
              },
            })
          }
        }

        if (filter.averageSentimentRange) {
          const [start, end] = filter.averageSentimentRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              averageSentiment: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              averageSentiment: {
                lte: end,
              },
            })
          }
        }

        if (filter.numberOfOpenSourceContributionsRange) {
          const [start, end] = filter.numberOfOpenSourceContributionsRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              numberOfOpenSourceContributions: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              numberOfOpenSourceContributions: {
                lte: end,
              },
            })
          }
        }
      }
    }

    const {
      dynamicAttributesDefaultNestedFields,
      dynamicAttributesPlatformNestedFields,
      dynamicAttributesProjection,
    } = await MemberRepository.getDynamicAttributesLiterals(attributesSettings, options)

    const activityCount = Sequelize.literal(`"memberActivityAggregatesMVs"."activityCount"`)
    const activityTypes = Sequelize.literal(`"memberActivityAggregatesMVs"."activityTypes"`)
    const activeDaysCount = Sequelize.literal(`"memberActivityAggregatesMVs"."activeDaysCount"`)
    const lastActive = Sequelize.literal(`"memberActivityAggregatesMVs"."lastActive"`)
    const activeOn = Sequelize.literal(`"memberActivityAggregatesMVs"."activeOn"`)

    const averageSentiment = Sequelize.literal(`"memberActivityAggregatesMVs"."averageSentiment"`)
    const identities = Sequelize.literal(`"memberActivityAggregatesMVs"."identities"`)
    const username = Sequelize.literal(`"memberActivityAggregatesMVs"."username"`)

    const toMergeArray = Sequelize.literal(`STRING_AGG( distinct "toMerge"."id"::text, ',')`)
    const noMergeArray = Sequelize.literal(`STRING_AGG( distinct "noMerge"."id"::text, ',')`)

    const numberOfOpenSourceContributions = Sequelize.literal(
      `COALESCE(jsonb_array_length("member"."contributions"), 0)`,
    )

    const parser = new QueryParser(
      {
        nestedFields: {
          ...dynamicAttributesDefaultNestedFields,
          reach: 'reach.total',
          username: 'username.asString',
        },
        aggregators: {
          activityCount,
          activityTypes,
          activeDaysCount,
          lastActive,
          averageSentiment,
          activeOn,
          identities,
          username,
          numberOfOpenSourceContributions,
          ...dynamicAttributesPlatformNestedFields,
          'reach.total': Sequelize.literal(`("member".reach->'total')::int`),
          'username.asString': Sequelize.literal(
            `CAST("memberActivityAggregatesMVs"."username" AS TEXT)`,
          ),
          ...SequelizeFilterUtils.getNativeTableFieldAggregations(
            [
              'id',
              'attributes',
              'displayName',
              'emails',
              'score',
              'lastEnriched',
              'enrichedBy',
              'contributions',
              'joinedAt',
              'importHash',
              'reach',
              'createdAt',
              'updatedAt',
              'createdById',
              'updatedById',
            ],
            'member',
          ),
        },
        manyToMany: {
          tags: {
            table: 'members',
            model: 'member',
            relationTable: {
              name: 'memberTags',
              from: 'memberId',
              to: 'tagId',
            },
          },
          organizations: {
            table: 'members',
            model: 'member',
            relationTable: {
              name: 'memberOrganizations',
              from: 'memberId',
              to: 'organizationId',
            },
          },
        },
        // TODO: member identitites FIX
        // customOperators: {
        //   username: {
        //     model: 'member',
        //     column: 'username',
        //   },
        //   platform: {
        //     model: 'member',
        //     column: 'username',
        //   },
        // },
        exportMode,
      },
      options,
    )

    const parsed: QueryOutput = parser.parse({
      filter: advancedFilter,
      orderBy: orderBy || ['joinedAt_DESC'],
      limit,
      offset,
    })

    let order = parsed.order

    if (customOrderBy.length > 0) {
      order = [customOrderBy]
    }

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.member.findAndCountAll({
      where: parsed.where ? parsed.where : {},
      having: parsed.having ? parsed.having : {},
      include,
      attributes: [
        ...SequelizeFilterUtils.getLiteralProjections(
          [
            'id',
            'attributes',
            'displayName',
            'emails',
            'tenantId',
            'score',
            'lastEnriched',
            'enrichedBy',
            'contributions',
            'joinedAt',
            'importHash',
            'createdAt',
            'updatedAt',
            'createdById',
            'updatedById',
            'reach',
          ],
          'member',
        ),
        [activeOn, 'activeOn'],
        [identities, 'identities'],
        [username, 'username'],
        [activityCount, 'activityCount'],
        [activityTypes, 'activityTypes'],
        [activeDaysCount, 'activeDaysCount'],
        [lastActive, 'lastActive'],
        [averageSentiment, 'averageSentiment'],
        [toMergeArray, 'toMergeIds'],
        [noMergeArray, 'noMergeIds'],
        [numberOfOpenSourceContributions, 'numberOfOpenSourceContributions'],
        ...dynamicAttributesProjection,
      ],
      limit: parsed.limit || 50,
      offset: offset ? Number(offset) : 0,
      order,
      subQuery: false,
      group: [
        'member.id',
        'memberActivityAggregatesMVs.activeOn',
        'memberActivityAggregatesMVs.activityCount',
        'memberActivityAggregatesMVs.activityTypes',
        'memberActivityAggregatesMVs.activeDaysCount',
        'memberActivityAggregatesMVs.lastActive',
        'memberActivityAggregatesMVs.averageSentiment',
        'memberActivityAggregatesMVs.username',
        'memberActivityAggregatesMVs.identities',
        'toMerge.id',
      ],
      distinct: true,
    })

    rows = await this._populateRelationsForRows(rows, attributesSettings, exportMode)

    return {
      rows,
      count: count.length,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    }
  }

  /**
   * Returns sequelize literals for dynamic member attributes.
   * @param memberAttributeSettings
   * @param options
   * @returns
   */
  static async getDynamicAttributesLiterals(
    memberAttributeSettings: AttributeData[],
    options: IRepositoryOptions,
  ) {
    // get possible platforms for a tenant
    const availableDynamicAttributePlatformKeys = [
      'default',
      'custom',
      ...(await TenantRepository.getAvailablePlatforms(options.currentTenant.id, options)).map(
        (p) => p.platform,
      ),
    ]

    const dynamicAttributesDefaultNestedFields = memberAttributeSettings.reduce(
      (acc, attribute) => {
        acc[attribute.name] = `attributes.${attribute.name}.default`
        return acc
      },
      {},
    )

    const dynamicAttributesPlatformNestedFields = memberAttributeSettings.reduce(
      (acc, attribute) => {
        for (const key of availableDynamicAttributePlatformKeys) {
          if (attribute.type === AttributeType.NUMBER) {
            acc[`attributes.${attribute.name}.${key}`] = Sequelize.literal(
              `("member"."attributes"#>>'{${attribute.name},${key}}')::integer`,
            )
          } else if (attribute.type === AttributeType.BOOLEAN) {
            acc[`attributes.${attribute.name}.${key}`] = Sequelize.literal(
              `("member"."attributes"#>>'{${attribute.name},${key}}')::boolean`,
            )
          } else if (attribute.type === AttributeType.MULTI_SELECT) {
            acc[`attributes.${attribute.name}.${key}`] = Sequelize.literal(
              `ARRAY( SELECT jsonb_array_elements_text("member"."attributes"#>'{${attribute.name},${key}}'))`,
            )
          } else {
            acc[`attributes.${attribute.name}.${key}`] = Sequelize.literal(
              `"member"."attributes"#>>'{${attribute.name},${key}}'`,
            )
          }
        }
        return acc
      },
      {},
    )

    const dynamicAttributesProjection = memberAttributeSettings.reduce((acc, attribute) => {
      for (const key of availableDynamicAttributePlatformKeys) {
        if (key === 'default') {
          acc.push([
            Sequelize.literal(`"member"."attributes"#>>'{${attribute.name},default}'`),
            attribute.name,
          ])
        } else {
          acc.push([
            Sequelize.literal(`"member"."attributes"#>>'{${attribute.name},${key}}'`),
            `${attribute.name}.${key}`,
          ])
        }
      }
      return acc
    }, [])

    return {
      dynamicAttributesDefaultNestedFields,
      dynamicAttributesPlatformNestedFields,
      availableDynamicAttributePlatformKeys,
      dynamicAttributesProjection,
    }
  }

  static async findAllAutocomplete(query, limit, options: IRepositoryOptions) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const whereAnd: Array<any> = [
      {
        tenantId: tenant.id,
      },
    ]

    if (query) {
      whereAnd.push({
        [Op.or]: [
          {
            displayName: {
              [Op.iLike]: `${query}%`,
            },
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.member.findAll({
      attributes: ['id', 'displayName', 'attributes', 'emails'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['displayName', 'ASC']],
      include: [
        {
          model: options.database.organization,
          attributes: ['id', 'name'],
          as: 'organizations',
        },
      ],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.displayName,
      email: record.emails.length > 0 ? record.emails[0] : null,
      avatar: record.attributes?.avatarUrl?.default || null,
      organizations: record.organizations.map((org) => ({
        id: org.id,
        name: org.name,
      })),
    }))
  }

  static async mergeSuggestionsByUsername(
    numberOfHours,
    options: IRepositoryOptions,
  ): Promise<IMemberMergeSuggestion[]> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
    -- Define a CTE named "new_members" to get members created in the last 2 hours with a specific tenantId
    WITH new_members AS (
      SELECT id, "tenantId"
      FROM members
      WHERE "createdAt" >= now() - INTERVAL :numberOfHours
      AND "tenantId" = :tenantId
    ),
    -- Define a CTE named "identity_join" to find members with the same usernames across different platforms
    identity_join AS (
      SELECT
        m1.id AS m1_id,
        m2.id AS m2_id,
        i1.platform AS i1_platform,
        i2.platform AS i2_platform,
        i1.username AS i1_username,
        i2.username AS i2_username
      FROM new_members m1
      -- Join memberIdentities and members to get related records
      JOIN "memberIdentities" i1 ON m1.id = i1."memberId"
      JOIN "memberIdentities" i2 ON i1.username = i2.username AND i1.platform <> i2.platform
      JOIN members m2 ON m2.id = i2."memberId"
      -- Filter out records where tenantId is different and memberIds are the same
      WHERE m1."tenantId" = m2."tenantId"
      AND m1.id <> m2.id
      -- Filter out records present in memberToMerge table
      AND NOT EXISTS (
        SELECT 1
        FROM "memberToMerge"
        WHERE (
          "memberId" = m1.id
          AND "toMergeId" = m2.id
        ) OR (
          "memberId" = m2.id
          AND "toMergeId" = m1.id
        )
      )
      -- Filter out records present in memberNoMerge table
      AND NOT EXISTS (
        SELECT 1
        FROM "memberNoMerge"
        WHERE (
          "memberId" = m1.id
          AND "noMergeId" = m2.id
        ) OR (
          "memberId" = m2.id
          AND "noMergeId" = m1.id
        )
      )
    )
    -- Select everything from the final CTE "identity_join"
    SELECT *
    FROM identity_join;`

    const suggestions = await seq.query(query, {
      replacements: {
        tenantId: tenant.id,
        numberOfHours: `${numberOfHours} hours`,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    return suggestions.map((suggestion: any) => ({
      members: [suggestion.m1_id, suggestion.m2_id],
      // 100% confidence only from emails
      similarity: 0.95,
    }))
  }

  static async mergeSuggestionsByEmail(
    numberOfHours,
    options: IRepositoryOptions,
  ): Promise<IMemberMergeSuggestion[]> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
    -- Define a CTE named "new_members" to get members created in the last 7 days with a specific tenantId and their emails
    WITH new_members AS (
      SELECT id, "tenantId", emails
      FROM members
      WHERE "createdAt" >= now() - INTERVAL :numberOfHours
      AND "tenantId" = :tenantId
    ),
    -- Define a CTE named "email_join" to find overlapping emails across different members
    email_join AS (
      SELECT
        m1.id AS m1_id,            -- Member 1 ID
        m2.id AS m2_id,            -- Member 2 ID
        m1.emails AS m1_emails,    -- Member 1 emails
        m2.emails AS m2_emails     -- Member 2 emails
      FROM new_members m1
      -- Join the members table on the tenantId field and ensuring the IDs are different
      JOIN members m2 ON m1."tenantId" = m2."tenantId" AND m1.id <> m2.id
      -- Filter for overlapping emails
      WHERE m1.emails && m2.emails
      -- Exclude pairs that are already in the memberToMerge table
      AND NOT EXISTS (
        SELECT 1
        FROM "memberToMerge"
        WHERE (
          "memberId" = m1.id
          AND "toMergeId" = m2.id
        ) OR (
          "memberId" = m2.id
          AND "toMergeId" = m1.id
        )
      )
      -- Exclude pairs that are in the memberNoMerge table
      AND NOT EXISTS (
        SELECT 1
        FROM "memberNoMerge"
        WHERE (
          "memberId" = m1.id
          AND "noMergeId" = m2.id
        ) OR (
          "memberId" = m2.id
          AND "noMergeId" = m1.id
        )
      )
    )
    -- Select all columns from the email_join CTE
    SELECT *
    FROM email_join;`

    const suggestions = await seq.query(query, {
      replacements: {
        tenantId: tenant.id,
        numberOfHours: `${numberOfHours} hours`,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    return suggestions.map((suggestion: any) => ({
      members: [suggestion.m1_id, suggestion.m2_id],
      similarity: 1,
    }))
  }

  static async mergeSuggestionsBySimilarity(
    numberOfHours,
    options: IRepositoryOptions,
  ): Promise<IMemberMergeSuggestion[]> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
    -- Define a CTE named "new_members" to get members created in the last 7 days with a specific tenantId
    WITH new_members AS (
      SELECT *
      FROM members
      WHERE "createdAt" >= now() - INTERVAL :numberOfHours
      AND "tenantId" = :tenantId
      LIMIT 1000
    ),
    -- Define a CTE named "identity_join" to find similar identities across platforms
    identity_join AS (
      -- Select distinct pairs of memberIds and relevant information, along with the similarity score
      SELECT DISTINCT ON(m1_id, m2_id)
        m1.id AS m1_id,
        m2.id AS m2_id,
        similarity(i1.username, i2.username) AS similarity
      FROM new_members m1
      -- Join memberIdentities and members to get related records
      JOIN "memberIdentities" i1 ON m1.id = i1."memberId"
      JOIN "memberIdentities" i2 ON i1.platform <> i2.platform
      JOIN members m2 ON m2.id = i2."memberId"
      -- Filter out records where tenantId is different and memberIds are the same
      WHERE m1."tenantId" = m2."tenantId"
      AND m1.id <> m2.id
      -- Consider only records with similarity > 0.5 (adjust this threshold as needed)
      AND similarity(i1.username, i2.username) > 0.5
      -- Order by similarity descending to get the most similar records first
      ORDER BY m1_id, m2_id, similarity DESC
    ),
    -- Define a CTE named "exclude_already_processed" to remove the already processed members
    exclude_already_processed AS (
      SELECT *
      FROM identity_join
      -- Filter out records present in memberToMerge table
      WHERE NOT EXISTS (
        SELECT 1
        FROM "memberToMerge"
        WHERE (
          "memberId" = identity_join.m1_id
          AND "toMergeId" = identity_join.m2_id
        ) OR (
          "memberId" = identity_join.m2_id
          AND "toMergeId" = identity_join.m1_id
        )
        -- Filter out records present in memberNoMerge table
      ) AND NOT EXISTS (
        SELECT 1
        FROM "memberNoMerge"
        WHERE (
          "memberId" = identity_join.m1_id
          AND "noMergeId" = identity_join.m2_id
        ) OR (
          "memberId" = identity_join.m2_id
          AND "noMergeId" = identity_join.m1_id
        )
      )
    )
    -- Select everything from the final CTE "exclude_already_processed"
    SELECT *
    FROM exclude_already_processed;`

    const suggestions = await seq.query(query, {
      replacements: {
        tenantId: tenant.id,
        numberOfHours: `${numberOfHours} hours`,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    return suggestions.map((suggestion: any) => ({
      members: [suggestion.m1_id, suggestion.m2_id],
      // 100% confidence only from emails
      similarity: suggestion.similarity > 0.95 ? 0.95 : suggestion.similarity,
    }))
  }

  static async addToWeakIdentities(
    memberIds: string[],
    username: string,
    platform: string,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
    update members
    set "weakIdentities" = "weakIdentities" || jsonb_build_object('username', :username, 'platform', :platform)::jsonb
    where id in (:memberIds)
      and not exists (select 1
                      from jsonb_array_elements("weakIdentities") as wi
                      where wi ->> 'username' = :username
                        and wi ->> 'platform' = :platform);
    `

    await seq.query(query, {
      replacements: {
        memberIds,
        username,
        platform,
        tenantId: tenant.id,
      },
      type: QueryTypes.UPDATE,
      transaction,
    })
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    if (log) {
      let values = {}

      if (data) {
        values = {
          ...record.get({ plain: true }),
          activitiesIds: data.activities,
          tagsIds: data.tags,
          noMergeIds: data.noMerge,
        }
      }

      await AuditLogRepository.log(
        {
          entityName: 'member',
          entityId: record.id,
          action,
          values,
        },
        options,
      )
    }
  }

  static async _populateRelationsForRows(rows, attributesSettings, exportMode = false) {
    if (!rows) {
      return rows
    }

    // No need for lazyloading tags for integrations or microservices
    if (
      (KUBE_MODE &&
        (SERVICE === ServiceType.NODEJS_WORKER || SERVICE === ServiceType.JOB_GENERATOR) &&
        !exportMode) ||
      process.env.SERVICE === 'integrations' ||
      process.env.SERVICE === 'microservices-nodejs'
    ) {
      return rows.map((record) => {
        const plainRecord = record.get({ plain: true })
        plainRecord.noMerge = plainRecord.noMergeIds ? plainRecord.noMergeIds.split(',') : []
        plainRecord.toMerge = plainRecord.toMergeIds ? plainRecord.toMergeIds.split(',') : []

        delete plainRecord.toMergeIds
        delete plainRecord.noMergeIds
        return plainRecord
      })
    }

    return Promise.all(
      rows.map(async (record) => {
        const plainRecord = record.get({ plain: true })
        plainRecord.noMerge = plainRecord.noMergeIds ? plainRecord.noMergeIds.split(',') : []
        plainRecord.toMerge = plainRecord.toMergeIds ? plainRecord.toMergeIds.split(',') : []
        plainRecord.lastActivity = plainRecord.lastActive
          ? (
              await record.getActivities({
                order: [['timestamp', 'DESC']],
                limit: 1,
              })
            )[0].get({ plain: true })
          : null
        delete plainRecord.toMergeIds
        delete plainRecord.noMergeIds

        plainRecord.activeOn = plainRecord.activeOn ?? []

        for (const attribute of attributesSettings) {
          if (Object.prototype.hasOwnProperty.call(plainRecord, attribute.name)) {
            delete plainRecord[attribute.name]
          }
        }

        for (const attributeName in plainRecord.attributes) {
          if (!lodash.find(attributesSettings, { name: attributeName })) {
            delete plainRecord.attributes[attributeName]
          }
        }

        delete plainRecord.contributions

        delete plainRecord.company
        plainRecord.organizations = await record.getOrganizations({
          joinTableAttributes: [],
        })
        plainRecord.tags = await record.getTags({
          joinTableAttributes: [],
        })

        if (exportMode) {
          plainRecord.notes = await record.getNotes({
            joinTableAttributes: [],
          })
        }
        return plainRecord
      }),
    )
  }

  /**
   * Fill a record with the relations and files (if any)
   * @param record Record to get relations and files for
   * @param options IRepository options
   * @param returnPlain If true: return object, otherwise  return model
   * @returns The model/object with filled relations and files
   */
  static async _populateRelations(record, options: IRepositoryOptions, returnPlain = true) {
    if (!record) {
      return record
    }

    let output

    if (returnPlain) {
      output = record.get({ plain: true })
    } else {
      output = record
    }

    const transaction = SequelizeRepository.getTransaction(options)

    output.activities = await record.getActivities({
      order: [['timestamp', 'DESC']],
      transaction,
    })

    output.lastActivity = output.activities[0]?.get({ plain: true }) ?? null

    output.lastActive = output.activities[0]?.timestamp ?? null

    output.activeOn = [...new Set(output.activities.map((i) => i.platform))]

    output.activityCount = output.activities.length

    output.numberOfOpenSourceContributions = output.contributions?.length ?? 0

    output.activityTypes = [...new Set(output.activities.map((i) => `${i.platform}:${i.type}`))]
    output.activeDaysCount =
      output.activities.reduce((acc, activity) => {
        if (!acc.datetimeHashmap) {
          acc.datetimeHashmap = {}
          acc.count = 0
        }
        // strip hours from timestamp
        const date = activity.timestamp.toISOString().split('T')[0]

        if (!acc.datetimeHashmap[date]) {
          acc.count += 1
          acc.datetimeHashmap[date] = true
        }

        return acc
      }, {}).count ?? 0

    output.averageSentiment =
      output.activityCount > 0
        ? Math.round(
            (output.activities.reduce((acc, i) => {
              if ('sentiment' in i.sentiment) {
                acc += i.sentiment.sentiment
              }
              return acc
            }, 0) /
              output.activities.filter((i) => 'sentiment' in i.sentiment).length) *
              100,
          ) / 100
        : 0

    output.tags = await record.getTags({
      transaction,
      joinTableAttributes: [],
    })

    output.organizations = await record.getOrganizations({
      transaction,
      joinTableAttributes: [],
    })

    output.tasks = await record.getTasks({
      transaction,
      joinTableAttributes: [],
    })

    output.notes = await record.getNotes({
      transaction,
      joinTableAttributes: [],
    })

    output.noMerge = (
      await record.getNoMerge({
        transaction,
      })
    ).map((i) => i.id)

    output.toMerge = (
      await record.getToMerge({
        transaction,
      })
    ).map((i) => i.id)

    const memberIdentities = (await this.getIdentities([record.id], options)).get(record.id)

    output.username = {}

    for (const identity of memberIdentities) {
      if (output.username[identity.platform]) {
        output.username[identity.platform].push(identity.username)
      } else {
        output.username[identity.platform] = [identity.username]
      }
    }

    output.identities = Object.keys(output.username)

    return output
  }
}

export default MemberRepository
