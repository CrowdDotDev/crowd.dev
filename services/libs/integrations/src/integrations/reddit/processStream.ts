import { ProcessStreamHandler } from '../../types'
import {
  RedditStreamType,
  IRedditSubredditStreamData,
  RedditPostsResponse,
  IRedditCommentStreamData,
  IRedditMoreCommentsStreamData,
  RedditPost,
  RedditCommentsResponse,
  RedditComment,
} from './types'
import getPosts from './api/getPosts'
import getComments from './api/getComments'
import getMoreComments from './api/getMoreComments'

const processSubredditStream: ProcessStreamHandler = async (ctx) => {
  const metadata = ctx.stream.data as IRedditSubredditStreamData
  const subreddit = metadata.channel
  const after = metadata.after
  const response: RedditPostsResponse = await getPosts(
    { subreddit, nangoId: ctx.serviceSettings.nangoId, after },
    ctx,
  )

  const posts = response.data.children

  if (posts.length === 0) {
    return
  }
  // The marker for the next page is always the name of the last post
  const nextPage = posts[posts.length - 1].data.name

  // publish all posts and new streams for comments
  for (const post of posts) {
    await ctx.publishStream<IRedditCommentStreamData>(
      `${RedditStreamType.COMMENTS}:${post.data.id}`,
      {
        channel: subreddit,
        postTitle: post.data.title,
        postUrl: post.data.url,
        postId: post.data.id,
      },
    )

    await ctx.publishData<RedditPost>(post.data)
  }

  // If there are more pages, we need to create a new stream to get the next page
  if (posts.length > 0 && nextPage) {
    await ctx.publishStream<IRedditSubredditStreamData>(
      `${RedditStreamType.SUBREDDIT}:${subreddit}:${nextPage}`,
      {
        channel: subreddit,
        after: nextPage,
      },
    )
  }
}

const processCommentsStream: ProcessStreamHandler = async (ctx) => {
  const metadata = ctx.stream.data as IRedditCommentStreamData
  const subreddit = metadata.channel
  const postId = metadata.postId
  const nangoId = ctx.serviceSettings.nangoId

  const response: RedditCommentsResponse = await getComments({ subreddit, nangoId, postId }, ctx)

  const comments = response.data.children

  if (comments.length === 0) {
    return
  }

  for (const comment of comments) {
    const commentData = comment.data

    // For each comment, publish the data and also create new streams for more comments if available
    await ctx.publishData<RedditComment>(commentData)
    if (commentData.replies && commentData.replies.data.children.length > 0) {
      await ctx.publishStream<IRedditMoreCommentsStreamData>(
        `${RedditStreamType.MORE_COMMENTS}:${commentData.id}`,
        {
          channel: subreddit,
          parentId: commentData.id,
          postId,
        },
      )
    }
  }
}

const processMoreCommentStream: ProcessStreamHandler = async (ctx) => {}

const handler: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.identifier.startsWith(RedditStreamType.SUBREDDIT)) {
    await processSubredditStream(ctx)
  } else if (ctx.stream.identifier.startsWith(RedditStreamType.COMMENTS)) {
    await processCommentsStream(ctx)
  } else if (ctx.stream.identifier.startsWith(RedditStreamType.MORE_COMMENTS)) {
    await processMoreCommentStream(ctx)
  } else {
    await ctx.abortRunWithError(`Unknown stream type: ${ctx.stream.identifier}`)
  }
}

export default handler
