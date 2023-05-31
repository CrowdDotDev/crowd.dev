import { LoggerBase } from '@crowd/logging'
import sendgridMail from '@sendgrid/mail'
import assert from 'assert'
import { API_CONFIG, SENDGRID_CONFIG } from '../conf'
import { AdvancedSuppressionManager } from './helpers/sendgridAsmType'

export default class EmailSender extends LoggerBase {
  templateId: string

  variables: any

  tenantId: string

  constructor(templateId, variables, tenantId = null) {
    super()
    this.templateId = templateId
    this.variables = variables
    this.tenantId = tenantId
    if (SENDGRID_CONFIG.key) {
      sendgridMail.setApiKey(SENDGRID_CONFIG.key)
    }
  }

  static get TEMPLATES() {
    if (!EmailSender.isConfigured) {
      return {}
    }

    return {
      EMAIL_ADDRESS_VERIFICATION: SENDGRID_CONFIG.templateEmailAddressVerification,
      INVITATION: SENDGRID_CONFIG.templateInvitation,
      PASSWORD_RESET: SENDGRID_CONFIG.templatePasswordReset,
      WEEKLY_ANALYTICS: SENDGRID_CONFIG.templateWeeklyAnalytics,
      INTEGRATION_DONE: SENDGRID_CONFIG.templateIntegrationDone,
      CSV_EXPORT: SENDGRID_CONFIG.templateCsvExport,
      EAGLE_EYE_DIGEST: SENDGRID_CONFIG.templateEagleEyeDigest,
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
      this.log.error('Email provider is not configured.')
      return undefined
    }

    assert(recipient, 'to is required')
    assert(SENDGRID_CONFIG.emailFrom, 'SENDGRID_EMAIL_FROM is required')
    assert(this.templateId, 'templateId is required')

    const msg = {
      to: recipient,
      from: {
        name: SENDGRID_CONFIG.nameFrom,
        email: SENDGRID_CONFIG.emailFrom,
      },
      templateId: this.templateId,
      dynamicTemplateData: {
        ...this.variables,
        appHost: API_CONFIG.frontendUrl,
      },
    } as any

    if (this.tenantId) {
      msg.custom_args = {
        tenantId: this.tenantId,
      }
    }

    if (asm) {
      msg.asm = asm
    }

    try {
      return await sendgridMail.send(msg)
    } catch (error) {
      this.log.error(error, 'Error sending SendGrid email.')
      throw error
    }
  }

  static get isConfigured() {
    return Boolean(SENDGRID_CONFIG.emailFrom && SENDGRID_CONFIG.key)
  }
}
