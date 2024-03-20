// processData.ts content
import {IActivityData, IMemberData, MemberAttributeName, PlatformType } from '@crowd/types'
import { YoutubeVideoStreamConfig, YoutubeComment, YoutubeActivityType, YoutubeCommentThreadSearch} from './types'
import { ProcessDataHandler, IProcessDataContext} from '../../types'
import { Youtube_GRID } from './grid'

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as {video: YoutubeVideoStreamConfig, comments: YoutubeCommentThreadSearch}
  const comments = data.comments
  const video = data.video

  for (const comment of comments.items) {
    const singleComment = comment.snippet.topLevelComment
    await processComment(ctx, video, singleComment)
  }
}

async function processComment(
  ctx: IProcessDataContext, 
  video: YoutubeVideoStreamConfig, 
  comment: YoutubeComment
) {
  const member = getMember(comment)
  const scoring = Youtube_GRID[YoutubeActivityType.COMMENT]

  const parentCommentUrl = `https://www.youtube.com/watch?v=${video.videoId}&lc=${comment.id}`
  const activity: IActivityData = {
    type: YoutubeActivityType.COMMENT,
    timestamp: comment.snippet.publishedAt,
    sourceId: comment.id,
    score: scoring.score,
    isContribution: scoring.isContribution,
    body: comment.snippet.textOriginal,
    url: parentCommentUrl,
    attributes: {
      videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      videoTitle: video.title,
      authorChannelUrl: comment.snippet.authorChannelUrl
    },
    member
  }
  await ctx.publishActivity(activity)
}

function getMember(comment: YoutubeComment): IMemberData {
  const member: IMemberData = {
    displayName: comment.snippet.authorDisplayName,
    identities: [
      {
        platform: PlatformType.YOUTUBE,
        sourceId: comment.snippet.authorChannelId.value,
        username: comment.snippet.authorChannelId.value
      },
    ],
    attributes: {
      [MemberAttributeName.URL]: {
        [PlatformType.YOUTUBE]: comment.snippet.authorChannelUrl,
      },
    },
  }

  return member
}

export default handler
