import type { KnownBlock } from '@slack/web-api'

export interface ISlackMessageContent {
  text: string
  blocks?: KnownBlock[]
}

export interface ILinkButton {
  text: string
  url: string
  actionId: string
}

const BUTTON_TEXT_MAX_LENGTH = 75
const BUTTONS_PER_BLOCK = 5
const SECTION_TEXT_MAX_LENGTH = 3000

export const MAX_BLOCKS_PER_MESSAGE = 50

function mrkdwnSection(text: string): KnownBlock {
  return { type: 'section', text: { type: 'mrkdwn', text } }
}

function fitLine(line: string): string {
  return line.length > SECTION_TEXT_MAX_LENGTH
    ? `${line.slice(0, SECTION_TEXT_MAX_LENGTH - 1)}…`
    : line
}

export function mrkdwnSections(text: string): KnownBlock[] {
  const blocks: KnownBlock[] = []
  let current = ''

  for (const line of text.split('\n').map(fitLine)) {
    const candidate = current ? `${current}\n${line}` : line
    if (candidate.length > SECTION_TEXT_MAX_LENGTH && current) {
      blocks.push(mrkdwnSection(current))
      current = line
    } else {
      current = candidate
    }
  }

  if (current) {
    blocks.push(mrkdwnSection(current))
  }
  return blocks
}

export function linkButtonBlocks(buttons: ILinkButton[]): KnownBlock[] {
  const blocks: KnownBlock[] = []
  for (let start = 0; start < buttons.length; start += BUTTONS_PER_BLOCK) {
    blocks.push({
      type: 'actions',
      elements: buttons.slice(start, start + BUTTONS_PER_BLOCK).map((button) => ({
        type: 'button',
        action_id: button.actionId,
        url: button.url,
        text: { type: 'plain_text', text: button.text.slice(0, BUTTON_TEXT_MAX_LENGTH) },
      })),
    })
  }
  return blocks
}
