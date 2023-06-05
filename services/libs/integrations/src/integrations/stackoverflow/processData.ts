import { IMemberData, MemberAttributeName, PlatformType } from '@crowd/types'
import sanitizeHtml from 'sanitize-html'
import { IProcessDataContext, ProcessDataHandler } from '../../types'
import { STACKOVERFLOW_GRID } from './grid'
import { IStackOverflowPublishData, StackOverflowUser, StackOverflowActivityType } from './types'

function parseMember(user: StackOverflowUser): IMemberData {
  return {
    identities: [
      {
        platform: PlatformType.STACKOVERFLOW,
        username: user.display_name,
        sourceId: user.user_id.toString(),
      },
    ],
    attributes: {
      [MemberAttributeName.SOURCE_ID]: {
        [PlatformType.STACKOVERFLOW]: user.user_id.toString(),
      },
      ...(user.profile_image && {
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.STACKOVERFLOW]: user.profile_image,
        },
      }),
      ...(user.link && {
        [MemberAttributeName.URL]: {
          [PlatformType.STACKOVERFLOW]: user.link,
        },
      }),
      ...(user.location && {
        [MemberAttributeName.LOCATION]: {
          [PlatformType.STACKOVERFLOW]: user.location,
        },
      }),
      ...(user.about_me && {
        [MemberAttributeName.BIO]: {
          [PlatformType.STACKOVERFLOW]: user.about_me,
        },
      }),
      ...(user.website_url && {
        [MemberAttributeName.WEBSITE_URL]: {
          [PlatformType.STACKOVERFLOW]: user.website_url,
        },
      }),
    },
  }
}

async function parseQuestion(ctx: IProcessDataContext) {
  const data = ctx.data as IStackOverflowPublishData
  const question = data.question.question
  const user = data.question.user
  const keyword = data.question.keyword
  const tag = data.question.tag
  let member = parseMember(user)
  const body = question.body
    ? sanitizeHtml(question.body)
    : `<a href="${question.link}" target="__blank">${question.link}</a>`

  if (member === undefined && question.owner.display_name) {
    member = {
      identities: [
        {
          platform: PlatformType.STACKOVERFLOW,
          username: question.owner.display_name,
        },
      ],
    }
  }

  await ctx.publishActivity({
    type: StackOverflowActivityType.QUESTION,
    sourceId: question.question_id.toString(),
    timestamp: new Date(question.creation_date * 1000).toISOString(),
    body,
    title: question.title,
    url: `https://stackoverflow.com/questions/${question.question_id}`,
    score: STACKOVERFLOW_GRID[StackOverflowActivityType.QUESTION].score,
    isContribution: STACKOVERFLOW_GRID[StackOverflowActivityType.QUESTION].isContribution,
    attributes: {
      tags: question.tags,
      answerCount: question.answer_count,
      viewCount: question.view_count,
      isAnswered: question.is_answered,
      ...(keyword && { keywordMentioned: keyword }),
      ...(tag && { tagMentioned: tag }),
    },
    member,
  })
}

async function parseAnswer(ctx: IProcessDataContext) {
  const data = ctx.data as IStackOverflowPublishData
  const answer = data.answer.answer
  const previousAnswerId = data.answer.previousAnswerId
  const user = data.answer.user
  const keyword = data.answer.keyword
  const tag = data.answer.tag
  let member = parseMember(user)
  const body = answer.body
    ? sanitizeHtml(answer.body)
    : `<a href="${answer.link}" target="__blank">${answer.link}</a>`

  if (member === undefined && answer.owner.display_name) {
    member = {
      identities: [
        {
          platform: PlatformType.STACKOVERFLOW,
          username: answer.owner.display_name,
        },
      ],
    }
  }

  await ctx.publishActivity({
    type: StackOverflowActivityType.ANSWER,
    sourceId: answer.answer_id.toString(),
    sourceParentId: previousAnswerId ? previousAnswerId : answer.question_id.toString(),
    timestamp: new Date(answer.creation_date * 1000).toISOString(),
    body,
    score: STACKOVERFLOW_GRID[StackOverflowActivityType.ANSWER].score,
    isContribution: STACKOVERFLOW_GRID[StackOverflowActivityType.ANSWER].isContribution,
    attributes: {
      ...(keyword && { keywordMentioned: keyword }),
      ...(tag && { tagMentioned: tag }),
    },
    member,
  })
}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as IStackOverflowPublishData
  // question and answer are mutually exclusive
  if (data.question !== null) {
    await parseQuestion(ctx)
  } else if (data.answer !== null) {
    await parseAnswer(ctx)
  } else {
    await ctx.abortRunWithError(`Unknown data type`)
    throw new Error(`Unknown data type`)
  }
}

export default handler
