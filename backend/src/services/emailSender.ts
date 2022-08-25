import assert from 'assert'
import sendgridMail from '@sendgrid/mail'
import { getConfig } from '../config'
import { AdvancedSuppressionManager } from './helpers/sendgridAsmType'

export default class EmailSender {
  templateId: string

  variables: any

  constructor(templateId, variables) {
    this.templateId = templateId
    this.variables = variables
    if (getConfig().SENDGRID_KEY) {
      sendgridMail.setApiKey(getConfig().SENDGRID_KEY)
    }
  }

  static get TEMPLATES() {
    if (!EmailSender.isConfigured) {
      return {}
    }

    return {
      EMAIL_ADDRESS_VERIFICATION: getConfig().SENDGRID_TEMPLATE_EMAIL_ADDRESS_VERIFICATION,
      INVITATION: getConfig().SENDGRID_TEMPLATE_INVITATION,
      PASSWORD_RESET: getConfig().SENDGRID_TEMPLATE_PASSWORD_RESET,
      WEEKLY_ANALYTICS: getConfig().SENDGRID_TEMPLATE_WEEKLY_ANALYTICS,
    }
  }

  /**
   * Sends an email to given recipient using sendgrid dynamic templates.
   * @param {string} recipient recipient email address
   * @param asm sendgrid advanced suppression manager for managing unsubscribe groups
   * @returns
   */
  async sendTo(recipient: string, asm?: AdvancedSuppressionManager): Promise<any> {
    if (!EmailSender.isConfigured) {
      console.error(`Email provider is not configured.`)
      return undefined
    }

    assert(recipient, 'to is required')
    assert(getConfig().SENDGRID_EMAIL_FROM, 'SENDGRID_EMAIL_FROM is required')
    assert(this.templateId, 'templateId is required')

    const msg = {
      to: recipient,
      from: {
        name: getConfig().SENDGRID_NAME_FROM,
        email: getConfig().SENDGRID_EMAIL_FROM,
      },
      templateId: this.templateId,
      dynamicTemplateData: this.variables,
    } as any

    if (asm) {
      msg.asm = asm
    }

    try {
      return await sendgridMail.send(msg)
    } catch (error) {
      console.error('Error sending SendGrid email.')
      console.error(error)
      throw error
    }
  }

  static get isConfigured() {
    return Boolean(getConfig().SENDGRID_EMAIL_FROM && getConfig().SENDGRID_KEY)
  }
}
