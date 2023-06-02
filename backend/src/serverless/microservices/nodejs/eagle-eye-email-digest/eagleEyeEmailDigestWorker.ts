import moment from 'moment-timezone'
import { getServiceChildLogger } from '@crowd/logging'
import { S3_CONFIG } from '../../../../conf'
import RecurringEmailsHistoryRepository from '../../../../database/repositories/recurringEmailsHistoryRepository'
import SequelizeRepository from '../../../../database/repositories/sequelizeRepository'
import TenantUserRepository from '../../../../database/repositories/tenantUserRepository'
import getUserContext from '../../../../database/utils/getUserContext'
import EagleEyeContentService from '../../../../services/eagleEyeContentService'
import EagleEyeSettingsService from '../../../../services/eagleEyeSettingsService'
import EmailSender from '../../../../services/emailSender'
import getStage from '../../../../services/helpers/getStage'
import { RecurringEmailType } from '../../../../types/recurringEmailsHistoryTypes'

const log = getServiceChildLogger('eagleEyeEmailDigestWorker')

async function eagleEyeEmailDigestWorker(userId: string, tenantId: string): Promise<void> {
  const s3Url = `https://${
    S3_CONFIG.microservicesAssetsBucket
  }-${getStage()}.s3.eu-central-1.amazonaws.com`
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()

  const tenantUser = await TenantUserRepository.findByTenantAndUser(tenantId, userId, options)

  if (moment(tenantUser.settings.eagleEye.emailDigest.nextEmailAt) > moment()) {
    log.info(
      'nextEmailAt is already updated. Email is already sent. Exiting without sending the email.',
    )
    return
  }

  const userContext = await getUserContext(tenantId, userId)

  const eagleEyeContentService = new EagleEyeContentService(userContext)
  const content = (await eagleEyeContentService.search(true)).slice(0, 10).map((c: any) => {
    c.platformIcon = `${s3Url}/email/${c.platform}.png`
    c.post.thumbnail = null
    return c
  })

  await new EmailSender(
    EmailSender.TEMPLATES.EAGLE_EYE_DIGEST,
    {
      content,
      frequency: tenantUser.settings.eagleEye.emailDigest.frequency,
      date: moment().format('D MMM YYYY'),
    },
    tenantId,
  ).sendTo(tenantUser.settings.eagleEye.emailDigest.email)

  const rehRepository = new RecurringEmailsHistoryRepository(userContext)

  const reHistory = await rehRepository.create({
    tenantId: userContext.currentTenant.id,
    type: RecurringEmailType.EAGLE_EYE_DIGEST,
    emailSentAt: moment().toISOString(),
    emailSentTo: [tenantUser.settings.eagleEye.emailDigest.email],
  })

  // update nextEmailAt
  const nextEmailAt = EagleEyeSettingsService.getNextEmailDigestDate(
    tenantUser.settings.eagleEye.emailDigest,
  )
  const updateSettings = tenantUser.settings.eagleEye
  updateSettings.emailDigest.nextEmailAt = nextEmailAt

  await TenantUserRepository.updateEagleEyeSettings(
    userContext.currentUser.id,
    updateSettings,
    userContext,
  )

  log.info({ receipt: reHistory })
}

export { eagleEyeEmailDigestWorker }
