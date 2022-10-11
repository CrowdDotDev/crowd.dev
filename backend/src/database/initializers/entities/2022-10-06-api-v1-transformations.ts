import { QueryTypes } from 'sequelize'
import TenantService from '../../../services/tenantService'
import getUserContext from '../../utils/getUserContext'
import IntegrationService from '../../../services/integrationService'
import ActivityService from '../../../services/activityService'
import SequelizeRepository from '../../repositories/sequelizeRepository'
import { PlatformType } from '../../../utils/platforms'
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
import OrganizationService from '../../../services/organizationService'
import MemberRepository from '../../repositories/memberRepository'
import ActivityRepository from '../../repositories/activityRepository'

export default async () => {
  let tenants = (await TenantService._findAndCountAllForEveryUser({ filter: {} })).rows
  tenants = [tenants[0]]

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()

  const memberCountQuery = `select count(*) from members m `

  const memberCount = (
    await options.database.sequelize.query(memberCountQuery, {
      type: QueryTypes.SELECT,
    })
  )[0].count

  const activityCountQuery = `select count(*) from activities a`

  const activityCount = (
    await options.database.sequelize.query(activityCountQuery, {
      type: QueryTypes.SELECT,
    })
  )[0].count

  // tenants = [tenants[0]]
  let updateMembers = []
  let updateActivities = []
  let transformedMemberCount = 0
  let transformedActivityCount = 0

  const startedAt = new Date()

  for (const tenant of tenants) {
    updateMembers = []
    updateActivities = []
    console.log('processing tenant: ', tenant.id)

    const userContext = await getUserContext(tenant.id)
    const is = new IntegrationService(userContext)
    const memberAttributesService = new MemberAttributeSettingsService(userContext)
    const activeIntegrations = await is.findAndCountAll({ filter: { status: 'done' } })

    // console.log('active integrations: ')
    // console.log(activeIntegrations.rows)

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
      // console.log(
      //   `creating member attribute settings of platform ${integration.platform} for tenant ${tenant.id}`,
      // )

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
          console.log('Unknown platform')
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

    // console.log('found members with raw query')
    // console.log(members)

    for (const member of members) {
      // console.log(`transforming member`)
      // console.log(member.id)

      // displayName
      const displayName = member.username.crowdUsername
      // console.log('displayname is : ', displayName)

      let attributes = {}

      // we will use the first activities platform as source for fields that'll go into attributes
      // such as location and bio
      //const as = new ActivityService(userContext)
      // console.log(`find first activity... for member ${member.id}`)
      const firstActQuery = `
      select * from activities a
      where a."tenantId"  = :tenantId
      and a."memberId" = :memberId
      order by a.timestamp asc
      limit 1 
  `
      const firstActParameters: any = {
        tenantId: tenant.id,
        memberId: member.id,
      }

      const act = (
        await seq.query(firstActQuery, {
          replacements: firstActParameters,
          type: QueryTypes.SELECT,
        })
      )[0]

      // const act = (await as.findAndCountAll({ filter: { memberId: member.id }, limit: 1 })).rows[0]
      // console.log('done!')

      if (act) {
        // set attributes.location
        if (member.location) {
          attributes[MemberAttributeName.LOCATION] = {
            [act.platform]: member.location,
          }
        }

        // set attributes.bio
        if (member.bio) {
          attributes[MemberAttributeName.BIO] = {
            [act.platform]: member.bio,
          }
        }

        // set rest of the crowdInfo to attributes
        if (member.crowdInfo) {
          for (const platform of Object.keys(member.crowdInfo)) {
            // console.log(`processing platform ${platform}`)
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
        // console.log('organisations...')
        if (member.organisation) {
          const os = new OrganizationService(userContext)
          const org = await os.findOrCreate({ name: member.organisation })

          // use findandcountall method to get it's members
          const { rows } = await userContext.database.organization.findAndCountAll({
            where: {
              id: org.id,
            },
            include: [
              {
                model: userContext.database.member,
                as: 'members',
                attributes: ['id'],
                through: {
                  attributes: [],
                },
              },
            ],
          })

          rows[0] = rows[0].get({ plain: true })
          const existingMemberIdsOfOrganization = rows[0].members.map((i) => i.id)

          await os.update(org.id, {
            members: [...existingMemberIdsOfOrganization, member.id],
          })
        }
        // console.log('done!')

        attributes = await ms.setAttributesDefaultValues(attributes)

        updateMembers.push({
          ...member,
          displayName,
          attributes,
        })

        transformedMemberCount += 1
        if (transformedMemberCount % 1000 === 0) {
          console.log(`transforming members: ${transformedMemberCount}/${memberCount}`)
        }
      }
    }

    console.log(`bulk updating tenant [${tenant.id}] members...`)
    await userContext.database.member.bulkCreate(updateMembers, {
      updateOnDuplicate: ['displayName', 'attributes'],
    })
    console.log("done!")

    
    // start transforming activities
    const activityQuery = `
        select * from activities a 
        where a."tenantId"  = :tenantId
    `
    const activityQueryParameters: any = {
      tenantId: tenant.id,
    }

    const activities = await seq.query(activityQuery, {
      replacements: activityQueryParameters,
      type: QueryTypes.SELECT,
    })

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

      if (activity.platform === PlatformType.TWITTER){
        if (activity.type === 'hashtag' && activity.crowdInfo.hashtag){
          channel = activity.crowdInfo.hashtag
        }
      }
      else if(activity.platform === PlatformType.GITHUB){
        if (activity.crowdInfo.repo){
          channel = activity.crowdInfo.repo
        }
      }
      else if (activity.platform === PlatformType.SLACK){
        if (activity.crowdInfo.channel){
          channel = activity.crowdInfo.channel
        }
      }
      else if (activity.platform === PlatformType.DEVTO){
        if (activity.crowdInfo.articleTitle){
          channel = activity.crowdInfo.articleTitle
        }

        if (activity.crowdInfo.thread === false || activity.crowdInfo.thread === true){
          delete activity.crowdInfo.thread
        }
      }
      else if( activity.platform === PlatformType.DISCORD){
        if (activity.crowdInfo.thread === false && activity.crowdInfo.channel){
          channel = activity.crowdInfo.channel
        }
        else if (activity.crowdInfo.thread){
          channel = activity.crowdInfo.thread

          if (activity.crowdInfo.channel){
            delete activity.crowdInfo.channel
          }
        }
      }

      const attributes = activity.crowdInfo

      const sentiment = await ActivityService.getSentiment({
        ...activity,
        body,
        url,
        title,
        attributes,
        channel
      })

      console.log("found sentiment: ")
      console.log(sentiment)

      console.log(`gonna update act: ${activity.id}`)

      updateActivities.push({
        ...activity,
        body,
        url,
        title,
        attributes,
        channel,
      })

      transformedActivityCount += 1
      if (transformedActivityCount % 1000 === 0) {
        console.log(`transforming activities: ${transformedActivityCount}/${activityCount}`)
      }

      /*
      wait ActivityRepository.update(
        activity.id,
        {
          body,
          url,
          title,
          attributes,
          channel,
        },
        userContext,
      )
      */
    }
    console.log(`bulk updating tenant [${tenant.id}] activities...`)
    await userContext.database.activity.bulkCreate(updateActivities, {
      updateOnDuplicate: ['body', 'url', 'title', 'attributes', 'channel'],
    })
    console.log("done!")
    
  }
  const endedAt = new Date()

  console.log('started at: ')
  console.log(startedAt)
  console.log('ended at: ')
  console.log(endedAt)
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
