import {
  IDbProjectCatalog,
  IRequestQuestion,
  IRequestQuestionOption,
} from '@crowd/data-access-layer/src/project-catalog/types'
import { ISlackMessageContent, escapeSlackText, mrkdwnSections } from '@crowd/slack'

import { ANSWER_REQUEST_ACTION_ID, STATUS, repoLabel } from './botCopy'

type QuestionRow = Pick<IDbProjectCatalog, 'id' | 'repoUrl' | 'requestQuestion'>
type KnownBlock = NonNullable<ISlackMessageContent['blocks']>[number]

const MAX_BUTTON_TEXT_LENGTH = 75
const BUTTONS_PER_BLOCK = 5
export const ANSWER_VALUE_SEPARATOR = '|'

function buttonText(text: string): string {
  return text.length > MAX_BUTTON_TEXT_LENGTH
    ? `${text.slice(0, MAX_BUTTON_TEXT_LENGTH - 1)}…`
    : text
}

export function answerActionId(index: number): string {
  return `${ANSWER_REQUEST_ACTION_ID}:${index}`
}

export function encodeAnswerValue(catalogId: string, optionId: string): string {
  return `${catalogId}${ANSWER_VALUE_SEPARATOR}${optionId}`
}

export function decodeAnswerValue(value: string): { catalogId: string; optionId: string } | null {
  const separator = value.indexOf(ANSWER_VALUE_SEPARATOR)
  if (separator <= 0 || separator === value.length - 1) {
    return null
  }
  return { catalogId: value.slice(0, separator), optionId: value.slice(separator + 1) }
}

function optionButtons(catalogId: string, options: IRequestQuestionOption[]): KnownBlock[] {
  const blocks: KnownBlock[] = []
  for (let start = 0; start < options.length; start += BUTTONS_PER_BLOCK) {
    blocks.push({
      type: 'actions',
      elements: options.slice(start, start + BUTTONS_PER_BLOCK).map((option, offset) => ({
        type: 'button',
        action_id: answerActionId(start + offset),
        value: encodeAnswerValue(catalogId, option.id),
        text: { type: 'plain_text', text: buttonText(option.label) },
        ...(start + offset === 0 && !option.handOff ? { style: 'primary' as const } : {}),
      })),
    })
  }
  return blocks
}

export function questionText(row: Pick<IDbProjectCatalog, 'repoUrl'>, question: IRequestQuestion) {
  return `${STATUS.needsInput} ${repoLabel(row.repoUrl)}: ${escapeSlackText(question.text)}`
}

export function buildBotQuestionContent(row: QuestionRow): ISlackMessageContent | null {
  const question = row.requestQuestion
  if (!question) {
    return null
  }
  const text = questionText(row, question)
  return { text, blocks: [...mrkdwnSections(text), ...optionButtons(row.id, question.options)] }
}

export function findQuestionOption(
  question: IRequestQuestion | null,
  optionId: string,
): IRequestQuestionOption | null {
  return question?.options.find((option) => option.id === optionId) ?? null
}

export function buildBotAnsweredContent(
  row: Pick<IDbProjectCatalog, 'repoUrl'>,
  question: IRequestQuestion,
  option: IRequestQuestionOption,
  answeredBy: string,
): ISlackMessageContent {
  const next = option.handOff
    ? "I've handed it to the CDP team; they'll decide here."
    : "Checking again with that, I'll update the status above."
  const text = `${questionText(row, question)}\n<@${answeredBy}> answered: *${escapeSlackText(option.label)}*. ${next}`
  return { text }
}

export function describeAnsweredQuestion(question: IRequestQuestion): string | null {
  if (!question.answeredBy || !question.answer) {
    return null
  }
  const option = findQuestionOption(question, question.answer)
  return `<@${question.answeredBy}> already answered this: ${option?.label ?? question.answer}.`
}
