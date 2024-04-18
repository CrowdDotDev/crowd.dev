// generateStreams.ts content
import { GenerateStreamsHandler } from '../../types'
import {
  GroupsioIntegrationSettings,
  GroupsioStreamType,
  GroupsioGroupMembersStreamMetadata,
  GroupsioPastGroupMembersStreamMetadata,
} from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as GroupsioIntegrationSettings
  const groups = settings.groups
  const token = settings.token
  const email = settings.email

  const onboarding = ctx.onboarding

  if (!groups || groups.length === 0) {
    await ctx.abortRunWithError('No groups specified!')
  }

  if (!token) {
    await ctx.abortRunWithError('No token specified!')
  }

  if (!email) {
    await ctx.abortRunWithError('No email specified!')
  }

  for (const group of groups) {
    // here we start parsing group members - very important to do this first
    // because we need to know who the members are before we can start parsing
    // messages don't have enough information to create members
    await ctx.publishStream<GroupsioGroupMembersStreamMetadata>(
      `${GroupsioStreamType.GROUP_MEMBERS}:${group}`,
      {
        group,
        page: null,
      },
    )
    // also parse past group members but only when onboarding is true
    if (onboarding) {
      await ctx.publishStream<GroupsioPastGroupMembersStreamMetadata>(
        `${GroupsioStreamType.PAST_GROUP_MEMBERS}:${group}`,
        {
          group,
          page: null,
        },
      )
    }
  }
}

export default handler
