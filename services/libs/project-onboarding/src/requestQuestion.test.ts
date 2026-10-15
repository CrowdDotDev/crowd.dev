import { describe, expect, it } from 'vitest'

import {
  buildBotAnsweredContent,
  buildBotQuestionContent,
  decodeAnswerValue,
  describeAnsweredQuestion,
  encodeAnswerValue,
  findQuestionOption,
} from './requestQuestion'

const question = {
  kind: 'did_you_mean' as const,
  text: 'I couldn\'t find a project called "Acme <Labs>". Did you mean Acme?',
  options: [
    {
      id: 'yes',
      label: 'Yes, Acme',
      hints: { pccProject: { projectId: 'p', name: 'Acme', slug: 'a', isLeaf: true } },
    },
    { id: 'no', label: 'No, ask the CDP team', handOff: true },
  ],
}
const row = {
  id: '8f1c2a44-5b7e-4d2f-9c1a-3e6f7a8b9c0d',
  repoUrl: 'https://github.com/acme/widget',
  requestQuestion: question,
}

describe('buildBotQuestionContent', () => {
  it('posts the question with one button per option, the first one primary', () => {
    const content = buildBotQuestionContent(row)

    expect(content?.text).toBe(
      '❓ *<https://github.com/acme/widget|acme/widget>*: I couldn\'t find a project called "Acme &lt;Labs&gt;". Did you mean Acme?',
    )
    expect(content?.blocks).toMatchObject([
      { type: 'section' },
      {
        type: 'actions',
        elements: [
          {
            action_id: 'answer_request:0',
            value: `${row.id}|yes`,
            text: { text: 'Yes, Acme' },
            style: 'primary',
          },
          {
            action_id: 'answer_request:1',
            value: `${row.id}|no`,
            text: { text: 'No, ask the CDP team' },
          },
        ],
      },
    ])
    expect(buildBotQuestionContent({ ...row, requestQuestion: null })).toBeNull()
  })

  it('replaces the question with the answer and what happens next, buttons gone', () => {
    const answered = buildBotAnsweredContent(row, question, question.options[0], 'U1')
    expect(answered.text).toContain(
      "<@U1> answered: *Yes, Acme*. Checking again with that, I'll update the status above.",
    )
    expect(answered.blocks).toMatchObject([{ type: 'section' }])
    expect(buildBotAnsweredContent(row, question, question.options[1], 'U1').text).toContain(
      "I've handed it to the CDP team; they'll decide here.",
    )
  })
})

describe('answer values', () => {
  it('round-trips the catalog id and the option id', () => {
    expect(decodeAnswerValue(encodeAnswerValue(row.id, 'seg-1'))).toEqual({
      catalogId: row.id,
      optionId: 'seg-1',
    })
    expect(decodeAnswerValue('nonsense')).toBeNull()
    expect(decodeAnswerValue('abc|')).toBeNull()
  })

  it('finds options and describes an answered question', () => {
    expect(findQuestionOption(question, 'no')?.handOff).toBe(true)
    expect(findQuestionOption(question, 'maybe')).toBeNull()
    expect(describeAnsweredQuestion(question)).toBeNull()
    expect(describeAnsweredQuestion({ ...question, answeredBy: 'U1', answer: 'yes' })).toBe(
      '<@U1> already answered this: Yes, Acme.',
    )
  })
})
