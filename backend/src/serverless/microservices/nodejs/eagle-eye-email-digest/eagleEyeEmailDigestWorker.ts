import moment from 'moment-timezone'
import { S3_CONFIG } from '../../../../config'
import RecurringEmailsHistoryRepository from '../../../../database/repositories/recurringEmailsHistoryRepository'
import SequelizeRepository from '../../../../database/repositories/sequelizeRepository'
import UserRepository from '../../../../database/repositories/userRepository'
import getUserContext from '../../../../database/utils/getUserContext'
import EagleEyeContentService from '../../../../services/eagleEyeContentService'
import EagleEyeSettingsService from '../../../../services/eagleEyeSettingsService'
import EmailSender from '../../../../services/emailSender'
import getStage from '../../../../services/helpers/getStage'
import { RecurringEmailType } from '../../../../types/recurringEmailsHistoryTypes'
import { createServiceChildLogger } from '../../../../utils/logging'

const log = createServiceChildLogger('eagleEyeEmailDigestWorker')

async function eagleEyeEmailDigestWorker(userId: string): Promise<void> {
  const s3Url = `https://${
    S3_CONFIG.microservicesAssetsBucket
  }-${getStage()}.s3.eu-central-1.amazonaws.com`
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const user = await UserRepository.findById(userId, {
    ...options,
    bypassPermissionValidation: true,
  })

  if (moment(user.eagleEyeSettings.emailDigest.nextEmailAt) > moment()) {
    log.info(
      'nextEmailAt is already updated. Email is already sent. Exiting without sending the email.',
    )
    return
  }

  const userContext = await getUserContext(user.tenants[0].tenant.id, user.id)

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
      frequency: user.eagleEyeSettings.emailDigest.frequency,
      date: moment().format('D MMM YYYY'),
    },
    user.tenants[0].tenant.id,
  ).sendTo(user.eagleEyeSettings.emailDigest.email)

  const rehRepository = new RecurringEmailsHistoryRepository(userContext)

  const reHistory = await rehRepository.create({
    tenantId: userContext.currentTenant.id,
    type: RecurringEmailType.EAGLE_EYE_DIGEST,
    emailSentAt: moment().toISOString(),
    emailSentTo: [user.eagleEyeSettings.emailDigest.email],
  })

  // update nextEmailAt
  const nextEmailAt = EagleEyeSettingsService.getNextEmailDigestDate(
    user.eagleEyeSettings.emailDigest,
  )
  const updateSettings = user.eagleEyeSettings
  updateSettings.emailDigest.nextEmailAt = nextEmailAt

  await UserRepository.updateEagleEyeSettings(
    userContext.currentUser.id,
    updateSettings,
    userContext,
  )

  log.info({ receipt: reHistory })
}

export { eagleEyeEmailDigestWorker }
