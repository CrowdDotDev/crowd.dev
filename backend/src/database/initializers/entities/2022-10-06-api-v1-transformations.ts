import { QueryTypes } from 'sequelize'
import { PlatformType } from '@crowd/types'
import TenantService from '../../../services/tenantService'
import getUserContext from '../../utils/getUserContext'
import IntegrationService from '../../../services/integrationService'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'
import { DevtoMemberAttributes } from '../../attributes/member/devto'
import { MemberAttributeName } from '../../attributes/member/enums'
import { TwitterMemberAttributes } from '../../attributes/member/twitter'
import { GithubMemberAttributes } from '../../attributes/member/github'
import { DiscordMemberAttributes } from '../../attributes/member/discord'
import { SlackMemberAttributes } from '../../attributes/member/slack'
import { DefaultMemberAttributes } from '../../attributes/member/default'
import MemberService from '../../../services/memberService'
import { CrowdMemberAttributes } from '../../attributes/member/crowd'

export default async () => {
  const tenants = (await TenantService._findAndCountAllForEveryUser({ filter: {} })).rows

  for (const tenant of tenants) {
    let updateMembers = []
    let updateActivities = []

    const userContext = await getUserContext(tenant.id)
    const is = new IntegrationService(userContext)
    const memberAttributesService = new MemberAttributeSettingsService(userContext)
    const activeIntegrations = await is.findAndCountAll({ filter: { status: 'done' } })

    // Create default member attribute settings
    await memberAttributesService.createPredefined(DefaultMemberAttributes)

    // create sample attribute settings if tenant.hasSampleData = true
    if (tenant.hasSampleData) {
      await memberAttributesService.createPredefined(
        MemberAttributeSettingsService.pickAttributes(
          [MemberAttributeName.SAMPLE],
          CrowdMemberAttributes,
        ),
      )
    }

    // Create integration specific member attribute settings
    for (const integration of activeIntegrations.rows) {
      switch (integration.platform) {
        case PlatformType.DEVTO:
          await memberAttributesService.createPredefined(DevtoMemberAttributes)

          await memberAttributesService.createPredefined(
            MemberAttributeSettingsService.pickAttributes(
              [MemberAttributeName.URL],
              TwitterMemberAttributes,
            ),
          )

          await memberAttributesService.createPredefined(
            MemberAttributeSettingsService.pickAttributes(
              [MemberAttributeName.URL, MemberAttributeName.NAME],
              GithubMemberAttributes,
            ),
          )
          break
        case PlatformType.DISCORD:
          await memberAttributesService.createPredefined(DiscordMemberAttributes)
          break
        case PlatformType.GITHUB:
          await memberAttributesService.createPredefined(GithubMemberAttributes)

          await memberAttributesService.createPredefined(
            MemberAttributeSettingsService.pickAttributes(
              [MemberAttributeName.URL],
              TwitterMemberAttributes,
            ),
          )
          break
        case PlatformType.SLACK:
          await memberAttributesService.createPredefined(SlackMemberAttributes)
          break

        case PlatformType.TWITTER:
          await memberAttributesService.createPredefined(TwitterMemberAttributes)
          break
        default:
          break
      }
    }

    // start transforming members
    const ms = new MemberService(userContext)
    const seq = await userContext.database.sequelize

    // We need a raw query becuase new entity models don't have old fields (such as crowdInfo, bio, location)
    const query = `
        select * from members m 
        where m."tenantId"  = :tenantId
    `
    const parameters: any = {
      tenantId: tenant.id,
    }

    const members = await seq.query(query, {
      replacements: parameters,
      type: QueryTypes.SELECT,
    })

    const nameMemberMapping = {}

    const orgNameMemberIdMappings = {}

    for (const member of members) {
      // displayName
      const displayName = member.username.crowdUsername

      let attributes = {}

      let bioAndLocationSourcePlatform

      if (member.crowdInfo.github) {
        bioAndLocationSourcePlatform = 'github'
      } else if (member.crowdInfo.devto) {
        bioAndLocationSourcePlatform = 'devto'
      }

      // set attributes.location
      if (member.location) {
        attributes[MemberAttributeName.LOCATION] = {
          [bioAndLocationSourcePlatform]: member.location,
        }
      }

      // set attributes.bio
      if (member.bio) {
        attributes[MemberAttributeName.BIO] = {
          [bioAndLocationSourcePlatform]: member.bio,
        }
      }

      // set rest of the crowdInfo to attributes
      if (member.crowdInfo) {
        for (const platform of Object.keys(member.crowdInfo)) {
          // We don't keep sample under a platform, it's stored as crowdInfo.sample in the old api
          if (platform === 'sample') {
            attributes = setObjectAttribute(
              attributes,
              MemberAttributeName.SAMPLE,
              PlatformType.CROWD,
              member.crowdInfo.sample,
            )
          }
          for (const attributeName of Object.keys(member.crowdInfo[platform])) {
            // we change crowdInfo.platform.id to attributes.sourceId.platform
            if (attributeName === 'id') {
              attributes = setObjectAttribute(
                attributes,
                MemberAttributeName.SOURCE_ID,
                platform,
                member.crowdInfo[platform][attributeName],
              )
            }
            if (attributeName === 'imageUrl') {
              attributes = setObjectAttribute(
                attributes,
                MemberAttributeName.AVATAR_URL,
                platform,
                member.crowdInfo[platform][attributeName],
              )
            } else {
              attributes = setObjectAttribute(
                attributes,
                attributeName,
                platform,
                member.crowdInfo[platform][attributeName],
              )
            }
          }
        }
      }

      // set organization
      if (member.organisation) {
        if (orgNameMemberIdMappings[member.organisation]) {
          orgNameMemberIdMappings[member.organisation].push(member.id)
        } else {
          orgNameMemberIdMappings[member.organisation] = [member.id]
        }
      }

      attributes = await ms.setAttributesDefaultValues(attributes)

      updateMembers.push({
        ...member,
        displayName,
        attributes,
      })
    }

    const { randomUUID } = require('crypto')

    if (Object.keys(orgNameMemberIdMappings).length !== 0) {
      let organizationsQuery = `INSERT INTO "organizations" ("id", "name", "createdAt", "updatedAt", "tenantId") VALUES `
      for (const organisationName of Object.keys(orgNameMemberIdMappings)) {
        organizationsQuery += `('${randomUUID()}', '${organisationName.replace(
          /'/g,
          "''",
        )}', NOW(), NOW(), '${tenant.id}'),`
      }
      organizationsQuery = organizationsQuery.slice(0, organizationsQuery.length - 1)
      organizationsQuery += ` returning id`

      const ids = await seq.query(organizationsQuery, {
        type: QueryTypes.INSERT,
      })

      let a = 0
      for (const organisationName of Object.keys(orgNameMemberIdMappings)) {
        nameMemberMapping[ids[0][a].id] = orgNameMemberIdMappings[organisationName]
        a += 1
      }

      let memberOrganisationsQuery = `
      INSERT INTO "memberOrganizations" ("createdAt", "updatedAt", "memberId", "organizationId") VALUES `
      for (const organisationId of Object.keys(nameMemberMapping)) {
        for (const memberId of nameMemberMapping[organisationId]) {
          memberOrganisationsQuery += `(NOW(), NOW(), '${memberId}', '${organisationId}'),`
        }
      }
      memberOrganisationsQuery = memberOrganisationsQuery.slice(
        0,
        memberOrganisationsQuery.length - 1,
      )

      await seq.query(memberOrganisationsQuery, {
        type: QueryTypes.INSERT,
      })
    }

    const MEMBER_CHUNK_SIZE = 25000

    if (updateMembers.length > MEMBER_CHUNK_SIZE) {
      const splittedBulkMembers = []

      while (updateMembers.length > MEMBER_CHUNK_SIZE) {
        splittedBulkMembers.push(updateMembers.slice(0, MEMBER_CHUNK_SIZE))
        updateMembers = updateMembers.slice(MEMBER_CHUNK_SIZE)
      }

      // push last leftover chunk
      if (updateMembers.length > 0) {
        splittedBulkMembers.push(updateMembers)
      }

      for (const memberChunk of splittedBulkMembers) {
        await userContext.database.member.bulkCreate(memberChunk, {
          updateOnDuplicate: ['displayName', 'attributes'],
        })
      }
    } else {
      await userContext.database.member.bulkCreate(updateMembers, {
        updateOnDuplicate: ['displayName', 'attributes'],
      })
    }

    const totalActivityCount = await getActivityCount(seq, tenant.id)
    let currentActivityCount = 0
    let currentOffset = 0

    while (currentActivityCount < totalActivityCount) {
      const LIMIT = 200000

      updateActivities = []
      let splittedBulkActivities = []
      const activities = await getActivities(seq, tenant.id, LIMIT, currentOffset)

      for (const activity of activities) {
        let body = ''

        if (activity.crowdInfo.body) {
          body = activity.crowdInfo.body
          delete activity.crowdInfo.body
        }

        let url = ''

        if (activity.crowdInfo.url) {
          url = activity.crowdInfo.url
          delete activity.crowdInfo.url
        }
        let title = ''

        if (activity.crowdInfo.title) {
          title = activity.crowdInfo.title
          delete activity.crowdInfo.title
        }

        let channel = ''

        if (activity.platform === PlatformType.TWITTER) {
          if (activity.type === 'hashtag' && activity.crowdInfo.hashtag) {
            channel = activity.crowdInfo.hashtag
          }
        } else if (activity.platform === PlatformType.GITHUB) {
          if (activity.crowdInfo.repo) {
            channel = activity.crowdInfo.repo
          }
        } else if (activity.platform === PlatformType.SLACK) {
          if (activity.crowdInfo.channel) {
            channel = activity.crowdInfo.channel
          }
        } else if (activity.platform === PlatformType.DEVTO) {
          if (activity.crowdInfo.articleTitle) {
            channel = activity.crowdInfo.articleTitle
          }

          if (activity.crowdInfo.thread === false || activity.crowdInfo.thread === true) {
            delete activity.crowdInfo.thread
          }
        } else if (activity.platform === PlatformType.DISCORD) {
          if (activity.crowdInfo.thread === false && activity.crowdInfo.channel) {
            channel = activity.crowdInfo.channel
          } else if (activity.crowdInfo.thread) {
            channel = activity.crowdInfo.thread

            if (activity.crowdInfo.channel) {
              delete activity.crowdInfo.channel
            }
          }
        }

        const attributes = activity.crowdInfo

        updateActivities.push({
          ...activity,
          body,
          url,
          title,
          attributes,
          channel,
        })
      }

      const ACTIVITY_CHUNK_SIZE = 25000

      if (updateActivities.length > ACTIVITY_CHUNK_SIZE) {
        splittedBulkActivities = []

        while (updateActivities.length > ACTIVITY_CHUNK_SIZE) {
          splittedBulkActivities.push(updateActivities.slice(0, ACTIVITY_CHUNK_SIZE))
          updateActivities = updateActivities.slice(ACTIVITY_CHUNK_SIZE)
        }

        // push last leftover chunk
        if (updateActivities.length > 0) {
          splittedBulkActivities.push(updateActivities)
        }

        for (const activityChunk of splittedBulkActivities) {
          await userContext.database.activity.bulkCreate(activityChunk, {
            updateOnDuplicate: ['body', 'url', 'title', 'attributes', 'channel'],
          })
        }
      } else {
        await userContext.database.activity.bulkCreate(updateActivities, {
          updateOnDuplicate: ['body', 'url', 'title', 'attributes', 'channel'],
        })
      }

      currentActivityCount += activities.length
      currentOffset += activities.length
    }
  }
}

async function getActivityCount(seq, tenantId) {
  const activityCountQuery = `
        select count(*) from activities a
        where a."tenantId"  = :tenantId
    `
  const activityCountQueryParameters: any = {
    tenantId,
  }

  const activityCount = (
    await seq.query(activityCountQuery, {
      replacements: activityCountQueryParameters,
      type: QueryTypes.SELECT,
    })
  )[0].count

  return activityCount
}

async function getActivities(seq, tenantId, limit, offset) {
  const activityQuery = `
        select * from activities a
        where a."tenantId"  = :tenantId
        ORDER  BY a."timestamp" DESC
        OFFSET :offset
        LIMIT  :limit
    `
  const activityQueryParameters: any = {
    tenantId,
    offset,
    limit,
  }

  return seq.query(activityQuery, {
    replacements: activityQueryParameters,
    type: QueryTypes.SELECT,
  })
}

function setObjectAttribute(obj, attributeName, platform, value) {
  if (obj[attributeName]) {
    obj[attributeName][platform] = value
  } else {
    obj[attributeName] = {
      [platform]: value,
    }
  }

  return obj
}
