import { ProcessStreamHandler, IProcessStreamContext } from '../../types'
import {
  RedditStreamType,
  IRedditSubredditStreamData,
  RedditPostsResponse,
  IRedditCommentStreamData,
  IRedditMoreCommentsStreamData,
  RedditCommentsResponse,
  RedditComment,
  RedditMoreChildren,
  RedditMoreCommentsResponse,
  IRedditPublishData,
  RedditActivityType,
} from './types'
import getPosts from './api/getPosts'
import getComments from './api/getComments'
import getMoreComments from './api/getMoreComments'

async function recursiveCommentParser(
  kind: string,
  comment: RedditComment | RedditMoreChildren,
  sourceParentId: string,
  ctx: IProcessStreamContext,
) {
  const metadata = ctx.stream.data as IRedditCommentStreamData

  // If the kind is 'more', instead of a comment we have a list of comment IDs to expand. We need to create streams for those and return them.
  if (kind === 'more') {
    comment = comment as RedditMoreChildren
    ctx.log.debug(
      { stream: ctx.stream.identifier, childrenLength: comment.children.length },
      'Found more children to parse',
    )
    // Split list into chunks of 99
    // eslint-disable-next-line no-inner-declarations
    function* chunks<T>(arr: T[], n: number): Generator<T[], void> {
      for (let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n)
      }
    }

    // Each stream has at most 99 children to expand. If there are more, we make more than one stream.
    for (const chunk of [...chunks(comment.children, 99)]) {
      await ctx.publishStream<IRedditMoreCommentsStreamData>(
        `${RedditStreamType.MORE_COMMENTS}:${metadata.postId}:${chunk.join(',')}`,
        {
          channel: metadata.channel,
          postId: metadata.postId,
          children: chunk,
        },
      )
    }
  }

  // Otherwise, we have a proper comment
  comment = comment as RedditComment

  // We need to publish an activity for the comment
  await ctx.publishData<IRedditPublishData>({
    type: RedditActivityType.COMMENT,
    data: comment,
    subreddit: metadata.channel,
    sourceParentId,
    postUrl: metadata.postUrl,
    postTitle: metadata.postTitle,
    postId: metadata.postId,
  })

  if (!comment.replies) {
    return
  }
  const repliesWrapped = comment.replies.data.children

  // For each reply, we need to recurse to get it parsed either as an activity or a new stream
  for (const replyWrapped of repliesWrapped) {
    const reply = replyWrapped.data
    await recursiveCommentParser(replyWrapped.kind, reply, sourceParentId, ctx)
  }
}

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

    await ctx.publishData<IRedditPublishData>({
      type: RedditActivityType.POST,
      data: post.data,
      subreddit: subreddit,
    })
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

  const comments = response[1].data.children

  if (comments.length === 0) {
    return
  }

  while (comments.length > 0) {
    const comment = comments.shift()
    // this function publishes activities and new streams based on type of comments
    await recursiveCommentParser(comment.kind, comment.data, postId, ctx)
  }
}

const processMoreCommentStream: ProcessStreamHandler = async (ctx) => {
  const metadata = ctx.stream.data as IRedditMoreCommentsStreamData
  const postId = metadata.postId
  const children = metadata.children
  const nangoId = ctx.serviceSettings.nangoId

  const response: RedditMoreCommentsResponse = await getMoreComments(
    { nangoId, postId, children },
    ctx,
  )

  const comments = response.json.data.things

  if (comments.length === 0) {
    return
  }

  while (comments.length > 0) {
    const comment = comments.shift()
    // this function publishes activities and new streams based on type of comments
    await recursiveCommentParser(comment.kind, comment.data, postId, ctx)
  }
}

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
