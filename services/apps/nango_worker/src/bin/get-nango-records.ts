import {
  NANGO_INTEGRATION_CONFIG,
  NangoIntegration,
  getNangoCloudRecords,
  initNangoCloudClient,
} from '@crowd/nango'

setImmediate(async () => {
  const providerConfigKey = NangoIntegration.GITHUB
  const connectionId = '<set>'
  const model = NANGO_INTEGRATION_CONFIG[providerConfigKey].models.DISCUSSION

  await initNangoCloudClient()

  const records = await getNangoCloudRecords(providerConfigKey, connectionId, model)

  console.log(records)
})
