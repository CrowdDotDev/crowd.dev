import { ProcessStreamHandler, IProcessStreamContext } from '../../types'
import {
  StackOverflowRootStream,
  IStackOverflowTagStreamData,
  IStackOverflowKeywordStreamData,
  IStackOverflowAnswerStreamData,
  StackOverflowQuestionsResponse,
  StackOverflowAnswerResponse,
  StackOverflowUser,
  IStackOverflowPublishQuestion,
  IStackOverflowPublishAnswer,
  IStackOverflowPublishData,
} from './types'
import getQuestionsByTags from './api/getQuestions'
import getQuestionsByKeyword from './api/getQuestionsByKeywords'
import getAnswers from './api/getAnswers'
import getUser from './api/getUser'

const getStackOverflowUser = async (
  ctx: IProcessStreamContext,
  userId: string,
): Promise<StackOverflowUser> => {
  const cached = await ctx.cache.get(`user:${userId}`)
  if (cached) {
    return JSON.parse(cached)
  }

  const user = await getUser({ userId, nangoId: ctx.serviceSettings.nangoId }, ctx)
  await ctx.cache.set(`user:${userId}`, JSON.stringify(user), 7 * 24 * 60 * 60) // store for 7 days
  return user
}

const processTagStream: ProcessStreamHandler = async (ctx) => {
  const metadata = ctx.stream.data as IStackOverflowTagStreamData
  const tags = metadata.tags
  const page = metadata.page || 1
  const response: StackOverflowQuestionsResponse = await getQuestionsByTags(
    { tags, page, nangoId: ctx.serviceSettings.nangoId },
    ctx,
  )

  const questions = response.items

  if (questions.length === 0) {
    return
  }

  // Shows if there are more pages to parse
  const hasMore = response.has_more

  // If there are more pages, we need to create a new stream to get the next page
  if (questions.length > 0 && hasMore) {
    await ctx.publishStream<IStackOverflowTagStreamData>(
      `${StackOverflowRootStream.QUESTIONS_BY_TAG}:${tags[0]}`,
      {
        tags: tags,
        page: page + 1,
      },
    )
  }

  // pulblish all questions and new streams for answers
  while (questions.length > 0) {
    const question = questions.shift()
    const user = await getStackOverflowUser(ctx, question.owner.user_id.toString())
    await ctx.publishData<IStackOverflowPublishData>({
      question: {
        question,
        user,
        tag: tags[0],
        keyword: null,
      },
      answer: null,
    })

    await ctx.publishStream<IStackOverflowAnswerStreamData>(
      `${StackOverflowRootStream.ANSWERS_TO_QUESTION}:${question.question_id}`,
      {
        questionId: question.question_id.toString(),
        tag: tags[0],
        keyword: null,
        page: 1,
      },
    )
  }
}

const processKeywordStream: ProcessStreamHandler = async (ctx) => {
  const metadata = ctx.stream.data as IStackOverflowKeywordStreamData
  const keyword = metadata.keyword
  const page = metadata.page || 1

  const response: StackOverflowQuestionsResponse = await getQuestionsByKeyword(
    { keyword, page, nangoId: ctx.serviceSettings.nangoId },
    ctx,
  )

  const questions = response.items

  if (questions.length === 0) {
    return
  }

  // Shows if there are more pages to parse
  const hasMore = response.has_more

  // If there are more pages, we need to create a new stream to get the next page
  if (questions.length > 0 && hasMore) {
    await ctx.publishStream<IStackOverflowKeywordStreamData>(
      `${StackOverflowRootStream.QUESTIONS_BY_KEYWORD}:${keyword}`,
      {
        keyword,
        page: page + 1,
      },
    )
  }

  // pulblish all questions and new streams for answers
  while (questions.length > 0) {
    const question = questions.shift()
    const user = await getStackOverflowUser(ctx, question.owner.user_id.toString())
    await ctx.publishData<IStackOverflowPublishData>({
      question: {
        question,
        user,
        tag: null,
        keyword,
      },
      answer: null,
    })

    await ctx.publishStream<IStackOverflowAnswerStreamData>(
      `${StackOverflowRootStream.ANSWERS_TO_QUESTION}:${question.question_id}`,
      {
        questionId: question.question_id.toString(),
        tag: null,
        keyword,
        page: 1,
      },
    )
  }
}

const processAnswerStream: ProcessStreamHandler = async (ctx) => {
  const metadata = ctx.stream.data as IStackOverflowAnswerStreamData
  const questionId = metadata.questionId
  const page = metadata.page || 1
  const tag = metadata.tag
  const keyword = metadata.keyword
  const response: StackOverflowAnswerResponse = await getAnswers(
    { questionId, page, nangoId: ctx.serviceSettings.nangoId },
    ctx,
  )

  const answers = response.items

  if (answers.length === 0) {
    return
  }
  // Shows if there are more pages to parse
  const hasMore = response.has_more

  // If there are more pages, we need to create a new stream to get the next page
  if (answers.length > 0 && hasMore) {
    await ctx.publishStream<IStackOverflowAnswerStreamData>(
      `${StackOverflowRootStream.ANSWERS_TO_QUESTION}:${questionId}`,
      {
        questionId,
        tag,
        keyword,
        page: page + 1,
      },
    )
  }

  // pulblish all questions and new streams for answers
  let previousAnswerId: string | null = null
  while (answers.length > 0) {
    const answer = answers.shift()
    const user = await getStackOverflowUser(ctx, answer.owner.user_id.toString())
    await ctx.publishData<IStackOverflowPublishData>({
      answer: {
        answer,
        user,
        tag,
        keyword,
        previousAnswerId,
      },
      question: null,
    })

    previousAnswerId = answer.answer_id.toString()
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.identifier.startsWith(StackOverflowRootStream.QUESTIONS_BY_TAG)) {
    await processTagStream(ctx)
  } else if (ctx.stream.identifier.startsWith(StackOverflowRootStream.QUESTIONS_BY_KEYWORD)) {
    await processKeywordStream(ctx)
  } else if (ctx.stream.identifier.startsWith(StackOverflowRootStream.ANSWERS_TO_QUESTION)) {
    await processAnswerStream(ctx)
  } else {
    await ctx.abortRunWithError(`Unknown stream type: ${ctx.stream.identifier}`)
  }
}

export default handler
