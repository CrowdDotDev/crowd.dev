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

export function mrkdwnSection(text: string): KnownBlock {
  return { type: 'section', text: { type: 'mrkdwn', text } }
}

export function linkButtons(buttons: ILinkButton[]): KnownBlock {
  return {
    type: 'actions',
    elements: buttons.map((button) => ({
      type: 'button',
      action_id: button.actionId,
      url: button.url,
      text: { type: 'plain_text', text: button.text.slice(0, BUTTON_TEXT_MAX_LENGTH) },
    })),
  }
}
